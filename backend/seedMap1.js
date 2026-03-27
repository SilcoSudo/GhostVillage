import dotenv from "dotenv";
import mongoose from "mongoose";
import { config } from "./src/config/env.js";
import MapConfig from "./src/modules/map/mapConfigModel.js";
import Monster from "./src/modules/monster/monsterModel.js";
import Item from "./src/modules/item/itemModel.js";

dotenv.config();

const MAP_ID = "MAP_01_ONG_KE";

const map1Config = {
  identityConfig: {
    mapId: MAP_ID,
    sceneName: "Map_1",
    displayName: "Van Nam Village ",
    thumbnailUrl: "sprite_map_ongke",
    shortDescription:
      "Obsessed with dark sorcery, That fellow sheds his daytime mask at night and prowls the village alleys, hunting the unlucky souls still wandering after dark.",
    isActive: true,
  },

  consumableConfig: {
    mandatoryItems: [
      { itemId: "ITEM_FLASHLIGHT", minCount: 1, maxCount: 1 },
      { itemId: "ITEM_MEDKIT", minCount: 1, maxCount: 1 },
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
      maxCount: 0,
      pool: [],
    },
  },

  monsterSystemConfig: {
    bossConfig: {
      monsterId: "ONG_KE",
    },
    minionConfig: {
      allowedMonsterIds: ["VONG_NHI"],
    },
  },

  rewardConfig: {
    baseExp: 500,
    baseCoin: 300,
  },
};

const map1Monsters = [
  {
    monsterId: "ONG_KE",
    monsterName: "Ong Ke",
    monsterType: "BOSS",
    prefabName: "OngKeMonster",
    isActive: true,
    movementConfig: {
      moveSpeed: 3.4,
      stoppingDistance: 1.3,
      patrolRadius: 28,
    },
    combatConfig: {
      chaseRange: 30,
      attackRange: 1.8,
      attackCooldown: 1.6,
    },
    detectionConfig: {
      detectionRange: 16,
      detectionAngle: 125,
    },
    // SKILL BEHAVIOR (Code cứng trong runtime script):
    // - NIGHT_HUNT: Tăng speed 1.25x khi active (cooldown 18s, duration 8s)
    // - knockOnHit: Khi hit, player → Knocked state (bò vòng quanh nhưng quái không tấn công)
    //   Cần teammate dùng ITEM_MEDKIT để cứu (không có timeout, chỉ cần cứu)
  },
  {
    monsterId: "VONG_NHI",
    monsterName: "Vong Nhi",
    monsterType: "MINION",
    prefabName: "VongNhiMonster",
    isActive: true,
    movementConfig: {
      moveSpeed: 3.8,
      stoppingDistance: 1.2,
      patrolRadius: 24,
    },
    combatConfig: {
      chaseRange: 18,
      attackRange: 1.4,
      attackCooldown: 1.2,
    },
    detectionConfig: {
      detectionRange: 14,
      detectionAngle: 120,
    },
    // SKILL BEHAVIOR (Code cứng trong runtime script):
    // - ALERT_CALL: Báo động cho ONG_KE khi phát hiện player (cooldown 20s)
  },
];

const map1Items = [
  {
    itemId: "ITEM_FLASHLIGHT",
    itemName: "Flashlight",
    itemType: "EQUIPMENT",
    prefabName: "FlashlightItem",
    isActive: true,
    stats: {
      maxBattery: 100,
      drainRate: 2,
    },
  },
  {
    itemId: "ITEM_POTION",
    itemName: "Stamina Potion",
    itemType: "CONSUMABLE",
    prefabName: "PotionItem",
    isActive: true,
    stats: {
      effectType: "STAMINA",
      recoverAmount: 35,
    },
  },
  {
    itemId: "ITEM_MEDKIT",
    itemName: "Medical Kit",
    itemType: "CONSUMABLE",
    prefabName: "MedkitItem",
    isActive: true,
    stats: {
      effectType: "RESCUE",
      reviveQTETime: 5,
    },
  },
];

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

    for (const monster of map1Monsters) {
      await Monster.updateOne(
        { monsterId: monster.monsterId },
        { $set: monster },
        { upsert: true },
      );
    }
    console.log(`Upserted ${map1Monsters.length} monsters: ONG_KE, VONG_NHI`);

    for (const item of map1Items) {
      await Item.updateOne(
        { itemId: item.itemId },
        { $set: item },
        { upsert: true },
      );
    }
    console.log(`Upserted ${map1Items.length} items: ITEM_FLASHLIGHT, ITEM_POTION, ITEM_MEDKIT`);

    const saved = await MapConfig.findOne({ "identityConfig.mapId": MAP_ID })
      .select("identityConfig consumableConfig equipmentConfig monsterSystemConfig rewardConfig")
      .lean();

    const seededMonsters = await Monster.find({
      monsterId: { $in: map1Monsters.map((m) => m.monsterId) },
    })
      .select("monsterId monsterName monsterType prefabName")
      .lean();

    const seededItems = await Item.find({
      itemId: { $in: map1Items.map((i) => i.itemId) },
    })
      .select("itemId itemName itemType prefabName")
      .lean();

    console.log("Seed result preview:");
    console.log(JSON.stringify(saved, null, 2));
    console.log("Monsters preview:");
    console.log(JSON.stringify(seededMonsters, null, 2));
    console.log("Items preview:");
    console.log(JSON.stringify(seededItems, null, 2));
  } catch (error) {
    console.error("Seed Map1 failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

seedMap1();
