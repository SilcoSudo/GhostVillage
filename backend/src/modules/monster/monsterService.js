import Monster from "./monsterModel.js";

export const MonsterService = {
  getAllMonsters: async (query) => {
    const { page = 1, limit = 20, isActive = "all", type } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (isActive !== "all") {
      filter.isActive = isActive === "true";
    }
    if (type) {
      filter.monsterType = type;
    }

    const monsters = await Monster.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Monster.countDocuments(filter);

    return {
      data: monsters,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  getMonsterById: async (id) => {
    // Hỗ trợ tìm bằng _id (Mongo) HOẶC monsterId (Game)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      return await Monster.findById(id).select("-__v");
    }
    return await Monster.findOne({ monsterId: id.toUpperCase() }).select(
      "-__v",
    );
  },

  createMonster: async (data) => {
    const {
      monsterId,
      monsterName,
      monsterType,
      prefabName,
      movementConfig,
      combatConfig,
      detectionConfig,
      specialSkillConfig,
    } = data;

    const existingMonster = await Monster.findOne({
      monsterId: monsterId.toUpperCase(),
    });
    if (existingMonster) {
      throw new Error(`Mã monsterId "${monsterId}" đã tồn tại!`);
    }

    const newMonster = new Monster({
      monsterId: monsterId.toUpperCase(),
      monsterName,
      monsterType,
      prefabName,
      movementConfig,
      combatConfig,
      detectionConfig,
      specialSkillConfig,
    });

    return await newMonster.save();
  },

  updateMonster: async (id, updateData) => {
    if (updateData.monsterId) delete updateData.monsterId; // Cấm sửa mã cứng

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      return await Monster.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      );
    }
    return await Monster.findOneAndUpdate(
      { monsterId: id.toUpperCase() },
      { $set: updateData },
      { new: true, runValidators: true },
    );
  },

  toggleMonsterStatus: async (id, isActive) => {
    let monster = id.match(/^[0-9a-fA-F]{24}$/)
      ? await Monster.findById(id)
      : await Monster.findOne({ monsterId: id.toUpperCase() });

    if (!monster) throw new Error("Không tìm thấy quái vật");

    monster.isActive = isActive;
    return await monster.save();
  },

  deleteMonster: async (id) => {
    let monster = id.match(/^[0-9a-fA-F]{24}$/)
      ? await Monster.findById(id)
      : await Monster.findOne({ monsterId: id.toUpperCase() });

    if (!monster) throw new Error("Không tìm thấy quái vật");

    monster.isActive = false; // Soft delete
    return await monster.save();
  },
};
