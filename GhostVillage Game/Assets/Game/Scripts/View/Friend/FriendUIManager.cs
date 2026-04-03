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
        [SerializeField] private GameObject _notiDotMainMenu; // THÊM MỚI: Chấm đỏ trên nút ngoài MainMenu
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

                if (string.IsNullOrEmpty(uid)) return;

                // ========================================================
                // LOGIC: IT'S YOU !!
                // ========================================================
                // Lấy UID của chính mình (Cắt chữ "UID: " ra)
                string myUid = _txtMyUID.text.Replace("UID: ", "").Trim();

                if (uid == myUid)
                {
                    // Nếu gõ đúng UID của mình
                    Debug.Log("<color=yellow>[Friend] It's you!! Gõ UID của chính mình rồi!</color>");

                    // Hiển thị lỗi ra UI (Sếp có cái _txtSearchError sẵn nè)
                    _txtSearchError.text = "It's you!!";
                    _txtSearchError.gameObject.SetActive(true);

                    // Ẩn nội dung List đi (để đéo hiện gì cả)
                    ClearContent();

                    return; // Dừng lại ở đây, ĐÉO ĐƯỢC CHẠY TIẾP XUỐNG DƯỚI
                }

                // Nếu không phải mình thì xóa lỗi và chạy tìm kiếm bình thường
                _txtSearchError.text = "";
                _txtSearchError.gameObject.SetActive(false);

                _friendController.SearchByUID(uid).Forget();
            });
        }

        private void BindReactiveData()
        {
            if (defaultAvatar != null) _imgMyAvatar.sprite = defaultAvatar;

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
                _txtSearchError.text = errorMsg;
                _txtSearchError.gameObject.SetActive(!string.IsNullOrEmpty(errorMsg));
            }).AddTo(_disposables);

            _friendController.FriendStatuses.Subscribe(statuses =>
            {
                // Chỉ vẽ lại nếu đang đứng ở tab FriendList
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
            Debug.Log($"<color=cyan>[DEBUG SESSION] Token: '{_session.Token}' | UID: '{_session.UID}' | Name: '{_session.DisplayName}'</color>");
            _modalPanel.SetActive(true);

            // ========================================================
            // [FIX]: GÁN TEXT VÀO LÚC MỞ BẢNG (VÌ LÚC NÀY SESSION ĐÃ LOAD XONG)
            // ========================================================
            _txtMyDisplayName.text = _session.DisplayName;
            if (_txtMyUID != null)
            {
                _txtMyUID.text = $"UID: {_session.UID}";
            }

            SwitchTab(FriendTab.FriendList);
            _friendController.InitializeDataAsync().Forget();

            // Ẩn chấm đỏ MainMenu khi đã mở Modal
            if (_notiDotMainMenu != null) _notiDotMainMenu.SetActive(false);
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
                return; // Tab này tự xử, không cần fetch List
            }

            // GỌI HÀM BẤT ĐỒNG BỘ ĐỂ FETCH DATA MỚI NHẤT TRƯỚC KHI RENDER
            UpdateTabAsync(tab).Forget();
        }

        private async UniTaskVoid UpdateTabAsync(FriendTab tab)
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
                    // BẮT BUỘC FETCH LẠI TRƯỚC KHI VẼ
                    await _friendController.FetchSentRequestsAsync();
                    if (_currentTab == FriendTab.Sent)
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

        // ==========================================
        // --- SETUP PREFAB ITEMS ---
        // ==========================================

        private void SetupFriendItem(GameObject obj, FriendProfileDTO data)
        {
            SetText(obj, "Txt_DisplayName", data.GetDisplayName());

            // ========================================================
            // [FIX]: LOGIC XỬ LÝ TRẠNG THÁI (STATUS) VÀ MÀU SẮC (COLOR)
            // ========================================================
            string userId = data.GetUserId();
            string statusText = "Offline";
            Color statusColor = Color.gray; // Mặc định Xám (Offline)

            // Kiểm tra xem Photon Chat có báo trạng thái của đứa này không
            if (_friendController.FriendStatuses.Value.TryGetValue(userId, out int chatStatus))
            {
                if (chatStatus == 2) // ChatUserStatus.Online = 2
                {
                    statusText = "Online";
                    statusColor = Color.green; // Xanh lá
                }
                else if (chatStatus == 3) // ChatUserStatus.Playing = 3
                {
                    statusText = "In-Game";
                    statusColor = Color.red; // Đỏ (Đang chơi / Ở trong Lobby)
                }
            }

            SetText(obj, "Txt_Status", statusText);

            // Tìm cái chấm tròn (hoặc Image) đại diện cho trạng thái và đổi màu
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
                    bool isSuccess = await _friendController.AcceptRequest(data.GetFriendshipId());
                    if (isSuccess)
                    {
                        // THÀNH CÔNG -> RENDER LẠI UI
                        SwitchTab(_currentTab);
                    }
                    else if (_globalUI != null)
                    {
                        _globalUI.ShowError("Lỗi", "Không thể chấp nhận (Có thể thư đã bị thu hồi)!");
                    }
                });
            }

            var btnReject = obj.transform.Find("Btn_Reject")?.GetComponent<Button>();
            if (btnReject != null)
            {
                btnReject.onClick.RemoveAllListeners();
                btnReject.onClick.AddListener(async () =>
                {
                    bool isSuccess = await _friendController.RejectRequest(data.GetFriendshipId());
                    if (isSuccess)
                    {
                        // THÀNH CÔNG -> RENDER LẠI UI
                        SwitchTab(_currentTab);
                    }
                    else if (_globalUI != null)
                    {
                        _globalUI.ShowError("Lỗi", "Không thể từ chối!");
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
                    bool isSuccess = await _friendController.RejectRequest(data.GetFriendshipId());
                    if (isSuccess)
                    {
                        if (_globalUI != null) _globalUI.ShowError("Thành công", "Đã thu hồi lời mời!");

                        // Gọi Controller Fetch lại danh sách Sent
                        await _friendController.FetchSentRequestsAsync();

                        // RENDER LẠI UI NGAY LẬP TỨC
                        SwitchTab(_currentTab);
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
                    bool isSuccess = await _friendController.SendFriendRequest(data.userId);

                    if (isSuccess)
                    {
                        // Ở Tab Tìm kiếm thì chỉ cần đổi text Nút là đủ mượt rồi, không cần tải lại List
                        btnAdd.interactable = false;
                        var btnText = btnAdd.GetComponentInChildren<TextMeshProUGUI>();
                        if (btnText != null) btnText.text = "Đã Gửi";
                        if (_globalUI != null) _globalUI.ShowError("Thành công", "Đã gửi lời mời!");
                    }
                    else
                    {
                        if (_globalUI != null) _globalUI.ShowError("Lỗi", "Đã gửi lời mời hoặc đã là bạn!");
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