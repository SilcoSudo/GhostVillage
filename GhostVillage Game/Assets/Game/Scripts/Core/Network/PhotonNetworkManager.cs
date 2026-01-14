using Photon.Pun;
using Photon.Realtime;
using System;
using System.Collections.Generic;
using UnityEngine;
using ExitGames.Client.Photon;
using Game.Core.Network.Lobby;

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
        }

        /// <summary>
        /// Thuc hien ket noi den server Photon.
        /// Tham so: nickName - Ten cua nguoi choi.
        /// Logic: Thiet lap phien ban app, dong bo scene va goi lenh ket noi.
        /// </summary>
        public void Connect(string nickName)
        {
            if (PhotonNetwork.IsConnected)
            {
                JoinHallway();
                return;
            }

            PhotonNetwork.NickName = nickName;
            PhotonNetwork.PhotonServerSettings.AppSettings.AppVersion = "1.0";
            PhotonNetwork.AutomaticallySyncScene = true;
            PhotonNetwork.ConnectUsingSettings();
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
            if (PhotonNetwork.InRoom)
            {
                Debug.Log("[Photon] Leaving current room to join hallway.");
                PhotonNetwork.LeaveRoom();
                return;
            }

            if (PhotonNetwork.InLobby)
            {
                Debug.Log("[Photon] Already in Lobby. Refreshing UI.");
                OnHallwayJoined?.Invoke();
                RefreshUIFromCache();
                return;
            }

            if (PhotonNetwork.IsConnected) PhotonNetwork.JoinLobby(TypedLobby.Default);
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
            Debug.Log("[Photon] Left room. Re-joining lobby.");
            PhotonNetwork.JoinLobby(TypedLobby.Default);
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
                JoinHallway();
                return;
            }

            RoomOptions options = new RoomOptions
            {
                MaxPlayers = (byte)maxPlayers,
                IsVisible = true,
                IsOpen = true,
                CleanupCacheOnLeave = true
            };

            if (!string.IsNullOrEmpty(password))
            {
                options.CustomRoomProperties = new Hashtable() { { "pw", password } };
                options.CustomRoomPropertiesForLobby = new string[] { "pw" };
            }

            Debug.Log($"[Photon] Sending create room command: {lobbyName}");
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
        public void JoinLobbySession(string lobbyName)
        {
            if (PhotonNetwork.InRoom) PhotonNetwork.LeaveRoom();
            Debug.Log($"[Photon] Joining room: {lobbyName}");
            PhotonNetwork.JoinRoom(lobbyName);
        }

        /// <summary>
        /// Callback khi lenh tao phong bi tu choi tu server.
        /// </summary>
        public override void OnCreateRoomFailed(short returnCode, string message)
        {
            Debug.LogError($"[Photon] Create room failed: {message}");
            OnCreateLobbyFailed?.Invoke();
        }

        /// <summary>
        /// Callback khi lenh tham gia phong bi tu choi tu server.
        /// </summary>
        public override void OnJoinRoomFailed(short returnCode, string message)
        {
            Debug.LogError($"[Photon] Join room failed: {message}");
            OnCreateLobbyFailed?.Invoke();
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
            Debug.Log($"[Photon] Joined room: {PhotonNetwork.CurrentRoom.Name}");
            OnJoinLobbySuccess?.Invoke();

            if (PhotonNetwork.IsMasterClient)
            {
                Debug.Log("[Photon] Master Client loading scene: LobbyGameScene");
                PhotonNetwork.LoadLevel("LobbyGameScene");
            }
        }
    }
}