import mongoose from "mongoose";

const MapConfigSchema = new mongoose.Schema(
  {
    // --- 1. UI & IDENTIFIER ---
    identityConfig: {
      mapId: { type: String, required: true, unique: true, index: true },
      sceneName: { type: String, required: true },
      displayName: { type: String, required: true }, // Tên hiển thị trên UI
      thumbnailUrl: { type: String, default: "" },
      shortDescription: { type: String, default: "" },
      requiredLevel: { type: Number, default: 1, min: 1 }, // Cấp độ yêu cầu để vào map
      isActive: { type: Boolean, default: true },
    },

    // --- 2. ENVIRONMENT (Sự kiện Trăng) ---
    environmentConfig: {
      baseLightingId: { type: String, default: "LIGHT_DEFAULT" },
      moonEventPool: [
        {
          _id: false,
          eventId: String, // EVENT_MOON_FULL, etc.
          weight: Number,
          uiIcon: String,
        },
      ],
    },

    // --- 3. CONSUMABLES ---
    consumableConfig: {
      spawnPointIds: [String], // Tổng kho vị trí

      // Item bắt buộc
      mandatoryItems: [
        {
          _id: false,
          itemId: String,
          minCount: { type: Number, default: 1 },
          maxCount: { type: Number, default: 1 },
        },
      ],

      // Item ngẫu nhiên
      randomPoolConfig: {
        minCount: { type: Number, default: 0 },
        maxCount: { type: Number, default: 0 },
        pool: [
          {
            _id: false,
            itemId: String,
            weight: Number,
          },
        ],
      },
    },

    // --- 4. MONSTERS & PUZZLES (Gameplay Objects) ---
    // Lưu ý: Đã bỏ maxActiveCount ở minion như yêu cầu
    monsterSystemConfig: {
      bossConfig: {
        monsterId: String,
        spawnPointIds: [String],
      },
      minionConfig: {
        allowedMonsterIds: [String],
        spawnPointIds: [String],
      },
    },

    puzzleConfig: {
      spawnPointIds: [String],
      puzzlePoolIds: [String],
    },

    // --- 5. REWARDS ---
    rewardConfig: {
      baseExp: { type: Number, default: 0 },
      baseCoin: { type: Number, default: 0 },
      eventMultipliers: [
        {
          _id: false,
          eventId: String,
          coinMultiplier: Number,
          expMultiplier: Number,
        },
      ],
    },
  },
  { timestamps: true },
);

const MapConfig = mongoose.model("MapConfig", MapConfigSchema);
export default MapConfig;
