import mongoose from "mongoose";

const perkSchema = new mongoose.Schema(
  {
    perkId: { type: String, required: true, unique: true }, // VD: PERK_RUNNER
    perkName: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },

    // Các chỉ số cộng thẳng vào PlayerStats trong Unity
    playerModifiers: {
      moveSpeedBonus: { type: Number, default: 0 }, // Cấp % hoặc cộng thẳng tùy logic Unity
      staminaBonus: { type: Number, default: 0 },
      batteryDrainReduction: { type: Number, default: 0 }, // VD: 0.1 là giảm 10% tốc độ tụt pin
      reviveSpeedBonus: { type: Number, default: 0 }, // Tốc độ cứu bồ
    },
  },
  { timestamps: true },
);

export default mongoose.model("Perk", perkSchema);
