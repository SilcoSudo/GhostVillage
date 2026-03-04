using UnityEngine;
using UnityEngine.UI;
using TMPro;
using VContainer;
using R3;
using Game.Domain.Friend.Controllers;
using Game.Domain.Friend.DTOs;
using System.Collections.Generic;
using Game.Core.ReactiveRepo;
using Cysharp.Threading.Tasks;
using System;

namespace Game.UI.Friend
{
    public class FriendUIManager : MonoBehaviour
    {
        [Header("--- Main Dependencies ---")]
        [SerializeField] private Button _btnOpenFriend;
        [SerializeField] private GameObject _modalPanel; // Grp_FriendModal
        [SerializeField] private Transform _contentTransform; // Src_Content/Viewport/Content
        [SerializeField] private GameObject _loadingPanel; // Img_Loading

        [Header("--- My Profile Section ---")]
        [SerializeField] private Image _imgMyAvatar;
        [SerializeField] private TextMeshProUGUI _txtMyDisplayName;
        [SerializeField] private TextMeshProUGUI _txtMyUID;

        [Header("--- Avatar Setup ---")]
        [SerializeField] private AvatarEntry[] avatarPresets;
        [SerializeField] private Sprite defaultAvatar;

        [Serializable]
        private class AvatarEntry
        {
            public string id;
            public Sprite sprite;
        }

        [Header("--- Tab Buttons ---")]
        [SerializeField] private Button _btnTabFriendList;
        [SerializeField] private Button _btnTabFindFriend;
        [SerializeField] private Button _btnTabPending;
        [SerializeField] private Button _btnTabSent;
        [SerializeField] private GameObject _notiDotPendingTab; // Img_NotiDot inside Btn_Pending
        [SerializeField] private Button _btnCloseModal;

        [Header("--- Search Box (Find Friend Tab) ---")]
        [SerializeField] private GameObject _searchPanel; // Grp_SearchBox
        [SerializeField] private TMP_InputField _inputSearchUID;
        [SerializeField] private Button _btnSearchSubmit;
        [SerializeField] private TextMeshProUGUI _txtSearchError;

        [Header("--- Prefabs ---")]
        [SerializeField] private GameObject _prefabFriendList;
        [SerializeField] private GameObject _prefabFindFriend;
        [SerializeField] private GameObject _prefabPending;
        [SerializeField] private GameObject _prefabSent;

        // VContainer Injection
        [Inject] private FriendController _friendController;
        [Inject] private PlayerDataStore _playerDataStore;

        private readonly CompositeDisposable _disposables = new();

        private enum FriendTab { FriendList, FindFriend, Pending, Sent }
        private FriendTab _currentTab = FriendTab.FriendList;

        private void Start()
        {
            BindUIEvents();
            BindReactiveData();

            _modalPanel.SetActive(false); // Hide initially
            _notiDotPendingTab.SetActive(false);
        }

        private void BindUIEvents()
        {
            _btnOpenFriend.onClick.AddListener(OpenModal);
            _btnCloseModal.onClick.AddListener(CloseModal);

            _btnTabFriendList.onClick.AddListener(() => SwitchTab(FriendTab.FriendList));
            _btnTabFindFriend.onClick.AddListener(() => SwitchTab(FriendTab.FindFriend));
            _btnTabPending.onClick.AddListener(() => SwitchTab(FriendTab.Pending));
            _btnTabSent.onClick.AddListener(() => SwitchTab(FriendTab.Sent));

            _btnSearchSubmit.onClick.AddListener(() =>
            {
                string uid = _inputSearchUID.text.Trim();
                _friendController.SearchByUID(uid).Forget();
            });
        }

        private void BindReactiveData()
        {
            // --- Bind My Profile Data ---
            _playerDataStore.DisplayName.Subscribe(val => _txtMyDisplayName.text = val).AddTo(_disposables);

            // Assuming UID is stored in PlayerDataStore or derived. 
            // If it's not in the store, you might need to fetch it or pass it differently.
            // For now, I'll assume you add a UID property to PlayerDataStore.
            // _playerDataStore.UID.Subscribe(val => _txtMyUID.text = $"UID: {val}").AddTo(_disposables);

            _playerDataStore.AvatarId.Subscribe(id => _imgMyAvatar.sprite = ResolveAvatarSprite(id)).AddTo(_disposables);

            // --- Bind Friend System State ---
            _friendController.IsLoading.Subscribe(isLoading =>
            {
                _loadingPanel.SetActive(isLoading);
            }).AddTo(_disposables);

            _friendController.FriendList.Subscribe(list =>
            {
                if (_currentTab == FriendTab.FriendList) RenderList(list, _prefabFriendList, SetupFriendItem);
            }).AddTo(_disposables);

            _friendController.PendingRequests.Subscribe(list =>
            {
                bool hasNewRequest = list != null && list.Count > 0;
                _notiDotPendingTab.SetActive(hasNewRequest);
                // Also show dot on the main open button if modal is closed
                if (!_modalPanel.activeSelf)
                {
                    // Assuming you have a dot on Btn_OpenFriend. You'd need a reference to it.
                    // _mainMenuNotiDot.SetActive(hasNewRequest); 
                }

                if (_currentTab == FriendTab.Pending) RenderList(list, _prefabPending, SetupPendingItem);
            }).AddTo(_disposables);

            _friendController.SentRequests.Subscribe(list =>
            {
                if (_currentTab == FriendTab.Sent) RenderList(list, _prefabSent, SetupSentItem);
            }).AddTo(_disposables);

            _friendController.CurrentSearchResult.Subscribe(result =>
            {
                if (_currentTab != FriendTab.FindFriend) return;

                ClearContent();
                if (result != null)
                {
                    GameObject obj = Instantiate(_prefabFindFriend, _contentTransform);
                    SetupFindItem(obj, result);
                }
            }).AddTo(_disposables);

            _friendController.SearchError.Subscribe(errorMsg =>
            {
                _txtSearchError.text = errorMsg;
                _txtSearchError.gameObject.SetActive(!string.IsNullOrEmpty(errorMsg));
            }).AddTo(_disposables);
        }

