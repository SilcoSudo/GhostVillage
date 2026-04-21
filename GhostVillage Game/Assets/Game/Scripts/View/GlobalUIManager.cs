// File: src/Game/UI/Core/GlobalUIManager.cs
using UnityEngine;
using Cysharp.Threading.Tasks;
using System.Threading;
using TMPro;
using Game.UI.Settings;
using UnityEngine.UI;
using VContainer;
using Game.Domain.Settings.Controllers;
using Game.Core.Network.Chat;
using Game.Core.Scene;
using Photon.Pun;
using Photon.Realtime;
using System.Collections.Generic;

namespace Game.Script.UI
{
    public class GlobalUIManager : MonoBehaviour, IConnectionCallbacks, IMatchmakingCallbacks
    {
        public enum EscMenuType { None, MainMenu, Lobby, InGame }

        [Header("Popup References")]
        [SerializeField] private GameObject _popupPanel;
        [SerializeField] private TMP_Text _txtTitle;
        [SerializeField] private TMP_Text _txtMessage;

        [Header("Loading Screen (Gom Gọn 1 Cục)")]
        [SerializeField] private GameObject _loadingPanel; // Sếp chỉ cần kéo cái Panel chứa nền + text vào đây
        private const float LOADING_TIMEOUT = 30f;
        private CancellationTokenSource _cts;

        [Header("Settings Reference")]
        [SerializeField] private SettingsUIManager _settingsUI;

        [Header("Invite Notification")]
        [SerializeField] private InviteNotificationUI _inviteNotificationUI;

        [Header("ESC Menu - Layouts")]
        [SerializeField] private GameObject _escMenuModal;
        [SerializeField] private GameObject _grpMainMenuEsc;
        [SerializeField] private GameObject _grpLobbyEsc;
        [SerializeField] private GameObject _grpGameEsc;

        [Header("ESC Menu - MainMenu Buttons")]
        [SerializeField] private Button _btnMainMenu_Resume;
        [SerializeField] private Button _btnMainMenu_Setting;
        [SerializeField] private Button _btnMainMenu_Logout;

        [Header("ESC Menu - Lobby Buttons")]
        [SerializeField] private Button _btnLobby_Resume;
        [SerializeField] private Button _btnLobby_Setting;
        [SerializeField] private Button _btnLobby_Exit;

        [Header("ESC Menu - InGame Buttons")]
        [SerializeField] private Button _btnGame_Resume;
        [SerializeField] private Button _btnGame_Setting;
        [SerializeField] private Button _btnGame_ExitMatch;

        public System.Action OnLogoutClicked;
        public System.Action OnLobbyExitClicked;
        public System.Action OnGameExitClicked;

        private EscMenuType _currentEscType = EscMenuType.None;
        private float _lastToggleTime = 0f;

        private string _pendingRoomToJoin = string.Empty;
        public static bool IsBypassPassword = false;

        private GlobalChatManager _chatManager;
        private ISceneLoaderService _sceneLoader;

        [Inject]
        public void Construct(SettingsController settingsController, GlobalChatManager chatManager, ISceneLoaderService sceneLoader)
        {
            if (_settingsUI != null)
            {
                _settingsUI.Init(settingsController);
                _settingsUI.OnCloseRequested += CloseSettings;
            }

            _chatManager = chatManager;
            _sceneLoader = sceneLoader;

            if (_chatManager != null)
            {
                _chatManager.OnRoomInviteReceived += HandleRoomInviteReceived;
            }
        }

        private void Awake()
        {
            if (_popupPanel != null) _popupPanel.SetActive(false);
            if (_loadingPanel != null) _loadingPanel.SetActive(false);
            if (_settingsUI != null) _settingsUI.ShowSettings(false);
            if (_escMenuModal != null) _escMenuModal.SetActive(false);
            if (_inviteNotificationUI != null) _inviteNotificationUI.Hide();

            BindEscMenuEvents();
        }

        private void OnEnable() { PhotonNetwork.AddCallbackTarget(this); }
        private void OnDisable() { PhotonNetwork.RemoveCallbackTarget(this); }

        // ========================================================
        // HỨNG THIỆP MỜI VÀ XUYÊN KHÔNG
        // ========================================================
        private void HandleRoomInviteReceived(string senderName, string roomName)
        {
            if (_inviteNotificationUI != null)
            {
                _inviteNotificationUI.Show(senderName, roomName, ExecuteJoinRoom);
            }
        }

