// File: src/Game/Core/Network/DTOs/RoomData.cs
namespace Game.Core.Network.Lobby
{
    public class LobbyData
    {
        public string Name;
        public int CurrentPlayers;
        public int MaxPlayers;
        public bool IsLocked; // Có pass hay không
    }
}