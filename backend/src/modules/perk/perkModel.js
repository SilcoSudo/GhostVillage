import mongoose from "mongoose";

const perkSchema = new mongoose.Schema(
  {
    perkId: { type: String, required: true, unique: true }, // VD: PERK_RUNNER_3
    perkName: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },

    // --- CÁC TRƯỜNG THÊM MỚI ---
    price: { type: Number, default: 0 }, // Giá tiền (Vàng) để mua
    rarity: {
      type: String,
      enum: ["COMMON", "RARE", "EPIC", "LEGENDARY"],
      default: "COMMON",
    }, // Độ hiếm
    prefabId: { type: String }, // Tên Prefab hoặc ID để nối với Unity (VD: "PERK_Runner_3")

    // Đổi sang Mixed để linh hoạt hứng mọi loại Modifier (Tốc chạy, Tốc cứu, Giảm ồn...)
    modifiers: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export default mongoose.model("Perk", perkSchema);
