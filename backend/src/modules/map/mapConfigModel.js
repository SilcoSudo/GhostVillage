import mongoose from "mongoose";

const MapConfigSchema = new mongoose.Schema(
  {
    // --- 1. UI & IDENTIFIER ---
    identityConfig: {
      mapId: { type: String, required: true, unique: true, index: true },
      sceneName: { type: String, required: true },
      displayName: { type: String, required: true },
      thumbnailUrl: { type: String, default: "" },
      shortDescription: { type: String, default: "" },
      requiredLevel: { type: Number, default: 1, min: 1 }, // Cấp độ yêu cầu để vào map
      isActive: { type: Boolean, default: true },
    },

    // --- 2. ENVIRONMENT ---
    environmentConfig: {
      baseLightingId: { type: String, default: "LIGHT_DEFAULT" },
      moonEventPool: [
        {
          _id: false,
          eventId: String,
          weight: Number,
          uiIcon: String,
        },
      ],
    },

    // --- 3. CONSUMABLES (Máu, Nước, Pin) ---
    consumableConfig: {
      spawnPointIds: [String],
      mandatoryItems: [
        {
          _id: false,
          itemId: String,
          minCount: { type: Number, default: 1 },
          maxCount: { type: Number, default: 1 },
        },
      ],
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

    // --- 4. EQUIPMENT (MỚI THÊM: Đèn pin, Máy dò, La bàn...) ---
    equipmentConfig: {
      spawnPointIds: [String], // Ví dụ: SP_Equip_Table, SP_Equip_Shelf

      // Những món bắt buộc phải có (VD: 1 Đèn pin xịn)
      mandatoryEquipment: [
        {
          _id: false,
          itemId: String,
          minCount: { type: Number, default: 1 },
          maxCount: { type: Number, default: 1 },
        },
      ],

      // Những món hên xui mới có (VD: Máy dò ma xịn)
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

    // --- 5. MONSTERS ---
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

    // --- 6. PUZZLES ---
    puzzleConfig: {
      spawnPointIds: [String],
      puzzlePoolIds: [String],
    },

    // --- 7. REWARDS ---
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
