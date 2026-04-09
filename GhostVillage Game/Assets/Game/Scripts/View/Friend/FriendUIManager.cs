using UnityEngine;
using UnityEngine.UI;
using TMPro;
using VContainer;
using R3;
using Game.Domain.Friend.Controllers;
using Game.Domain.Friend.DTOs;
using System.Collections.Generic;
using Cysharp.Threading.Tasks;
using System;
using Game.Core.Network;
using Game.Script.UI;

namespace Game.UI.Friend
{
    public class FriendUIManager : MonoBehaviour
    {
        [Header("--- Main Dependencies ---")]
        [SerializeField] private Button _btnOpenFriend;
        [SerializeField] private GameObject _notiDotMainMenu;
        [SerializeField] private GameObject _modalPanel;
        [SerializeField] private Transform _contentTransform;
        [SerializeField] private GameObject _loadingPanel;

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
        [SerializeField] private GameObject _notiDotPendingTab;
        [SerializeField] private Button _btnCloseModal;

        [Header("--- Search Box (Find Friend Tab) ---")]
        [SerializeField] private GameObject _searchPanel;
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
        [Inject] private GameSession _session;
        private GlobalUIManager _globalUI;
        private readonly CompositeDisposable _disposables = new();

        private enum FriendTab { FriendList, FindFriend, Pending, Sent }
        private FriendTab _currentTab = FriendTab.FriendList;

        [Obsolete]
        private void Start()
        {
            _globalUI = FindObjectOfType<GlobalUIManager>();
            BindUIEvents();
            BindReactiveData();

            _modalPanel.SetActive(false);
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

            _btnSearchSubmit.onClick.AddListener(async () =>
            {
                string uid = _inputSearchUID.text.Trim();

                if (string.IsNullOrEmpty(uid))
                {
                    if (_globalUI != null) _globalUI.ShowError("Lỗi nhập liệu", "UID không được để trống!");
                    return;
                }

                if (uid.Length != 8 || !System.Text.RegularExpressions.Regex.IsMatch(uid, @"^\d{8}$"))
                {
                    if (_globalUI != null) _globalUI.ShowError("Lỗi nhập liệu", "UID không hợp lệ! Vui lòng nhập chính xác 8 chữ số.");
                    return;
                }

                string myUid = _txtMyUID.text.Replace("UID: ", "").Trim();

                if (uid == myUid)
                {
                    if (_globalUI != null) _globalUI.ShowError("Oops!", "Bạn không thể tìm kiếm chính mình!");
                    ClearContent();
                    return;
                }

                if (_txtSearchError != null) _txtSearchError.gameObject.SetActive(false);

                // ========================================================
                // [FIX CHÍ MẠNG 1]: Bọc Try-Catch để hứng lỗi API (như 404 Not Found)
                // ========================================================
                try
                {
                    await _friendController.SearchByUID(uid);
                }
                catch (Exception e)
                {
                    Debug.LogWarning($"[FriendUI] Lỗi tìm kiếm: {e.Message}");

                    // Nếu lỗi do Controller báo rỗng, GlobalUI sẽ hiện lên
                    if (_globalUI != null)
                    {
                        // Kiểm tra nếu là lỗi HTTP 404
                        if (e.Message.Contains("404"))
                            _globalUI.ShowError("Không tìm thấy", "Không tìm thấy người chơi với UID này.");
                        else
                            _globalUI.ShowError("Lỗi tìm kiếm", "Đã xảy ra lỗi khi tìm kiếm UID. Vui lòng thử lại!");
                    }
                    ClearContent(); // Xóa sạch kết quả cũ nếu tìm lỗi
                }
            });
        }

        private void BindReactiveData()
        {
            if (defaultAvatar != null) _imgMyAvatar.sprite = defaultAvatar;

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
                if (_notiDotMainMenu != null)
                {
                    _notiDotMainMenu.SetActive(hasNewRequest);
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
                if (_txtSearchError != null)
                {
                    _txtSearchError.text = "";
                    _txtSearchError.gameObject.SetActive(false);
                }

                // Nếu có chuỗi lỗi báo về từ Controller thì bắn GlobalUI lên
                if (!string.IsNullOrEmpty(errorMsg) && _globalUI != null)
                {
                    _globalUI.ShowError("Thông báo", errorMsg);
                }
            }).AddTo(_disposables);

