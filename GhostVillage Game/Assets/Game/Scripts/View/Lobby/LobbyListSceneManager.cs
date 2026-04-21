using UnityEngine;
using VContainer;
using TMPro;
using System.Collections.Generic;
using Game.Core.Network;
using Game.Core.Scene;
using Game.Core.Network.Lobby;
using Game.Script.UI;

namespace Game.UI.Lobby
{
    public class LobbyListSceneManager : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Transform _contentParent;
        [SerializeField] private LobbyItemUI _itemPrefab;
        [SerializeField] private GameObject _emptyText;

        [Header("Create Lobby UI")]
        [SerializeField] private GameObject _createLobbyPopup;
        [SerializeField] private TMP_InputField _inputLobbyName;
        [SerializeField] private TMP_InputField _inputPassword;

        [Header("Password Modal UI")]
        [SerializeField] private GameObject _passwordModal;
        [SerializeField] private TMP_InputField _inputJoinPassword;
        [SerializeField] private TextMeshProUGUI _txtPasswordError;
        private LobbyData _pendingLobby;

        [Inject] private INetworkService _network;
        [Inject] private ISceneLoaderService _sceneLoader;
        [Inject] private GlobalUIManager _globalUI;

        /// <summary>
        /// Khoi tao trang thai UI ban dau va dang ky cac su kien mang.
        /// Logic: Bat loading ngay lap tuc de cho phan hoi tu Hallway/Lobby.
        /// </summary>
        private void Start()
        {
            _network.OnLobbyListUpdated += UpdateUI;
            _network.OnCreateLobbyFailed += OnCreateFailed;
            _network.OnHallwayJoined += OnReadyToInteract;
            _network.OnJoinLobbySuccess += OnReadyToInteract;
            _network.OnJoinLobbyFailed += HandleJoinFailed;

            if (_txtPasswordError != null) _txtPasswordError.text = "";
            if (_createLobbyPopup != null) _createLobbyPopup.SetActive(false);
            if (_passwordModal != null) _passwordModal.SetActive(false);

            UnlockCursor();

            if (_network.IsConnected)
            {
                _globalUI.ShowLoading(true);
                _network.JoinHallway();
            }
            else
            {
                _sceneLoader.LoadSceneAsync("MainMenu");
            }
        }

        /// <summary>
        /// Huy dang ky cac su kien khi doi tuong bi pha huy.
        /// </summary>
        private void OnDestroy()
        {
            if (_network != null)
            {
                _network.OnLobbyListUpdated -= UpdateUI;
                _network.OnCreateLobbyFailed -= OnCreateFailed;
                _network.OnHallwayJoined -= OnReadyToInteract;
                _network.OnJoinLobbySuccess -= OnReadyToInteract;
                _network.OnJoinLobbyFailed -= HandleJoinFailed;
            }
        }

        /// <summary>
        /// Callback khi da vao Hallway/Lobby thanh cong va san sang tuong tac.
        /// </summary>
        private void OnReadyToInteract() => _globalUI.ShowLoading(false);

        /// <summary>
        /// Xử lý khi Join thất bại (do sai pass hoặc lỗi mạng).
        /// </summary>
        private void HandleJoinFailed(string errorReason)
        {
            _globalUI.ShowLoading(false); // Tắt xoay xoay


            // Dùng Global UI để báo lỗi cho "xịn"
            if (errorReason == "Wrong Password!")
            {
                _passwordModal.SetActive(true);
                if (_txtPasswordError != null)
                {
                    _txtPasswordError.text = "Mật khẩu không đúng, vui lòng thử lại!";
                    _txtPasswordError.color = Color.red;
                }

                if (UnityEngine.SceneManagement.SceneManager.GetActiveScene().name != "LobbyListScene")
                {
                    _sceneLoader.LoadSceneAsync("LobbyListScene");
                }
            }
            else
            {
                _globalUI.ShowError("Lỗi hệ thống", $"Không thể vào phòng: {errorReason}");
            }
        }

        /// <summary>
        /// Quay lai man hinh chinh.
        /// </summary>
        public void OnBackClick() => _sceneLoader.LoadSceneAsync("MainMenu");

        /// <summary>
        /// Cap nhat danh sach phong hien thi tren UI.
        /// Tham so: lobbies - Danh sach du lieu phong nhan tu mang.
        /// Logic: Don dep danh sach cu va khoi tao lai cac item moi dua tren LobbyData.
        /// </summary>
        private void UpdateUI(List<LobbyData> lobbies)
        {
            Debug.Log($"[UI] Refreshing room list. Total rooms: {lobbies.Count}");

            foreach (Transform child in _contentParent)
            {
                Destroy(child.gameObject);
            }

            if (_emptyText != null)
            {
                _emptyText.SetActive(lobbies.Count == 0);
            }

            foreach (var lobby in lobbies)
            {
                var item = Instantiate(_itemPrefab, _contentParent);
                item.Setup(lobby, (data) =>
                {
                    Debug.Log($"[UI] User selected room: {data.Name}");
                    OnLobbyItemClicked(data);
                });
            }
        }

        /// <summary>
        /// Mo popup nhap thong tin tao phong.
        /// </summary>
        public void OnOpenCreatePopupClick()
        {
            _createLobbyPopup.SetActive(true);
            _inputLobbyName.text = "";
            _inputPassword.text = "";
        }

