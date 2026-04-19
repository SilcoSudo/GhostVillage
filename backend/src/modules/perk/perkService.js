import Perk from "./perkModel.js";

export const PerkService = {
  getAllPerks: async (query) => {
    const { page = 1, limit = 20, isActive = "all", search } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (isActive !== "all") filter.isActive = isActive === "true";
    if (search) {
      filter.$or = [
        { perkId: { $regex: search, $options: "i" } },
        { perkName: { $regex: search, $options: "i" } },
        { prefabId: { $regex: search, $options: "i" } },
      ];
    }

    const perks = await Perk.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Perk.countDocuments(filter);

    return {
      data: perks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  getPerkById: async (id) => {
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      return await Perk.findById(id).select("-__v");
    }
    return await Perk.findOne({ perkId: id.toUpperCase() }).select("-__v");
  },

  createPerk: async (data) => {
    // Chỉ bóc perkId ra để kiểm tra
    const { perkId } = data;

    const existingPerk = await Perk.findOne({ perkId: perkId.toUpperCase() });
    if (existingPerk) {
      throw new Error(`Perk ID "${perkId}" đã tồn tại`);
    }

    // Đẩy nguyên cục data vào, Mongoose Schema sẽ tự lọc các trường hợp lệ
    const newPerk = new Perk({
      ...data,
      perkId: perkId.toUpperCase(),
      modifiers: data.modifiers || {}, // Đổi tên playerModifiers -> modifiers cho gọn
    });

    return await newPerk.save();
  },

  updatePerk: async (id, updateData) => {
    if (updateData.perkId) delete updateData.perkId;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      return await Perk.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      );
    }
    return await Perk.findOneAndUpdate(
      { perkId: id.toUpperCase() },
      { $set: updateData },
      { new: true, runValidators: true },
    );
  },

  togglePerkStatus: async (id, isActive) => {
    let perk = id.match(/^[0-9a-fA-F]{24}$/)
      ? await Perk.findById(id)
      : await Perk.findOne({ perkId: id.toUpperCase() });

    if (!perk) throw new Error("Không tìm thấy Perk");

    perk.isActive = isActive;
    return await perk.save();
  },

  deletePerk: async (id) => {
    let perk = id.match(/^[0-9a-fA-F]{24}$/)
      ? await Perk.findById(id)
      : await Perk.findOne({ perkId: id.toUpperCase() });

    if (!perk) throw new Error("Không tìm thấy Perk");

    perk.isActive = false; // Soft Delete
    return await perk.save();
  },
};
