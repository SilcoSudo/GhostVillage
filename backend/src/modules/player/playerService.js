import Player from "./playerModel.js";
import Achievement from "../achievement/achievementModel.js";
import PlayerMatchHistory from "../profile/playerMatchHistoryModel.js";

export const PlayerService = {
  // Hàm lấy trọn bộ Profile cho UI
  getFullProfileData: async (userId) => {
    // 1. Truy vấn song song 3 nguồn dữ liệu
    const [player, matchHistory, allAchiDefs] = await Promise.all([
      Player.findOne({ userId }).lean(),
      PlayerMatchHistory.find({ userId })
        .populate("matchId") // Lấy thông tin map từ bảng GameResult
        .limit(10)
        .sort({ createdAt: -1 })
        .lean(),
      Achievement.find().lean(),
    ]);

    if (!player) throw new Error("Player not found");

    // 2. Logic Trộn (Merge): Gắn định nghĩa thành tựu vào tiến độ của người chơi
    const mergedAchievements = allAchiDefs.map((def) => {
      const prog = player.achievementsProgress.find(
        (p) => p.achievementCode === def._id,
      );
      return {
        id: def._id,
        title: def.title,
        desc: def.desc,
        target: def.target,
        reward: def.reward,
        current: prog ? prog.current : 0,
        isClaimed: prog ? prog.isClaimed : false,
        isEquipped: player.selectedMedals.includes(def._id),
      };
    });

    // 3. Trả về đúng cấu cục mà Frontend DTO mong đợi
    return {
      profile: player.profile,
      selectedMedals: player.selectedMedals,
      achievements: mergedAchievements,
      history: matchHistory,
    };
  },

  // Thêm hàm Update Medal
  updateSelectedMedals: async (userId, medalCodes) => {
    // 1. Kiểm tra tối đa 3 huy chương
    if (medalCodes.length > 3)
      throw new Error("Can only equip up to 3 medals.");

    // 2. Cập nhật Player
    const player = await Player.findOneAndUpdate(
      { userId },
      { selectedMedals: medalCodes },
      { new: true },
    );
    return player.selectedMedals;
  },

  // Đã sửa lại chuẩn chỉ để tìm bằng UID 8 số
  searchPlayerByUID: async (targetUid) => {
    // 1. CHÚ Ý: Tìm bằng trường `uid`, không phải `userId`
    // 2. CHÚ Ý: Lấy `profile.avatar`, không phải `profile.avatarId`
    const targetPlayer = await Player.findOne({ uid: targetUid })
      .select("userId uid profile.displayName profile.avatar profile.level")
      .lean();

    if (!targetPlayer) {
      throw new Error("Không tìm thấy người chơi với UID này.");
    }

    return {
      userId: targetPlayer.userId, // Vẫn trả về userId gốc để API Add Friend dùng
      uid: targetPlayer.uid, // Trả về UID để hiện lên UI (VD: UID: 10000002)
      displayName: targetPlayer.profile.displayName,
      avatar: targetPlayer.profile.avatar, // Đã sửa thành avatar
      level: targetPlayer.profile.level,
    };
  },
};