        /// <summary>
        /// Dong popup tao phong.
        /// </summary>
        public void OnCloseCreatePopupClick()
        {
            _createLobbyPopup.SetActive(false);
        }

        /// <summary>
        /// Xu ly lenh xac nhan tao phong.
        /// Logic: Kiem tra Input hop le, chi cho phep chu/so, block ky tu dac biet, gioi han do dai pass.
        /// </summary>
        public void OnConfirmCreateClick()
        {
            string roomName = _inputLobbyName.text.Trim();
            string password = _inputPassword.text;

            // 1. Bắt lỗi rỗng
            if (string.IsNullOrEmpty(roomName))
            {
                if (_globalUI != null) _globalUI.ShowError("Error", "Room name cannot be empty!");
                return;
            }

            // 2. Bắt lỗi độ dài tên phòng (ngắn quá hoặc dài quá nhìn UI sẽ rất gớm)
            if (roomName.Length < 3 || roomName.Length > 20)
            {
                if (_globalUI != null) _globalUI.ShowError("Error", "Room name must be between 3 and 20 characters!");
                return;
            }

            // 3. Bắt lỗi ký tự đặc biệt (Chỉ cho phép Chữ không dấu/có dấu, Số và Khoảng trắng)
            if (!System.Text.RegularExpressions.Regex.IsMatch(roomName, @"^[a-zA-Z0-9 ]+$"))
            {
                if (_globalUI != null) _globalUI.ShowError("Error", "Room name can only contain letters, numbers, and spaces!");
                return;
            }

            // 4. Giới hạn độ dài Password (Mặc dù Photon cho max ping, nhưng UI mình set 16 cho đẹp)
            if (password.Length > 16)
            {
                if (_globalUI != null) _globalUI.ShowError("Error", "Password cannot exceed 16 characters!");
                return;
            }

            // Mọi thứ qua cửa kiểm duyệt ngon lành -> Gọi mạng
            _globalUI.ShowLoading(true);
            _createLobbyPopup.SetActive(false);

            Debug.Log($"[UI] Sending create lobby request: {roomName}");
            _network.CreateLobby(roomName, password, 4);
        }

        /// <summary>
        /// Callback khi thao tac tao phong bi loi tu phia server.
        /// </summary>
        private void OnCreateFailed()
        {
            _globalUI.ShowLoading(false);
            Debug.LogError("[UI] Room creation failed on server.");
        }

        /// <summary>
        /// Xu ly khi nguoi dung click vao mot phong trong danh sach.
        /// Tham so: lobbyData - Du lieu phong duoc chon.
        /// Logic: Hien thi loading va goi lenh gia nhap thong qua Network Service.
        /// </summary>
        private void OnLobbyItemClicked(LobbyData lobbyData)
        {
            if (lobbyData.IsLocked)
            {
                _pendingLobby = lobbyData;
                OpenPasswordModal();
            }
            else
            {
                _globalUI.ShowLoading(true);
                _network.JoinLobbySession(lobbyData.Name);
            }
        }

        public void OpenPasswordModal()
        {
            _passwordModal.SetActive(true);
            _inputJoinPassword.text = "";
            if (_txtPasswordError != null) _txtPasswordError.text = ""; // Reset thông báo lỗi cũ
            _inputJoinPassword.ActivateInputField();
        }

        public void OnConfirmJoinWithPassword()
        {
            if (_pendingLobby == null)
            {
                if (_globalUI != null) _globalUI.ShowError("Lỗi Hệ Thống", "Dữ liệu phòng bị mất, vui lòng thử lại!");
                return;
            }

            string enteredPass = _inputJoinPassword.text;

            // Bắt lỗi không nhập pass mà đòi vào phòng kín
            if (string.IsNullOrEmpty(enteredPass))
            {
                if (_globalUI != null) _globalUI.ShowError("Lỗi Nhập Liệu", "Vui lòng nhập mật khẩu để vào phòng!");
                return;
            }

            _globalUI.ShowLoading(true);
            _passwordModal.SetActive(false);

            _network.JoinLobbySession(_pendingLobby.Name, enteredPass);
        }

        public void OnClosePasswordModal() => _passwordModal.SetActive(false);

        /// <summary>
        /// Hàm xử lý sự kiện khi ấn nút về Main Menu.
        /// Gán hàm này vào sự kiện OnClick của Button.
        /// </summary>
        public void OnReturnToMainMenu()
        {
            // 1. Hiện màn hình loading để chặn input người dùng ngay lập tức
            _globalUI.ShowLoading(true);

            // 2. (Tuỳ chọn) Nếu bạn muốn ngắt kết nối khỏi Lobby hiện tại để về menu sạch sẽ hơn
            // _network.LeaveLobby(); 

            // 3. Gọi SceneLoader để chuyển về MainMenu
            _sceneLoader.LoadSceneAsync("MainMenu");
        }

        /// <summary>
        /// Hàm giải phóng con trỏ chuột để người chơi có thể click UI.
        /// </summary>
        private void UnlockCursor()
        {
            Cursor.lockState = CursorLockMode.None; // Cho phép chuột di chuyển tự do
            Cursor.visible = true;                  // Hiện con trỏ chuột
        }

    }
}