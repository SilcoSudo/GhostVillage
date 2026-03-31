import Quest from "./questModel.js";
import Player from "../player/playerModel.js"; // <-- Chỉnh lại đường dẫn cho đúng

export const QuestService = {
  getAllQuests: async (query) => {
    const { page = 1, limit = 20, isActive = "all", questType, search } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (isActive !== "all") filter.isActive = isActive === "true";
    if (questType && questType !== "all") filter.questType = questType;
    if (search) filter.questName = { $regex: search, $options: "i" };

    const quests = await Quest.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Quest.countDocuments(filter);

    return {
      data: quests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  getQuestById: async (id) => {
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      return await Quest.findById(id).select("-__v");
    }
    return await Quest.findOne({ questId: id.toUpperCase() }).select("-__v");
  },

  createQuest: async (data) => {
    const {
      questId,
      questName,
      description,
      questType,
      actionType,
      targetCount,
      rewardCoin,
      rewardExp,
    } = data;

    const existingQuest = await Quest.findOne({
      questId: questId.toUpperCase(),
    });
    if (existingQuest) {
      throw new Error(`Quest ID "${questId}" đã tồn tại`);
    }

    const newQuest = new Quest({
      questId: questId.toUpperCase(),
      questName,
      description,
      questType,
      actionType,
      targetCount: targetCount || 1,
      rewardCoin: rewardCoin || 0,
      rewardExp: rewardExp || 0,
    });

    return await newQuest.save();
  },

  updateQuest: async (id, updateData) => {
    if (updateData.questId) delete updateData.questId;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      return await Quest.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      );
    }
    return await Quest.findOneAndUpdate(
      { questId: id.toUpperCase() },
      { $set: updateData },
      { new: true, runValidators: true },
    );
  },

  toggleQuestStatus: async (id, isActive) => {
    let quest = id.match(/^[0-9a-fA-F]{24}$/)
      ? await Quest.findById(id)
      : await Quest.findOne({ questId: id.toUpperCase() });

    if (!quest) throw new Error("Không tìm thấy quest");

    quest.isActive = isActive;
    return await quest.save();
  },

  deleteQuest: async (id) => {
    let quest = id.match(/^[0-9a-fA-F]{24}$/)
      ? await Quest.findById(id)
      : await Quest.findOne({ questId: id.toUpperCase() });

    if (!quest) throw new Error("Không tìm thấy quest");

    quest.isActive = false; // Soft delete
    return await quest.save();
  },

  getQuestStats: async () => {
    const [total, active, inactive, byQuestType] = await Promise.all([
      Quest.countDocuments(),
      Quest.countDocuments({ isActive: true }),
      Quest.countDocuments({ isActive: false }),
      Quest.aggregate([{ $group: { _id: "$questType", count: { $sum: 1 } } }]),
    ]);

    return { total, active, inactive, byQuestType };
  },

  checkAndResetDaily: async (player) => {
    const now = new Date();
    const lastReset = new Date(player.lastDailyReset || 0);

    if (now.toDateString() !== lastReset.toDateString()) {
      player.dailyProgress = []; // Xóa sạch tiến độ Daily
      player.lastDailyReset = now;
      return true;
    }
    return false;
  },

  // --- 2. CỘNG DỒN TIẾN ĐỘ TỪ BẢNG THỐNG KÊ ---
  updateProgressFromStats: async (userId, rawStats) => {
    const player = await Player.findOne({ userId });
    if (!player) throw new Error("Không tìm thấy Player");

    await QuestService.checkAndResetDaily(player);

    const activeQuests = await Quest.find({ isActive: true });
    let isUpdated = false;

    activeQuests.forEach((quest) => {
      const statAmount = rawStats[quest.actionType]; // VD: rawStats["KILL_SMALL_MONSTER"]

      if (statAmount && statAmount > 0) {
        const progressArray =
          quest.questType === "DAILY"
            ? player.dailyProgress
            : player.achievementsProgress;
        let progressObj = progressArray.find(
          (p) => p.questId === quest.questId,
        );

        if (!progressObj) {
          progressObj = {
            questId: quest.questId,
            current: 0,
            isClaimed: false,
          };
          progressArray.push(progressObj);
        }

        if (!progressObj.isClaimed && progressObj.current < quest.targetCount) {
          progressObj.current += statAmount;
          if (progressObj.current > quest.targetCount)
            progressObj.current = quest.targetCount;
          isUpdated = true;
        }
      }
    });

    if (isUpdated) await player.save();
    return {
      daily: player.dailyProgress,
      achievements: player.achievementsProgress,
    };
  },

  // Đặt bên dưới hàm updateProgressFromStats của sếp
  claimQuestReward: async (userId, questId) => {
    const player = await Player.findOne({ userId });
    const quest = await Quest.findOne({ questId });

    if (!player || !quest) throw new Error("Dữ liệu không hợp lệ");

    // Tìm trong cả 2 mảng xem tiến độ nằm ở đâu
    const progressArray =
      quest.questType === "DAILY"
        ? player.dailyProgress
        : player.achievementsProgress;
    const progressObj = progressArray.find((p) => p.questId === questId);

    if (!progressObj) throw new Error("Chưa có tiến độ cho nhiệm vụ này");
    if (progressObj.current < quest.targetCount)
      throw new Error("Chưa hoàn thành nhiệm vụ");
    if (progressObj.isClaimed)
      throw new Error("Nhiệm vụ này đã được nhận quà rồi");

    progressObj.isClaimed = true;

    const bonusCoin = quest.rewardCoin || quest.reward?.coin || 0;
    const bonusExp = quest.rewardExp || quest.reward?.exp || 0;

    player.profile.coin += bonusCoin;
    player.profile.exp += bonusExp;

    console.log(
      `[QuestService] Player ${userId} nhận thưởng Quest ${questId}. +${bonusCoin} Coin, +${bonusExp} Exp. Tổng: ${player.profile.coin}`,
    );

    // Nếu có danh hiệu tặng kèm thì add vào list Unlocked
    const titleReward = quest.rewardTitleId || quest.reward?.titleId;
    if (titleReward && !player.unlockedMedals.includes(titleReward)) {
      player.unlockedMedals.push(titleReward);
    }

    // [Bí Thuật Mongoose]: Ép nó lưu mảng
    player.markModified("dailyProgress");
    player.markModified("achievementsProgress");
    await player.save();

    return {
      message: "Nhận thưởng thành công",
      newCoin: player.profile.coin,
      newExp: player.profile.exp,
    };
  },
};
