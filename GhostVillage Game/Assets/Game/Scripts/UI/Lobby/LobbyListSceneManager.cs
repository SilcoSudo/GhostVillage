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

            if (_createLobbyPopup != null) _createLobbyPopup.SetActive(false);
            if (_passwordModal != null) _passwordModal.SetActive(false);

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
                _globalUI.ShowError("Lỗi truy cập", "Mật khẩu bạn nhập không chính xác. Vui lòng thử lại!");
                // Không cần mở lại Modal Pass ở đây, để user tự ấn lại vào phòng nếu muốn
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
        /// Logic: Trim khoang trang, kiem tra ten phong hop le va ngan chan double-click bang loading.
        /// </summary>
        public void OnConfirmCreateClick()
        {
            string roomName = _inputLobbyName.text.Trim();
            if (string.IsNullOrEmpty(roomName))
            {
                Debug.LogWarning("[UI] Room name cannot be empty.");
                return;
            }

            _globalUI.ShowLoading(true);
            _createLobbyPopup.SetActive(false);

            Debug.Log($"[UI] Sending create lobby request: {roomName}");
            _network.CreateLobby(roomName, _inputPassword.text, 4);
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
            _inputJoinPassword.ActivateInputField(); // Tự focus vào ô nhập cho tiện
        }

        public void OnConfirmJoinWithPassword()
        {
            if (_pendingLobby == null)
            {
                Debug.LogError("[UI] Pending lobby is null. Cannot join.");
                _globalUI.ShowLoading(false);
                return;
            }

            string enteredPass = _inputJoinPassword.text;
            if (string.IsNullOrEmpty(enteredPass))
            {
                Debug.LogWarning("[UI] Password cannot be empty.");
                _globalUI.ShowLoading(false);
                return;
            }

            _globalUI.ShowLoading(true);
            _passwordModal.SetActive(false);

            _network.JoinLobbySession(_pendingLobby.Name, enteredPass);
        }

        public void OnClosePasswordModal() => _passwordModal.SetActive(false);

    }
}