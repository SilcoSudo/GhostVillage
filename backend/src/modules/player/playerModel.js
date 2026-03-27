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
      coin: { type: Number, default: 1000 }
    },
    unlockedSkins: { type: [String], default: [] }, 
    unlockedPerks: { type: [String], default: [] },
    equippedSkins: {
      head: { type: String, default: "" }, // Lưu prefabId của head
      body: { type: String, default: "" }  // Lưu prefabId của body
    },
    equippedPerks: { type: [String], default: [] },
    unlockedMedals: [String],
    selectedMedals: { type: [String], default: [] },
    // Sub-document để truy vấn tiến độ cực nhanh
    achievementsProgress: [
      {
        achievementCode: String,
        current: { type: Number, default: 0 },
        isClaimed: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true },
);

playerSchema.pre("validate", async function (next) {
  try {
    if (this.uid) return next();

    for (let i = 0; i < 20; i++) {
      const candidate = Math.floor(10000000 + Math.random() * 90000000).toString();
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
