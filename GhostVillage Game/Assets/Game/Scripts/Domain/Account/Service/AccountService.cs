using Game.Domain.Authentication.DTOs;
using UnityEngine;

namespace Game.Domain.Account.Service
{

    public class AccountService
    {
        // Biến lưu trữ data trả về từ Server
        public LoginResponseDTO CurrentPlayerData { get; private set; }

        public bool IsLoggedIn => CurrentPlayerData != null;

        // Hàm mà AuthService đang gọi
        public void SetPlayerData(LoginResponseDTO data)
        {
            CurrentPlayerData = data;

            // Debug check thử
            if (CurrentPlayerData?.player?.profile != null)
            {
                Debug.Log($"[AccountService] Saved Profile: {CurrentPlayerData.player.profile.displayName}");
            }
        }

        // Helper để lấy nhanh thông tin hiển thị UI
        // Helper: Hàm hỗ trợ lấy tên nhanh để hiển thị UI (nếu cần sau này)
        public string GetDisplayName()
        {
            return CurrentPlayerData?.player?.profile?.displayName ?? "Unknown";
        }

        public int GetCoin() => CurrentPlayerData?.player?.profile?.coin ?? 0;
        public int GetLevel() => CurrentPlayerData?.player?.profile?.level ?? 1;

        public void Logout()
        {
            CurrentPlayerData = null;
        }
    }

}
