import mongoose from "mongoose";
import Player from "../player/playerModel.js";
import PlayerMatchHistory from "./playerMatchHistoryModel.js";
import GameResult from "./gameResultModel.js";
import Achievement from "../achievement/achievementModel.js";

class ProfileService {
  /**
   * Tab 1: Thông tin cơ bản
   */
  async getBasicProfile(userId) {
    const objId = new mongoose.Types.ObjectId(userId);
    const [player, totalMatches] = await Promise.all([
      Player.findOne({ userId: objId }).lean(),
      PlayerMatchHistory.countDocuments({ userId: objId })
    ]);

    if (!player) return null;

    return {
      profile: {
        displayName: player.profile?.displayName,
        level: player.profile?.level || 1,
        exp: player.profile?.exp || 0,
        nextLevelExp: player.profile?.nextLevelExp || 100,
        coin: player.profile?.coin || 0,
        avatar: player.profile?.avatar || "avatar_default_02",
        userId: player.userId.toString(),
        totalMatches: totalMatches 
      },
      selectedMedals: player.selectedMedals || [],
      achievements: [],
      history: []
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
      history: records.map(r => ({
        isWin: r.isWin,
        expGained: r.expGained || 0,
        coinGained: r.coinGained || 0,
        durationSec: r.matchId?.durationSec || 0,
        rankTitles: r.titles || [], // Đây là nơi chứa GrimReaper, HumanSiren...
        resultStatus: r.resultStatus || (r.isWin ? "Victory" : "Defeat"),
        matchId: {
          mapId: r.matchId?.mapId || "Unknown",
          mapName: r.matchId?.roomName || "Ghost Village",
          startTime: r.createdAt
        }
      }))
    };
  }

  /**
   * Tab 3: Thành tựu (Achievements)
   */
  async getAchievements(userId) {
    const objId = new mongoose.Types.ObjectId(userId);
    
    // 1. Lấy tiến độ của Player và định nghĩa gốc cùng lúc
    const [player, definitions] = await Promise.all([
      Player.findOne({ userId: objId }).lean(),
      Achievement.find().lean() // Lấy Title/Desc/Target tiếng Anh từ bảng Achievement
    ]);

    if (!player || !player.achievementsProgress) return { achievements: [] };

    // 2. Gộp tiến độ vào định nghĩa để gửi về Unity
    return {
      achievements: player.achievementsProgress.map(progress => {
        const def = definitions.find(d => d._id === progress.achievementCode);
        return {
          id: progress.achievementCode,
          title: def?.title || "Unknown Achievement",
          desc: def?.desc || "No description available",
          current: progress.current || 0,
          target: def?.target || 1,
          isClaimed: progress.isClaimed || false,
          reward: { coin: def?.reward?.coin || 0, exp: 0 }
        };
      })
    };
  }
}

export default new ProfileService();