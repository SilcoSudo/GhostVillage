import mongoose from "mongoose";

/**
 * Costume Schema
 * Định nghĩa cấu trúc dữ liệu cho trang phục (costume) trong game
 */

const CostumeSchema = new mongoose.Schema(
  {
    costumeId: {
      type: String,
      required: [true, "Costume ID là bắt buộc"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^COSTUME_[A-Z0-9_]+$/, "Costume ID phải theo format: COSTUME_XXX"],
      comment: "Mã định danh costume (VD: COSTUME_GHOST_KIMONO, COSTUME_SKELETON_SUIT)",
    },
    name: {
      type: String,
      required: [true, "Tên costume là bắt buộc"],
      trim: true,
      maxlength: [100, "Tên không được vượt quá 100 ký tự"],
      comment: "Tên hiển thị của costume",
    },
    description: {
      type: String,
      required: [true, "Mô tả costume là bắt buộc"],
      trim: true,
      maxlength: [500, "Mô tả không được vượt quá 500 ký tự"],
      comment: "Mô tả chi tiết về costume",
    },
    rarity: {
      type: String,
      required: true,
      enum: {
        values: ["Common", "Rare", "Epic", "Legendary", "Mythic"],
        message: "Rarity phải là: Common, Rare, Epic, Legendary, hoặc Mythic",
      },
      default: "Common",
      comment: "Độ hiếm của costume",
    },
    category: {
      type: String,
      required: true,
      enum: {
        values: ["Full Body", "Head", "Body", "Accessory", "Weapon", "Pet"],
        message: "Category không hợp lệ",
      },
      default: "Full Body",
      comment: "Phân loại costume",
    },
    visualAsset: {
      type: String,
      required: [true, "Visual asset là bắt buộc"],
      trim: true,
      comment: "Đường dẫn đến asset hình ảnh (URL hoặc path trong Unity)",
    },
    thumbnailAsset: {
      type: String,
      trim: true,
      comment: "Đường dẫn đến thumbnail preview (nếu có)",
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Giá không được âm"],
      default: 0,
      comment: "Giá bán trong shop (coin)",
    },
    specialPrice: {
      type: Number,
      min: 0,
      comment: "Giá đặc biệt khi có sale hoặc event",
    },
    isAvailableInStore: {
      type: Boolean,
      default: true,
      comment: "Có hiển thị trong shop không",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
      comment: "Trạng thái hoạt động (admin toggle)",
    },
    isExclusive: {
      type: Boolean,
      default: false,
      comment: "Là trang phục độc quyền (event, limited edition)",
    },
    requiredLevel: {
      type: Number,
      min: 1,
      default: 1,
      comment: "Level tối thiểu để mua/sử dụng",
    },
    tags: [
      {
        type: String,
        trim: true,
        comment: "Tags để phân loại (VD: 'halloween', 'christmas', 'premium')",
      },
    ],
    stats: {
      defense: {
        type: Number,
        default: 0,
        comment: "Bonus defense (nếu costume có stats)",
      },
      speed: {
        type: Number,
        default: 0,
        comment: "Bonus speed",
      },
      luck: {
        type: Number,
        default: 0,
        comment: "Bonus luck",
      },
    },
    releaseDate: {
      type: Date,
      comment: "Ngày phát hành costume",
    },
    expiryDate: {
      type: Date,
      comment: "Ngày hết hạn (cho limited edition)",
    },
  },
  {
    timestamps: true,
    collection: "costumes",
  }
);

// Indexes
CostumeSchema.index({ costumeId: 1 });
CostumeSchema.index({ isActive: 1, isAvailableInStore: 1 });
CostumeSchema.index({ rarity: 1 });
CostumeSchema.index({ category: 1 });
CostumeSchema.index({ price: 1 });
CostumeSchema.index({ name: "text", description: "text" }); // Text search

// Virtual: isSale
CostumeSchema.virtual("isSale").get(function () {
  return this.specialPrice && this.specialPrice < this.price;
});

// Virtual: discountPercent
CostumeSchema.virtual("discountPercent").get(function () {
  if (this.isSale) {
    return Math.round(((this.price - this.specialPrice) / this.price) * 100);
  }
  return 0;
});

// Static methods
CostumeSchema.statics = {
  /**
   * Lấy danh sách costume với filter và pagination
   */
  async getCostumes(filters = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      isActive,
      isAvailableInStore,
      rarity,
      category,
      search,
    } = { ...filters, ...options };

    const query = {};

    // Filters
    if (isActive !== undefined && isActive !== "all") {
      query.isActive = isActive === "true" || isActive === true;
    }

    if (isAvailableInStore !== undefined && isAvailableInStore !== "all") {
      query.isAvailableInStore =
        isAvailableInStore === "true" || isAvailableInStore === true;
    }

    if (rarity && rarity !== "all") {
      query.rarity = rarity;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { costumeId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.countDocuments(query),
    ]);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Lấy thống kê costume
   */
  async getStats() {
    const [total, active, inactive, inStore, byRarity, byCategory] =
      await Promise.all([
        this.countDocuments(),
        this.countDocuments({ isActive: true }),
        this.countDocuments({ isActive: false }),
        this.countDocuments({ isAvailableInStore: true }),
        this.aggregate([
          { $group: { _id: "$rarity", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        this.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ]);

    return {
      total,
      active,
      inactive,
      inStore,
      byRarity,
      byCategory,
    };
  },
};

const Costume = mongoose.model("Costume", CostumeSchema);

export default Costume;
