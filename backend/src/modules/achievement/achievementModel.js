import mongoose from 'mongoose';

const AchievementSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // VD: "KILL_100_GHOSTS", "FIRST_WIN"
  title: { type: String, required: true },
  desc: { type: String, required: true },
  target: { type: Number, required: true }, // Con số cần đạt (100, 50, 1...)
  reward: {
    coin: { type: Number, default: 0 },
    titleId: { type: String, default: null } // ID danh hiệu tặng kèm
  }
}, { timestamps: true });

export default mongoose.model("Achievement", AchievementSchema, "achievements");