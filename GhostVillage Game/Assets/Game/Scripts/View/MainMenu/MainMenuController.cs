using UnityEngine;
using VContainer;
using Game.Core.Scene; // Namespace chứa ISceneLoaderService
using Game.Core.Network;
using Game.Domain.Account.Service;
using UnityEngine.UI;
using TMPro;

namespace Game.UI.MainMenu
{
    public class MainMenuController : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Button _lobbyListButton; // Nút vào xem danh sách
        [SerializeField] private Button _debugHostButton; // Nút test tạo nhanh phòng
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
        [Inject] private AccountService _account;
        [Inject] private ISceneLoaderService _sceneLoader;

        private void Start()
        {
            // Mặc định khóa nút chờ kết nối
            _lobbyListButton.interactable = false;
            _debugHostButton.interactable = false;
            _statusText.text = "Connecting to Server...";

            // 1. Lắng nghe sự kiện kết nối thành công
            _network.OnPhotonConnected += HandleConnected;

            //Bind profile UI
            BindProfilePanel();

            // 2. Lấy tên người chơi từ Login (đã lưu trong AccountService)
            string playerName = _account.GetDisplayName();
            Debug.Log($"[MainMenu] Hello {playerName}");

            // 3. Gọi lệnh kết nối (Nếu chưa kết nối)
            if (!_network.IsConnected)
            {
                _network.Connect(playerName);
            }
            else
            {
                // Nếu lỡ đã kết nối rồi (do quay lại từ scene khác) thì mở nút luôn
                HandleConnected();
            }
        }
        
        private void BindProfilePanel()
        {
            // Text
            txtPlayerName.text  = _account.GetDisplayName();
            txtPlayerLevel.text = _account.GetLevel().ToString();
            txtCoin.text        = _account.GetCoin().ToString("N0");

            // Avatar preset
            if (imgPlayerAvatar != null)
            {
                var avatarId = _account.GetAvatarId();
                imgPlayerAvatar.sprite = ResolveAvatarSprite(avatarId);
                imgPlayerAvatar.enabled = true;
            }

            if (imgAvatarNotification != null)
                imgAvatarNotification.enabled = false;
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
            if (_network != null)
            {
                _network.OnPhotonConnected -= HandleConnected;
            }
        }

        // --- EVENT HANDLERS ---

        private void HandleConnected()
        {
            _statusText.text = $"Online: {_account.GetDisplayName()}";
            _statusText.color = Color.green;

            // Mở khóa các nút chức năng
            _lobbyListButton.interactable = true;
            _debugHostButton.interactable = true;
        }

        // Gắn vào nút "Lobby List"
        public void OnLobbyListClick()
        {
            // Chuyển sang scene xem danh sách
            _sceneLoader.LoadSceneAsync("LobbyListScene");
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