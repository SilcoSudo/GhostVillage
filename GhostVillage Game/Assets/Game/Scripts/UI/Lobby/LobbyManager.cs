using UnityEngine;
using Photon.Pun;
using VContainer;
using Game.Script.UI;
using Cysharp.Threading.Tasks;
using System.Collections.Generic;
using UnityEngine.InputSystem;

namespace Game.Scripts.UI.Lobby
{
    /// <summary>
    /// Điều phối luồng hoạt động chính và đồng bộ hóa mạng qua Photon RPC.
    /// </summary>
    public class LobbyManager : MonoBehaviourPunCallbacks // Sửa thành MonoBehaviourPunCallbacks để dùng photonView
    {
        [Header("Networking Setup")]
        [SerializeField] private string _playerPrefabName = "Player";
        [SerializeField] private List<Transform> _spawnPoints;
        [SerializeField] private Camera _sceneCamera;

        [Inject] private GlobalUIManager _globalUI;
        [Inject] private LobbyUIManager _uiManager;

        private async void Start()
        {
            _globalUI.ShowLoading(true);

            try
            {
                await UniTask.WhenAll(
                    WaitForInRoom(),
                    FetchLobbyResources()
                );
            }
            catch (System.Exception e)
            {
                Debug.LogError($"[LobbyManager] Error: {e.Message}");
            }

            // ĐĂNG KÝ: Bảo UI rằng khi nhấn Enter gửi tin thì gọi hàm này
            if (_uiManager != null)
            {
                _uiManager.BindSubmitEvent(HandleChatInput);
                SetupRoomUI();
            }
            else
            {
                Debug.LogError("❌ [LobbyManager] _uiManager is NULL. Check VContainer Registration!");
            }

            _globalUI.ShowLoading(false);
            SpawnPlayer();
        }

        /// <summary>
        /// Lắng nghe sự kiện phím Enter để thực hiện Focus hoặc gửi tin nhắn.
        /// </summary>
        private void Update()
        {
            if (Keyboard.current != null && Keyboard.current.enterKey.wasPressedThisFrame)
            {
                if (_uiManager == null) return;

                // TRƯỜNG HỢP 1: Ô chat đang ĐÓNG -> Mở lên để gõ
                if (!_uiManager.IsChatFocused())
                {
                    Debug.Log("🔍 [Lobby] Mở ô Chat.");
                    _uiManager.FocusChat();
                }
                // TRƯỜNG HỢP 2: Ô chat đang MỞ -> Lấy nội dung và xử lý (Gửi hoặc Hủy)
                else
                {
                    string message = _uiManager.GetInputText();
                    HandleChatInput(message);
                }
            }
        }

        /// <summary>
        /// Logic xử lý Chat: Nếu chưa focus thì focus, nếu đang focus và có nội dung thì gửi.
        /// </summary>
        private void HandleChatInput(string message)
        {
            if (!string.IsNullOrWhiteSpace(message))
            {
                Debug.Log($"📡 [Lobby] Gửi RPC Chat: {message}");
                photonView.RPC("RPC_ReceiveChatMessage", RpcTarget.All, PhotonNetwork.LocalPlayer.NickName, message);
            }
            else
            {
                Debug.Log("⚠️ [Lobby] Tin nhắn trống -> Đóng ô chat.");
            }

            // BẮT BUỘC: Xóa chữ và THOÁT FOCUS để di chuyển được WASD
            _uiManager.ClearInput();
            _uiManager.DeFocusChat();
        }

        /// <summary>
        /// Hàm nhận tin nhắn từ mạng và đẩy lên UI.
        /// </summary>
        /// <param name="senderName">Tên người gửi.</param>
        /// <param name="message">Nội dung tin nhắn.</param>
        [PunRPC]
        public void RPC_ReceiveChatMessage(string senderName, string message)
        {
            // Kiểm tra xem tin nhắn này có phải của chính mình gửi không
            bool isMe = senderName == PhotonNetwork.LocalPlayer.NickName;

            _uiManager.AddChatMessage(senderName, message, isMe);
        }

        private async UniTask WaitForInRoom()
        {
            while (!PhotonNetwork.InRoom) await UniTask.Yield();
        }

        private async UniTask FetchLobbyResources()
        {
            await UniTask.Delay(1000);
            _uiManager.AddMission("Sống sót qua đêm đầu tiên", false);
        }

        private void SetupRoomUI()
        {
            var room = PhotonNetwork.CurrentRoom;
            if (room == null) return;
            string pass = room.CustomProperties.ContainsKey("pw") ? (string)room.CustomProperties["pw"] : "";
            _uiManager.SetRoomInfo(room.Name, PhotonNetwork.MasterClient.NickName, pass);
            _uiManager.RefreshPlayerList(PhotonNetwork.PlayerList);
        }

        private void SpawnPlayer()
        {
            if (PhotonNetwork.InRoom)
            {
                int spawnIndex = (PhotonNetwork.LocalPlayer.ActorNumber - 1) % _spawnPoints.Count;

                Transform selectedSpawn = _spawnPoints[spawnIndex];

                Debug.Log($"👾 [Lobby] Spawning at Slot {spawnIndex} (Actor: {PhotonNetwork.LocalPlayer.ActorNumber})");

                // 2. Instantiate tại đúng vị trí và hướng xoay (Rotation) của SpawnPoint đó
                PhotonNetwork.Instantiate(_playerPrefabName, selectedSpawn.position, selectedSpawn.rotation);

                // TẮT Scene Camera để nhường chỗ cho Camera của nhân vật
                if (_sceneCamera != null)
                {
                    _sceneCamera.gameObject.SetActive(false);
                    Debug.Log("📷 [Lobby] Disabled Scene Camera.");
                }
            }
        }
    }
}