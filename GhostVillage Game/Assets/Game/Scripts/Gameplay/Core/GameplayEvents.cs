using UnityEngine;
using System;
using Game.Scripts.Core.Game;
using System.Collections.Generic;

namespace Game.Scripts.Gameplay.Core
{
    // Lớp chứa tất cả các sự kiện (events) diễn ra trong quá trình chơi game.
    // Đóng vai trò là trung tâm phát thanh để các hệ thống khác lắng nghe và xử lý.
    public static class GameplayEvents
    {
        // --- CÁC SỰ KIỆN VỀ TRẠNG THÁI ---

        // GameManager sẽ gọi sự kiện này khi đổi trạng thái của game (VD: Playing -> Ending).
        public static Action<GameState> OnGameStateChanged;

        // --- CÁC SỰ KIỆN LƯU TRÌNH GAME ---

        // Gọi khi cổng trốn thoát đã được mở hoàn toàn.
        public static Action OnGateOpened;
        // Gọi khi một câu đố được giải quyết xong. Dùng để báo động quái hoặc đếm tiến độ.
        public static Action OnPuzzleSolved;
        // Gọi khi bàn thờ (Altar) được kích hoạt, yêu cầu GameManager chuyển pha.
        public static Action OnAltarActivated;
        public static Action<Vector3> OnWrongPuzzlePenalty;

        // --- CÁC SỰ KIỆN TRẠNG THÁI NGƯỜI CHƠI ---

        // Người chơi ở máy local gửi yêu cầu muốn trốn thoát.
        public static Action OnLocalPlayerRequestEscape;
        // Trạng thái của một người chơi bị thay đổi (actorNumber, trạng thái mới).
        public static Action<int, PlayerMatchStatus> OnPlayerStatusChanged;
        // Gọi khi ván đấu kết thúc, truyền đi danh sách trạng thái của tất cả người chơi.
        public static Action<Dictionary<int, PlayerMatchStatus>> OnGameMatchEnded;

        // --- CÁC SỰ KIỆN THEO DÕI THỐNG KÊ (Dành cho MatchStatisticManager) ---

        // Gọi khi có người giải xong câu đố (truyền vào actorNumber của người giải).
        public static Action<int> OnPlayerSolvedPuzzle;

        // Gọi khi có người nhặt được vật phẩm (truyền vào actorNumber của người nhặt).
        public static Action<int> OnPlayerLootedItem;

        // Gọi khi có người cứu đồng đội thành công (healerActorNumber, knockedActorNumber).
        public static Action<int, int> OnPlayerRescued;

        // Gọi khi có người bị quái đánh gục (truyền vào actorNumber của người bị gục).
        public static Action<int> OnPlayerKnocked;

        // Gọi khi có người tiêu diệt được quái phụ (truyền vào actorNumber của người giết).
        public static Action<int> OnSmallMonsterKilled;

        // Gọi khi Boss khóa mục tiêu vào một người chơi (truyền vào actorNumber của nạn nhân).
        public static Action<int> OnBossTargetedPlayer;

        // Gọi khi người chơi hét vào mic vượt ngưỡng (truyền vào actorNumber của người hét).
        public static Action<int> OnPlayerScreamed;

        // Gọi khi người chơi thu thập được vật phẩm quan trọng (truyền vào actorNumber).
        public static Action<int> OnKeyItemGathered;

        // Gọi khi người chơi sử dụng vật phẩm còi báo động (truyền vào actorNumber).
        public static Action<int> OnPlayerUsedSiren;
    }
}