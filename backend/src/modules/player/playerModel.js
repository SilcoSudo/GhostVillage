import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    // Reference to User (Web account)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // MỚI THÊM: UID 8 chữ số để kết bạn/tìm kiếm trong game
    uid: {
      type: String,
      required: true,
      unique: true,
      minlength: 8,
      maxlength: 8,
    },

    // Player profile (Game-specific)
    // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    profile: {
      displayName: String,
      avatar: { type: String, default: "avatar_default_01" },
      level: { type: Number, default: 1 },
      exp: { type: Number, default: 0 },
      coin: { type: Number, default: 1000 },
    },
    unlockedPerks: { type: [String], default: [] },
    equippedPerks: { type: [String], default: [] },

    // TIẾN ĐỘ THÀNH TỰU (Lưu vĩnh viễn không bao giờ xóa)
    achievementsProgress: [
      {
        questId: String, // ID của Quest (Loại ACHIEVEMENT)
        current: { type: Number, default: 0 },
        isClaimed: { type: Boolean, default: false },
      },
    ],

    // TIẾN ĐỘ NHIỆM VỤ NGÀY (Sẽ bị xóa đè khi sang ngày mới)
    dailyProgress: [
      {
        questId: String, // ID của Quest (Loại DAILY)
        current: { type: Number, default: 0 },
        isClaimed: { type: Boolean, default: false },
      },
    ],

    // THỜI GIAN RESET LƯỜI (Kiểm tra xem đã qua 0h00 chưa)
    lastDailyReset: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Populate User reference when returning JSON
playerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  return obj;
};

const Player = mongoose.model("Player", playerSchema);

// Drop old email/username indexes if they exist (migration from old schema)
Player.collection.dropIndex("email_1").catch(() => {});
Player.collection.dropIndex("username_1").catch(() => {});

export default Player;
