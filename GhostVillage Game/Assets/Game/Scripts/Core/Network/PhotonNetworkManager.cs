// File: src/Game/Core/Network/PhotonNetworkManager.cs
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
        // --- EVENTS ---
        public event Action OnPhotonConnected;
        public event Action OnHallwayJoined;
        public event Action<List<LobbyData>> OnLobbyListUpdated;
        public event Action OnJoinLobbySuccess;
        public event Action OnCreateLobbyFailed; // Thực thi event này

        public bool IsConnected => PhotonNetwork.IsConnected;

        // --- 1. KẾT NỐI ---
        public void Connect(string nickName)
        {
            if (PhotonNetwork.IsConnected)
            {
                JoinHallway(); // Gọi hàm xử lý thông minh bên dưới
                return;
            }
            PhotonNetwork.NickName = nickName;
            PhotonNetwork.AutomaticallySyncScene = true;
            PhotonNetwork.ConnectUsingSettings();
        }

        public override void OnConnectedToMaster()
        {
            Debug.Log("✅ Connected to Master.");
            OnPhotonConnected?.Invoke();
            PhotonNetwork.JoinLobby(); // Tự động vào sảnh chờ
        }

        // --- 2. SẢNH CHỜ (HALLWAY) ---
        public void JoinHallway()
        {
            // LOGIC QUAN TRỌNG: Nếu đang kẹt trong phòng, phải LeaveRoom trước
            if (PhotonNetwork.InRoom)
            {
                Debug.Log("⚠️ Đang kẹt trong phòng cũ. Đang thoát...");
                PhotonNetwork.LeaveRoom();
                return; // Đợi callback OnLeftRoom rồi mới vào Lobby
            }

            // Case 2: Đã ở trong Sảnh rồi -> Báo luôn cho UI biết
            if (PhotonNetwork.InLobby)
            {
                Debug.Log("ℹ️ Đã ở sẵn trong Sảnh chờ.");
                OnHallwayJoined?.Invoke(); // Kích hoạt sự kiện ngay
                return;
            }

            // Case 3: Đang ở Master Server nhưng chưa vào Sảnh -> Vào
            if (PhotonNetwork.IsConnected)
            {
                PhotonNetwork.JoinLobby();
            }
        }


        // Callback khi thoát phòng thành công -> Tự động quay lại Sảnh chờ
        public override void OnLeftRoom()
        {
            Debug.Log("✅ Đã thoát phòng cũ. Đang quay lại Sảnh chờ...");
            PhotonNetwork.JoinLobby();
        }

        public override void OnJoinedLobby()
        {
            Debug.Log("✅ Joined Hallway (Photon Lobby).");
            OnHallwayJoined?.Invoke();
        }

        public override void OnRoomListUpdate(List<RoomInfo> roomList)
        {
            // Convert Photon Room -> Game LobbyData
            var cleanList = new List<LobbyData>();
            foreach (var room in roomList)
            {
                if (room.RemovedFromList) continue;

                bool isLocked = room.CustomProperties.ContainsKey("pw")
                                && !string.IsNullOrEmpty((string)room.CustomProperties["pw"]);

                cleanList.Add(new LobbyData
                {
                    Name = room.Name,
                    CurrentPlayers = room.PlayerCount,
                    MaxPlayers = room.MaxPlayers,
                    IsLocked = isLocked
                });
            }
            OnLobbyListUpdated?.Invoke(cleanList);
        }

        // --- 3. TẠO & VÀO LOBBY ---
        public void CreateLobby(string lobbyName, string password, int maxPlayers)
        {
            // Double check: Nếu chưa vào Lobby (chưa Ready) thì không cho tạo
            if (!PhotonNetwork.InLobby)
            {
                Debug.LogError("❌ Chưa vào Sảnh chờ (InLobby = false). Đang gọi JoinHallway...");
                JoinHallway();
                return;
            }

            Debug.Log($"🚀 Đang gửi lệnh tạo phòng: {lobbyName}");
            RoomOptions options = new RoomOptions();
            options.MaxPlayers = (byte)maxPlayers;
            if (!string.IsNullOrEmpty(password))
            {
                options.CustomRoomProperties = new Hashtable() { { "pw", password } };
                options.CustomRoomPropertiesForLobby = new string[] { "pw" };
            }
            PhotonNetwork.CreateRoom(lobbyName, options);
        }

        public override void OnCreateRoomFailed(short returnCode, string message)
        {
            Debug.LogError($"Tạo Lobby thất bại: {message}");
            OnCreateLobbyFailed?.Invoke(); // Báo ra UI
        }

        // --- 4. VÀO GAME LOBBY ---
        public void JoinLobbySession(string lobbyName)
        {
            if (PhotonNetwork.InRoom) PhotonNetwork.LeaveRoom(); // Safety check
            PhotonNetwork.JoinRoom(lobbyName);
        }

        public override void OnJoinedRoom()
        {
            Debug.Log("✅ Joined Game Session.");
            OnJoinLobbySuccess?.Invoke();

            if (PhotonNetwork.IsMasterClient)
            {
                PhotonNetwork.LoadLevel("LobbyGameScene");
            }
        }

        public override void OnJoinRoomFailed(short returnCode, string message)
        {
            Debug.LogError($"Vào Lobby thất bại: {message}");
            // Có thể thêm event OnJoinLobbyFailed nếu muốn
        }
    }
}