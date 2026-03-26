import dotenv from "dotenv";
import mongoose from "mongoose";
import { config } from "./src/config/env.js";
import MapConfig from "./src/modules/map/mapConfigModel.js";

dotenv.config();

const MAP_ID = "MAP_01_ONG_KE";

const map1Config = {
  identityConfig: {
    mapId: MAP_ID,
    sceneName: "Scene_Game_OngKe",
    displayName: "Lang Co - Ong Ke",
    thumbnailUrl: "sprite_map_ongke",
    shortDescription:
      "Obsessed with dark sorcery, Ong Ke sheds his daytime mask at night and prowls the village alleys, hunting the unlucky souls still wandering after dark.",
    isActive: true,
  },

  consumableConfig: {
    mandatoryItems: [
      { itemId: "ITEM_FLASHLIGHT", minCount: 1, maxCount: 1 },
    ],
    randomPoolConfig: {
      minCount: 2,
      maxCount: 3,
      pool: [{ itemId: "ITEM_POTION", weight: 100 }],
    },
  },

  equipmentConfig: {
    mandatoryEquipment: [
      { itemId: "ITEM_FLASHLIGHT", minCount: 1, maxCount: 1 },
    ],
    randomPoolConfig: {
      minCount: 0,
      maxCount: 1,
      pool: [
        { itemId: "ITEM_GHOST_DETECTOR", weight: 40 },
        { itemId: "ITEM_COMPASS", weight: 60 },
      ],
    },
  },

  monsterSystemConfig: {
    bossConfig: {
      monsterId: "BOSS_ONG_KE",
    },
    minionConfig: {
      allowedMonsterIds: ["MINION_SHADOW_HAND", "MINION_CURSED_RAT"],
    },
  },

  rewardConfig: {
    baseExp: 500,
    baseCoin: 300,
  },
};

const seedMap1 = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log("Connected to MongoDB");

    const result = await MapConfig.updateOne(
      { "identityConfig.mapId": MAP_ID },
      { $set: map1Config },
      { upsert: true },
    );

    if (result.upsertedCount > 0) {
      console.log(`Created new map config: ${MAP_ID}`);
    } else if (result.modifiedCount > 0) {
      console.log(`Updated existing map config: ${MAP_ID}`);
    } else {
      console.log(`No changes applied (already up to date): ${MAP_ID}`);
    }

    const saved = await MapConfig.findOne({ "identityConfig.mapId": MAP_ID })
      .select("identityConfig consumableConfig equipmentConfig monsterSystemConfig rewardConfig")
      .lean();

    console.log("Seed result preview:");
    console.log(JSON.stringify(saved, null, 2));
  } catch (error) {
    console.error("Seed Map1 failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

seedMap1();
