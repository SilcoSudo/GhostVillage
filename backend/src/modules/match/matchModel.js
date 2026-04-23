import mongoose from "mongoose";

// 1. Schema con: Kết quả của từng người chơi
const PlayerResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Liên kết với bảng User nếu cần populate sau này
      required: true,
    },
    nickname: {
      type: String,
      required: true,
    },
    isWin: {
      type: Boolean,
      required: true,
    },
    outcome: {
      type: String,
      enum: ["ESCAPED", "CAUGHT", "DEAD", "DISCONNECTED"], // Giới hạn các giá trị hợp lệ
      required: true,
    },
    rewards: {
      exp: { type: Number, default: 0 },
      coin: { type: Number, default: 0 },
    },
    titles: [
      {
        type: String, // Lưu mã danh hiệu: "GrimReaper", "Medic"...
      },
    ],
  },
  { _id: false }, // Không cần tự sinh _id cho sub-document này để tiết kiệm dung lượng
);

// 2. Schema chính: Trận đấu
const MatchSchema = new mongoose.Schema(
  {
    mapId: {
      type: String,
      required: true, // VD: "MAP_01_ONG_KE"
    },
    sessionId: {
      type: String,
      required: true, // VD: Tên phòng Photon "Room_123"
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    durationSec: {
      type: Number,
      required: true, // Thời gian chơi tính bằng giây
    },
    moonEventId: { type: String, default: "EVENT_MOON_DEFAULT" },
    moonEventName: { type: String, default: "Normal Moon" },
    playerResults: [PlayerResultSchema], // Nhúng mảng kết quả vào đây
  },
  {
    timestamps: true, // Tự động thêm createdAt, updatedAt cho bản ghi Match
    collection: "matches", // Tên collection trong MongoDB
  },
);

// 3. TẠO INDEX (RẤT QUAN TRỌNG)
// Giúp tìm lịch sử đấu của User cực nhanh: db.matches.find({ "playerResults.userId": "..." })
MatchSchema.index({ "playerResults.userId": 1, endTime: -1 });

// 4. Export Model
const MatchResult = mongoose.model("MatchResult", MatchSchema);

export default MatchResult;
