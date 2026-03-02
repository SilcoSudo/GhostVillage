using R3;
using System.Collections.Generic;
using Game.Domain.Authentication.DTOs;

namespace Game.Core.ReactiveRepo
{
    public class PlayerDataStore
    {
        // Sử dụng ReactiveProperty để UI tự nhảy số khi thay đổi
        public readonly ReactiveProperty<string> DisplayName = new("");
        public readonly ReactiveProperty<string> AuthToken = new("");  // ✅ Token từ Backend
        public readonly ReactiveProperty<int> Level = new(1);
        public readonly ReactiveProperty<int> Coins = new(0);
        public readonly ReactiveProperty<string> AvatarId = new("");
        public readonly ReactiveProperty<List<string>> OwnedPerks = new(new List<string>());

        // Biến kiểm tra trạng thái đăng nhập
        public bool IsLoggedIn => !string.IsNullOrEmpty(DisplayName.Value);

        // Hàm khởi tạo toàn bộ Cục Data (Hydration)
        public void Initialize(LoginResponseDTO data)
        {
            if (data?.player?.profile == null) return;

            // ✅ LƯU TOKEN TỪ BACKEND
            AuthToken.Value = data.token ?? "";

            var profile = data.player.profile;
            DisplayName.Value = profile.displayName;
            Level.Value = profile.level;
            Coins.Value = profile.coin;
            AvatarId.Value = profile.avatar;

            // Nếu API trả về list perk, hãy nạp vào đây
            // OwnedPerks.Value = data.player.perks ?? new List<string>();
        }

        // Cập nhật Delta (Chỉ cập nhật phần nhỏ - Giống Virtual DOM)
        public void UpdateCoins(int newAmount) => Coins.Value = newAmount;

        public void Clear()
        {
            DisplayName.Value = "";
            AuthToken.Value = "";  // ✅ Clear token on logout
            Coins.Value = 0;
            OwnedPerks.Value.Clear();
        }
    }
}