            _friendController.FriendStatuses.Subscribe(statuses =>
            {
                if (_currentTab == FriendTab.FriendList)
                {
                    RenderList(_friendController.FriendList.Value, _prefabFriendList, SetupFriendItem);
                }
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

            _txtMyDisplayName.text = _session.DisplayName;
            if (_txtMyUID != null)
            {
                _txtMyUID.text = $"UID: {_session.UID}";
            }

            SwitchTab(FriendTab.FriendList);

            // ========================================================
            // [FIX]: GỌI HÀM ASYNC RIÊNG THAY VÌ DÙNG ContinueWith 
            // ========================================================
            SafeInitializeDataAsync().Forget();

            if (_notiDotMainMenu != null) _notiDotMainMenu.SetActive(false);
        }

        // HÀM MỚI TẠO ĐỂ LOAD DATA VÀ BẮT LỖI
        private async UniTaskVoid SafeInitializeDataAsync()
        {
            try
            {
                await _friendController.InitializeDataAsync();
            }
            catch (Exception e)
            {
                Debug.LogError($"[FriendUI] Lỗi tải dữ liệu bạn bè: {e.Message}");
                if (_globalUI != null) _globalUI.ShowError("Lỗi Dữ Liệu", "Không thể lấy danh sách bạn bè lúc này.");
            }
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
                if (_txtSearchError != null) _txtSearchError.text = "";
                _friendController.CurrentSearchResult.Value = null;
                return;
            }

            UpdateTabAsync(tab).Forget();
        }

