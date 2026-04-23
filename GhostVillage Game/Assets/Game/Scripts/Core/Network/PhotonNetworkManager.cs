using Photon.Pun;
using Photon.Realtime;
using System;
using System.Collections.Generic;
using UnityEngine;
using ExitGames.Client.Photon;
using Game.Core.Network.Lobby;
using Cysharp.Threading.Tasks;
using VContainer;
using VContainer.Unity;

namespace Game.Core.Network
{
    public class PhotonNetworkManager : MonoBehaviourPunCallbacks, INetworkService
    {
        private Dictionary<string, RoomInfo> _cachedRoomList = new Dictionary<string, RoomInfo>();

        public event Action OnPhotonConnected;
        public event Action OnHallwayJoined;
        public event Action<List<LobbyData>> OnLobbyListUpdated;
        public event Action OnJoinLobbySuccess;
        public event Action OnCreateLobbyFailed;
        public event Action<string> OnJoinLobbyFailed;


        private string _tempInputPass = "";
        public bool IsConnected => PhotonNetwork.IsConnected;

        /// <summary>
        /// Khoi tao singleton va dam bao doi tuong khong bi xoa khi chuyen Scene.
        /// </summary>
        [Obsolete]
        private void Awake()
        {
            var objs = FindObjectsOfType<PhotonNetworkManager>();
            if (objs.Length > 1)
            {
                Destroy(gameObject);
                return;
            }
            DontDestroyOnLoad(gameObject);

            // ========================================================
            // [FIX LỖI MẤT KẾT NỐI KHI TEST 2 MÁY / ẨN CỬA SỔ]
            // ========================================================
            // 1. Ép Unity luôn chạy ngầm, không pause game khi mất Focus
            Application.runInBackground = true;

            // 2. Báo cho Photon biết "Tui vẫn sống, đừng có cắt mạng tui!"
            // Cho phép mất tín hiệu Focus lên tới 60000ms (60 giây) trước khi timeout
            PhotonNetwork.KeepAliveInBackground = 60000;
        }

        /// <summary>
        /// Thuc hien ket noi den server Photon.
        /// Tham so: nickName - Ten cua nguoi choi, token - Authentication token tu Backend.
        /// Logic: Thiet lap phien ban app, dong bo scene va goi lenh ket noi voi token thuc tu Backend.
        /// </summary>
        public async UniTask<bool> ConnectAsync(string nickName, string token)
        {
            // 1. Chờ cho đến khi tiến trình Disconnect trước đó hoàn tất hẳn 100%
            while (PhotonNetwork.NetworkClientState == ClientState.Disconnecting ||
                   PhotonNetwork.NetworkClientState == ClientState.Leaving)
            {
                await UniTask.Yield();
            }

            if (PhotonNetwork.IsConnectedAndReady) return true;

            // Vẫn log ra để biết là có nhận được Token
            Debug.Log($"[Photon] Nhận lệnh kết nối. Có Token: {!string.IsNullOrEmpty(token)}");

            PhotonNetwork.NickName = nickName;

            // [FIX Ở ĐÂY] SỬ DỤNG AUTHENTICATION MẶC ĐỊNH THAY VÌ CUSTOM
            var authValues = new AuthenticationValues();
            authValues.UserId = nickName; // ID người chơi
                                          // Nếu bạn KHÔNG dùng Photon Custom Auth Dashboard, KHÔNG ĐƯỢC set AuthType = Custom
                                          // authValues.AuthType = CustomAuthenticationType.Custom; <-- XÓA HOẶC COMMENT DÒNG NÀY

            PhotonNetwork.AuthValues = authValues;

            PhotonNetwork.PhotonServerSettings.AppSettings.AppVersion = "1.0";
            PhotonNetwork.AutomaticallySyncScene = true;

            Debug.Log($"[Photon] Bắt đầu kết nối Server...");

            PhotonNetwork.ConnectUsingSettings();

            // Chờ kết nối (Timeout 15 giây)
            float timeout = 15f;
            float timer = 0f;

            while (!PhotonNetwork.IsConnectedAndReady)
            {
                await UniTask.Yield();
                timer += Time.deltaTime;
                if (timer >= timeout)
                {
                    Debug.LogError($"[Photon] Kết nối Server thất bại (Timeout)! Trạng thái hiện tại: {PhotonNetwork.NetworkClientState}");
                    return false;
                }
            }

            Debug.Log("[Photon] Đã kết nối và sẵn sàng!");
            return true;
        }

