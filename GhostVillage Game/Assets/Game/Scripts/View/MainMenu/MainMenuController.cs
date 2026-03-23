using UnityEngine;
using VContainer;
using Game.Core.Scene;
using Game.Core.Network;
using UnityEngine.UI;
using TMPro;
using R3;
using Cysharp.Threading.Tasks;
using Game.Domain.Authentication;
using Game.Script.UI;
using UnityEngine.InputSystem;

namespace Game.UI.MainMenu
{
    public class MainMenuController : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Button _lobbyListButton;
        [SerializeField] private Button _debugHostButton;
        [SerializeField] private TextMeshProUGUI _statusText;

        [Header("Profile Text")]
        [SerializeField] private TMP_Text txtPlayerName;
        [SerializeField] private TMP_Text txtPlayerLevel;
        [SerializeField] private TMP_Text txtCoin;

        [Header("Profile Images")]
        [SerializeField] private Image imgPlayerAvatar;
        [SerializeField] private Image imgAvatarNotification;

        [System.Serializable]
        private class AvatarEntry
        {
            public string id;
            public Sprite sprite;
        }

        [Header("Avatar Presets")]
        [SerializeField] private AvatarEntry[] avatarPresets;
        [SerializeField] private Sprite defaultAvatar;

        [Inject] private INetworkService _network;
        [Inject] private ISceneLoaderService _sceneLoader;
        [Inject] private GameSession _session;
        [Inject] private AuthService _authService;
        [Inject] private GlobalUIManager _globalUI;

        [Inject] private Game.Domain.Friend.Controllers.FriendController _friendController;

        [Header("Settings UI")]
        [SerializeField] private Button _btnOpenEscMenu;

        // Bổ sung biến để chứa Input
        [Inject] private PlayerInputActions _inputActions; // Dùng Inject thay vì new

        private void OnEnable()
        {
            // Bật action map và gắn sự kiện
            _inputActions.Enable();

            // Tìm Action "EscTab" (Tên phải giống y hệt trong ảnh bạn chụp)
            var escAction = _inputActions.FindAction("Esc_Tab") ?? _inputActions.FindAction("EscapeTab");
            if (escAction != null)
            {
                escAction.performed += OnEscapePressed;
            }
            else
            {
                Debug.LogError("[MainMenu] Không tìm thấy Action có tên Esc_Tab hoặc EscapeTab trong PlayerInputActions!");
            }
        }

        private void OnDisable()
        {
            // Gỡ sự kiện và tắt input
            var escAction = _inputActions.FindAction("Esc_Tab") ?? _inputActions.FindAction("EscapeTab");
            if (escAction != null)
            {
                escAction.performed -= OnEscapePressed;
            }

            _inputActions.Disable();
        }

        private void Start()
        {
            _globalUI.OnLogoutClicked = OnLogoutAction;

            if (_btnOpenEscMenu != null)
            {
                _btnOpenEscMenu.onClick.AddListener(() => _globalUI.OpenEscMenu(GlobalUIManager.EscMenuType.MainMenu, false));
            }

            FetchAndPopulateProfile().Forget();
            _friendController.InitializeDataAsync().Forget();

            if (_network.IsConnected)
                HandleConnected();
            else
            {
                _statusText.text = "Đang kết nối lại...";
                _statusText.color = Color.yellow;
                _lobbyListButton.interactable = false;
                _debugHostButton.interactable = false;
                _network.ConnectAsync(_session.DisplayName, _session.Token).Forget();
            }
        }

        private void OnEscapePressed(InputAction.CallbackContext context)
        {
            if (_globalUI.IsEscMenuOpen())
            {
                _globalUI.CloseEscMenu();
            }
            else
            {
                _globalUI.OpenEscMenu(GlobalUIManager.EscMenuType.MainMenu, false);
            }
        }

        private void OnDestroy()
        {
            // RÚT ỐNG KHI THOÁT SCENE ĐỂ TRÁNH LỖI MEMORY LEAK
            if (_globalUI != null) _globalUI.OnLogoutClicked -= OnLogoutAction;
        }

        private void OnLogoutAction()
        {
            Debug.Log("[MainMenu] Thoát Game / Logout");
            Application.Quit();
        }

        private async UniTask FetchAndPopulateProfile()
        {
            var profileData = await _authService.FetchMyProfileAsync();

            if (profileData != null && profileData.profile != null)
            {
                txtPlayerName.text = profileData.profile.displayName;
                txtPlayerLevel.text = profileData.profile.level.ToString();
                txtCoin.text = profileData.profile.coin.ToString("N0");
                imgPlayerAvatar.sprite = ResolveAvatarSprite(profileData.profile.avatar);
            }
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
            return defaultAvatar != null ? defaultAvatar : imgPlayerAvatar.sprite;
        }

        private void HandleConnected()
        {
            _statusText.text = $"Online: {_session.DisplayName}";
            _statusText.color = Color.green;
            _lobbyListButton.interactable = true;
            _debugHostButton.interactable = true;
        }

        public void OnLobbyListClick() => _sceneLoader.LoadSceneAsync("LobbyListScene");
        public void OpenProfileScene() => _sceneLoader.LoadSceneAsync("ProfileScene");
        public void OnDebugCreateRoomClick()
        {
            _statusText.text = "Creating Test Room...";
            _network.CreateLobby("Test_Room_01", "", 4);
        }
    }
}