using UnityEngine;
using VContainer;
using TMPro;
using System.Collections.Generic;
using Game.Core.Network;
using Game.Core.Scenes;
using Game.Core.Network.Lobby;
using Game.Script.UI;

namespace Game.UI.Lobby
{
    public class LobbyListSceneManager : MonoBehaviour
    {
        [Header("UI")]
        [SerializeField] private Transform _contentParent; // Chỗ chứa item
        [SerializeField] private LobbyItemUI _itemPrefab;  // Prefab dòng lobby
        [SerializeField] private GameObject _emptyText;    // Text "Không có phòng nào"

        [Header("Create Lobby UI")]
        [SerializeField] private GameObject _createLobbyPopup; // Panel Popup nhập thông tin (Đã đổi tên)
        [SerializeField] private TMP_InputField _inputLobbyName; // Ô nhập tên lobby (Đã đổi tên)
        [SerializeField] private TMP_InputField _inputPassword; // Ô nhập pass

        [Inject] private INetworkService _network;
        [Inject] private ISceneLoaderService _sceneLoader;
        [Inject] private GlobalUIManager _globalUI;

        private void Start()
        {
            // 1. Đăng ký sự kiện
            _network.OnLobbyListUpdated += UpdateUI;

            // Đăng ký sự kiện khi tạo thất bại để tắt loading
            _network.OnCreateLobbyFailed += OnCreateFailed;
            _network.OnHallwayJoined += OnReadyToInteract; // Sự kiện quan trọng mới thêm

            // 2. Mặc định tắt Popup tạo phòng
            if (_createLobbyPopup != null) _createLobbyPopup.SetActive(false);

            // 3. Refresh logic
            if (_network.IsConnected)
            {
                // BẬT LOADING NGAY LẬP TỨC để ngăn người dùng bấm lung tung khi chưa sẵn sàng
                _globalUI.ShowLoading(true);
                // Nếu đã kết nối, đảm bảo đang ở Hallway để nhận list
                _network.JoinHallway();
            }
            else
            {
                // Edge case: Nếu rớt mạng thì quay về MainMenu connect lại
                Debug.LogWarning("Lost connection! Back to MainMenu.");
                _sceneLoader.LoadSceneAsync("MainMenu");
            }
        }

        private void OnDestroy()
        {
            if (_network != null) _network.OnLobbyListUpdated -= UpdateUI;
        }

        // Chỉ khi nào vào Sảnh xong mới tắt Loading
        private void OnReadyToInteract()
        {
            Debug.Log("✅ UI đã sẵn sàng tương tác!");
            _globalUI.ShowLoading(false);
        }

        public void OnBackClick()
        {
            _sceneLoader.LoadSceneAsync("MainMenu");
        }

        // Hàm xử lý hiển thị
        private void UpdateUI(List<LobbyData> lobbies)
        {
            // Clear list cũ
            foreach (Transform child in _contentParent) Destroy(child.gameObject);

            // Ẩn hiện text trống
            if (_emptyText != null) _emptyText.SetActive(lobbies.Count == 0);

            // Spawn list mới
            foreach (var lobby in lobbies)
            {
                var item = Instantiate(_itemPrefab, _contentParent);
                // Setup item (Chỉ hiển thị, chưa cần logic Join phức tạp vội)
                item.Setup(lobby, (data) =>
                {
                    Debug.Log($"Người dùng chọn phòng: {data.Name}");
                });
            }
        }

        // 1. Gắn vào nút "Create Room" ở góc màn hình -> Mở Popup
        public void OnOpenCreatePopupClick()
        {
            _createLobbyPopup.SetActive(true);
            _inputLobbyName.text = ""; // Reset text
            _inputPassword.text = "";
        }

        // 2. Gắn vào nút "Cancel" hoặc dấu X trong Popup -> Đóng Popup
        public void OnCloseCreatePopupClick()
        {
            _createLobbyPopup.SetActive(false);
        }

        // 3. Gắn vào nút "Confirm" trong Popup -> Gửi lệnh tạo
        public void OnConfirmCreateClick()
        {
            string roomName = _inputLobbyName.text;
            string password = _inputPassword.text;


            Debug.Log($"📝 Input Data -> Name: '{roomName}' | Pass: '{password}'");

            if (string.IsNullOrEmpty(roomName))
            {
                Debug.LogWarning("Tên phòng không được để trống!");
                return;
            }

            // Hiện loading xoay xoay
            _globalUI.ShowLoading(true);

            // Gọi Network tạo phòng (Khi tạo xong, Photon tự chuyển scene nhờ logic bên NetworkManager)
            _network.CreateLobby(roomName, password, 4); // Max 4 người
        }

        private void OnCreateFailed()
        {
            _globalUI.ShowLoading(false);
            Debug.LogError("Tạo phòng thất bại (Trùng tên hoặc lỗi server)!");
            // Có thể hiện popup thông báo lỗi ở đây nếu muốn
        }
    }
}