        /// <summary>
        /// Callback khi ket noi thanh cong vao Master Server.
        /// Logic: Tu dong tham gia vao Lobby mac dinh de nhan danh sach phong.
        /// </summary>
        public override void OnConnectedToMaster()
        {
            Debug.Log("[Photon] Connected to Master.");
            OnPhotonConnected?.Invoke();
            PhotonNetwork.JoinLobby(TypedLobby.Default);
        }

        /// <summary>
        /// Dieu huong nguoi choi vao sanh cho (Lobby).
        /// Logic: Kiem tra trang thai phong cu, neu dang ket thi thoat truoc khi vao Lobby.
        /// </summary>
        public void JoinHallway()
        {
            // --- [FIX LỖI 254 LOBBY] ---
            // Rút điện thằng Voice khi ở sảnh để nó không gửi lệnh LeaveRoom bậy bạ lên MasterServer
            var voiceClient = UnityEngine.Object.FindFirstObjectByType<Photon.Voice.PUN.PunVoiceClient>();
            if (voiceClient != null && voiceClient.ClientState != Photon.Realtime.ClientState.Disconnected)
            {
                voiceClient.Disconnect();
                Debug.Log("🔇 [Photon] Đã rút điện Voice khi về sảnh chờ!");
            }
            // ---------------------------

            if (PhotonNetwork.InRoom)
            {
                Debug.Log("[Photon] Leaving current room to join hallway.");
                PhotonNetwork.LeaveRoom();
                return;
            }

            // TƯ DUY KỸ: Chỉ JoinLobby khi trạng thái là ConnectedAndReady
            if (PhotonNetwork.IsConnectedAndReady)
            {
                if (PhotonNetwork.InLobby)
                {
                    OnHallwayJoined?.Invoke();
                    RefreshUIFromCache();
                }
                else
                {
                    PhotonNetwork.JoinLobby(TypedLobby.Default);
                }
            }
            else
            {
                // Nếu chưa sẵn sàng (đang Authenticating), log lại để theo dõi
                Debug.LogWarning("[Photon] Chưa sẵn sàng để JoinLobby. Đang ở trạng thái: " + PhotonNetwork.NetworkClientState);
                // Photon sẽ tự động gọi OnConnectedToMaster khi xong, lúc đó ta mới JoinLobby (đã có trong callback của bạn)
            }
        }

        /// <summary>
        /// Loc va gui danh sach phong tu bo nho dem (Cache) ra giao dien.
        /// Logic: Chi lay cac phong dang mo (IsOpen) va duoc thiet lap cong khai (IsVisible).
        /// </summary>
        private void RefreshUIFromCache()
        {
            var displayList = new List<LobbyData>();
            foreach (var room in _cachedRoomList.Values)
            {
                if (!room.IsVisible || !room.IsOpen) continue;

                bool isLocked = room.CustomProperties.ContainsKey("pw") && !string.IsNullOrEmpty((string)room.CustomProperties["pw"]);
                displayList.Add(new LobbyData
                {
                    Name = room.Name,
                    CurrentPlayers = room.PlayerCount,
                    MaxPlayers = room.MaxPlayers,
                    IsLocked = isLocked
                });
            }
            Debug.Log($"[UI Sync] Sending {displayList.Count} rooms to UI list.");
            OnLobbyListUpdated?.Invoke(displayList);
        }

        /// <summary>
        /// Callback khi thoat khoi phong choi.
        /// </summary>
        public override void OnLeftRoom()
        {
            Debug.Log("[Photon] Đã rời khỏi phòng an toàn.");

            // Kiểm tra xem trước khi rời phòng, người chơi muốn đi đâu?
            string targetScene = PlayerPrefs.GetString("TargetSceneAfterLeave", "LobbyListScene"); // Mặc định là LobbyListScene
            PlayerPrefs.DeleteKey("TargetSceneAfterLeave"); // Xóa sau khi lấy để tránh rác

            // Load Scene một cách an toàn
            UnityEngine.SceneManagement.SceneManager.LoadScene(targetScene);
        }

        /// <summary>
        /// Callback khi tham gia thanh cong vao Lobby.
        /// Logic: Xoa bo nho dem cu de chuan bi nhan danh sach moi.
        /// </summary>
        public override void OnJoinedLobby()
        {
            _cachedRoomList.Clear();
            Debug.Log("[Photon] Joined Lobby.");
            OnHallwayJoined?.Invoke();
        }

