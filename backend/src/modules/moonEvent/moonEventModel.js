import mongoose from "mongoose";

const moonEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true }, // VD: EVENT_MOON_RED
    eventName: { type: String, required: true },
    description: { type: String },
    uiIcon: { type: String },
    isActive: { type: Boolean, default: true },

    // Tỷ lệ quay trúng sự kiện này (Global)
    weight: { type: Number, required: true, default: 10 },

    // Thay đổi môi trường
    environmentModifiers: {
      globalLightIntensity: { type: Number, default: 1.0 },
      fogDensity: { type: Number, default: 1.0 },
    },

    // Buff cho quái (Hệ số nhân)
    monsterBuffMultipliers: {
      speedMultiplier: { type: Number, default: 1.0 },
      detectionRangeMultiplier: { type: Number, default: 1.0 },
      chaseRangeMultiplier: { type: Number, default: 1.0 },
      cooldownMultiplier: { type: Number, default: 1.0 },
    },

    // THÊM MỚI: Phần thưởng cộng thêm khi trúng event này
    rewardMultipliers: {
      expMultiplier: { type: Number, default: 1.0 }, // VD: 1.5 = +50% EXP
      coinMultiplier: { type: Number, default: 1.0 }, // VD: 2.0 = Nhân đôi tiền
    },
  },
  { timestamps: true },
);
export default mongoose.model("MoonEvent", moonEventSchema);
