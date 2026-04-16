import MatchResult from "./matchModel.js";
import PlayerMatchHistory from "../profile/playerMatchHistoryModel.js";
import Player from "../player/playerModel.js"; // <-- [FIX]: Phải gọi Model Player vào để cập nhật

export const MatchService = {
  /**
   * Tạo một bản ghi kết quả trận đấu mới vào DB VÀ rải lịch sử cho từng Player
   * KÈM THEO VIỆC CỘNG EXP VÀ COIN VÀO PROFILE CỦA PLAYER
   * @param {Object} matchData - Dữ liệu trận đấu từ Client gửi lên
   */
  createMatchResult: async (matchData) => {
    // 1. Lưu trận đấu tổng vào bảng Matches
    const newMatch = new MatchResult(matchData);
    const savedMatch = await newMatch.save();

    // 2. Rải lịch sử cá nhân cho từng người chơi trong mảng playerResults
    if (matchData.playerResults && matchData.playerResults.length > 0) {
      const historyDocs = [];

      // Dùng vòng lặp for...of để có thể dùng await bên trong (cập nhật từng thằng)
      for (const pr of matchData.playerResults) {
        // Chuẩn bị data cho History
        historyDocs.push({
          userId: pr.userId,
          matchId: savedMatch._id,
          isWin: pr.isWin,
          expGained: pr.rewards?.exp || 0,
          coinGained: pr.rewards?.coin || 0,
          titles: pr.titles || [],
          resultStatus: pr.outcome === "ESCAPED" ? "Escaped" : "Killed",
        });

        // =====================================================
        // [FIX CHÍ MẠNG]: CỘNG TRỰC TIẾP EXP & COIN VÀO PROFILE
        // =====================================================
        if (pr.rewards) {
          // Tìm player dựa trên userId
          const player = await Player.findOne({ userId: pr.userId });
          if (player && player.profile) {
            player.profile.exp += pr.rewards.exp || 0;
            player.profile.coin += pr.rewards.coin || 0;

            // [LƯU Ý QUAN TRỌNG]: Khi gọi player.save(), cái Hook 'pre-save'
            // (Bí thuật Auto Level Up) mà tui chỉ sếp ở Turn trước sẽ tự động chạy!
            // Nếu EXP tràn bình, nó sẽ tự động trừ EXP và tăng Level cho sếp luôn!
            await player.save();
          }
        }
      }

      // Bơm tất cả vào bảng PlayerMatchHistory
      await PlayerMatchHistory.insertMany(historyDocs);
      console.log(
        `[MatchService] Đã lưu ${historyDocs.length} bản ghi lịch sử cá nhân & cập nhật Exp/Coin.`,
      );
    }

    return savedMatch;
  },
};
