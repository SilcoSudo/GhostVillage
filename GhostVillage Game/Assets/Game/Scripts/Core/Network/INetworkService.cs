// File: src/Game/Core/Network/INetworkService.cs
using System;
using System.Collections.Generic;
using Game.Core.Network.Lobby; // Nhớ namespace chứa LobbyData

namespace Game.Core.Network
{
    public interface INetworkService
    {
        bool IsConnected { get; }

        // --- EVENTS (Đã đổi tên Room -> Lobby) ---
        event Action OnPhotonConnected;           // Đã kết nối Master
        event Action OnHallwayJoined;             // Đã vào Sảnh chờ (Tên cũ: OnLobbyJoined - đổi thành Hallway cho đỡ nhầm với Game Lobby)
        event Action<List<LobbyData>> OnLobbyListUpdated; // Danh sách phòng
        event Action OnJoinLobbySuccess;          // Vào phòng chơi thành công
        event Action OnCreateLobbyFailed;         // Tạo phòng thất bại (Thêm cái này để UI Manager lắng nghe)

        // --- METHODS ---
        void Connect(string nickName);

        // Vào Sảnh Chờ (để lấy danh sách)
        void JoinHallway();

        // Tạo Phòng Chơi
        void CreateLobby(string lobbyName, string password, int maxPlayers);

        // Vào Phòng Chơi (Overload: Khác tên hoặc khác tham số để phân biệt)
        void JoinLobbySession(string lobbyName);
    }
}