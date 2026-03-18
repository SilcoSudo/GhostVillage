import Quest from "./questModel.js";

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
};
