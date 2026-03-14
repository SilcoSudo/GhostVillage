// File: src/Game/UI/Core/GlobalUIManager.cs
using UnityEngine;
using Cysharp.Threading.Tasks;
using System.Threading;
using TMPro;
using Game.UI.Settings;
using UnityEngine.UI;
using VContainer;
using Game.Domain.Settings.Controllers;
namespace Game.Script.UI
{
    public class GlobalUIManager : MonoBehaviour
    {
        // === ENUM ĐỂ PHÂN BIỆT 3 LOẠI MENU ESC ===
        public enum EscMenuType { None, MainMenu, Lobby, InGame }

        [Header("Popup References")]
        [SerializeField] private GameObject _popupPanel;
        [SerializeField] private TMP_Text _txtTitle;
        [SerializeField] private TMP_Text _txtMessage;

        [SerializeField] private GameObject _loadingPanel;
        [SerializeField] private TMP_Text _txtLoadingMessage; // Kéo Text của Loading vào đây
        private const float LOADING_TIMEOUT = 30f;
        private CancellationTokenSource _cts;

        [Header("Settings Reference")]
        [SerializeField] private SettingsUIManager _settingsUI;

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

        // === CÁC ACTION ĐỂ SCENE LẮNG NGHE ===
        public System.Action OnLogoutClicked;
        public System.Action OnLobbyExitClicked;
        public System.Action OnGameExitClicked;

        private EscMenuType _currentEscType = EscMenuType.None;


        [Inject]
        public void Construct(SettingsController settingsController)
        {
            // Sau khi nhận được thuốc, bơm xuống cho thằng con ngay lập tức
            if (_settingsUI != null)
            {
                _settingsUI.Init(settingsController);
            }
            else
            {
                Debug.LogError("[GlobalUIManager] Chưa gán _settingsUI trên Inspector!");
            }
        }

        private void Awake()
        {
            // 1. Đảm bảo Popup và Loading luôn ẩn khi mới vào Game
            if (_popupPanel != null) _popupPanel.SetActive(false);
            if (_loadingPanel != null) _loadingPanel.SetActive(false);
            if (_settingsUI != null) _settingsUI.ShowSettings(false);
            CloseEscMenu(false); // Khởi tạo ẩn

            BindEscMenuEvents();
        }

        private void BindEscMenuEvents()
        {
            // SỬA Ở ĐÂY: Hàm gọi truyền đúng param
            if (_btnMainMenu_Resume != null) _btnMainMenu_Resume.onClick.AddListener(() => CloseEscMenu(false));
            if (_btnLobby_Resume != null) _btnLobby_Resume.onClick.AddListener(() => CloseEscMenu(true));
            if (_btnGame_Resume != null) _btnGame_Resume.onClick.AddListener(() => CloseEscMenu(true));

            // Nút Setting
            if (_btnMainMenu_Setting != null) _btnMainMenu_Setting.onClick.AddListener(OpenSettingsFromEsc);
            if (_btnLobby_Setting != null) _btnLobby_Setting.onClick.AddListener(OpenSettingsFromEsc);
            if (_btnGame_Setting != null) _btnGame_Setting.onClick.AddListener(OpenSettingsFromEsc);

            // Nút Chức Năng
            if (_btnMainMenu_Logout != null) _btnMainMenu_Logout.onClick.AddListener(() => { CloseEscMenu(false); OnLogoutClicked?.Invoke(); });
            if (_btnLobby_Exit != null) _btnLobby_Exit.onClick.AddListener(() => { CloseEscMenu(true); OnLobbyExitClicked?.Invoke(); });
            if (_btnGame_ExitMatch != null) _btnGame_ExitMatch.onClick.AddListener(() => { CloseEscMenu(true); OnGameExitClicked?.Invoke(); });
        }

        private void OpenSettingsFromEsc()
        {
            CloseEscMenu(false);
            OpenSettings();
        }

        public bool IsEscMenuOpen() => _escMenuModal != null && _escMenuModal.activeSelf;

        public void ToggleEscMenu(bool forceState, bool useCursorLock = true)
        {
            if (_escMenuModal == null) return;

            _escMenuModal.SetActive(forceState);

            // Xử lý chuột (Cẩn thận khi InGame)
            if (useCursorLock)
            {
                Cursor.lockState = forceState ? CursorLockMode.None : CursorLockMode.Locked;
                Cursor.visible = forceState;
            }
        }

        public void OpenEscMenu(EscMenuType type, bool useCursorLock = true)
        {
            if (_escMenuModal == null || type == EscMenuType.None)
            {
                Debug.LogError("[GlobalUIManager] OpenEscMenu thất bại: Lỗi tham chiếu Modal hoặc Type là None!");
                return;
            }

            Debug.Log($"[GlobalUIManager] Đang mở Menu ESC: {type}");

            _currentEscType = type;

            // Bật Panel cha
            _escMenuModal.SetActive(true);

            // Bật tắt các Group con
            if (_grpMainMenuEsc != null) _grpMainMenuEsc.SetActive(type == EscMenuType.MainMenu);
            if (_grpLobbyEsc != null) _grpLobbyEsc.SetActive(type == EscMenuType.Lobby);
            if (_grpGameEsc != null) _grpGameEsc.SetActive(type == EscMenuType.InGame);

            // Ép UI Focus ra khỏi nút bấm để tránh lỗi Input System kẹt Enter/Space
            if (UnityEngine.EventSystems.EventSystem.current != null)
                UnityEngine.EventSystems.EventSystem.current.SetSelectedGameObject(null);

            if (useCursorLock)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }
        }

        public void CloseEscMenu(bool useCursorLock = true)
        {
            if (_escMenuModal == null) return;

            _escMenuModal.SetActive(false);

            if (useCursorLock)
            {
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
        }

        public void OpenSettings()
        {
            if (_settingsUI != null)
            {
                _settingsUI.ShowSettings(true);
            }
        }

        public void CloseSettings()
        {
            if (_settingsUI != null) _settingsUI.ShowSettings(false);

            if (_currentEscType == EscMenuType.InGame || _currentEscType == EscMenuType.Lobby)
            {
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
        }

        // Hàm ShowLoading chuẩn chỉnh
        public void ShowLoading(bool show, string msg = "Loading...")
        {
            if (_loadingPanel == null) return;

            _loadingPanel.SetActive(show);

            if (show)
            {
                if (_txtLoadingMessage != null) _txtLoadingMessage.text = msg;

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
                // Đợi 30s nhưng có kèm token kiểm soát
                await UniTask.Delay((int)(LOADING_TIMEOUT * 1000), cancellationToken: token);

                // Kiểm tra an toàn trước khi truy cập
                if (_loadingPanel != null && _loadingPanel.activeInHierarchy)
                {
                    Debug.LogWarning($"⚠️ Loading timeout sau {LOADING_TIMEOUT}s. Tự động ẩn.");
                    _loadingPanel.SetActive(false);
                }
            }
            catch (System.OperationCanceledException)
            {
                // Task bị hủy khi Object bị Destroy - Đây là hành vi bình thường, không phải lỗi
                Debug.Log("Task loading đã được hủy an toàn.");
            }
        }

        public void ShowError(string title, string message)
        {
            if (_popupPanel == null) return;
            _txtTitle.text = title;
            _txtMessage.text = message;
            _popupPanel.SetActive(true);
        }
        public void ClosePopup() => _popupPanel.SetActive(false);
    }
}