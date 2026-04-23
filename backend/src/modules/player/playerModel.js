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
      nextLevelExp: { type: Number, default: 100 }, // <--- THÊM DÒNG NÀY
      coin: { type: Number, default: 1000 },
    },
    unlockedPerks: { type: [String], default: [] },
    equippedPerks: { type: [String], default: [] },

    //  THÊM FIELD MEDAL ĐỂ TRACK CÁC MEDAL HUY CHƯƠNG ĐÃ UNLOCK VÀ SELECTED
    unlockedMedals: { type: [String], default: [] },
    selectedMedals: { type: [String], default: [] },
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

playerSchema.pre("validate", async function (next) {
  try {
    if (this.uid) return next();

    for (let i = 0; i < 20; i++) {
      const candidate = Math.floor(
        10000000 + Math.random() * 90000000,
      ).toString();
      const exists = await mongoose.models.Player.exists({ uid: candidate });
      if (!exists) {
        this.uid = candidate;
        return next();
      }
    }

    return next(new Error("Unable to generate unique player uid"));
  } catch (error) {
    return next(error);
  }
});

// ==========================================================
// AUTO LEVEL UP TRƯỚC KHI LƯU VÀO DB
// Bất cứ khi nào Player được lưu (nhận EXP), nó sẽ tự động check và lên cấp!
// ==========================================================
playerSchema.pre("save", function (next) {
  if (this.profile) {
    // Đảm bảo luôn có mốc exp để lên cấp (mặc định 100)
    if (!this.profile.nextLevelExp) this.profile.nextLevelExp = 100;

    // MAX LEVEL LÀ 100. Nếu đã cấp 100 thì ngưng không cộng dồn exp hay tính toán lên cấp nữa.
    if (this.profile.level >= 100) {
      this.profile.level = 100;
      this.profile.exp = 0; // Tràn exp cũng cắt luôn, không cho dư
      return next();
    }

    // Dùng vòng lặp while lỡ nhận 1 đống EXP lên 2, 3 cấp 1 lúc
    while (
      this.profile.exp >= this.profile.nextLevelExp &&
      this.profile.level < 100
    ) {
      this.profile.exp -= this.profile.nextLevelExp; // Trừ đi số exp đã tiêu hao để lên cấp
      this.profile.level += 1; // Lên 1 cấp

      // [TÍNH NĂNG MỚI]: Thưởng 500 Coin mỗi khi lên cấp! (Sếp có thể đổi con số này)
      this.profile.coin += 500;

      // Công thức tính exp cấp tiếp theo (Mỗi cấp tăng 100 exp yêu cầu)
      // VD: Cấp 1->2 cần 100, 2->3 cần 200, 3->4 cần 300...
      this.profile.nextLevelExp = this.profile.level * 100;

      // Nếu chạy vòng lặp mà đụng mốc 100 thì break ngay
      if (this.profile.level === 100) {
        this.profile.exp = 0;
        break;
      }
    }
  }
  next();
});

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
