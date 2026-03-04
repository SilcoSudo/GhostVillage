using UnityEngine;
using VContainer;
using Game.Core.Scene; // Namespace chứa ISceneLoaderService
using Game.Core.Network;
using UnityEngine.UI;
using TMPro;
using Game.Core.ReactiveRepo;
using R3;
using Cysharp.Threading.Tasks;

namespace Game.UI.MainMenu
{
    public class MainMenuController : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Button _lobbyListButton; // Nút vào xem danh sách
        [SerializeField] private Button _debugHostButton; // Nút test tạo nhanh phòng

        [SerializeField] private Button _shopButton; // Nút vào cửa hàng

        [SerializeField] private TextMeshProUGUI _statusText; // Hiện trạng thái kết nối

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
            public string id;      // ví dụ: "avatar_default_02"
            public Sprite sprite;  // sprite tương ứng
        }

        [Header("Avatar Presets")]
        [SerializeField] private AvatarEntry[] avatarPresets;
        [SerializeField] private Sprite defaultAvatar;

        // --- INJECTION ---
        [Inject] private INetworkService _network;
        [Inject] private PlayerDataStore _store; // Inject Cục Data trung tâm
        [Inject] private ISceneLoaderService _sceneLoader;

        // Quản lý các đăng ký để xóa khi tắt scene (tránh rò rỉ RAM)
        private readonly CompositeDisposable _disposables = new();

        private void Start()
        {
            // 1. KẾT NỐI UI VỚI DATA STORE (REACTIVE BINDING)
            BindUI();

            if (_network.IsConnected)
            {
                HandleConnected();
            }
            else
            {
                // Nếu bị rớt mạng hoặc chưa kết nối (do lỗi nào đó), thử kết nối lại ngầm
                Debug.Log("[MainMenu] Photon offline, đang kết nối lại...");
                _statusText.text = "Đang kết nối lại...";
                _statusText.color = Color.yellow;
                _lobbyListButton.interactable = false;
                _debugHostButton.interactable = false;
                _shopButton.interactable = false;

                string playerName = _store.DisplayName.Value;
                string token = _store.AuthToken.Value;
                // Gọi kết nối lại. Khi kết nối xong, HandleConnected sẽ tự động được gọi (vì đã đăng ký ở OnEnable/Start trước đó)
                // Lưu ý: Đảm bảo bạn đã đăng ký _network.OnPhotonConnected += HandleConnected; ở đâu đó trong MainMenuController.
                _network.ConnectAsync(playerName, token).Forget();
            }
        }

        private void BindUI()
        {
            // Mỗi khi Tên trong Store đổi -> Text tự đổi
            _store.DisplayName
                .Subscribe(val => txtPlayerName.text = val)
                .AddTo(_disposables);

            // Mỗi khi Level đổi -> Text tự nhảy
            _store.Level
                .Subscribe(val => txtPlayerLevel.text = val.ToString())
                .AddTo(_disposables);

            // Mỗi khi Tiền đổi -> Text tự cập nhật định dạng số
            _store.Coins
                .Subscribe(val => txtCoin.text = val.ToString("N0"))
                .AddTo(_disposables);

            // Mỗi khi Avatar đổi -> Sprite tự load lại
            _store.AvatarId
                .Subscribe(id => imgPlayerAvatar.sprite = ResolveAvatarSprite(id))
                .AddTo(_disposables);
        }

        private Sprite ResolveAvatarSprite(string avatarId)
        {
            if (!string.IsNullOrEmpty(avatarId) && avatarPresets != null)
            {
                for (int i = 0; i < avatarPresets.Length; i++)
                {
                    if (avatarPresets[i] != null &&
                        avatarPresets[i].id == avatarId &&
                        avatarPresets[i].sprite != null)
                    {
                        return avatarPresets[i].sprite;
                    }
                }
            }

            return defaultAvatar != null ? defaultAvatar : imgPlayerAvatar.sprite;
        }

        private void OnDestroy()
        {
            _disposables.Dispose(); // Hủy toàn bộ lắng nghe khi thoát scene
            if (_network != null) _network.OnPhotonConnected -= HandleConnected;
        }

        // --- EVENT HANDLERS ---

        private void HandleConnected()
        {
            _statusText.text = $"Online: {_store.DisplayName.Value}";
            _statusText.color = Color.green;

            // Mở khóa các nút chức năng
            _lobbyListButton.interactable = true;
            _debugHostButton.interactable = true;
            _shopButton.interactable = true;
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

        // Gắn vào nút "Test Host" (Nút ảo để test)
        public void OnDebugCreateRoomClick()
        {
            _statusText.text = "Creating Test Room...";
            // Tạo nhanh phòng tên "Test_Room_01", pass rỗng, 4 người
            _network.CreateLobby("Test_Room_01", "", 4);
        }

        // Gắn vào nút Quit
        public void OnQuitClick()
        {
            Application.Quit();
        }
    }
}