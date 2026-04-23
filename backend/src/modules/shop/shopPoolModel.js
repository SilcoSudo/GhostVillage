import mongoose from 'mongoose';
const shopPoolSchema = new mongoose.Schema({
  weeklyPerks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Perk' }], // 6 Perk ngẫu nhiên
  expiresAt: { type: Date, required: true } // Hết hạn sau 1 tuần
}, { timestamps: true });
export default mongoose.model('ShopPool', shopPoolSchema);