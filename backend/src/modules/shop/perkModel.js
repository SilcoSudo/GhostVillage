import mongoose from 'mongoose';
const perkSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, default: 0 },
  rarity: { type: String, enum: ['COMMON', 'RARE', 'EPIC'] },
  prefabId: { type: String, required: true }, // Lưu ID/Tên của Prefab Unity
  effect: Object
});
export default mongoose.model('Perk', perkSchema);