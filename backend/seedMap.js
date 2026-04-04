import mongoose from "mongoose";
import MapConfig from "./src/modules/map/mapConfigModel.js";
import { config } from "dotenv";

config();

/**
 * Seed Data cho Map
 * Tạo dữ liệu mẫu cho bản đồ trong game
 */
const maps = [
  {
    identityConfig: {
      mapId: "MAP_FOREST_01",
      sceneName: "ForestScene",
      displayName: "Rừng Sương Mù",
      thumbnailUrl: "/images/maps/misty-forest.jpg",
      shortDescription: "Một khu rừng bí ẩn đầy sương mù và nguy hiểm",
      requiredLevel: 1,
      isActive: true,
    },
    environmentConfig: {
      baseLightingId: "LIGHT_FOREST",
      moonEventPool: [
        { eventId: "EVENT_MOON_FULL", weight: 20, uiIcon: "moon_full" },
        { eventId: "EVENT_MOON_HALF", weight: 50, uiIcon: "moon_half" },
        { eventId: "EVENT_MOON_NEW", weight: 30, uiIcon: "moon_new" },
      ],
    },
    consumableConfig: {
      spawnPointIds: ["SP_FOREST_01", "SP_FOREST_02", "SP_FOREST_03"],
      mandatoryItems: [
        { itemId: "ITEM_HEALTH_POTION", minCount: 1, maxCount: 2 },
      ],
      randomPoolConfig: {
        minCount: 1,
        maxCount: 3,
        pool: [
          { itemId: "ITEM_MANA_POTION", weight: 50 },
          { itemId: "ITEM_SPEED_BOOST", weight: 30 },
        ],
      },
    },
    monsterSystemConfig: {
      bossConfig: {
        monsterId: "BOSS_FOREST_KING",
        spawnPointIds: ["BOSS_SP_01"],
      },
      minionConfig: {
        allowedMonsterIds: ["MON_SLIME", "MON_WOLF"],
        spawnPointIds: ["MIN_SP_01", "MIN_SP_02", "MIN_SP_03"],
      },
    },
    puzzleConfig: {
      spawnPointIds: ["PUZ_SP_01"],
      puzzlePoolIds: ["PUZZLE_FOREST_01", "PUZZLE_FOREST_02"],
    },
    rewardConfig: {
      baseExp: 100,
      baseCoin: 50,
      eventMultipliers: [
        { eventId: "EVENT_MOON_FULL", coinMultiplier: 2, expMultiplier: 1.5 },
      ],
    },
  },
  {
    identityConfig: {
      mapId: "MAP_CAVE_01",
      sceneName: "DarkCaveScene",
      displayName: "Hang Động Tối",
      thumbnailUrl: "/images/maps/dark-cave.jpg",
      shortDescription: "Hang động sâu tối tăm với nhiều quái vật mạnh",
      requiredLevel: 5,
      isActive: true,
    },
    environmentConfig: {
      baseLightingId: "LIGHT_DARK",
      moonEventPool: [
        { eventId: "EVENT_MOON_FULL", weight: 10, uiIcon: "moon_full" },
        { eventId: "EVENT_MOON_NEW", weight: 90, uiIcon: "moon_new" },
      ],
    },
    consumableConfig: {
      spawnPointIds: ["SP_CAVE_01", "SP_CAVE_02"],
      mandatoryItems: [
        { itemId: "ITEM_TORCH", minCount: 1, maxCount: 1 },
      ],
      randomPoolConfig: {
        minCount: 0,
        maxCount: 2,
        pool: [
          { itemId: "ITEM_HEALTH_POTION", weight: 60 },
          { itemId: "ITEM_ANTIDOTE", weight: 40 },
        ],
      },
    },
    monsterSystemConfig: {
      bossConfig: {
        monsterId: "BOSS_CAVE_DRAGON",
        spawnPointIds: ["BOSS_SP_CAVE_01"],
      },
      minionConfig: {
        allowedMonsterIds: ["MON_BAT", "MON_SPIDER"],
        spawnPointIds: ["MIN_SP_CAVE_01", "MIN_SP_CAVE_02"],
      },
    },
    puzzleConfig: {
      spawnPointIds: ["PUZ_SP_CAVE_01"],
      puzzlePoolIds: ["PUZZLE_CAVE_01"],
    },
    rewardConfig: {
      baseExp: 250,
      baseCoin: 120,
      eventMultipliers: [
        { eventId: "EVENT_MOON_NEW", coinMultiplier: 1.8, expMultiplier: 2 },
      ],
    },
  },
  {
    identityConfig: {
      mapId: "MAP_CASTLE_01",
      sceneName: "HauntedCastleScene",
      displayName: "Lâu Đài Ma Quái",
      thumbnailUrl: "/images/maps/haunted-castle.jpg",
      shortDescription: "Lâu đài bị ma ám với những bí ẩn đáng sợ",
      requiredLevel: 10,
      isActive: true,
    },
    environmentConfig: {
      baseLightingId: "LIGHT_HAUNTED",
      moonEventPool: [
        { eventId: "EVENT_MOON_BLOOD", weight: 30, uiIcon: "moon_blood" },
        { eventId: "EVENT_MOON_FULL", weight: 40, uiIcon: "moon_full" },
        { eventId: "EVENT_MOON_NEW", weight: 30, uiIcon: "moon_new" },
      ],
    },
    consumableConfig: {
      spawnPointIds: ["SP_CASTLE_01", "SP_CASTLE_02", "SP_CASTLE_03"],
      mandatoryItems: [
        { itemId: "ITEM_HOLY_WATER", minCount: 1, maxCount: 1 },
      ],
      randomPoolConfig: {
        minCount: 2,
        maxCount: 4,
        pool: [
          { itemId: "ITEM_ELIXIR", weight: 40 },
          { itemId: "ITEM_STRENGTH_POTION", weight: 35 },
          { itemId: "ITEM_DEFENSE_POTION", weight: 25 },
        ],
      },
    },
    monsterSystemConfig: {
      bossConfig: {
        monsterId: "BOSS_VAMPIRE_LORD",
        spawnPointIds: ["BOSS_SP_CASTLE_01"],
      },
      minionConfig: {
        allowedMonsterIds: ["MON_GHOST", "MON_SKELETON", "MON_ZOMBIE"],
        spawnPointIds: [
          "MIN_SP_CASTLE_01",
          "MIN_SP_CASTLE_02",
          "MIN_SP_CASTLE_03",
          "MIN_SP_CASTLE_04",
        ],
      },
    },
    puzzleConfig: {
      spawnPointIds: ["PUZ_SP_CASTLE_01", "PUZ_SP_CASTLE_02"],
      puzzlePoolIds: ["PUZZLE_CASTLE_01", "PUZZLE_CASTLE_02", "PUZZLE_CASTLE_03"],
    },
    rewardConfig: {
      baseExp: 500,
      baseCoin: 300,
      eventMultipliers: [
        { eventId: "EVENT_MOON_BLOOD", coinMultiplier: 3, expMultiplier: 2.5 },
      ],
    },
  },
  {
    identityConfig: {
      mapId: "MAP_DESERT_01",
      sceneName: "BurningDesertScene",
      displayName: "Sa Mạc Rực Lửa",
      thumbnailUrl: "/images/maps/burning-desert.jpg",
      shortDescription: "Sa mạc khô cằn với nhiệt độ khắc nghiệt",
      requiredLevel: 15,
      isActive: true,
    },
    environmentConfig: {
      baseLightingId: "LIGHT_DESERT",
      moonEventPool: [
        { eventId: "EVENT_SANDSTORM", weight: 50, uiIcon: "sandstorm" },
        { eventId: "EVENT_MOON_HALF", weight: 50, uiIcon: "moon_half" },
      ],
    },
    consumableConfig: {
      spawnPointIds: ["SP_DESERT_01", "SP_DESERT_02"],
      mandatoryItems: [
        { itemId: "ITEM_WATER_FLASK", minCount: 2, maxCount: 3 },
      ],
      randomPoolConfig: {
        minCount: 1,
        maxCount: 2,
        pool: [
          { itemId: "ITEM_FIRE_RESIST_POTION", weight: 70 },
          { itemId: "ITEM_STAMINA_POTION", weight: 30 },
        ],
      },
    },
    monsterSystemConfig: {
      bossConfig: {
        monsterId: "BOSS_SAND_WORM",
        spawnPointIds: ["BOSS_SP_DESERT_01"],
      },
      minionConfig: {
        allowedMonsterIds: ["MON_SCORPION", "MON_SAND_GOLEM"],
        spawnPointIds: ["MIN_SP_DESERT_01", "MIN_SP_DESERT_02"],
      },
    },
    puzzleConfig: {
      spawnPointIds: ["PUZ_SP_DESERT_01"],
      puzzlePoolIds: ["PUZZLE_DESERT_01"],
    },
    rewardConfig: {
      baseExp: 700,
      baseCoin: 450,
      eventMultipliers: [
        { eventId: "EVENT_SANDSTORM", coinMultiplier: 2.5, expMultiplier: 2 },
      ],
    },
  },
  {
    identityConfig: {
      mapId: "MAP_ICE_01",
      sceneName: "FrozenWastelandScene",
      displayName: "Vùng Đất Băng Giá",
      thumbnailUrl: "/images/maps/frozen-wasteland.jpg",
      shortDescription: "Vùng đất băng tuyết với khí hậu lạnh lẽo",
      requiredLevel: 20,
      isActive: false,
    },
    environmentConfig: {
      baseLightingId: "LIGHT_ICE",
      moonEventPool: [
        { eventId: "EVENT_BLIZZARD", weight: 60, uiIcon: "blizzard" },
        { eventId: "EVENT_MOON_FULL", weight: 40, uiIcon: "moon_full" },
      ],
    },
    consumableConfig: {
      spawnPointIds: ["SP_ICE_01", "SP_ICE_02", "SP_ICE_03"],
      mandatoryItems: [
        { itemId: "ITEM_WARM_COAT", minCount: 1, maxCount: 1 },
      ],
      randomPoolConfig: {
        minCount: 2,
        maxCount: 3,
        pool: [
          { itemId: "ITEM_COLD_RESIST_POTION", weight: 80 },
          { itemId: "ITEM_MEGA_HEALTH_POTION", weight: 20 },
        ],
      },
    },
    monsterSystemConfig: {
      bossConfig: {
        monsterId: "BOSS_ICE_DRAGON",
        spawnPointIds: ["BOSS_SP_ICE_01"],
      },
      minionConfig: {
        allowedMonsterIds: ["MON_ICE_WOLF", "MON_YETI"],
        spawnPointIds: ["MIN_SP_ICE_01", "MIN_SP_ICE_02", "MIN_SP_ICE_03"],
      },
    },
    puzzleConfig: {
      spawnPointIds: ["PUZ_SP_ICE_01", "PUZ_SP_ICE_02"],
      puzzlePoolIds: ["PUZZLE_ICE_01", "PUZZLE_ICE_02"],
    },
    rewardConfig: {
      baseExp: 1000,
      baseCoin: 600,
      eventMultipliers: [
        { eventId: "EVENT_BLIZZARD", coinMultiplier: 3.5, expMultiplier: 3 },
      ],
    },
  },
];

const seedMaps = async () => {
  try {
    // Kết nối MongoDB
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
    const DB_NAME = process.env.DB_NAME || "GhostVillage";
    await mongoose.connect(`${MONGO_URI}/${DB_NAME}`);

    console.log("🔗 Connected to MongoDB");

    // Xóa dữ liệu cũ
    await MapConfig.deleteMany({});
    console.log("🗑️  Cleared existing maps");

    // Thêm dữ liệu mới
    const insertedMaps = await MapConfig.insertMany(maps);
    console.log(` Successfully seeded ${insertedMaps.length} maps`);

    // Hiển thị danh sách
    console.log("\n📋 Seeded Maps:");
    insertedMaps.forEach((map, index) => {
      console.log(
        `${index + 1}. ${map.identityConfig.displayName} (${map.identityConfig.mapId}) - Level: ${map.identityConfig.requiredLevel}, Active: ${map.identityConfig.isActive}`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error(" Error seeding maps:", error);
    process.exit(1);
  }
};

seedMaps();