        private async UniTaskVoid UpdateTabAsync(FriendTab tab)
        {
            // ========================================================
            // [FIX CHÍ MẠNG 3]: Bọc Try-Catch khi chuyển Tab
            // ========================================================
            try
            {
                switch (tab)
                {
                    case FriendTab.FriendList:
                        await _friendController.FetchFriendListAsync();
                        if (_currentTab == FriendTab.FriendList)
                            RenderList(_friendController.FriendList.Value, _prefabFriendList, SetupFriendItem);
                        break;

                    case FriendTab.Pending:
                        await _friendController.FetchPendingRequestsAsync();
                        if (_currentTab == FriendTab.Pending)
                            RenderList(_friendController.PendingRequests.Value, _prefabPending, SetupPendingItem);
                        break;

                    case FriendTab.Sent:
                        await _friendController.FetchSentRequestsAsync();
                        if (_currentTab == FriendTab.Sent)
                            RenderList(_friendController.SentRequests.Value, _prefabSent, SetupSentItem);
                        break;
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[FriendUI] Lỗi tải dữ liệu Tab {tab}: {e.Message}");
                if (_globalUI != null) _globalUI.ShowError("Lỗi", $"Không thể tải danh sách ({tab}).");
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

        // ==========================================
        // --- SETUP PREFAB ITEMS ---
        // ==========================================

        private void SetupFriendItem(GameObject obj, FriendProfileDTO data)
        {
            SetText(obj, "Txt_DisplayName", data.GetDisplayName());

            string userId = data.GetUserId();
            string statusText = "Offline";
            Color statusColor = Color.gray;

            if (_friendController.FriendStatuses.Value.TryGetValue(userId, out int chatStatus))
            {
                if (chatStatus == 2)
                {
                    statusText = "Online";
                    statusColor = Color.green;
                }
                else if (chatStatus == 3)
                {
                    statusText = "In-Game";
                    statusColor = Color.red;
                }
            }

            SetText(obj, "Txt_Status", statusText);

            var imgStatus = obj.transform.Find("Img_StatusPoint")?.GetComponent<Image>();
            if (imgStatus != null)
            {
                imgStatus.color = statusColor;
            }

            var btnUnfriend = obj.transform.Find("Btn_Unfriend")?.GetComponent<Button>();
            if (btnUnfriend != null)
            {
                btnUnfriend.onClick.RemoveAllListeners();
                btnUnfriend.onClick.AddListener(async () =>
                {
                    // ========================================================
                    // [FIX CHÍ MẠNG 4]: Bọc Try-Catch khi xóa bạn
                    // ========================================================
                    try
                    {
                        bool isSuccess = await _friendController.Unfriend(data.GetUserId());
                        if (isSuccess)
                        {
                            if (_globalUI != null) _globalUI.ShowError("Thành công", "Đã xóa khỏi danh sách bạn bè.");
                            SwitchTab(_currentTab);
                        }
                        else
                        {
                            if (_globalUI != null) _globalUI.ShowError("Lỗi", "Không thể xóa bạn lúc này!");
                        }
                    }
                    catch (Exception e)
                    {
                        Debug.LogWarning($"[FriendUI] Lỗi hủy kết bạn: {e.Message}");
                        if (_globalUI != null) _globalUI.ShowError("Lỗi hệ thống", "Đã xảy ra lỗi khi kết nối máy chủ.");
                    }
                });
            }
        }

        private void SetupPendingItem(GameObject obj, FriendProfileDTO data)
        {
            SetText(obj, "Txt_DisplayName", data.GetDisplayName());
            SetText(obj, "Txt_UID", "UID: ***");

            var btnAccept = obj.transform.Find("Btn_Accept")?.GetComponent<Button>();
            if (btnAccept != null)
            {
                btnAccept.onClick.RemoveAllListeners();
                btnAccept.onClick.AddListener(async () =>
                {
                    try
                    {
                        bool isSuccess = await _friendController.AcceptRequest(data.GetFriendshipId());
                        if (isSuccess) SwitchTab(_currentTab);
                        else if (_globalUI != null) _globalUI.ShowError("Lỗi", "Không thể chấp nhận (Có thể thư đã bị thu hồi)!");
                    }
                    catch (Exception)
                    {
                        if (_globalUI != null) _globalUI.ShowError("Lỗi hệ thống", "Không thể xử lý yêu cầu.");
                    }
                });
            }

            var btnReject = obj.transform.Find("Btn_Reject")?.GetComponent<Button>();
            if (btnReject != null)
            {
                btnReject.onClick.RemoveAllListeners();
                btnReject.onClick.AddListener(async () =>
                {
                    try
                    {
                        bool isSuccess = await _friendController.RejectRequest(data.GetFriendshipId());
                        if (isSuccess) SwitchTab(_currentTab);
                        else if (_globalUI != null) _globalUI.ShowError("Lỗi", "Không thể từ chối!");
                    }
                    catch (Exception)
                    {
                        if (_globalUI != null) _globalUI.ShowError("Lỗi hệ thống", "Không thể xử lý yêu cầu.");
                    }
                });
            }
        }

        private void SetupSentItem(GameObject obj, FriendProfileDTO data)
        {
            SetText(obj, "Txt_DisplayName", data.GetDisplayName());
            SetText(obj, "Txt_Status", "Đang chờ...");

            var btnTakeBack = obj.transform.Find("Btn_TakeBack")?.GetComponent<Button>();
            if (btnTakeBack != null)
            {
                btnTakeBack.onClick.RemoveAllListeners();
                btnTakeBack.onClick.AddListener(async () =>
                {
                    try
                    {
                        bool isSuccess = await _friendController.RejectRequest(data.GetFriendshipId());
                        if (isSuccess)
                        {
                            if (_globalUI != null) _globalUI.ShowError("Thành công", "Đã thu hồi lời mời!");
                            await _friendController.FetchSentRequestsAsync();
                            SwitchTab(_currentTab);
                        }
                    }
                    catch (Exception)
                    {
                        if (_globalUI != null) _globalUI.ShowError("Lỗi hệ thống", "Không thể thu hồi lúc này.");
                    }
                });
            }
        }

        private void SetupFindItem(GameObject obj, PlayerSearchDTO data)
        {
            SetText(obj, "Txt_DisplayName", data.displayName);
            SetText(obj, "Txt_UID", $"UID: {data.uid}");

            var btnAdd = obj.transform.Find("Btn_AddFriend")?.GetComponent<Button>();
            if (btnAdd != null)
            {
                btnAdd.onClick.RemoveAllListeners();
                btnAdd.onClick.AddListener(async () =>
                {
                    try
                    {
                        bool isSuccess = await _friendController.SendFriendRequest(data.userId);

                        if (isSuccess)
                        {
                            btnAdd.interactable = false;
                            var btnText = btnAdd.GetComponentInChildren<TextMeshProUGUI>();
                            if (btnText != null) btnText.text = "Đã Gửi";
                            if (_globalUI != null) _globalUI.ShowError("Thành công", "Đã gửi lời mời!");
                        }
                        else
                        {
                            if (_globalUI != null) _globalUI.ShowError("Lỗi", "Đã gửi lời mời hoặc đã là bạn!");
                        }
                    }
                    catch (Exception e)
                    {
                        Debug.LogWarning($"[FriendUI] Lỗi gửi kết bạn: {e.Message}");
                        if (_globalUI != null) _globalUI.ShowError("Lỗi", "Có vẻ như UID này không thể kết bạn.");
                    }
                });
            }
        }

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