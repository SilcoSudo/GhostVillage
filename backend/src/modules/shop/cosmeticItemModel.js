import mongoose from 'mongoose';
const cosmeticItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['Hat', 'Body'] }, // Chỉ dùng Nón và Body
  price: { type: Number, default: 0 },
  rarity: { type: String, enum: ['COMMON', 'RARE', 'EPIC'] },
  prefabId: { type: String, required: true } // Lưu ID/Tên của Prefab Unity
});
export default mongoose.model('CosmeticItem', cosmeticItemSchema);