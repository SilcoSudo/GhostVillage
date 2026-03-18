import mongoose from "mongoose";

const MapConfigSchema = new mongoose.Schema(
  {
    identityConfig: {
      mapId: { type: String, required: true, unique: true, index: true },
      sceneName: { type: String, required: true },
      displayName: { type: String, required: true },
      thumbnailUrl: { type: String, default: "" },
      shortDescription: { type: String, default: "" },
      isActive: { type: Boolean, default: true },
    },

    consumableConfig: {
      // Đã xóa spawnPointIds
      mandatoryItems: [
        { _id: false, itemId: String, minCount: Number, maxCount: Number },
      ],
      randomPoolConfig: {
        minCount: Number,
        maxCount: Number,
        pool: [{ _id: false, itemId: String, weight: Number }],
      },
    },

    equipmentConfig: {
      // Đã xóa spawnPointIds
      mandatoryEquipment: [
        { _id: false, itemId: String, minCount: Number, maxCount: Number },
      ],
      randomPoolConfig: {
        minCount: Number,
        maxCount: Number,
        pool: [{ _id: false, itemId: String, weight: Number }],
      },
    },

    monsterSystemConfig: {
      bossConfig: {
        monsterId: String,
        // Đã xóa spawnPointIds
      },
      minionConfig: {
        allowedMonsterIds: [String],
        // Đã xóa spawnPointIds
      },
    },

    rewardConfig: {
      baseExp: { type: Number, default: 0 },
      baseCoin: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export default mongoose.model("MapConfig", MapConfigSchema);