        /// <summary>
        /// Callback nhan danh sach phong thay doi tu server.
        /// Tham so: roomList - Danh sach cac phong co su thay doi (delta update).
        /// Logic: Cap nhat Dictionary cache de duy tri danh sach phong day du.
        /// </summary>
        public override void OnRoomListUpdate(List<RoomInfo> roomList)
        {
            Debug.Log($"[Photon] RoomListUpdate: Received {roomList.Count} changes.");

            foreach (var room in roomList)
            {
                if (room.RemovedFromList) _cachedRoomList.Remove(room.Name);
                else _cachedRoomList[room.Name] = room;
            }
            RefreshUIFromCache();
        }

        /// <summary>
        /// Gui yeu cau tao phong moi len server.
        /// Tham so: lobbyName - Ten phong, password - Mat khau, maxPlayers - So nguoi toi da.
        /// Logic: Thiet lap RoomOptions de phong luon hien thi cong khai va dong bo cache.
        /// </summary>
        public void CreateLobby(string lobbyName, string password, int maxPlayers)
        {
            Debug.Log($"[Photon] Current State: {PhotonNetwork.NetworkClientState} | InLobby: {PhotonNetwork.InLobby}");

            if (!PhotonNetwork.InLobby)
            {
                Debug.LogError("[Photon] Not in lobby. Attempting to re-join.");

                // [FIX LỖI] Báo UI cho người chơi biết máy chủ chưa load xong
                var globalUI = FindFirstObjectByType<Game.Script.UI.GlobalUIManager>();
                if (globalUI != null) globalUI.ShowError("Error", "Reconnecting to lobby. Please try again in 2 seconds...");

                JoinHallway();
                return;
            }

            _tempInputPass = password;

            RoomOptions options = new RoomOptions
            {
                MaxPlayers = (byte)maxPlayers,
                IsVisible = true,
                IsOpen = true,
                CleanupCacheOnLeave = true,
                PlayerTtl = 0,
                EmptyRoomTtl = 0
            };

            if (!string.IsNullOrEmpty(password))
            {
                options.CustomRoomProperties = new Hashtable() { { "pw", password } };
                options.CustomRoomPropertiesForLobby = new string[] { "pw" };
            }

            Debug.Log($"[Photon] Sending create room command: {lobbyName} with pass: {password}");
            bool sent = PhotonNetwork.CreateRoom(lobbyName, options);
            if (!sent)
            {
                Debug.LogError("[Photon] CreateRoom command failed to send.");
                OnCreateLobbyFailed?.Invoke();
            }
        }

        /// <summary>
        /// Gui yeu cau tham gia vao mot phong cu the.
        /// Tham so: lobbyName - Ten phong muon vao.
        /// </summary>
        public void JoinLobbySession(string lobbyName, string password = "")
        {
            _tempInputPass = password; // Lưu lại để tí nữa so sánh khi đã vào phòng
            if (PhotonNetwork.InRoom) PhotonNetwork.LeaveRoom();

            PhotonNetwork.AutomaticallySyncScene = false;

            Debug.Log($"[Photon] Đang thử Join vào {lobbyName} với pass: '{password}'");
            PhotonNetwork.JoinRoom(lobbyName);
        }

        /// <summary>
        /// Callback khi lenh tao phong bi tu choi tu server.
        /// </summary>
        public override void OnCreateRoomFailed(short returnCode, string message)
        {
            Debug.LogError($"[Photon] Create room failed: {message}");

            // [FIX LỖI] Hiển thị UI khi tên phòng bị trùng
            var globalUI = FindFirstObjectByType<Game.Script.UI.GlobalUIManager>();
            if (globalUI != null)
            {
                // Nếu mã lỗi là 32766 (GameIdAlreadyExists)
                if (returnCode == 32766)
                    globalUI.ShowError("Error", "Failed to create room: This room name is already in use!");
                else
                    globalUI.ShowError("Error", $"Failed to create room: {message}");
            }

            OnCreateLobbyFailed?.Invoke();
        }

        public override void OnJoinRoomFailed(short returnCode, string message)
        {
            Debug.LogError($"[Photon] Join failed: {message}");

            // [FIX LỖI] Hiển thị UI khi không vào được phòng
            var globalUI = FindFirstObjectByType<Game.Script.UI.GlobalUIManager>();
            if (globalUI != null)
            {
                globalUI.ShowError("Error", $"Failed to join room: {message}");
            }

            OnJoinLobbyFailed?.Invoke(message);
        }

