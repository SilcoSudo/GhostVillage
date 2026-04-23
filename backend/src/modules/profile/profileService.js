import mongoose from "mongoose";
import Player from "../player/playerModel.js";
import PlayerMatchHistory from "./playerMatchHistoryModel.js";
import GameResult from "./gameResultModel.js";
import Quest from "../quest/questModel.js";
import { QuestService } from "../quest/questService.js";

class ProfileService {
  /**
   * Tab 1: Thông tin cơ bản
   */
  async getBasicProfile(userId) {
    const objId = new mongoose.Types.ObjectId(userId);
    const [player, totalMatches] = await Promise.all([
      Player.findOne({ userId: objId }).lean(),
      PlayerMatchHistory.countDocuments({ userId: objId }),
    ]);

    if (!player) return null;

    return {
      uid: player.uid,
      profile: {
        displayName: player.profile?.displayName,
        level: player.profile?.level || 1,
        exp: player.profile?.exp || 0,
        nextLevelExp: player.profile?.nextLevelExp || 100,
        coin: player.profile?.coin || 0,
        avatar: player.profile?.avatar || "avatar_default_01",
        userId: player.userId.toString(),
        totalMatches: totalMatches,
      },
      selectedMedals: player.selectedMedals || [],
      achievements: [],
      history: [],
    };
  }

  /**
   * Tab 2: Lịch sử đấu (History) - Fix lấy tên Map từ Config
   */
  async getHistory(userId) {
    const objId = new mongoose.Types.ObjectId(userId);
    const MatchModel = mongoose.model("MatchResult");
    const MapConfigModel = mongoose.model("MapConfig"); // [MỚI]: Gọi model MapConfig

    const records = await PlayerMatchHistory.find({ userId: objId })
      .populate({
        path: "matchId",
        model: MatchModel,
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // [BÍ THUẬT]: Lấy danh sách MapId duy nhất có trong history để fetch tên 1 lần cho lẹ
    const uniqueMapIds = [
      ...new Set(records.map((r) => r.matchId?.mapId).filter((id) => id)),
    ];
    const mapConfigs = await MapConfigModel.find({
      "identityConfig.mapId": { $in: uniqueMapIds },
    }).lean();

    return {
      history: records.map((r) => {
        // Tìm thông tin Map tương ứng trong đống Config vừa fetch
        const mapInfo = mapConfigs.find(
          (m) => m.identityConfig.mapId === r.matchId?.mapId,
        );

        return {
          isWin: r.isWin,
          expGained: r.expGained || 0,
          coinGained: r.coinGained || 0,
          durationSec: r.matchId?.durationSec || 0,
          rankTitles: r.titles || [],
          resultStatus: r.resultStatus || (r.isWin ? "Victory" : "Defeat"),
          matchId: {
            mapId: r.matchId?.mapId || "Unknown",
            // [FIX CHỐT HẠ]: Lấy displayName từ bảng MapConfig, không lấy sessionId bậy bạ nữa!
            mapName: mapInfo?.identityConfig?.displayName || "Unknown Map",
            startTime: r.createdAt,
            moonEventId: r.matchId?.moonEventId || "EVENT_MOON_DEFAULT",
            moonEventName: r.matchId?.moonEventName || "Normal Moon",
          },
        };
      }),
    };
  }

  /**
   * Tab 3: Lấy gộp cả Thành tựu (Achievements) và Nhiệm vụ (Daily)
   */
  async getAchievements(userId) {
    const objId = new mongoose.Types.ObjectId(userId);

    // 1. Lấy Player + TOÀN BỘ Quest đang Active
    const [player, activeQuests] = await Promise.all([
      Player.findOne({ userId: objId }), // Bỏ .lean() đi để còn save() được
      Quest.find({ isActive: true }).lean(),
    ]);

    if (!player) return { achievements: [], dailyQuests: [] };

    // ==============================================================
    // [FIX LỖI]: KIỂM TRA VÀ RESET DAILY NGAY LÚC LẤY DATA SHOW LÊN UI
    // ==============================================================
    const isReset = await QuestService.checkAndResetDaily(player);
    if (isReset) {
      await player.save(); // Nếu qua ngày mới, lưu lại mảng rỗng vào DB luôn
      console.log(`[ProfileService] Đã reset Daily Quest cho Player ${userId}`);
    }

    // 2. Hàm gom tiến độ (Map Progress)
    const mapQuestProgress = (quest, progressArray) => {
      const p = progressArray?.find((x) => x.questId === quest.questId);

      return {
        id: quest.questId,
        title: quest.questName,
        desc: quest.description,
        current: p ? p.current : 0,
        target: quest.targetCount,
        isClaimed: p ? p.isClaimed : false,
        reward: {
          coin: quest.reward?.coin || quest.rewardCoin || 0, // Bao lỗi schema cũ mới
          exp: quest.reward?.exp || quest.rewardExp || 0,
          titleId: quest.reward?.titleId || quest.rewardTitleId || null,
        },
      };
    };

    // 3. XỬ LÝ ACHIEVEMENT (Lấy hết)
    const achievements = activeQuests
      .filter((q) => q.questType === "ACHIEVEMENT")
      .map((q) => mapQuestProgress(q, player.achievementsProgress));

    // ====================================================
    // RANDOM DAILY THEO NGÀY HIỆN TẠI
    // ====================================================
    const finalDailyQuests = player.dailyProgress
      .map((progress) => {
        // Tìm cấu hình Quest gốc
        const questDef = activeQuests.find(
          (q) => q.questId === progress.questId,
        );
        if (!questDef) return null; // Lỡ quest bị xóa

        return mapQuestProgress(questDef, player.dailyProgress);
      })
      .filter((q) => q != null);

    return {
      achievements: achievements,
      dailyQuests: finalDailyQuests,
    };
  }
}

export default new ProfileService();