        private void ExecuteJoinRoom(string roomName)
        {
            _pendingRoomToJoin = roomName;
            ShowLoading(true, "Đang vào phòng của bạn bè...");

            IsBypassPassword = true;

            if (PhotonNetwork.InRoom)
            {
                PhotonNetwork.LeaveRoom();
            }
            else if (PhotonNetwork.IsConnectedAndReady)
            {
                PhotonNetwork.JoinRoom(_pendingRoomToJoin);
            }
            else
            {
                // Thay vì chỉ ShowError, giờ dùng SafeReturn luôn
                HandleLoadingCrash("Lỗi Mạng", "Bạn chưa kết nối vào Server!");
            }
        }

        // ========================================================
        // PHOTON CALLBACKS
        // ========================================================
        public void OnConnectedToMaster()
        {
            if (!string.IsNullOrEmpty(_pendingRoomToJoin))
            {
                PhotonNetwork.JoinRoom(_pendingRoomToJoin);
            }
        }

        public void OnJoinedRoom()
        {
            if (!string.IsNullOrEmpty(_pendingRoomToJoin))
            {
                _pendingRoomToJoin = string.Empty;
                ShowLoading(false);
            }
        }

        public void OnJoinRoomFailed(short returnCode, string message)
        {
            if (!string.IsNullOrEmpty(_pendingRoomToJoin))
            {
                _pendingRoomToJoin = string.Empty;
                HandleLoadingCrash("Vào phòng thất bại", "Phòng đã đầy, đang chơi, hoặc không tồn tại!");
            }
        }

        public void OnConnected() { }
        public void OnDisconnected(DisconnectCause cause) { }
        public void OnRegionListReceived(RegionHandler regionHandler) { }
        public void OnCustomAuthenticationResponse(Dictionary<string, object> data) { }
        public void OnCustomAuthenticationFailed(string debugMessage) { }
        public void OnFriendListUpdate(List<FriendInfo> friendList) { }
        public void OnCreatedRoom() { }
        public void OnCreateRoomFailed(short returnCode, string message) { }
        public void OnJoinRandomFailed(short returnCode, string message) { }
        public void OnLeftRoom() { }

        // ========================================================
        // ESC MENU LOGIC
        // ========================================================
        private void BindEscMenuEvents()
        {
            if (_btnMainMenu_Resume != null) _btnMainMenu_Resume.onClick.AddListener(CloseEscMenu);
            if (_btnLobby_Resume != null) _btnLobby_Resume.onClick.AddListener(CloseEscMenu);
            if (_btnGame_Resume != null) _btnGame_Resume.onClick.AddListener(CloseEscMenu);

            if (_btnMainMenu_Setting != null) _btnMainMenu_Setting.onClick.AddListener(OpenSettingsFromEsc);
            if (_btnLobby_Setting != null) _btnLobby_Setting.onClick.AddListener(OpenSettingsFromEsc);
            if (_btnGame_Setting != null) _btnGame_Setting.onClick.AddListener(OpenSettingsFromEsc);

            if (_btnMainMenu_Logout != null) _btnMainMenu_Logout.onClick.AddListener(() => { CloseEscMenu(); OnLogoutClicked?.Invoke(); });
            if (_btnLobby_Exit != null) _btnLobby_Exit.onClick.AddListener(() => { CloseEscMenu(); OnLobbyExitClicked?.Invoke(); });
            if (_btnGame_ExitMatch != null) _btnGame_ExitMatch.onClick.AddListener(() => { CloseEscMenu(); OnGameExitClicked?.Invoke(); });
        }

        private void OpenSettingsFromEsc()
        {
            if (_escMenuModal != null) _escMenuModal.SetActive(false);
            OpenSettings();
        }

        public bool IsEscMenuOpen() => _escMenuModal != null && _escMenuModal.activeSelf;

        public void OpenEscMenu(EscMenuType type, bool releaseCursor = true)
        {
            if (Time.unscaledTime - _lastToggleTime < 0.1f) return;
            _lastToggleTime = Time.unscaledTime;

            if (_escMenuModal == null || type == EscMenuType.None) return;

            _currentEscType = type;
            _escMenuModal.SetActive(true);

            if (_grpMainMenuEsc != null) _grpMainMenuEsc.SetActive(type == EscMenuType.MainMenu);
            if (_grpLobbyEsc != null) _grpLobbyEsc.SetActive(type == EscMenuType.Lobby);
            if (_grpGameEsc != null) _grpGameEsc.SetActive(type == EscMenuType.InGame);

            if (UnityEngine.EventSystems.EventSystem.current != null)
                UnityEngine.EventSystems.EventSystem.current.SetSelectedGameObject(null);

            if (releaseCursor)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }
        }

