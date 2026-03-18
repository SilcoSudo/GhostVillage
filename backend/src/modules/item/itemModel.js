import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, unique: true }, // VD: ITEM_FLASHLIGHT, ITEM_MEDKIT
    itemName: { type: String, required: true },
    itemType: {
      type: String,
      enum: ["CONSUMABLE", "EQUIPMENT"],
      required: true,
    },
    prefabName: { type: String, required: true },
    isActive: { type: Boolean, default: true },

    // Dùng Mixed để linh hoạt.
    // VD Đèn pin: { maxBattery: 100, drainRate: 2, rechargeAmount: 0 }
    // VD Bình máu/Pin sạc: { rechargeAmount: 50, effectType: "HEAL" }
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export default mongoose.model("Item", itemSchema);