        private Sprite ResolveAvatarSprite(string avatarId)
        {
            if (!string.IsNullOrEmpty(avatarId) && avatarPresets != null)
            {
                for (int i = 0; i < avatarPresets.Length; i++)
                {
                    if (avatarPresets[i] != null && avatarPresets[i].id == avatarId && avatarPresets[i].sprite != null)
                        return avatarPresets[i].sprite;
                }
            }
            return defaultAvatar != null ? defaultAvatar : _imgMyAvatar.sprite;
        }

        private void OpenModal()
        {
            _modalPanel.SetActive(true);
            SwitchTab(FriendTab.FriendList);
            _friendController.InitializeDataAsync().Forget();
        }

        private void CloseModal()
        {
            _modalPanel.SetActive(false);
        }

        private void SwitchTab(FriendTab tab)
        {
            _currentTab = tab;
            ClearContent();

            _searchPanel.SetActive(tab == FriendTab.FindFriend);
            if (tab == FriendTab.FindFriend)
            {
                _inputSearchUID.text = "";
                _txtSearchError.text = "";
                _friendController.CurrentSearchResult.Value = null;
            }

            switch (tab)
            {
                case FriendTab.FriendList:
                    RenderList(_friendController.FriendList.Value, _prefabFriendList, SetupFriendItem);
                    break;
                case FriendTab.Pending:
                    RenderList(_friendController.PendingRequests.Value, _prefabPending, SetupPendingItem);
                    break;
                case FriendTab.Sent:
                    RenderList(_friendController.SentRequests.Value, _prefabSent, SetupSentItem);
                    break;
            }
        }

        private void ClearContent()
        {
            foreach (Transform child in _contentTransform)
            {
                Destroy(child.gameObject);
            }
        }

        private void RenderList(List<FriendProfileDTO> dataList, GameObject prefab, Action<GameObject, FriendProfileDTO> setupAction)
        {
            ClearContent();
            if (dataList == null) return;

            foreach (var data in dataList)
            {
                GameObject itemObj = Instantiate(prefab, _contentTransform);
                setupAction?.Invoke(itemObj, data);
            }
        }

        // --- SETUP PREFAB ITEMS ---
        // Note: Make sure the names passed to Transform.Find match your prefab hierarchy exactly.

        private void SetupFriendItem(GameObject obj, FriendProfileDTO data)
        {
            SetText(obj, "Txt_DisplayName", data.fullname);
            // Default status for now. Photon integration will update this later.
            SetText(obj, "Txt_Status", "Offline");

            var btnUnfriend = obj.transform.Find("Btn_Unfriend")?.GetComponent<Button>();
            if (btnUnfriend != null)
            {
                btnUnfriend.onClick.RemoveAllListeners();
                btnUnfriend.onClick.AddListener(() => _friendController.Unfriend(data._id).Forget());
            }
        }

        private void SetupPendingItem(GameObject obj, FriendProfileDTO data)
        {
            SetText(obj, "Txt_DisplayName", data.fullname);
            // Set UID if available in DTO, otherwise might need an API change to return it
            SetText(obj, "Txt_UID", "UID: ???");

            var btnAccept = obj.transform.Find("Btn_Accept")?.GetComponent<Button>();
            if (btnAccept != null)
            {
                btnAccept.onClick.RemoveAllListeners();
                btnAccept.onClick.AddListener(() => _friendController.AcceptRequest(data._id).Forget());
            }

            var btnReject = obj.transform.Find("Btn_Reject")?.GetComponent<Button>();
            if (btnReject != null)
            {
                btnReject.onClick.RemoveAllListeners();
                btnReject.onClick.AddListener(() => _friendController.RejectRequest(data._id).Forget());
            }
        }

        private void SetupSentItem(GameObject obj, FriendProfileDTO data)
        {
            SetText(obj, "Txt_DisplayName", data.fullname);
            SetText(obj, "Txt_Status", "Đang chờ...");
            // Set UID if available in DTO
        }

        private void SetupFindItem(GameObject obj, PlayerSearchDTO data)
        {
            SetText(obj, "Txt_DisplayName", data.displayName);
            SetText(obj, "Txt_UID", $"UID: {data.uid}");

            var btnAdd = obj.transform.Find("Btn_AddFriend")?.GetComponent<Button>();
            if (btnAdd != null)
            {
                btnAdd.onClick.RemoveAllListeners();
                btnAdd.onClick.AddListener(() =>
                {
                    _friendController.SendFriendRequest(data.userId).Forget();
                    btnAdd.interactable = false;
                    var btnText = btnAdd.GetComponentInChildren<TextMeshProUGUI>();
                    if (btnText != null) btnText.text = "Đã Gửi";
                });
            }
        }

        // Helper to safely set text
        private void SetText(GameObject parent, string childName, string text)
        {
            var textComp = parent.transform.Find(childName)?.GetComponent<TextMeshProUGUI>();
            if (textComp != null) textComp.text = text;
            else Debug.LogWarning($"[FriendUI] Cannot find {childName} on {parent.name}");
        }

        private void OnDestroy()
        {
            _disposables.Dispose();
        }
    }
}