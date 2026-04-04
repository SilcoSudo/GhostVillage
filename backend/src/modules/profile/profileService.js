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
        avatar: player.profile?.avatar || "avatar_default_02",
        userId: player.userId.toString(),
        totalMatches: totalMatches,
      },
      selectedMedals: player.selectedMedals || [],
      achievements: [],
      history: [],
    };
  }

  /**
   * Tab 2: Lịch sử đấu (History) - Đã fix Populate
   */
  async getHistory(userId) {
    const objId = new mongoose.Types.ObjectId(userId);
    const records = await PlayerMatchHistory.find({ userId: objId })
      .populate("matchId") // Lấy thông tin Map/Duration từ GameResult
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      history: records.map((r) => ({
        isWin: r.isWin,
        expGained: r.expGained || 0,
        coinGained: r.coinGained || 0,
        durationSec: r.matchId?.durationSec || 0,
        rankTitles: r.titles || [], // Đây là nơi chứa GrimReaper, HumanSiren...
        resultStatus: r.resultStatus || (r.isWin ? "Victory" : "Defeat"),
        matchId: {
          mapId: r.matchId?.mapId || "Unknown",
          mapName: r.matchId?.roomName || "Ghost Village",
          startTime: r.createdAt,
        },
      })),
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
    // 4. BÍ THUẬT DAILY POOL: RANDOM THEO NGÀY HIỆN TẠI
    // ====================================================
    const allDailyQuests = activeQuests.filter((q) => q.questType === "DAILY");

    const today = new Date();
    const seedString = `${today.getUTCFullYear()}${today.getUTCMonth()}${today.getUTCDate()}`;

    let seed = 0;
    for (let i = 0; i < seedString.length; i++) {
      seed = seedString.charCodeAt(i) + ((seed << 5) - seed);
    }

    const shuffledDailies = [...allDailyQuests].sort(() => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x) - 0.5;
    });

    const todaysDailyQuests = shuffledDailies.slice(0, 3);

    const finalDailyQuests = todaysDailyQuests.map((q) =>
      mapQuestProgress(q, player.dailyProgress),
    );

    return {
      achievements: achievements,
      dailyQuests: finalDailyQuests,
    };
  }
}

export default new ProfileService();
