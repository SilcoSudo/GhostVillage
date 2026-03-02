import mongoose from "mongoose";

/**
 * Monster Schema
 * Định nghĩa cấu trúc dữ liệu cho quái vật trong game
 */
const MonsterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên quái vật là bắt buộc"],
      trim: true,
      maxlength: [100, "Tên quái vật không được vượt quá 100 ký tự"],
    },
    avatar: {
      type: String,
      default: "/images/monsters/default-monster.png",
      trim: true,
    },
    hp: {
      type: Number,
      required: [true, "HP là bắt buộc"],
      min: [1, "HP phải lớn hơn 0"],
      default: 100,
    },
    atk: {
      type: Number,
      required: [true, "ATK là bắt buộc"],
      min: [0, "ATK không được âm"],
      default: 10,
    },
    def: {
      type: Number,
      required: [true, "DEF là bắt buộc"],
      min: [0, "DEF không được âm"],
      default: 5,
    },
    spawnRate: {
      type: Number,
      required: [true, "Spawn Rate là bắt buộc"],
      min: [0, "Spawn Rate không được âm"],
      max: [100, "Spawn Rate không được vượt quá 100"],
      default: 50,
      comment: "Tỷ lệ xuất hiện của quái vật (0-100%)",
    },
    isActive: {
      type: Boolean,
      default: true,
      comment: "Trạng thái kích hoạt của quái vật",
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
    versionKey: false,
  }
);

// Index để tối ưu hóa truy vấn
MonsterSchema.index({ name: 1 });
MonsterSchema.index({ isActive: 1 });

// Virtual để lấy thông tin tổng quan
MonsterSchema.virtual("powerLevel").get(function () {
  return Math.round((this.hp * 0.5 + this.atk * 2 + this.def * 1.5) / 4);
});

const Monster = mongoose.model("Monster", MonsterSchema);

export default Monster;