        /// <summary>
        /// Callback khi phong duoc tao thanh cong tren server.
        /// </summary>
        public override void OnCreatedRoom()
        {
            Debug.Log("[Photon] Room created successfully. Waiting for Join callback.");
        }

        /// <summary>
        /// Callback khi nguoi choi da vao trong phong thanh cong.
        /// Logic: Master Client se thuc hien load level cho toan bo phong.
        /// </summary>
        public override void OnJoinedRoom()
        {

            var room = PhotonNetwork.CurrentRoom;
            string correctPass = room.CustomProperties.ContainsKey("pw") ? (string)room.CustomProperties["pw"] : "";

            // 1. KIỂM TRA MẬT KHẨU
            if (!Game.Script.UI.GlobalUIManager.IsBypassPassword && !PhotonNetwork.IsMasterClient && !string.IsNullOrEmpty(correctPass))
            {
                if (_tempInputPass != correctPass)
                {
                    Debug.LogError("[Photon] Wrong password...");
                    PhotonNetwork.LeaveRoom();
                    OnJoinLobbyFailed?.Invoke("Wrong Password!");
                    return;
                }
            }

            if (Game.Script.UI.GlobalUIManager.IsBypassPassword)
            {
                Debug.Log("<color=green>Dùng thẻ VIP Bypass Password thành công!</color>");
            }

            string savedUserId = PlayerPrefs.GetString("UserId", "");
            if (!string.IsNullOrEmpty(savedUserId))
            {
                var playerProps = new Hashtable { { "UID", savedUserId } };
                PhotonNetwork.LocalPlayer.SetCustomProperties(playerProps);
                Debug.Log($"<color=cyan>[Photon] Đã nạp thành công UID ({savedUserId}) vào mạng!</color>");
            }
            else
            {
                Debug.LogError("<color=red>[Photon] CẢNH BÁO MÁU: Không tìm thấy UserId trong PlayerPrefs! Sẽ bị lưu nhầm lịch sử đấu!</color>");
            }

            // // ✅ [FIX KẾT BẠN]: Gửi UID vào Player CustomProperties để Lobby có thể lấy
            // // Sử dụng VContainer GlobalScope để resolve GameSession
            // try
            // {
            //     var container = LifetimeScope.Find<LifetimeScope>()?.Container;
            //     GameSession session = container?.Resolve<GameSession>();

            //     if (session != null && !string.IsNullOrEmpty(session.UID))
            //     {
            //         var playerProps = new Hashtable { { "UID", session.UID } };
            //         PhotonNetwork.LocalPlayer.SetCustomProperties(playerProps);
            //         Debug.Log($"<color=cyan>[Photon] Đã gửi UID ({session.UID}) vào Player CustomProperties</color>");
            //     }
            //     else
            //     {
            //         Debug.LogWarning("<color=yellow>[Photon] GameSession hoặc UID chưa available!</color>");
            //     }
            // }
            // catch (System.Exception e)
            // {
            //     Debug.LogWarning($"<color=yellow>[Photon] Lỗi resolve GameSession: {e.Message}</color>");
            // }

            // Nếu đúng pass, bật lại tính năng sync scene
            PhotonNetwork.AutomaticallySyncScene = true;
            Debug.Log($" [Photon] Join thành công: {room.Name}");
            OnJoinLobbySuccess?.Invoke();

            if (PhotonNetwork.IsMasterClient)
            {
                PhotonNetwork.LoadLevel("LobbyGameScene");
            }

            Game.Script.UI.GlobalUIManager.IsBypassPassword = false; // Xong việc thì thu thẻ
        }

        /// <summary>
        /// Callback xử lý Custom Authentication Response từ Photon Server.
        /// </summary>
        public override void OnCustomAuthenticationResponse(Dictionary<string, object> data)
        {
            Debug.Log("[Photon] Custom authentication successful!");
        }

        /// <summary>
        /// Callback xử lý Custom Authentication Failed từ Photon Server.
        /// </summary>
        public override void OnCustomAuthenticationFailed(string debugMessage)
        {
            Debug.LogError($"[Photon] Custom authentication failed: {debugMessage}");
        }
    }
}