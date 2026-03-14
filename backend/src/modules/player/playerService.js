import Player from './playerModel.js';
import Achievement from '../achievement/achievementModel.js';
import PlayerMatchHistory from '../profile/playerMatchHistoryModel.js';

export const PlayerService = {
  // Hàm lấy trọn bộ Profile cho UI
  getFullProfileData: async (userId) => {
    // 1. Truy vấn song song 3 nguồn dữ liệu
    const [player, matchHistory, allAchiDefs] = await Promise.all([
      Player.findOne({ userId }).lean(),
      PlayerMatchHistory.find({ userId })
        .populate('matchId') // Lấy thông tin map từ bảng GameResult
        .limit(10)
        .sort({ createdAt: -1 })
        .lean(),
      Achievement.find().lean()
    ]);

    if (!player) throw new Error("Player not found");

    // 2. Logic Trộn (Merge): Gắn định nghĩa thành tựu vào tiến độ của người chơi
    const mergedAchievements = allAchiDefs.map(def => {
      const prog = player.achievementsProgress.find(p => p.achievementCode === def._id);
      return {
        id: def._id,
        title: def.title,
        desc: def.desc,
        target: def.target,
        reward: def.reward,
        current: prog ? prog.current : 0,
        isClaimed: prog ? prog.isClaimed : false,
        isEquipped: player.selectedMedals.includes(def._id)
      };
    });

    // 3. Trả về đúng cấu cục mà Frontend DTO mong đợi
    return {
      profile: player.profile,
      selectedMedals: player.selectedMedals,
      achievements: mergedAchievements,
      history: matchHistory,
      storage: {
        unlockedSkins: player.unlockedSkins,
        unlockedPerks: player.unlockedPerks
      },
      equipped: {
        skins: player.equippedSkins,
        perks: player.equippedPerks
      }
    };
  },
  // Thêm hàm Update Medal
    updateSelectedMedals: async (userId, medalCodes) => {
      // 1. Kiểm tra tối đa 3 huy chương
      if (medalCodes.length > 3) throw new Error("Can only equip up to 3 medals.");

      // 2. Cập nhật Player
      const player = await Player.findOneAndUpdate(
        { userId },
        { selectedMedals: medalCodes },
        { new: true }
      );
      return player.selectedMedals;
    },

    updateEquippedSkins: async (userId, headId, bodyId) => {
    // 1. Tìm player
    const player = await Player.findOne({ userId });
    if (!player) throw new Error("Player not found");

    // 2. Validate quyền sở hữu (bỏ qua nếu truyền lên chuỗi rỗng "" để tháo đồ)
    if (headId && !player.unlockedSkins.includes(headId)) {
      throw new Error("You do not own this head skin.");
    }
    if (bodyId && !player.unlockedSkins.includes(bodyId)) {
      throw new Error("You do not own this body skin.");
    }

    // 3. Cập nhật (chỉ cập nhật trường nào được truyền lên)
    if (headId !== undefined) player.equippedSkins.head = headId;
    if (bodyId !== undefined) player.equippedSkins.body = bodyId;

    await player.save();
    return player.equippedSkins;
  }
};