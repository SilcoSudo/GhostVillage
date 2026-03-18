import mongoose from 'mongoose';

const GameResultSchema = new mongoose.Schema({
  mapId: { type: String, required: true }, // Liên kết với MapConfig ID
  roomName: String,
  durationSec: Number, // Thời gian diễn ra trận đấu
  startTime: Date,
  endTime: Date
}, { timestamps: true });

export default mongoose.model('GameResult', GameResultSchema);