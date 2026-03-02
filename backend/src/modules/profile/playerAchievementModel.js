import mongoose from "mongoose";

const playerAchievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Mã định danh thành tựu để tránh trùng (FIRST_CLEAR, KILL_50, ...)
    code: {
      type: String,
      required: true,
      trim: true,
    },

    // Nội dung hiển thị
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Tiến độ
    progress: {
      current: { type: Number, default: 0, min: 0 },
      target: { type: Number, default: 1, min: 1 },
    },

    // Trạng thái (UI cần)
    isUnlocked: { type: Boolean, default: false },
    unlockedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Ràng buộc: Một người chơi không thể có 2 bản ghi cho cùng 1 thành tựu
playerAchievementSchema.index({ userId: 1, code: 1 }, { unique: true });

const PlayerAchievement = mongoose.model("PlayerAchievement", playerAchievementSchema, "playerachievments");

export default PlayerAchievement;