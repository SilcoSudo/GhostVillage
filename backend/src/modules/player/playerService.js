import Player from "./playerModel.js";
import Quest from "../quest/questModel.js";
import PlayerMatchHistory from "../profile/playerMatchHistoryModel.js";
import Perk from "../perk/perkModel.js";
import MatchResult from "../match/matchModel.js"; // <--- Thêm import này

export const PlayerService = {
  // Hàm lấy trọn bộ Profile cho UI
  getFullProfileData: async (userId) => {
    // 1. Truy vấn song song 3 nguồn dữ liệu
    const [player, matchHistory, allAchiDefs] = await Promise.all([
      Player.findOne({ userId }).lean(),
      PlayerMatchHistory.find({ userId })
        .populate({ path: "matchId", model: MatchResult })
        .limit(10)
        .sort({ createdAt: -1 })
        .lean(),
      Quest.find({ questType: "ACHIEVEMENT" }).lean(),
    ]);

    if (!player) throw new Error("Player not found");

    // 2. Logic Trộn (Merge): Gắn định nghĩa thành tựu vào tiến độ của người chơi
    const mergedAchievements = allAchiDefs.map((def) => {
      // [FIX 1]: Tìm theo questId chứ không phải _id
      const prog = (player.achievementsProgress || []).find(
        (p) => p.questId === def.questId,
      );

      const finalId =
        def.reward && def.reward.titleId ? def.reward.titleId : def.questId;

      return {
        id: finalId,
        title: def.questName, // Sửa def.title -> def.questName
        desc: def.description, // Sửa def.desc -> def.description
        target: def.targetCount,
        reward: def.reward,
        current: prog ? prog.current : 0,
        isClaimed: prog ? prog.isClaimed : false,
        isEquipped: (player.selectedMedals || []).includes(finalId), // [FIX 3]: So sánh bằng finalId
      };
    });

    // 3. Trả về đúng cấu cục mà Frontend DTO mong đợi
    return {
      uid: player.uid,
      profile: player.profile,
      selectedMedals: player.selectedMedals || [],
      achievements: mergedAchievements,
      history: matchHistory,
      storage: {
        unlockedPerks: player.unlockedPerks || [],
      },
      equipped: {
        perks: player.equippedPerks || [],
      },
    };
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

  updateEquippedPerks: async (userId, perkIds) => {
    const player = await Player.findOne({ userId });
    if (!player) throw new Error("Player not found");

    // MỞ KHÓA SLOT THEO LEVEL
    let maxSlots = 1;
    const playerLevel = player.profile.level || 1;

    if (playerLevel >= 25) maxSlots = 3;
    else if (playerLevel >= 10) maxSlots = 2;

    if (perkIds.length > maxSlots) {
      throw new Error(
        `Level ${playerLevel} chỉ được trang bị tối đa ${maxSlots} kỹ năng.`,
      );
    }

    // Kiểm tra quyền sở hữu
    for (const id of perkIds) {
      if (id && !player.unlockedPerks.includes(id)) {
        throw new Error(`Kỹ năng ${id} chưa được mở khóa.`);
      }
    }

    player.equippedPerks = perkIds;
    await player.save();
    return player.equippedPerks;
  },

  // ==========================================
  // [MỚI] API CHUYÊN DỤNG CHO BẢNG PERK LOBBY
  // ==========================================
  getPlayerPerksData: async (userId) => {
    const player = await Player.findOne({ userId }).lean();
    if (!player) throw new Error("Player not found");

    // Lấy thông tin chi tiết của NHỮNG PERK MÀ PLAYER ĐANG SỞ HỮU
    // Dùng $in để query một phát lấy luôn cho lẹ
    const ownedPerksDetails = await Perk.find({
      perkId: { $in: player.unlockedPerks },
      isActive: true,
    }).lean();

    // Map lại data cho sạch đẹp để gởi xuống Unity
    const mergedUnlockedPerks = ownedPerksDetails.map((p) => ({
      perkId: p.perkId,
      perkName: p.perkName,
      description: p.description,
      rarity: p.rarity,
      prefabId: p.prefabId,
      modifiers: p.modifiers,
      isEquipped: player.equippedPerks.includes(p.perkId),
    }));

    // Tính toán số lượng Slot được phép dùng
    let maxSlots = 1;
    const playerLevel = player.profile.level || 1;
    if (playerLevel >= 25) maxSlots = 3;
    else if (playerLevel >= 10) maxSlots = 2;

    return {
      playerLevel: playerLevel,
      maxPerkSlots: maxSlots,
      equippedPerks: player.equippedPerks, // Mảng ID các perk đang trang bị
      unlockedPerksDetails: mergedUnlockedPerks, // Mảng chứa full Info để vẽ UI
    };
  },

  // ==========================================
  // [MỚI] API ĐỔI AVATAR
  // ==========================================
  updateAvatar: async (userId, newAvatarId) => {
    // 1. Dùng ID avatar hợp lệ sếp đã chốt: avatar_default_01 -> 05
    const validAvatars = [
      "avatar_default_01",
      "avatar_default_02",
      "avatar_default_03",
      "avatar_default_04",
      "avatar_default_05",
    ];

    if (!validAvatars.includes(newAvatarId)) {
      throw new Error("ID Avatar không hợp lệ!");
    }

    // 2. Tìm và Update thẳng vào DB (lưu ý: avatar nằm trong object `profile`)
    const player = await Player.findOneAndUpdate(
      { userId },
      { $set: { "profile.avatar": newAvatarId } },
      { new: true }, // Trả về data mới sau khi update
    );

    if (!player) throw new Error("Không tìm thấy người chơi.");

    return player.profile.avatar;
  },
};
