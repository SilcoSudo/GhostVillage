using System.Collections.Generic;

namespace Game.Scripts.Gameplay.Result
{
    // Định nghĩa hằng số cho Title để tránh gõ sai chính tả
    public static class TitleNames
    {
        public const string GRIM_REAPER = "GrimReaper";
        public const string PRIME_TARGET = "PrimeTarget";
        public const string WALKING_HOSPITAL = "WalkingHospital";
        public const string PUNCHING_BAG = "PunchingBag";
        public const string HUMAN_SIREN = "HumanSiren";
    }

    public enum MatchRoute
    {
        Escape,   // Thắng: Cổng thoát
        KillBoss, // Thắng: Giết quái
        Lose      // Thua: Chết hết
    }

    public class MatchPlayerStats
    {
        public int ActorNumber;

        // --- Các biến đếm cho Title ---
        public int SmallMonstersKilled = 0;
        public int BossTargetCount = 0;
        public int TeammatesRescued = 0;
        public int TimesKnocked = 0;
        public int ScreamCount = 0;

        // --- Các biến đếm cho Điểm (Exp/Coin) ---
        public int KeyItemsGathered = 0; // Tối đa 3

        // Danh sách title cuối cùng nhận được
        public List<string> EarnedTitles = new List<string>();

        // Hàm tính điểm (Gọi ở cuối trận)
        public (int exp, int coin) CalculateRewards(MatchRoute route)
        {
            int exp = 0;
            int coin = 0;

            switch (route)
            {
                case MatchRoute.Escape:
                    exp = 150; coin = 150;
                    break;
                case MatchRoute.KillBoss:
                    exp = 200; coin = 200;
                    break;
                case MatchRoute.Lose:
                default:
                    // Thua thì tính theo số lượng KeyItem đã gom (tối đa 3 * 50 = 150)
                    // Lưu ý: Nếu KeyItem là dùng chung cho Team, bạn cần đồng bộ biến này từ GameManager.
                    exp = KeyItemsGathered * 50;
                    coin = KeyItemsGathered * 50;
                    break;
            }

            return (exp, coin);
        }
    }
}