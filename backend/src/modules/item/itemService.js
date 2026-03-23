import Item from "./itemModel.js";

export const ItemService = {
  getAllItems: async (query) => {
    const { page = 1, limit = 20, isActive = "all", itemType, search } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (isActive !== "all") filter.isActive = isActive === "true";
    if (itemType && itemType !== "all") filter.itemType = itemType; // Lọc theo CONSUMABLE hoặc EQUIPMENT

    // Tìm kiếm tương đối theo tên item
    if (search) filter.itemName = { $regex: search, $options: "i" };

    const items = await Item.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(filter);

    return {
      data: items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  getItemById: async (id) => {
    // Hỗ trợ tìm bằng _id (Mongo) HOẶC itemId (Game)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      return await Item.findById(id).select("-__v");
    }
    return await Item.findOne({ itemId: id.toUpperCase() }).select("-__v");
  },

  createItem: async (data) => {
    // ĐÃ XÓA maxStack Ở ĐÂY
    const { itemId, itemName, itemType, prefabName, stats } = data;

    const existingItem = await Item.findOne({ itemId: itemId.toUpperCase() });
    if (existingItem) {
      throw new Error(`Mã Item ID "${itemId}" đã tồn tại`);
    }

    const newItem = new Item({
      itemId: itemId.toUpperCase(),
      itemName,
      itemType,
      prefabName,
      stats: stats || {},
    });

    return await newItem.save();
  },

  updateItem: async (id, updateData) => {
    if (updateData.itemId) delete updateData.itemId; // Cấm sửa mã cứng

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      return await Item.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      );
    }
    return await Item.findOneAndUpdate(
      { itemId: id.toUpperCase() },
      { $set: updateData },
      { new: true, runValidators: true },
    );
  },

  toggleItemStatus: async (id, isActive) => {
    let item = id.match(/^[0-9a-fA-F]{24}$/)
      ? await Item.findById(id)
      : await Item.findOne({ itemId: id.toUpperCase() });

    if (!item) throw new Error("Không tìm thấy vật phẩm");

    item.isActive = isActive;
    return await item.save();
  },

  deleteItem: async (id) => {
    let item = id.match(/^[0-9a-fA-F]{24}$/)
      ? await Item.findById(id)
      : await Item.findOne({ itemId: id.toUpperCase() });

    if (!item) throw new Error("Không tìm thấy vật phẩm");

    item.isActive = false; // Soft Delete an toàn
    return await item.save();
  },
};
