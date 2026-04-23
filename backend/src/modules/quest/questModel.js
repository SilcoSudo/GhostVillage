import mongoose from "mongoose";

const questSchema = new mongoose.Schema(
  {
    questId: { type: String, required: true, unique: true },
    questName: { type: String, required: true },
    description: { type: String },
    questType: { type: String, enum: ["DAILY", "ACHIEVEMENT"], required: true },

    // Tag để Backend nhận diện hành động từ Client gửi lên
    // VD: "REVIVE_TEAMMATE", "WIN_ONG_KE_MAP", "BURN_10_DOLLS"
    actionType: { type: String, required: true },
    targetCount: { type: Number, required: true, default: 1 },

    reward: {
      coin: { type: Number, default: 0 },
      exp: { type: Number, default: 0 },
      titleId: { type: String, default: null }, // Danh hiệu nếu có
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Quest", questSchema);
