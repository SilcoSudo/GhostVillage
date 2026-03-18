import mongoose from "mongoose";

/**
 * Consumable Item Schema
 * Định nghĩa cấu trúc dữ liệu cho consumable items trong game
 * (Máu, Nước, Pin, Potion, etc.)
 */

const ConsumableSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: [true, "Item ID là bắt buộc"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^ITEM_[A-Z0-9_]+$/, "Item ID phải theo format: ITEM_XXX"],
      comment: "Mã định danh item (VD: ITEM_HP_POTION, ITEM_STAMINA_DRINK)",
    },
    name: {
      type: String,
      required: [true, "Tên item là bắt buộc"],
      trim: true,
      maxlength: [100, "Tên không được vượt quá 100 ký tự"],
      comment: "Tên hiển thị của item",
    },
    description: {
      type: String,
      required: [true, "Mô tả item là bắt buộc"],
      trim: true,
      maxlength: [500, "Mô tả không được vượt quá 500 ký tự"],
      comment: "Mô tả chi tiết về item",
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ["Health", "Stamina", "Battery", "Buff", "Utility", "Special"],
        message: "Type phải là: Health, Stamina, Battery, Buff, Utility, hoặc Special",
      },
      default: "Utility",
      comment: "Loại consumable",
    },
    rarity: {
      type: String,
      required: true,
      enum: {
        values: ["Common", "Rare", "Epic", "Legendary", "Mythic"],
        message: "Rarity phải là: Common, Rare, Epic, Legendary, hoặc Mythic",
      },
      default: "Common",
      comment: "Độ hiếm của item",
    },
    iconAsset: {
      type: String,
      required: [true, "Icon asset là bắt buộc"],
      trim: true,
      comment: "Đường dẫn đến icon hình ảnh (URL hoặc path trong Unity)",
    },
    effects: {
      restoreHP: {
        type: Number,
        default: 0,
        min: 0,
        comment: "Hồi máu",
      },
      restoreStamina: {
        type: Number,
        default: 0,
        min: 0,
        comment: "Hồi thể lực",
      },
      restoreBattery: {
        type: Number,
        default: 0,
        min: 0,
        comment: "Hồi pin",
      },
      speedBoost: {
        type: Number,
        default: 0,
        min: 0,
        comment: "Tăng tốc độ (%)",
      },
      defenseBoost: {
        type: Number,
        default: 0,
        min: 0,
        comment: "Tăng phòng thủ (%)",
      },
      duration: {
        type: Number,
        default: 0,
        min: 0,
        comment: "Thời gian hiệu ứng (giây)",
      },
      customEffect: {
        type: String,
        trim: true,
        comment: "Hiệu ứng đặc biệt (mô tả)",
      },
    },
    stackSize: {
      type: Number,
      required: true,
      min: [1, "Stack size phải lớn hơn 0"],
      max: [999, "Stack size không được vượt quá 999"],
      default: 10,
      comment: "Số lượng tối đa có thể stack trong inventory",
    },
    cooldown: {
      type: Number,
      default: 0,
      min: 0,
      comment: "Thời gian hồi chiêu (giây)",
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Giá không được âm"],
      default: 0,
      comment: "Giá bán trong shop (coin)",
    },
    sellPrice: {
      type: Number,
      min: 0,
      comment: "Giá bán lại cho NPC (nếu có)",
    },
    isAvailableInStore: {
      type: Boolean,
      default: true,
      comment: "Có hiển thị trong shop không",
    },
    canDrop: {
      type: Boolean,
      default: true,
      index: true,
      comment: "Có thể rơi từ monster/loot box không",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
      comment: "Trạng thái hoạt động (admin toggle)",
    },
    requiredLevel: {
      type: Number,
      min: 1,
      default: 1,
      comment: "Level tối thiểu để sử dụng",
    },
    weight: {
      type: Number,
      default: 1,
      min: 0,
      comment: "Trọng lượng item (cho hệ thống inventory)",
    },
    dropRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
      comment: "Tỉ lệ rơi từ monster (%)",
    },
    tags: [
      {
        type: String,
        trim: true,
        comment: "Tags để phân loại (VD: 'healing', 'buff', 'rare')",
      },
    ],
  },
  {
    timestamps: true,
    collection: "consumables",
  }
);

// ========================
// INDEXES
// ========================
ConsumableSchema.index({ itemId: 1 });
ConsumableSchema.index({ type: 1 });
ConsumableSchema.index({ rarity: 1 });
ConsumableSchema.index({ isActive: 1 });
ConsumableSchema.index({ canDrop: 1 });
ConsumableSchema.index({ name: "text", description: "text" });

// ========================
// STATIC METHODS
// ========================

/**
 * Lấy danh sách consumables với filter, search và pagination
 */
ConsumableSchema.statics.getConsumables = async function ({
  page = 1,
  limit = 20,
  isActive,
  canDrop,
  isAvailableInStore,
  type,
  rarity,
  search,
} = {}) {
  const query = {};

  // Filters
  if (isActive !== undefined && isActive !== "all") {
    query.isActive = isActive === "true" || isActive === true;
  }

  if (canDrop !== undefined && canDrop !== "all") {
    query.canDrop = canDrop === "true" || canDrop === true;
  }

  if (isAvailableInStore !== undefined && isAvailableInStore !== "all") {
    query.isAvailableInStore = isAvailableInStore === "true" || isAvailableInStore === true;
  }

  if (type && type !== "all") {
    query.type = type;
  }

  if (rarity && rarity !== "all") {
    query.rarity = rarity;
  }

  // Search
  if (search && search.trim() !== "") {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { itemId: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Pagination
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    this.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Lấy thống kê tổng quan
 */
ConsumableSchema.statics.getStats = async function () {
  const [total, active, inactive, canDropCount, byType, byRarity] = await Promise.all([
    this.countDocuments({}),
    this.countDocuments({ isActive: true }),
    this.countDocuments({ isActive: false }),
    this.countDocuments({ canDrop: true }),
    this.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    this.aggregate([
      { $group: { _id: "$rarity", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    total,
    active,
    inactive,
    canDrop: canDropCount,
    byType,
    byRarity,
  };
};

const Consumable = mongoose.model("Consumable", ConsumableSchema);

export default Consumable;