        public void CloseEscMenu()
        {
            if (Time.unscaledTime - _lastToggleTime < 0.1f) return;
            _lastToggleTime = Time.unscaledTime;

            if (_escMenuModal == null) return;

            _escMenuModal.SetActive(false);

            if (_currentEscType == EscMenuType.InGame || _currentEscType == EscMenuType.Lobby)
            {
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
            else if (_currentEscType == EscMenuType.MainMenu)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }

            _currentEscType = EscMenuType.None;
        }

        public void OpenSettings()
        {
            if (_settingsUI != null)
            {
                _settingsUI.ShowSettings(true);
                // [FIX]: Chắc chắn nhả chuột khi mở Settings
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }
        }

        public void CloseSettings()
        {
            if (_settingsUI != null) _settingsUI.ShowSettings(false);

            // [FIX]: Khóa chuột cho cả InGame và Lobby khi đóng Settings
            if (_currentEscType == EscMenuType.InGame || _currentEscType == EscMenuType.Lobby)
            {
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
            else if (_currentEscType == EscMenuType.MainMenu)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }

            // Reset trạng thái sau khi đóng từ Settings (nếu muốn đóng thẳng về Game)
            _currentEscType = EscMenuType.None;
        }

        public bool IsSettingsOpen()
        {
            if (_settingsUI == null) return false;
            // Kiểm tra xem GameObject của Settings hoặc Panel chính của nó có đang Active không
            return _settingsUI.gameObject.activeInHierarchy;
        }

        // ========================================================
        // MÀN HÌNH LOADING & XỬ LÝ LỖI (SAFE RETURN)
        // ========================================================
        public void ShowLoading(bool show, string msg = "Loading...")
        {
            if (_loadingPanel == null) return;
            _loadingPanel.SetActive(show);

            if (show)
            {
                // Tự động mò xuống con để đổi chữ (Khỏi cần kéo inspector)
                TMP_Text loadingText = _loadingPanel.GetComponentInChildren<TMP_Text>(true);
                if (loadingText != null) loadingText.text = msg;

                if (_cts != null) { _cts.Cancel(); _cts.Dispose(); }
                _cts = new CancellationTokenSource();
                LoadingTimeoutTask(_cts.Token).Forget();
            }
            else
            {
                if (_cts != null) { _cts.Cancel(); _cts.Dispose(); _cts = null; }
            }
        }

        private async UniTaskVoid LoadingTimeoutTask(CancellationToken token)
        {
            try
            {
                await UniTask.Delay((int)(LOADING_TIMEOUT * 1000), cancellationToken: token);
                if (_loadingPanel != null && _loadingPanel.activeInHierarchy)
                {
                    Debug.LogWarning($"⚠️ Loading timeout sau {LOADING_TIMEOUT}s. Kích hoạt Safe Return.");
                    // Nếu quá 30 giây mà đơ -> Tự động kích hoạt cơ chế rút lui an toàn
                    HandleLoadingCrash("Mất Kết Nối", "Thời gian tải quá lâu. Đang quay về sảnh...");
                }
            }
            catch (System.OperationCanceledException) { }
        }

        public void ShowError(string title, string message)
        {
            if (_popupPanel == null) return;
            _txtTitle.text = title;
            _txtMessage.text = message;
            _popupPanel.SetActive(true);
        }

        public void ClosePopup() => _popupPanel.SetActive(false);

        /// <summary>
        /// GỌI HÀM NÀY NẾU CÓ BIẾN LỚN KHI ĐANG LOAD MAP/SPAWN NHÂN VẬT ĐỂ RÚT AN TOÀN
        /// </summary>
        public void HandleLoadingCrash(string errorTitle, string errorMessage, string safeScene = "MainMenu")
        {
            Debug.LogError($"[SafeReturn] Khởi chạy! Lỗi: {errorTitle} - {errorMessage}");

            // 1. Tắt Loading
            ShowLoading(false);

            // 2. Hiện Popup đập vào mặt người chơi để họ biết bị gì
            ShowError(errorTitle, errorMessage);

            // 3. Rút điện mạng (Nếu đang lỡ kẹt trong phòng)
            if (PhotonNetwork.InRoom)
            {
                PhotonNetwork.LeaveRoom();
            }

            // 4. Mở cửa thoát hiểm về sảnh an toàn
            if (_sceneLoader != null)
            {
                _sceneLoader.LoadSceneAsync(safeScene).Forget();
            }
        }
    }
}