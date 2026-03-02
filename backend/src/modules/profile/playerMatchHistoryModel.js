import mongoose from "mongoose";

const userMatchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    mapId: String,
    isWin: Boolean,
    durationSec: Number,
    exp: Number,
    coin: Number,
    titles: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const UserMatchHistory = mongoose.model(
  "UserMatchHistory",
  userMatchHistorySchema
);

export default UserMatchHistory;
