import mongoose from "mongoose";

const playerMatchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MatchResult",
      required: true,
    },
    isWin: { type: Boolean, default: false },
    expGained: { type: Number, default: 0 },
    coinGained: { type: Number, default: 0 },
    titles: { type: [String], default: [] },
    resultStatus: {
      type: String,
      enum: ["Escaped", "Killed", "Disconnected", "Victory", "Defeat"],
      default: "Killed",
    },
  },
  { timestamps: true },
);

export default mongoose.model(
  "PlayerMatchHistory",
  playerMatchHistorySchema,
  "playermatchhistories",
);
