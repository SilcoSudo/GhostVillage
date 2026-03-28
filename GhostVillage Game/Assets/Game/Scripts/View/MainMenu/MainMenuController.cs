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
using GhostVillage.Domain.Profile;
using System.Collections.Generic;

namespace Game.UI.MainMenu
{
    public class MainMenuController : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Button _lobbyListButton; // Nút vào xem danh sách
        [SerializeField] private Button _debugHostButton; // Nút test tạo nhanh phòng
        [SerializeField] private Button _shopButton; // Nút vào cửa hàng
        [SerializeField] private Button _storageButton; // Nút vào kho đồ

        [SerializeField] private TextMeshProUGUI _statusText; // Hiện trạng thái kết nối

        [Header("Profile Text")]
        [SerializeField] private TMP_Text txtPlayerName;
        [SerializeField] private TMP_Text txtPlayerLevel;
        [SerializeField] private TMP_Text txtCoin;

        [Header("Profile Images")]
        [SerializeField] private Image imgPlayerAvatar;
        [SerializeField] private Image imgAvatarNotification;

        [Header("Daily Quests UI")]
        [SerializeField] private Transform _dailyQuestContent; // Nơi chứa Item
        [SerializeField] private GameObject _dailyQuestPrefab; // Prefab Item_DailyQuestUI

        [Inject] private ProfileService _profileService; // Lấy service để fetch & claim quest

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
            FetchAndRenderDailyQuests().Forget();
            _friendController.InitializeDataAsync().Forget();

            if (_network.IsConnected)
                HandleConnected();
            else
            {
                _statusText.text = "Đang kết nối lại...";
                _statusText.color = Color.yellow;
                _lobbyListButton.interactable = false;
                _debugHostButton.interactable = false;
                _shopButton.interactable = false;
                _storageButton.interactable = false;
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
            _shopButton.interactable = true;
            _storageButton.interactable = true;
        }

        // Gắn vào nút "Lobby List"
        public void OnLobbyListClick()
        {
            // Chuyển sang scene xem danh sách
            _sceneLoader.LoadSceneAsync("LobbyListScene");
        }

        // Gắn vào Profile
        public void OpenProfileScene()
        {
            // Chuyển sang scene Profile
            _sceneLoader.LoadSceneAsync("ProfileScene");
        }

        // Gắn vào nút "Shop"
        public void OpenShopScene()
        {
            // Chuyển sang scene Shop
            _sceneLoader.LoadSceneAsync("ShopScene");
        }

        public void OpenStorageScene()
        {
            // Chuyển sang scene Storage
            _sceneLoader.LoadSceneAsync("StorageScene");
        }

        // Gắn vào nút "Test Host" (Nút ảo để test)
        public void OnDebugCreateRoomClick()
        {
            _statusText.text = "Creating Test Room...";
            _network.CreateLobby("Test_Room_01", "", 4);
        }

        // =========================================================
        // VÙNG LOGIC DAILY QUEST TRONG MAIN MENU
        // =========================================================

        private async UniTask FetchAndRenderDailyQuests()
        {
            if (_profileService == null) return;

            // Gọi API GetAchievementsAsync vì bên BE mình đã gộp trả về cả dailyQuests
            var profileData = await _profileService.GetAchievementsAsync(_session.Token);

            if (profileData != null && profileData.dailyQuests != null)
            {
                RenderDailyQuests(profileData.dailyQuests);
            }
        }

        private void RenderDailyQuests(List<QuestItemDTO> dailyQuests)
        {
            // 1. Dọn rác UI cũ
            foreach (Transform child in _dailyQuestContent) Destroy(child.gameObject);

            // 2. Sinh item mới
            foreach (var quest in dailyQuests)
            {
                var itemGo = Instantiate(_dailyQuestPrefab, _dailyQuestContent);

                if (itemGo.TryGetComponent<RectTransform>(out var rect))
                    rect.localScale = Vector3.one;

                // Lưu ý namespace của Item_DailyQuestUI đang nằm ở Lobby
                if (itemGo.TryGetComponent<Game.Scripts.UI.Lobby.Item_DailyQuestUI>(out var ui))
                {
                    ui.Setup(quest, () => ClaimQuest(quest.id).Forget());
                }
            }
        }

        private async UniTaskVoid ClaimQuest(string questId)
        {
            _globalUI.ShowLoading(true);
            bool success = await _profileService.ClaimQuestAsync(questId, _session.Token);
            _globalUI.ShowLoading(false);

            if (success)
            {
                Debug.Log($"<color=green>[MainMenu] Nhận thưởng nhiệm vụ {questId} thành công!</color>");

                // Refresh lại cả 2 thứ: Profile (để tiền/exp nảy số) và Daily List (để nút biến thành ĐÃ NHẬN)
                FetchAndPopulateProfile().Forget();
                FetchAndRenderDailyQuests().Forget();
            }
            else
            {
                Debug.LogError($"<color=red>[MainMenu] Nhận thưởng {questId} thất bại!</color>");
            }
        }
    }
}