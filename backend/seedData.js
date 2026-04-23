import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/modules/user/userModel.js";
import Player from "./src/modules/player/playerModel.js";
import Quest from "./src/modules/quest/questModel.js";
import Perk from "./src/modules/perk/perkModel.js";
import Item from "./src/modules/item/itemModel.js";
import Monster from "./src/modules/monster/monsterModel.js";
import MoonEvent from "./src/modules/moonEvent/moonEventModel.js";
import MapConfig from "./src/modules/map/mapConfigModel.js";
import Post from "./src/modules/forum/posts/postModel.js";
import Comment from "./src/modules/forum/comments/commentModel.js";
import Friend from "./src/modules/friend/web/friendModel.js";
import Notification from "./src/modules/forum/notifications/notificationModel.js";
import SupportTicket from "./src/modules/forum/supportTickets/supportTicketModel.js";
import Wiki from "./src/modules/forum/wiki/wikiModel.js";
import Announcement from "./src/modules/forum/announcement/announcementModel.js";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "GhostVillage";

const seedData = async () => {
  try {
    await mongoose.connect(`${MONGO_URI}/${DB_NAME}`);
    console.log("🔌 Đã kết nối MongoDB");
    console.log("=========================================");
    console.log("🗑️  Bắt đầu seed toàn bộ dữ liệu...");
    console.log("=========================================");

  // =========================================================
  // PLAYERS
  // =========================================================
  console.log('⏳ Seeding players...');
  await Player.deleteMany({});
  await Player.insertMany([
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5f1"),
      userId: new mongoose.Types.ObjectId("69d3a8033d207add0884f5af"),
      uid: "10000002",
      profile: {
        displayName: "Bé Lan Support",
        avatar: "avatar_default_03",
        level: 2,
        exp: 0,
        coin: 800,
        nextLevelExp: 200
      },
      unlockedPerks: [
        "PERK_RARE_RELIC_BEARER"
      ],
      equippedPerks: [
        "PERK_RARE_RELIC_BEARER"
      ],
      unlockedMedals: [],
      selectedMedals: [],
      achievementsProgress: [
        {
          questId: "QUEST_ACHV_RESCUE_100",
          current: 6,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d4e1f475424cb039a0335b")
        },
        {
          questId: "QUEST_ACHV_PLAY_100",
          current: 26,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d4e1f475424cb039a0335c")
        },
        {
          questId: "QUEST_ACHV_WIN_100",
          current: 2,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d50b08b2f36b2a962bcb5c")
        },
        {
          questId: "FIRST_CLEAR",
          current: 1,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d50b08b2f36b2a962bcb5e")
        },
        {
          questId: "WIN_5_STREAK",
          current: 2,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d50b08b2f36b2a962bcb5f")
        },
        {
          questId: "QUEST_ACHV_KNOCK_100",
          current: 5,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d50d6cb2f36b2a962bccab")
        },
        {
          questId: "QUEST_ACHV_KILL_100",
          current: 0,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d51024085e49ba40e03bdb")
        },
        {
          questId: "KILL_50",
          current: 0,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d51024085e49ba40e03bdc")
        },
        {
          questId: "KILL_500",
          current: 0,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d51024085e49ba40e03bdd")
        },
        {
          questId: "QUEST_ACHV_SCREAM_20",
          current: 1,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d514a7085e49ba40e03d4b")
        }
      ],
      dailyProgress: [
        {
          questId: "QUEST_DAILY_PLAY_2",
          current: 2,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69e4300bf95225a971e6d4e1")
        },
        {
          questId: "QUEST_DAILY_KILL_5",
          current: 0,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69e4300bf95225a971e6d4e2")
        },
        {
          questId: "QUEST_DAILY_WIN_1",
          current: 0,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69e4300bf95225a971e6d4e3")
        }
      ],
      lastDailyReset: new Date("2026-04-19T01:29:47.051Z"),
      createdAt: new Date("2026-04-06T12:33:07.953Z"),
      updatedAt: new Date("2026-04-19T04:33:57.195Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5f2"),
      userId: new mongoose.Types.ObjectId("696da0d5a6e42a937b80aaff"),
      uid: "10000003",
      profile: {
        displayName: "Raccoon",
        avatar: "avatar_default_02",
        level: 10,
        exp: 450,
        coin: 5000
      },
      unlockedPerks: [
        "PERK_COM_INDIGO_POUCH"
      ],
      equippedPerks: [
        "PERK_COM_INDIGO_POUCH"
      ],
      unlockedMedals: [],
      selectedMedals: [
        "FIRST_CLEAR",
        "KILL_500"
      ],
      achievementsProgress: [
        {
          current: 1,
          isClaimed: true,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5f3")
        },
        {
          current: 50,
          isClaimed: true,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5f4")
        },
        {
          current: 10,
          isClaimed: true,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5f5")
        },
        {
          current: 1,
          isClaimed: true,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5f6")
        },
        {
          current: 520,
          isClaimed: true,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5f7")
        },
        {
          current: 3,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5f8")
        },
        {
          current: 45,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5f9")
        },
        {
          current: 12,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5fa")
        }
      ],
      dailyProgress: [],
      lastDailyReset: new Date("2026-04-06T12:33:07.951Z"),
      createdAt: new Date("2026-04-06T12:33:07.954Z"),
      updatedAt: new Date("2026-04-06T12:33:07.954Z")
    },
    {
      _id: new mongoose.Types.ObjectId("659d4b1e9d3e2a1b3c4d5e70"),
      userId: new mongoose.Types.ObjectId("659d4b1e9d3e2a1b3c4d5e6f"),
      uid: "10000001",
      profile: {
        displayName: "Hùng Đẹp Trai",
        avatar: "avatar_default_05",
        level: 26,
        exp: 1654,
        coin: 25756,
        nextLevelExp: 2600
      },
      unlockedPerks: [
        "PERK_EPIC_PROPHETIC_SIGHT",
        "PERK_RARE_RELIC_BEARER",
        "PERK_RARE_AGARWOOD_BEADS",
        "PERK_RARE_ANCESTRAL_VOW",
        "PERK_COM_BRAIDED_BELT",
        "PERK_COM_GLOOM_EYE",
        "PERK_COM_TIRE_SANDALS",
        "PERK_COM_INDIGO_POUCH"
      ],
      equippedPerks: [
        "PERK_COM_TIRE_SANDALS",
        "PERK_RARE_RELIC_BEARER",
        "PERK_EPIC_PROPHETIC_SIGHT"
      ],
      unlockedMedals: [
        "FIRST_CLEAR",
        "KILL_500",
        "WIN_5_STREAK",
        "RESCUE_100"
      ],
      selectedMedals: [
        "KILL_500",
        "WIN_5_STREAK",
        "KILL_50"
      ],
      achievementsProgress: [
        {
          questId: "QUEST_ACHV_RESCUE_100",
          current: 100,
          isClaimed: true,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5e7")
        },
        {
          questId: "QUEST_ACHV_WIN_100",
          current: 38,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5e8")
        },
        {
          questId: "QUEST_ACHV_PLAY_100",
          current: 96,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5e9")
        },
        {
          questId: "QUEST_ACHV_KILL_100",
          current: 35,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5ea")
        },
        {
          questId: "QUEST_ACHV_SCREAM_20",
          current: 9,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5eb")
        },
        {
          questId: "QUEST_ACHV_KNOCK_100",
          current: 35,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5ec")
        },
        {
          questId: "FIRST_CLEAR",
          current: 1,
          isClaimed: true,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5ed")
        },
        {
          questId: "KILL_50",
          current: 50,
          isClaimed: true,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5ee")
        },
        {
          questId: "KILL_500",
          current: 500,
          isClaimed: true,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5ef")
        },
        {
          questId: "WIN_5_STREAK",
          current: 5,
          isClaimed: true,
          _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5f0")
        }
      ],
      dailyProgress: [
        {
          questId: "QUEST_DAILY_PLAY_2",
          current: 2,
          isClaimed: true,
          _id: new mongoose.Types.ObjectId("69e429e6f95225a971e6d49d")
        },
        {
          questId: "QUEST_DAILY_KILL_5",
          current: 0,
          isClaimed: false,
          _id: new mongoose.Types.ObjectId("69e429e6f95225a971e6d49e")
        },
        {
          questId: "QUEST_DAILY_WIN_1",
          current: 1,
          isClaimed: true,
          _id: new mongoose.Types.ObjectId("69e429e6f95225a971e6d49f")
        }
      ],
      lastDailyReset: new Date("2026-04-19T01:03:34.683Z"),
      createdAt: new Date("2026-04-06T12:33:07.954Z"),
      updatedAt: new Date("2026-04-19T04:33:57.109Z")
    }
  ]);
  console.log('✅ players: 3 docs inserted.');

  // =========================================================
  // QUESTS
  // =========================================================
  console.log('⏳ Seeding quests...');
  await Quest.deleteMany({});
  await Quest.insertMany([
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5b0"),
      questId: "QUEST_DAILY_PLAY_2",
      questName: "Hardworking Survivor",
      description: "Complete 2 matches.",
      questType: "DAILY",
      actionType: "PLAY_MATCH",
      targetCount: 2,
      reward: {
        coin: 100,
        exp: 100,
        titleId: null
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.579Z"),
      updatedAt: new Date("2026-04-06T12:33:07.579Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5b2"),
      questId: "QUEST_DAILY_KILL_5",
      questName: "Monster Hunter",
      description: "Kill 5 small monsters.",
      questType: "DAILY",
      actionType: "KILL_SMALL_MONSTER",
      targetCount: 5,
      reward: {
        coin: 100,
        exp: 100,
        titleId: null
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.580Z"),
      updatedAt: new Date("2026-04-06T12:33:07.580Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5b3"),
      questId: "QUEST_DAILY_RESCUE_3",
      questName: "Combat Medic",
      description: "Rescue a knocked-down teammate 3 times.",
      questType: "DAILY",
      actionType: "RESCUE_TEAMMATE",
      targetCount: 3,
      reward: {
        coin: 300,
        exp: 50,
        titleId: null
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.580Z"),
      updatedAt: new Date("2026-04-06T12:33:07.580Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5b4"),
      questId: "QUEST_ACHV_RESCUE_100",
      questName: "Guardian Angel",
      description: "Rescue knocked-down teammates 100 times in total.",
      questType: "ACHIEVEMENT",
      actionType: "RESCUE_TEAMMATE",
      targetCount: 100,
      reward: {
        coin: 100,
        exp: 100,
        titleId: "RESCUE_100"
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.580Z"),
      updatedAt: new Date("2026-04-06T12:33:07.580Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5b5"),
      questId: "QUEST_ACHV_WIN_100",
      questName: "Escape Artist",
      description: "Successfully escape the map 100 times.",
      questType: "ACHIEVEMENT",
      actionType: "WIN_MATCH",
      targetCount: 100,
      reward: {
        coin: 100,
        exp: 100,
        titleId: "WIN_100"
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.580Z"),
      updatedAt: new Date("2026-04-06T12:33:07.580Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5b1"),
      questId: "QUEST_DAILY_WIN_1",
      questName: "Taste of Victory",
      description: "Survive and escape the village 1 time.",
      questType: "DAILY",
      actionType: "WIN_MATCH",
      targetCount: 1,
      reward: {
        coin: 100,
        exp: 100,
        titleId: null
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.580Z"),
      updatedAt: new Date("2026-04-06T12:33:07.580Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5b8"),
      questId: "QUEST_ACHV_KILL_100",
      questName: "Exterminator",
      description: "Eliminate a total of 100 small monsters.",
      questType: "ACHIEVEMENT",
      actionType: "KILL_SMALL_MONSTER",
      targetCount: 100,
      reward: {
        coin: 100,
        exp: 100,
        titleId: "KILL_100"
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.580Z"),
      updatedAt: new Date("2026-04-06T12:33:07.580Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5b9"),
      questId: "QUEST_ACHV_SCREAM_20",
      questName: "Human Siren",
      description: "Scream into the microphone 20 times during matches.",
      questType: "ACHIEVEMENT",
      actionType: "SCREAM",
      targetCount: 20,
      reward: {
        coin: 100,
        exp: 100,
        titleId: "SCREAM_20"
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.580Z"),
      updatedAt: new Date("2026-04-06T12:33:07.580Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5ba"),
      questId: "QUEST_ACHV_KNOCK_100",
      questName: "Punching Bag",
      description: "Get knocked down by monsters 100 times. Are you okay? Lmaooo",
      questType: "ACHIEVEMENT",
      actionType: "GET_KNOCKED",
      targetCount: 100,
      reward: {
        coin: 100,
        exp: 100,
        titleId: "KNOCK_100"
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.580Z"),
      updatedAt: new Date("2026-04-06T12:33:07.580Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5bb"),
      questId: "FIRST_CLEAR",
      questName: "First Clear",
      description: "Complete a stage for the first time.",
      questType: "ACHIEVEMENT",
      actionType: "WIN_MATCH",
      targetCount: 1,
      reward: {
        coin: 100,
        exp: 0,
        titleId: "FIRST_CLEAR"
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.580Z"),
      updatedAt: new Date("2026-04-06T12:33:07.580Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5bc"),
      questId: "KILL_50",
      questName: "Slayer I",
      description: "Defeat 50 minions.",
      questType: "ACHIEVEMENT",
      actionType: "KILL_SMALL_MONSTER",
      targetCount: 50,
      reward: {
        coin: 200,
        exp: 0,
        titleId: "KILL_50"
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.580Z"),
      updatedAt: new Date("2026-04-06T12:33:07.580Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5bd"),
      questId: "KILL_500",
      questName: "Slayer II",
      description: "Defeat 500 minions to prove your dominance.",
      questType: "ACHIEVEMENT",
      actionType: "KILL_SMALL_MONSTER",
      targetCount: 500,
      reward: {
        coin: 500,
        exp: 0,
        titleId: "KILL_500"
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.580Z"),
      updatedAt: new Date("2026-04-06T12:33:07.580Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5be"),
      questId: "WIN_5_STREAK",
      questName: "Unstoppable",
      description: "Win 5 matches in a row without losing.",
      questType: "ACHIEVEMENT",
      actionType: "WIN_MATCH",
      targetCount: 5,
      reward: {
        coin: 300,
        exp: 0,
        titleId: "WIN_5_STREAK"
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.580Z"),
      updatedAt: new Date("2026-04-06T12:33:07.580Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5b6"),
      questId: "QUEST_ACHV_PLAY_100",
      questName: "Veteran Survivor",
      description: "Play a total of 100 matches.",
      questType: "ACHIEVEMENT",
      actionType: "PLAY_MATCH",
      targetCount: 100,
      reward: {
        coin: 100,
        exp: 100,
        titleId: "PLAY_100"
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.580Z"),
      updatedAt: new Date("2026-04-06T12:33:07.580Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5b7"),
      questId: "QUEST_ACHV_SIREN_20",
      questName: "Attention Seeker",
      description: "Use the siren item 20 times to alert the monster.",
      questType: "ACHIEVEMENT",
      actionType: "USE_SIREN",
      targetCount: 20,
      reward: {
        coin: 100,
        exp: 100,
        titleId: "SIREN_20"
      },
      isActive: true,
      createdAt: new Date("2026-04-06T12:33:07.580Z"),
      updatedAt: new Date("2026-04-06T12:33:07.580Z")
    }
  ]);
  console.log('✅ quests: 15 docs inserted.');

  // =========================================================
  // PERKS
  // =========================================================
  console.log('⏳ Seeding perks...');
  await Perk.deleteMany({});
  await Perk.insertMany([
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5cf"),
      perkId: "PERK_EPIC_PROPHETIC_SIGHT",
      perkName: "Prophetic Sight",
      description: "Whenever a teammate completes a puzzle, reveal the Boss and all allies' outlines through walls for 7 seconds.",
      isActive: true,
      price: 2000,
      rarity: "EPIC",
      prefabId: "PERK_EPIC_PROPHETIC_SIGHT",
      modifiers: {
        revealDuration: 7,
        revealOutline: true
      },
      createdAt: new Date("2026-04-06T12:33:07.605Z"),
      updatedAt: new Date("2026-04-06T12:33:07.605Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5d0"),
      perkId: "PERK_RARE_RELIC_BEARER",
      perkName: "Relic Bearer",
      description: "Rescue speed increased by 15%. After a successful rescue, both you and the rescued ally gain 15% Move Speed for 5 seconds.",
      isActive: true,
      price: 800,
      rarity: "RARE",
      prefabId: "PERK_RARE_RELIC_BEARER",
      modifiers: {
        reviveSpeedMult: 1.15,
        postReviveSpeedBoost: 0.15,
        boostDuration: 5
      },
      createdAt: new Date("2026-04-06T12:33:07.605Z"),
      updatedAt: new Date("2026-04-06T12:33:07.605Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5d1"),
      perkId: "PERK_RARE_AGARWOOD_BEADS",
      perkName: "Agarwood Beads",
      description: "The Boss's detection range against you is reduced by 15%.",
      isActive: true,
      price: 800,
      rarity: "RARE",
      prefabId: "PERK_RARE_AGARWOOD_BEADS",
      modifiers: {
        bossDetectionRangeMult: 0.85
      },
      createdAt: new Date("2026-04-06T12:33:07.605Z"),
      updatedAt: new Date("2026-04-06T12:33:07.605Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5d2"),
      perkId: "PERK_RARE_ANCESTRAL_VOW",
      perkName: "Ancestral Vow",
      description: "Gain permanent buffs for each teammate eliminated (stacks up to 3 times): +5% Move Speed and -10% Stamina consumption.",
      isActive: true,
      price: 1000,
      rarity: "RARE",
      prefabId: "PERK_RARE_ANCESTRAL_VOW",
      modifiers: {
        speedBoostPerDeath: 0.05,
        staminaSavePerDeath: 0.1,
        maxStacks: 3
      },
      createdAt: new Date("2026-04-06T12:33:07.605Z"),
      updatedAt: new Date("2026-04-06T12:33:07.605Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5d3"),
      perkId: "PERK_COM_BRAIDED_BELT",
      perkName: "Braided Grass Belt",
      description: "Increases Max Stamina by 15% and increases Stamina regeneration speed by 10%.",
      isActive: true,
      price: 200,
      rarity: "COMMON",
      prefabId: "PERK_COM_BRAIDED_BELT",
      modifiers: {
        maxStaminaMult: 1.15,
        staminaRegenMult: 1.1
      },
      createdAt: new Date("2026-04-06T12:33:07.605Z"),
      updatedAt: new Date("2026-04-06T12:33:07.605Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5d4"),
      perkId: "PERK_COM_GLOOM_EYE",
      perkName: "Gloom Eye",
      description: "Reduces Flashlight battery consumption rate by 15%.",
      isActive: true,
      price: 150,
      rarity: "COMMON",
      prefabId: "PERK_COM_GLOOM_EYE",
      modifiers: {
        batteryDrainMult: 0.85
      },
      createdAt: new Date("2026-04-06T12:33:07.605Z"),
      updatedAt: new Date("2026-04-06T12:33:07.605Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5d5"),
      perkId: "PERK_COM_TIRE_SANDALS",
      perkName: "Tire Tread Sandals",
      description: "Reduces Stamina consumption while sprinting by 15%.",
      isActive: true,
      price: 250,
      rarity: "COMMON",
      prefabId: "PERK_COM_TIRE_SANDALS",
      modifiers: {
        sprintStaminaDrainMult: 0.85
      },
      createdAt: new Date("2026-04-06T12:33:07.605Z"),
      updatedAt: new Date("2026-04-06T12:33:07.605Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f5d6"),
      perkId: "PERK_COM_INDIGO_POUCH",
      perkName: "Indigo Cloth Pouch",
      description: "Has a 10% chance to not consume Med-kits or Batteries upon use.",
      isActive: true,
      price: 300,
      rarity: "COMMON",
      prefabId: "PERK_COM_INDIGO_POUCH",
      modifiers: {
        preserveItemChance: 0.1
      },
      createdAt: new Date("2026-04-06T12:33:07.605Z"),
      updatedAt: new Date("2026-04-06T12:33:07.605Z")
    }
  ]);
  console.log('✅ perks: 8 docs inserted.');

  // =========================================================
  // ITEMS
  // =========================================================
  console.log('⏳ Seeding items...');
  await Item.deleteMany({});
  await Item.insertMany([
    {
      _id: new mongoose.Types.ObjectId("69d17659a8f8cb2bb89305d3"),
      itemId: "ITEM_FLASHLIGHT",
      itemName: "Flashlight",
      itemType: "EQUIPMENT",
      prefabName: "FlashlightItem",
      isActive: true,
      stats: {
        maxBattery: 100,
        drainRate: 2
      },
      updatedAt: new Date("2026-04-04T21:18:33.900Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d17660a8f8cb2bb89305d5"),
      itemId: "ITEM_BATTERY",
      itemName: "Pin Dự Phòng",
      itemType: "CONSUMABLE",
      prefabName: "Prefab_Item_Battery",
      isActive: true,
      stats: {
        rechargeAmount: 50
      }
    },
    {
      _id: new mongoose.Types.ObjectId("69e2085d6f83b157c33217a4"),
      itemId: "ITEM_MEDKIT",
      itemName: "Medical Kit",
      itemType: "CONSUMABLE",
      prefabName: "MedkitItem",
      isActive: true,
      stats: {
        healAmount: 10
      }
    },
    {
      _id: new mongoose.Types.ObjectId("69e208646f83b157c33217a6"),
      itemId: "ITEM_WHISTLE",
      itemName: "Monster Caller",
      itemType: "CONSUMABLE",
      prefabName: "WhistleItem",
      isActive: true,
      stats: {}
    }
  ]);
  console.log('✅ items: 4 docs inserted.');

  // =========================================================
  // MONSTERS
  // =========================================================
  console.log('⏳ Seeding monsters...');
  await Monster.deleteMany({});
  await Monster.insertMany([
    {
      _id: new mongoose.Types.ObjectId("69d18029f0299a1499ba998e"),
      monsterId: "ONG_KE",
      combatConfig: {
        chaseRange: 30,
        attackRange: 1.8,
        attackCooldown: 1.6
      },
      createdAt: new Date("2026-04-04T21:18:33.870Z"),
      detectionConfig: {
        detectionRange: 16,
        detectionAngle: 125
      },
      isActive: true,
      monsterName: "Ong Ke",
      monsterType: "BOSS",
      movementConfig: {
        moveSpeed: 3.4,
        stoppingDistance: 1.3,
        patrolRadius: 28
      },
      prefabName: "OngKeMonster",
      specialSkillConfig: {},
      updatedAt: new Date("2026-04-04T21:18:33.870Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d18029f0299a1499ba998f"),
      monsterId: "VONG_NHI",
      combatConfig: {
        chaseRange: 18,
        attackRange: 1.4,
        attackCooldown: 1.2
      },
      createdAt: new Date("2026-04-04T21:18:33.897Z"),
      detectionConfig: {
        detectionRange: 14,
        detectionAngle: 120
      },
      isActive: true,
      monsterName: "Vong Nhi",
      monsterType: "MINION",
      movementConfig: {
        moveSpeed: 3.8,
        stoppingDistance: 1.2,
        patrolRadius: 24
      },
      prefabName: "VongNhiMonster",
      specialSkillConfig: {},
      updatedAt: new Date("2026-04-04T21:18:33.897Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d8d899a6adcd04d9e04cac"),
      monsterId: "BOSS_MADA",
      monsterName: "Ma Da",
      monsterType: "BOSS",
      prefabName: "MaDa_Boss",
      isActive: true,
      movementConfig: {
        moveSpeed: 1.5,
        stoppingDistance: 0,
        patrolRadius: 30
      },
      combatConfig: {
        chaseRange: 25,
        attackRange: 1,
        attackCooldown: 1.5
      },
      detectionConfig: {
        detectionRange: 15,
        detectionAngle: 120
      },
      specialSkillConfig: {}
    },
    {
      _id: new mongoose.Types.ObjectId("69d8d89fa6adcd04d9e04cae"),
      monsterId: "MINION_DROWNED",
      monsterName: "Drowned",
      monsterType: "MINION",
      prefabName: "Drowned_Minion",
      isActive: true,
      movementConfig: {
        moveSpeed: 1,
        stoppingDistance: 0,
        patrolRadius: 20
      },
      combatConfig: {
        chaseRange: 15,
        attackRange: 1,
        attackCooldown: 1
      },
      detectionConfig: {
        detectionRange: 15,
        detectionAngle: 120
      },
      specialSkillConfig: {}
    }
  ]);
  console.log('✅ monsters: 4 docs inserted.');

  // =========================================================
  // MOONEVENTS
  // =========================================================
  console.log('⏳ Seeding moonevents...');
  await MoonEvent.deleteMany({});
  await MoonEvent.insertMany([
    {
      _id: new mongoose.Types.ObjectId("69d4b5da8b1edffe422a6e1d"),
      eventId: "EVENT_MOON_FULL",
      eventName: "Full Moon",
      description: "Tầm nhìn rõ ràng. Ông Kẹ ở trạng thái bình thường.",
      uiIcon: "icon_moon_full",
      isActive: true,
      weight: 60,
      environmentModifiers: {
        globalLightIntensity: 1,
        fogDensity: 1
      },
      monsterBuffMultipliers: {
        speedMultiplier: 1,
        detectionRangeMultiplier: 1,
        chaseRangeMultiplier: 1,
        cooldownMultiplier: 1
      },
      rewardMultipliers: {
        expMultiplier: 1,
        coinMultiplier: 1
      },
      createdAt: new Date("2026-04-07T07:44:26.330Z"),
      updatedAt: new Date("2026-04-07T07:44:26.330Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d4b5da8b1edffe422a6e1e"),
      eventId: "EVENT_MOON_NEW",
      eventName: "New Moon",
      description: "Bóng tối bao trùm. Tầm nhìn hẹp lại nhưng bạn cũng khó bị phát hiện hơn.",
      uiIcon: "icon_moon_new",
      isActive: true,
      weight: 30,
      environmentModifiers: {
        globalLightIntensity: 0.5,
        fogDensity: 2
      },
      monsterBuffMultipliers: {
        speedMultiplier: 1,
        detectionRangeMultiplier: 0.8,
        chaseRangeMultiplier: 1,
        cooldownMultiplier: 1
      },
      rewardMultipliers: {
        expMultiplier: 1.2,
        coinMultiplier: 1.2
      },
      createdAt: new Date("2026-04-07T07:44:26.332Z"),
      updatedAt: new Date("2026-04-07T07:44:26.332Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d4b5da8b1edffe422a6e1f"),
      eventId: "EVENT_MOON_RED",
      eventName: "Blood Moon",
      description: "Bầu trời đỏ rực. Ông Kẹ phát điên, chạy nhanh và ra đòn liên tục.",
      uiIcon: "icon_moon_red",
      isActive: true,
      weight: 10,
      environmentModifiers: {
        globalLightIntensity: 0.8,
        fogDensity: 1.2
      },
      monsterBuffMultipliers: {
        speedMultiplier: 1.3,
        detectionRangeMultiplier: 1.5,
        chaseRangeMultiplier: 1.5,
        cooldownMultiplier: 0.7
      },
      rewardMultipliers: {
        expMultiplier: 2,
        coinMultiplier: 2
      },
      createdAt: new Date("2026-04-07T07:44:26.332Z"),
      updatedAt: new Date("2026-04-07T07:44:26.332Z")
    }
  ]);
  console.log('✅ moonevents: 3 docs inserted.');

  // =========================================================
  // MAPCONFIGS
  // =========================================================
  console.log('⏳ Seeding mapconfigs...');
  await MapConfig.deleteMany({});
  await MapConfig.insertMany([
    {
      _id: new mongoose.Types.ObjectId("69d3a8033d207add0884f602"),
      identityConfig: {
        mapId: "MAP_01_ONG_KE",
        sceneName: "Scene_Game_OngKe",
        displayName: "Làng Cổ - Ông Kẹ",
        thumbnailUrl: "sprite_map_ongke",
        shortDescription: "Ngôi làng chìm trong bóng tối. 'Hư là bị ông kẹ bắt' - Đừng để hắn thấy bạn.",
        isActive: true
      },
      consumableConfig: {
        mandatoryItems: [
          {
            itemId: "ITEM_FLASHLIGHT",
            minCount: 1,
            maxCount: 1
          }
        ],
        randomPoolConfig: {
          minCount: 2,
          maxCount: 3,
          pool: [
            {
              itemId: "ITEM_POTION",
              weight: 100
            }
          ]
        }
      },
      equipmentConfig: {
        mandatoryEquipment: [
          {
            itemId: "ITEM_FLASHLIGHT",
            minCount: 1,
            maxCount: 1
          }
        ],
        randomPoolConfig: {
          minCount: 0,
          maxCount: 1,
          pool: [
            {
              itemId: "ITEM_GHOST_DETECTOR",
              weight: 40
            },
            {
              itemId: "ITEM_COMPASS",
              weight: 60
            }
          ]
        }
      },
      monsterSystemConfig: {
        bossConfig: {
          monsterId: "BOSS_ONG_KE"
        },
        minionConfig: {
          allowedMonsterIds: [
            "MINION_SHADOW_HAND",
            "MINION_CURSED_RAT"
          ]
        }
      },
      rewardConfig: {
        baseExp: 500,
        baseCoin: 300
      },
      createdAt: new Date("2026-04-06T12:33:07.982Z"),
      updatedAt: new Date("2026-04-06T12:33:07.982Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3aa37e1e79b1582337f62"),
      identityConfig: {
        mapId: "MAP_99_TEST",
        sceneName: "Scene_Game_Test",
        displayName: "Bản Đồ Thử Nghiệm",
        thumbnailUrl: "sprite_map_test",
        shortDescription: "Map chuyên dụng để test hệ thống spawn mới sau khi ép cân.",
        isActive: true
      },
      consumableConfig: {
        mandatoryItems: [
          {
            itemId: "ITEM_MEDKIT",
            minCount: 2,
            maxCount: 4
          }
        ],
        randomPoolConfig: {
          minCount: 3,
          maxCount: 6,
          pool: [
            {
              itemId: "ITEM_MEDKIT",
              weight: 40
            }
          ]
        }
      },
      equipmentConfig: {
        mandatoryEquipment: [
          {
            itemId: "ITEM_FLASHLIGHT",
            minCount: 1,
            maxCount: 1
          }
        ],
        randomPoolConfig: {
          minCount: 1,
          maxCount: 2,
          pool: []
        }
      },
      monsterSystemConfig: {
        bossConfig: {},
        minionConfig: {
          allowedMonsterIds: []
        }
      },
      rewardConfig: {
        baseExp: 1000,
        baseCoin: 500
      },
      createdAt: new Date("2026-04-06T12:42:31.186Z"),
      updatedAt: new Date("2026-04-06T12:42:31.186Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69d3aa37e1e79b1582337f63"),
      identityConfig: {
        mapId: "MAP_02_MADA",
        sceneName: "Map2_Mada",
        displayName: "Ma Da Island",
        thumbnailUrl: "sprite_map2_mada",
        shortDescription: "A haunted river island surrounded by dark waters. Survive the puzzles and escape before the drowned entities pull you under.",
        isActive: true
      },
      consumableConfig: {
        mandatoryItems: [
          {
            itemId: "ITEM_MEDKIT",
            minCount: 4,
            maxCount: 5
          },
          {
            itemId: "ITEM_BATTERY",
            minCount: 4,
            maxCount: 6
          }
        ],
        randomPoolConfig: {
          minCount: 4,
          maxCount: 8,
          pool: [
            {
              itemId: "ITEM_MEDKIT",
              weight: 30
            },
            {
              itemId: "ITEM_BATTERY",
              weight: 50
            },
            {
              itemId: "ITEM_WHISTLE",
              weight: 20
            }
          ]
        }
      },
      equipmentConfig: {
        mandatoryEquipment: [
          {
            itemId: "ITEM_FLASHLIGHT",
            minCount: 1,
            maxCount: 1
          }
        ],
        randomPoolConfig: {
          minCount: 0,
          maxCount: 1,
          pool: [
            {
              itemId: "ITEM_FLASHLIGHT",
              weight: 100
            }
          ]
        }
      },
      monsterSystemConfig: {
        bossConfig: {
          monsterId: "BOSS_MADA"
        },
        minionConfig: {
          allowedMonsterIds: [
            "MINION_DROWNED"
          ]
        }
      },
      rewardConfig: {
        baseExp: 1200,
        baseCoin: 600
      }
    }
  ]);
  console.log('✅ mapconfigs: 3 docs inserted.');

  // =========================================================
  // POSTS
  // =========================================================
  console.log('⏳ Seeding posts...');
  await Post.deleteMany({});
  await Post.insertMany([
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea"),
      title: "Launch Week Strategy Notes",
      body: "A compact list of early-game decisions for the forest map.",
      category: "General",
      author: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
      media: [
        {
          url: "https://res.cloudinary.com/dpdizlimp/image/upload/v1772618797/ghostvillage/posts/tbu6a5xma8firoagoo1p.jpg",
          publicId: null,
          type: "image",
          _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35b26")
        }
      ],
      likes: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e7"),
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e8"),
        new mongoose.Types.ObjectId("69e48db9e72d713647b98efa")
      ],
      commentCount: 3,
      isLocked: false,
      isEdited: true,
      isTemporarilyHidden: false,
      reports: [],
      editedAt: new Date("2026-04-14T02:37:09.442Z"),
      createdAt: new Date("2026-04-15T02:37:09.892Z"),
      updatedAt: new Date("2026-04-15T02:37:09.892Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ed"),
      title: "Need two players for castle night run",
      body: "Searching for a steady team that can clear the castle without panic.",
      category: "Team Up",
      author: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1"),
      media: [],
      likes: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e7")
      ],
      commentCount: 1,
      isLocked: false,
      isEdited: false,
      isTemporarilyHidden: false,
      reports: [],
      editedAt: null,
      createdAt: new Date("2026-04-15T02:37:09.893Z"),
      updatedAt: new Date("2026-04-15T02:37:09.893Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e583579c44eeb58c8447a4"),
      title: "I need a friend to play with me",
      body: "<p>I need a friend to play with me</p>",
      category: "Team Up",
      author: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      media: [],
      likes: [
        new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c")
      ],
      commentCount: 1,
      isLocked: false,
      isEdited: false,
      isTemporarilyHidden: false,
      editedAt: null,
      reports: [],
      createdAt: new Date("2026-04-20T01:37:27.725Z"),
      updatedAt: new Date("2026-04-20T01:37:27.725Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
      title: "We win OMG",
      body: "<p>We just win a difficult match</p>",
      category: "General",
      author: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      media: [
        {
          url: "https://res.cloudinary.com/dpdizlimp/image/upload/v1776665528/ghostvillage/posts/nsyawdkfbwdzorbwabrp.jpg",
          publicId: "ghostvillage/posts/nsyawdkfbwdzorbwabrp",
          type: "image",
          _id: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d67")
        }
      ],
      likes: [
        new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
        new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84")
      ],
      commentCount: 9,
      isLocked: false,
      isEdited: false,
      isTemporarilyHidden: false,
      editedAt: null,
      reports: [],
      createdAt: new Date("2026-04-20T06:12:09.093Z"),
      updatedAt: new Date("2026-04-20T06:12:09.094Z")
    }
  ]);
  console.log('✅ posts: 4 docs inserted.');

  // =========================================================
  // COMMENTS
  // =========================================================
  console.log('⏳ Seeding comments...');
  await Comment.deleteMany({});
  await Comment.insertMany([
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359f0"),
      post: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea"),
      author: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
      content: "Agreed. Battery management matters more than raw speed.",
      parentId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ef"),
      likes: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1")
      ],
      isHiddenByModeration: false,
      reports: [],
      createdAt: new Date("2026-04-15T02:37:09.899Z"),
      updatedAt: new Date("2026-04-15T02:37:09.899Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ef"),
      post: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea"),
      author: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1"),
      content: "The flashlight route works best when the group stays close.",
      parentId: null,
      likes: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0")
      ],
      isHiddenByModeration: false,
      reports: [],
      createdAt: new Date("2026-04-15T02:37:09.899Z"),
      updatedAt: new Date("2026-04-15T02:37:09.899Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359f2"),
      post: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ec"),
      author: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e2"),
      content: "I can offer a bundle of batteries or a map guide review.",
      parentId: null,
      likes: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e3")
      ],
      isHiddenByModeration: false,
      reports: [],
      createdAt: new Date("2026-04-15T02:37:09.899Z"),
      updatedAt: new Date("2026-04-15T02:37:09.899Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359f1"),
      post: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359eb"),
      author: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e3"),
      content: "Relic Bearer plus Spectral Reflex is a strong escape pair.",
      parentId: null,
      likes: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e2"),
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1")
      ],
      isHiddenByModeration: false,
      reports: [],
      createdAt: new Date("2026-04-15T02:37:09.899Z"),
      updatedAt: new Date("2026-04-15T02:37:09.899Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359f3"),
      post: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ec"),
      author: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1"),
      content: "Send me a message if you want to swap after the next update.",
      parentId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359f2"),
      likes: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0")
      ],
      isHiddenByModeration: false,
      reports: [],
      createdAt: new Date("2026-04-15T02:37:09.899Z"),
      updatedAt: new Date("2026-04-15T02:37:09.899Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e4b3f6f94403ce904db473"),
      post: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea"),
      author: new mongoose.Types.ObjectId("69e48db9e72d713647b98efa"),
      content: "sửa thử",
      parentId: null,
      likes: [],
      isHiddenByModeration: false,
      reports: [],
      createdAt: new Date("2026-04-19T10:52:38.075Z"),
      updatedAt: new Date("2026-04-19T10:59:22.417Z"),
      editedAt: new Date("2026-04-19T10:59:22.415Z"),
      isEdited: true
    },
    {
      _id: new mongoose.Types.ObjectId("69e5968d7dcb27e607293cb4"),
      post: new mongoose.Types.ObjectId("69e583579c44eeb58c8447a4"),
      author: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      content: "Let me play with you!!!",
      parentId: null,
      likes: [],
      isHiddenByModeration: false,
      isEdited: false,
      editedAt: null,
      reports: [],
      createdAt: new Date("2026-04-20T02:59:25.249Z"),
      updatedAt: new Date("2026-04-20T02:59:25.249Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5c82f7dcb27e607294154"),
      post: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
      author: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      content: "Imagine being such a pathetic loser that you have to post about a lucky win. Nobody gives a fuck about your trash gameplay. Delete this shit and go touch some grass, you absolute retard.",
      parentId: null,
      likes: [],
      isHiddenByModeration: true,
      isEdited: false,
      editedAt: null,
      reports: [
        {
          reporter: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
          reason: "ABUSE",
          aiModeration: {
            isValidReport: true,
            label: "abuse",
            confidence: 0.95,
            reason: "The post contains multiple toxic insults, aggressive language, and a derogatory slur directed at another user.",
            evidence: [
              "pathetic loser",
              "Nobody gives a fuck about your trash gameplay",
              "Delete this shit and go touch some grass, you absolute retard"
            ],
            recommendedAction: "remove"
          },
          createdAt: new Date("2026-04-20T07:34:57.471Z"),
          _id: new mongoose.Types.ObjectId("69e5d72195f894707235b65f")
        }
      ],
      createdAt: new Date("2026-04-20T06:31:11.127Z"),
      updatedAt: new Date("2026-04-20T07:34:57.482Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5f9f595f894707235b98b"),
      post: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
      author: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      content: "fvck you, bicth",
      parentId: null,
      likes: [],
      isHiddenByModeration: true,
      isEdited: false,
      editedAt: null,
      reports: [
        {
          reporter: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
          reason: "ABUSE",
          aiModeration: {
            isValidReport: true,
            label: "abuse",
            confidence: 1,
            reason: "The user is using hate speech and toxic insults.",
            evidence: [
              "fvck you, bicth"
            ],
            recommendedAction: "remove"
          },
          createdAt: new Date("2026-04-20T10:04:03.490Z"),
          _id: new mongoose.Types.ObjectId("69e5fa1395f894707235b9bb")
        }
      ],
      createdAt: new Date("2026-04-20T10:03:33.469Z"),
      updatedAt: new Date("2026-04-20T10:04:03.498Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e60aac95f894707235babe"),
      post: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
      author: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      content: "FVCK YOU",
      parentId: null,
      likes: [],
      isHiddenByModeration: true,
      isEdited: false,
      editedAt: null,
      reports: [
        {
          reporter: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
          reason: "ABUSE",
          aiModeration: {
            isValidReport: true,
            label: "abuse",
            confidence: 1,
            reason: "The user used a profanity directed at another user.",
            evidence: [
              "FVCK YOU"
            ],
            recommendedAction: "remove"
          },
          createdAt: new Date("2026-04-20T11:15:19.884Z"),
          _id: new mongoose.Types.ObjectId("69e60ac795f894707235baf6")
        }
      ],
      createdAt: new Date("2026-04-20T11:14:52.450Z"),
      updatedAt: new Date("2026-04-20T11:15:19.892Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e614f595f894707235bcd4"),
      post: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
      author: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      content: "We play so funny!!!",
      parentId: null,
      likes: [],
      isHiddenByModeration: false,
      isEdited: false,
      editedAt: null,
      reports: [],
      createdAt: new Date("2026-04-20T11:58:45.417Z"),
      updatedAt: new Date("2026-04-20T11:58:45.417Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e6152895f894707235bcf1"),
      post: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
      author: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      content: "I wish I can escape faster",
      parentId: null,
      likes: [],
      isHiddenByModeration: false,
      isEdited: false,
      editedAt: null,
      reports: [],
      createdAt: new Date("2026-04-20T11:59:36.258Z"),
      updatedAt: new Date("2026-04-20T11:59:36.258Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e6164395f894707235bd65"),
      post: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
      author: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      content: "Haha",
      parentId: null,
      likes: [],
      isHiddenByModeration: false,
      isEdited: false,
      editedAt: null,
      reports: [],
      createdAt: new Date("2026-04-20T12:04:19.730Z"),
      updatedAt: new Date("2026-04-20T12:04:19.730Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e6169395f894707235bd82"),
      post: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
      author: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      content: "YES",
      parentId: new mongoose.Types.ObjectId("69e614f595f894707235bcd4"),
      likes: [],
      isHiddenByModeration: false,
      isEdited: true,
      editedAt: new Date("2026-04-20T12:06:34.208Z"),
      reports: [],
      createdAt: new Date("2026-04-20T12:05:39.757Z"),
      updatedAt: new Date("2026-04-20T12:06:34.208Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e61db47eafd03ed80a765f"),
      post: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
      author: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      content: "Yeah",
      parentId: null,
      likes: [],
      isHiddenByModeration: false,
      isEdited: false,
      editedAt: null,
      reports: [],
      createdAt: new Date("2026-04-20T12:36:04.837Z"),
      updatedAt: new Date("2026-04-20T12:36:04.837Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e61e097eafd03ed80a7680"),
      post: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
      author: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      content: "I wish too",
      parentId: new mongoose.Types.ObjectId("69e6152895f894707235bcf1"),
      likes: [],
      isHiddenByModeration: false,
      isEdited: true,
      editedAt: new Date("2026-04-20T12:38:18.259Z"),
      reports: [],
      createdAt: new Date("2026-04-20T12:37:29.305Z"),
      updatedAt: new Date("2026-04-20T12:38:18.259Z")
    }
  ]);
  console.log('✅ comments: 16 docs inserted.');

  // =========================================================
  // FRIENDS
  // =========================================================
  console.log('⏳ Seeding friends...');
  await Friend.deleteMany({});
  await Friend.insertMany([
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359fe"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
      friendId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e2"),
      status: "accepted",
      requestedAt: new Date("2026-04-08T02:37:09.442Z"),
      acceptedAt: new Date("2026-04-09T02:37:09.442Z"),
      createdAt: new Date("2026-04-15T02:37:09.910Z"),
      updatedAt: new Date("2026-04-15T02:37:09.910Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ff"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
      friendId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e3"),
      status: "accepted",
      requestedAt: new Date("2026-04-07T02:37:09.442Z"),
      acceptedAt: new Date("2026-04-08T02:37:09.442Z"),
      createdAt: new Date("2026-04-15T02:37:09.910Z"),
      updatedAt: new Date("2026-04-15T02:37:09.910Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35a00"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1"),
      friendId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e4"),
      status: "accepted",
      requestedAt: new Date("2026-04-10T02:37:09.442Z"),
      acceptedAt: new Date("2026-04-11T02:37:09.442Z"),
      createdAt: new Date("2026-04-15T02:37:09.910Z"),
      updatedAt: new Date("2026-04-15T02:37:09.910Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35a01"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1"),
      friendId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e2"),
      status: "pending",
      requestedAt: new Date("2026-04-14T02:37:09.442Z"),
      acceptedAt: null,
      createdAt: new Date("2026-04-15T02:37:09.910Z"),
      updatedAt: new Date("2026-04-15T02:37:09.910Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e70da1bac6dff6514f221f"),
      userId: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      friendId: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      status: "accepted",
      acceptedAt: new Date("2026-04-21T05:41:12.602Z"),
      requestedAt: new Date("2026-04-21T05:39:45.610Z"),
      createdAt: new Date("2026-04-21T05:39:45.610Z"),
      updatedAt: new Date("2026-04-21T05:41:12.604Z")
    }
  ]);
  console.log('✅ friends: 5 docs inserted.');

  // =========================================================
  // NOTIFICATIONS
  // =========================================================
  console.log('⏳ Seeding notifications...');
  await Notification.deleteMany({});
  await Notification.insertMany([
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35b6b"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1"),
      type: "friend_accepted",
      title: "Friend request accepted",
      message: "Leo accepted your friend request.",
      relatedUser: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e4"),
      relatedEntity: {
        entityType: "friend",
        entityId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35a00"),
        link: "/friends/69def9d56b6ceed8e1c35a00"
      },
      isRead: true,
      readAt: new Date("2026-04-11T02:37:09.442Z"),
      createdAt: new Date("2026-04-15T02:37:09.918Z"),
      updatedAt: new Date("2026-04-15T02:37:09.918Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35b6c"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e3"),
      type: "post_liked",
      title: "Your post was liked",
      message: "Avery liked your trading post.",
      relatedUser: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
      relatedEntity: {
        entityType: "post",
        entityId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ec"),
        link: "/posts/69def9d56b6ceed8e1c359ec"
      },
      isRead: false,
      readAt: null,
      createdAt: new Date("2026-04-15T02:37:09.918Z"),
      updatedAt: new Date("2026-04-15T02:37:09.918Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35b6d"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
      type: "post_commented",
      title: "New comment on your post",
      message: "Noah replied on your discussion post.",
      relatedUser: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e2"),
      relatedEntity: {
        entityType: "post",
        entityId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359eb"),
        link: "/posts/69def9d56b6ceed8e1c359eb"
      },
      isRead: true,
      readAt: new Date("2026-04-13T02:37:09.442Z"),
      createdAt: new Date("2026-04-15T02:37:09.918Z"),
      updatedAt: new Date("2026-04-15T02:37:09.918Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35b6e"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e2"),
      type: "comment_replied",
      title: "Reply received",
      message: "Mara replied to your trading comment.",
      relatedUser: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1"),
      relatedEntity: {
        entityType: "comment",
        entityId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359f3"),
        link: "/comments/69def9d56b6ceed8e1c359f3"
      },
      isRead: false,
      readAt: null,
      createdAt: new Date("2026-04-15T02:37:09.918Z"),
      updatedAt: new Date("2026-04-15T02:37:09.918Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35b6f"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1"),
      type: "report_processed",
      title: "Report processed",
      message: "The cave camera report was reviewed by the moderation team.",
      relatedUser: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
      relatedEntity: {
        entityType: "post",
        entityId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ee"),
        link: "/posts/69def9d56b6ceed8e1c359ee"
      },
      isRead: true,
      readAt: new Date("2026-04-14T02:37:09.442Z"),
      createdAt: new Date("2026-04-15T02:37:09.918Z"),
      updatedAt: new Date("2026-04-15T02:37:09.918Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35b70"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e4"),
      type: "ticket_replied",
      title: "Ticket updated",
      message: "Your support ticket received a new admin reply.",
      relatedUser: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
      relatedEntity: {
        entityType: "ticket",
        entityId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359fc"),
        link: "/tickets/69def9d56b6ceed8e1c359fc"
      },
      isRead: false,
      readAt: null,
      createdAt: new Date("2026-04-15T02:37:09.918Z"),
      updatedAt: new Date("2026-04-15T02:37:09.918Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35b71"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
      type: "announcement",
      title: "New announcement",
      message: "Patch 1.2.3 notes are now live for everyone.",
      relatedUser: null,
      relatedEntity: {
        link: "/announcements/69def9d56b6ceed8e1c359f9",
        entityType: null,
        entityId: null
      },
      isRead: true,
      readAt: new Date("2026-04-14T02:37:09.442Z"),
      createdAt: new Date("2026-04-15T02:37:09.918Z"),
      updatedAt: new Date("2026-04-15T02:37:09.918Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e4b3f6f94403ce904db47a"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
      type: "post_commented",
      title: "Bình luận bài viết",
      message: "Nhật Dương đã bình luận bài viết của bạn",
      relatedUser: new mongoose.Types.ObjectId("69e48db9e72d713647b98efa"),
      relatedEntity: {
        entityType: "post",
        entityId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea"),
        link: "/post/69def9d56b6ceed8e1c359ea"
      },
      isRead: false,
      readAt: null,
      createdAt: new Date("2026-04-19T10:52:38.093Z"),
      updatedAt: new Date("2026-04-19T10:52:38.093Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e4b887693384c4ba867899"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
      type: "post_liked",
      title: "Thích bài viết",
      message: "Nhật Dương đã thích bài viết của bạn",
      relatedUser: new mongoose.Types.ObjectId("69e48db9e72d713647b98efa"),
      relatedEntity: {
        entityType: "post",
        entityId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea"),
        link: "/post/69def9d56b6ceed8e1c359ea"
      },
      isRead: false,
      readAt: null,
      createdAt: new Date("2026-04-19T11:12:07.216Z"),
      updatedAt: new Date("2026-04-19T11:12:07.216Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5967f7dcb27e607293ca9"),
      userId: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      type: "post_liked",
      title: "Thích bài viết",
      message: "Phi Hùng đã thích bài viết của bạn",
      i18n: {
        titleKey: "notifications.items.postLiked.title",
        messageKey: "notifications.items.postLiked.message",
        messageParams: {
          name: "Phi Hùng"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "I need a friend to play with me",
          _id: new mongoose.Types.ObjectId("69e5967f7dcb27e607293caa")
        }
      ],
      relatedUser: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      relatedEntity: {
        entityType: "post",
        entityId: new mongoose.Types.ObjectId("69e583579c44eeb58c8447a4"),
        link: "/post/69e583579c44eeb58c8447a4"
      },
      isRead: true,
      readAt: new Date("2026-04-20T03:01:22.348Z"),
      createdAt: new Date("2026-04-20T02:59:11.038Z"),
      updatedAt: new Date("2026-04-20T03:01:22.349Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5968d7dcb27e607293cbb"),
      userId: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      type: "post_commented",
      title: "Bình luận bài viết",
      message: "Phi Hùng đã bình luận bài viết của bạn",
      i18n: {
        titleKey: "notifications.items.postCommented.title",
        messageKey: "notifications.items.postCommented.message",
        messageParams: {
          name: "Phi Hùng"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "I need a friend to play with me",
          _id: new mongoose.Types.ObjectId("69e5968d7dcb27e607293cbc")
        }
      ],
      relatedUser: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      relatedEntity: {
        entityType: "post",
        entityId: new mongoose.Types.ObjectId("69e583579c44eeb58c8447a4"),
        link: "/post/69e583579c44eeb58c8447a4"
      },
      isRead: true,
      readAt: new Date("2026-04-20T03:01:18.829Z"),
      createdAt: new Date("2026-04-20T02:59:25.273Z"),
      updatedAt: new Date("2026-04-20T03:01:18.830Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e596fa7dcb27e607293cf3"),
      userId: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      type: "friend_accepted",
      title: "Chấp nhận lời mời kết bạn",
      message: "Nhat Duong đã chấp nhận lời mời kết bạn",
      i18n: {
        titleKey: "notifications.items.friendAccepted.title",
        messageKey: "notifications.items.friendAccepted.message",
        messageParams: {
          name: "Nhat Duong"
        }
      },
      relatedUser: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      relatedEntity: {
        entityType: "friend",
        entityId: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
        link: "/profile/69e582709c44eeb58c844258"
      },
      isRead: true,
      readAt: new Date("2026-04-20T03:03:20.457Z"),
      context: [],
      createdAt: new Date("2026-04-20T03:01:14.489Z"),
      updatedAt: new Date("2026-04-20T03:03:20.457Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5c82f7dcb27e60729415c"),
      userId: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      type: "post_commented",
      title: "Bình luận bài viết",
      message: "Little girl đã bình luận bài viết của bạn",
      i18n: {
        titleKey: "notifications.items.postCommented.title",
        messageKey: "notifications.items.postCommented.message",
        messageParams: {
          name: "Little girl"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "We win OMG",
          _id: new mongoose.Types.ObjectId("69e5c82f7dcb27e60729415d")
        }
      ],
      relatedUser: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      relatedEntity: {
        entityType: "post",
        entityId: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
        link: "/post/69e5c3b97dcb27e607293d66"
      },
      isRead: true,
      readAt: new Date("2026-04-20T07:34:37.723Z"),
      createdAt: new Date("2026-04-20T06:31:11.134Z"),
      updatedAt: new Date("2026-04-20T07:34:37.727Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5d72195f894707235b665"),
      userId: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      type: "report_processed",
      title: "Report Update",
      message: "Thanks for your report. We reviewed the content and removed it under community guidelines.",
      i18n: {
        titleKey: "notifications.items.reportProcessed.reporter.title",
        messageKey: "notifications.items.reportProcessed.reporter.remove.message",
        messageParams: {
          entityType: "comment"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "We win OMG",
          _id: new mongoose.Types.ObjectId("69e5d72195f894707235b666")
        },
        {
          labelKey: "notifications.contexts.comment",
          value: "Imagine being such a pathetic loser that you have to post about a lucky win. Nobody gives a fuck about your trash gamep…",
          _id: new mongoose.Types.ObjectId("69e5d72195f894707235b667")
        }
      ],
      relatedUser: null,
      relatedEntity: {
        entityType: "comment",
        entityId: new mongoose.Types.ObjectId("69e5c82f7dcb27e607294154"),
        link: "/post/69e5c3b97dcb27e607293d66#comment-69e5c82f7dcb27e607294154"
      },
      isRead: true,
      readAt: new Date("2026-04-20T07:35:11.904Z"),
      createdAt: new Date("2026-04-20T07:34:57.504Z"),
      updatedAt: new Date("2026-04-20T07:35:11.905Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5d72195f894707235b669"),
      userId: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      type: "report_processed",
      title: "Moderation Notice",
      message: "Your comment was reviewed under community guidelines. Some of your content visibility has been limited to protect the community.",
      i18n: {
        titleKey: "notifications.items.reportProcessed.moderationNotice.title",
        messageKey: "notifications.items.reportProcessed.moderationNotice.mergedHideOnly",
        messageParams: {
          entityType: "comment"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "We win OMG",
          _id: new mongoose.Types.ObjectId("69e5d72195f894707235b66a")
        },
        {
          labelKey: "notifications.contexts.comment",
          value: "Imagine being such a pathetic loser that you have to post about a lucky win. Nobody gives a fuck about your trash gamep…",
          _id: new mongoose.Types.ObjectId("69e5d72195f894707235b66b")
        }
      ],
      relatedUser: null,
      relatedEntity: {
        entityType: "comment",
        entityId: new mongoose.Types.ObjectId("69e5c82f7dcb27e607294154"),
        link: "/post/69e5c3b97dcb27e607293d66#comment-69e5c82f7dcb27e607294154"
      },
      isRead: true,
      readAt: new Date("2026-04-20T07:36:20.195Z"),
      createdAt: new Date("2026-04-20T07:34:57.510Z"),
      updatedAt: new Date("2026-04-20T07:36:20.195Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5f19695f894707235b90a"),
      userId: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      type: "ticket_replied",
      title: "Support Ticket Updated",
      message: "Admin replied to your support ticket: \"Content recovery\".",
      i18n: {
        titleKey: "notifications.items.ticketReplied.title",
        messageKey: "notifications.items.ticketReplied.messageWithSubject",
        messageParams: {
          name: "Admin",
          subject: "Content recovery"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.ticket",
          value: "Content recovery",
          _id: new mongoose.Types.ObjectId("69e5f19695f894707235b90b")
        }
      ],
      relatedUser: new mongoose.Types.ObjectId("69e584bb9c44eeb58c8447ab"),
      relatedEntity: {
        entityType: "ticket",
        entityId: new mongoose.Types.ObjectId("69e5d7cc95f894707235b6a2"),
        link: "/support/ticket"
      },
      isRead: true,
      readAt: new Date("2026-04-20T09:28:23.997Z"),
      createdAt: new Date("2026-04-20T09:27:50.855Z"),
      updatedAt: new Date("2026-04-20T09:28:23.997Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5f9f595f894707235b993"),
      userId: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      type: "post_commented",
      title: "Bình luận bài viết",
      message: "Little girl đã bình luận bài viết của bạn",
      i18n: {
        titleKey: "notifications.items.postCommented.title",
        messageKey: "notifications.items.postCommented.message",
        messageParams: {
          name: "Little girl"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "We win OMG",
          _id: new mongoose.Types.ObjectId("69e5f9f595f894707235b994")
        }
      ],
      relatedUser: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      relatedEntity: {
        entityType: "post",
        entityId: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
        link: "/post/69e5c3b97dcb27e607293d66"
      },
      isRead: true,
      readAt: new Date("2026-04-20T12:00:30.725Z"),
      createdAt: new Date("2026-04-20T10:03:33.504Z"),
      updatedAt: new Date("2026-04-20T12:00:30.735Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5fa1395f894707235b9c1"),
      userId: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      type: "report_processed",
      title: "Report Update",
      message: "Thanks for your report. We reviewed the content and removed it under community guidelines.",
      i18n: {
        titleKey: "notifications.items.reportProcessed.reporter.title",
        messageKey: "notifications.items.reportProcessed.reporter.remove.message",
        messageParams: {
          entityType: "comment"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "We win OMG",
          _id: new mongoose.Types.ObjectId("69e5fa1395f894707235b9c2")
        },
        {
          labelKey: "notifications.contexts.comment",
          value: "fvck you, bicth",
          _id: new mongoose.Types.ObjectId("69e5fa1395f894707235b9c3")
        }
      ],
      relatedUser: null,
      relatedEntity: {
        entityType: "comment",
        entityId: new mongoose.Types.ObjectId("69e5f9f595f894707235b98b"),
        link: "/post/69e5c3b97dcb27e607293d66#comment-69e5f9f595f894707235b98b"
      },
      isRead: true,
      readAt: new Date("2026-04-20T10:04:18.206Z"),
      createdAt: new Date("2026-04-20T10:04:03.518Z"),
      updatedAt: new Date("2026-04-20T10:04:18.206Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5fa1395f894707235b9c5"),
      userId: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      type: "report_processed",
      title: "Moderation Notice",
      message: "Your comment was reviewed under community guidelines. Your account is temporarily restricted from posting and commenting.",
      i18n: {
        titleKey: "notifications.items.reportProcessed.moderationNotice.title",
        messageKey: "notifications.items.reportProcessed.moderationNotice.mute",
        messageParams: {
          entityType: "comment"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "We win OMG",
          _id: new mongoose.Types.ObjectId("69e5fa1395f894707235b9c6")
        },
        {
          labelKey: "notifications.contexts.comment",
          value: "fvck you, bicth",
          _id: new mongoose.Types.ObjectId("69e5fa1395f894707235b9c7")
        }
      ],
      relatedUser: null,
      relatedEntity: {
        entityType: "comment",
        entityId: new mongoose.Types.ObjectId("69e5f9f595f894707235b98b"),
        link: "/post/69e5c3b97dcb27e607293d66#comment-69e5f9f595f894707235b98b"
      },
      isRead: true,
      readAt: new Date("2026-04-20T10:06:08.828Z"),
      createdAt: new Date("2026-04-20T10:04:03.524Z"),
      updatedAt: new Date("2026-04-20T10:06:08.828Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e60aac95f894707235bac6"),
      userId: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      type: "post_commented",
      title: "Bình luận bài viết",
      message: "Little girl đã bình luận bài viết của bạn",
      i18n: {
        titleKey: "notifications.items.postCommented.title",
        messageKey: "notifications.items.postCommented.message",
        messageParams: {
          name: "Little girl"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "We win OMG",
          _id: new mongoose.Types.ObjectId("69e60aac95f894707235bac7")
        }
      ],
      relatedUser: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      relatedEntity: {
        entityType: "post",
        entityId: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
        link: "/post/69e5c3b97dcb27e607293d66"
      },
      isRead: true,
      readAt: new Date("2026-04-20T12:00:30.725Z"),
      createdAt: new Date("2026-04-20T11:14:52.463Z"),
      updatedAt: new Date("2026-04-20T12:00:30.735Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e60ac795f894707235bafc"),
      userId: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      type: "report_processed",
      title: "Report Update",
      message: "Thanks for your report. We reviewed the content and removed it under community guidelines.",
      i18n: {
        titleKey: "notifications.items.reportProcessed.reporter.title",
        messageKey: "notifications.items.reportProcessed.reporter.remove.message",
        messageParams: {
          entityType: "comment"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "We win OMG",
          _id: new mongoose.Types.ObjectId("69e60ac795f894707235bafd")
        },
        {
          labelKey: "notifications.contexts.comment",
          value: "FVCK YOU",
          _id: new mongoose.Types.ObjectId("69e60ac795f894707235bafe")
        }
      ],
      relatedUser: null,
      relatedEntity: {
        entityType: "comment",
        entityId: new mongoose.Types.ObjectId("69e60aac95f894707235babe"),
        link: "/post/69e5c3b97dcb27e607293d66#comment-69e60aac95f894707235babe"
      },
      isRead: true,
      readAt: new Date("2026-04-21T05:15:40.104Z"),
      createdAt: new Date("2026-04-20T11:15:19.904Z"),
      updatedAt: new Date("2026-04-21T05:15:40.104Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e60ac795f894707235bb00"),
      userId: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      type: "report_processed",
      title: "Moderation Notice",
      message: "Your comment was reviewed under community guidelines. Your account is temporarily restricted from posting and commenting.",
      i18n: {
        titleKey: "notifications.items.reportProcessed.moderationNotice.title",
        messageKey: "notifications.items.reportProcessed.moderationNotice.mute",
        messageParams: {
          entityType: "comment"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "We win OMG",
          _id: new mongoose.Types.ObjectId("69e60ac795f894707235bb01")
        },
        {
          labelKey: "notifications.contexts.comment",
          value: "FVCK YOU",
          _id: new mongoose.Types.ObjectId("69e60ac795f894707235bb02")
        }
      ],
      relatedUser: null,
      relatedEntity: {
        entityType: "comment",
        entityId: new mongoose.Types.ObjectId("69e60aac95f894707235babe"),
        link: "/post/69e5c3b97dcb27e607293d66#comment-69e60aac95f894707235babe"
      },
      isRead: true,
      readAt: new Date("2026-04-20T11:38:18.982Z"),
      createdAt: new Date("2026-04-20T11:15:19.906Z"),
      updatedAt: new Date("2026-04-20T11:38:18.982Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e6126895f894707235bbfb"),
      userId: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      type: "post_liked",
      title: "Thích bài viết",
      message: "Little girl đã thích bài viết của bạn",
      i18n: {
        titleKey: "notifications.items.postLiked.title",
        messageKey: "notifications.items.postLiked.message",
        messageParams: {
          name: "Little girl"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "We win OMG",
          _id: new mongoose.Types.ObjectId("69e6126895f894707235bbfc")
        }
      ],
      relatedUser: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      relatedEntity: {
        entityType: "post",
        entityId: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
        link: "/post/69e5c3b97dcb27e607293d66"
      },
      isRead: true,
      readAt: new Date("2026-04-20T12:00:30.725Z"),
      createdAt: new Date("2026-04-20T11:47:52.158Z"),
      updatedAt: new Date("2026-04-20T12:00:30.735Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e614f595f894707235bcdc"),
      userId: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      type: "post_commented",
      title: "Bình luận bài viết",
      message: "Nhat Duong đã bình luận bài viết của bạn",
      i18n: {
        titleKey: "notifications.items.postCommented.title",
        messageKey: "notifications.items.postCommented.message",
        messageParams: {
          name: "Nhat Duong"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "We win OMG",
          _id: new mongoose.Types.ObjectId("69e614f595f894707235bcdd")
        }
      ],
      relatedUser: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      relatedEntity: {
        entityType: "post",
        entityId: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
        link: "/post/69e5c3b97dcb27e607293d66"
      },
      isRead: true,
      readAt: new Date("2026-04-20T12:00:30.725Z"),
      createdAt: new Date("2026-04-20T11:58:45.422Z"),
      updatedAt: new Date("2026-04-20T12:00:30.735Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e6152895f894707235bcf9"),
      userId: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      type: "post_commented",
      title: "Bình luận bài viết",
      message: "Nhat Duong đã bình luận bài viết của bạn",
      i18n: {
        titleKey: "notifications.items.postCommented.title",
        messageKey: "notifications.items.postCommented.message",
        messageParams: {
          name: "Nhat Duong"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "We win OMG",
          _id: new mongoose.Types.ObjectId("69e6152895f894707235bcfa")
        }
      ],
      relatedUser: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      relatedEntity: {
        entityType: "post",
        entityId: new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66"),
        link: "/post/69e5c3b97dcb27e607293d66"
      },
      isRead: true,
      readAt: new Date("2026-04-20T12:00:30.725Z"),
      createdAt: new Date("2026-04-20T11:59:36.278Z"),
      updatedAt: new Date("2026-04-20T12:00:30.735Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e6169395f894707235bd8c"),
      userId: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      type: "comment_replied",
      title: "Trả lời bình luận",
      message: "Phi Hùng đã trả lời bình luận của bạn",
      i18n: {
        titleKey: "notifications.items.commentReplied.title",
        messageKey: "notifications.items.commentReplied.message",
        messageParams: {
          name: "Phi Hùng"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "We win OMG",
          _id: new mongoose.Types.ObjectId("69e6169395f894707235bd8d")
        },
        {
          labelKey: "notifications.contexts.comment",
          value: "We play so funny!!!",
          _id: new mongoose.Types.ObjectId("69e6169395f894707235bd8e")
        }
      ],
      relatedUser: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      relatedEntity: {
        entityType: "comment",
        entityId: new mongoose.Types.ObjectId("69e614f595f894707235bcd4"),
        link: "/post/69e5c3b97dcb27e607293d66#comment-69e614f595f894707235bcd4"
      },
      isRead: true,
      readAt: new Date("2026-04-21T05:15:40.104Z"),
      createdAt: new Date("2026-04-20T12:05:39.776Z"),
      updatedAt: new Date("2026-04-21T05:15:40.104Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e61e097eafd03ed80a768a"),
      userId: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      type: "comment_replied",
      title: "Trả lời bình luận",
      message: "Phi Hùng đã trả lời bình luận của bạn",
      i18n: {
        titleKey: "notifications.items.commentReplied.title",
        messageKey: "notifications.items.commentReplied.message",
        messageParams: {
          name: "Phi Hùng"
        }
      },
      context: [
        {
          labelKey: "notifications.contexts.post",
          value: "We win OMG",
          _id: new mongoose.Types.ObjectId("69e61e097eafd03ed80a768b")
        },
        {
          labelKey: "notifications.contexts.comment",
          value: "I wish I can escape faster",
          _id: new mongoose.Types.ObjectId("69e61e097eafd03ed80a768c")
        }
      ],
      relatedUser: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      relatedEntity: {
        entityType: "comment",
        entityId: new mongoose.Types.ObjectId("69e6152895f894707235bcf1"),
        link: "/post/69e5c3b97dcb27e607293d66#comment-69e6152895f894707235bcf1"
      },
      isRead: true,
      readAt: new Date("2026-04-21T05:15:40.104Z"),
      createdAt: new Date("2026-04-20T12:37:29.318Z"),
      updatedAt: new Date("2026-04-21T05:15:40.104Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e70469dc3197e123a030bb"),
      userId: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      type: "friend_accepted",
      title: "Chấp nhận lời mời kết bạn",
      message: "Little girl đã chấp nhận lời mời kết bạn",
      i18n: {
        titleKey: "notifications.items.friendAccepted.title",
        messageKey: "notifications.items.friendAccepted.message",
        messageParams: {
          name: "Little girl"
        }
      },
      relatedUser: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      relatedEntity: {
        entityType: "friend",
        entityId: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
        link: "/profile/69e5c3f97dcb27e607293d84"
      },
      isRead: true,
      readAt: new Date("2026-04-23T11:47:31.103Z"),
      context: [],
      createdAt: new Date("2026-04-21T05:00:25.378Z"),
      updatedAt: new Date("2026-04-23T11:47:31.104Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e7084dbac6dff6514f2040"),
      userId: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      type: "friend_accepted",
      title: "Chấp nhận lời mời kết bạn",
      message: "Phi Hùng đã chấp nhận lời mời kết bạn",
      i18n: {
        titleKey: "notifications.items.friendAccepted.title",
        messageKey: "notifications.items.friendAccepted.message",
        messageParams: {
          name: "Phi Hùng"
        }
      },
      relatedUser: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      relatedEntity: {
        entityType: "friend",
        entityId: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
        link: "/profile/69e581d99c44eeb58c84424c"
      },
      isRead: true,
      readAt: new Date("2026-04-21T05:18:41.456Z"),
      context: [],
      createdAt: new Date("2026-04-21T05:17:01.593Z"),
      updatedAt: new Date("2026-04-21T05:18:41.456Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e7094fbac6dff6514f2108"),
      userId: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      type: "friend_accepted",
      title: "Chấp nhận lời mời kết bạn",
      message: "Nhat Duong đã chấp nhận lời mời kết bạn",
      i18n: {
        titleKey: "notifications.items.friendAccepted.title",
        messageKey: "notifications.items.friendAccepted.message",
        messageParams: {
          name: "Nhat Duong"
        }
      },
      relatedUser: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      relatedEntity: {
        entityType: "friend",
        entityId: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
        link: "/profile/69e582709c44eeb58c844258"
      },
      isRead: true,
      readAt: new Date("2026-04-21T05:40:58.966Z"),
      context: [],
      createdAt: new Date("2026-04-21T05:21:19.841Z"),
      updatedAt: new Date("2026-04-21T05:40:58.966Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e70df8ea82f4e0868c0922"),
      userId: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      type: "friend_accepted",
      title: "Chấp nhận lời mời kết bạn",
      message: "Phi Hùng đã chấp nhận lời mời kết bạn",
      i18n: {
        titleKey: "notifications.items.friendAccepted.title",
        messageKey: "notifications.items.friendAccepted.message",
        messageParams: {
          name: "Phi Hùng"
        }
      },
      relatedUser: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      relatedEntity: {
        entityType: "friend",
        entityId: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
        link: "/profile/69e581d99c44eeb58c84424c"
      },
      isRead: true,
      readAt: new Date("2026-04-21T05:42:51.082Z"),
      context: [],
      createdAt: new Date("2026-04-21T05:41:12.610Z"),
      updatedAt: new Date("2026-04-21T05:42:51.082Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69ea087335a94491eabbcfdf"),
      userId: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      type: "report_processed",
      title: "Account Unmuted",
      message: "Your account has been unmuted by Admin. You can post and comment again.",
      i18n: {
        titleKey: null,
        messageKey: null
      },
      relatedUser: new mongoose.Types.ObjectId("69e584bb9c44eeb58c8447ab"),
      relatedEntity: {
        entityType: null,
        entityId: null,
        link: null
      },
      isRead: false,
      readAt: null,
      context: [],
      createdAt: new Date("2026-04-23T11:54:27.876Z"),
      updatedAt: new Date("2026-04-23T11:54:27.876Z")
    }
  ]);
  console.log('✅ notifications: 32 docs inserted.');

  // =========================================================
  // SUPPORTTICKETS
  // =========================================================
  console.log('⏳ Seeding supporttickets...');
  await SupportTicket.deleteMany({});
  await SupportTicket.insertMany([
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359fa"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e2"),
      subject: "Unable to verify email",
      message: "The verification mail never arrived after registration.",
      attachments: [
        {
          url: "https://cdn.ghostvillage.local/tickets/email-issue.png",
          publicId: null,
          _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35b5d")
        }
      ],
      status: "OPEN",
      adminReplies: [],
      createdAt: new Date("2026-04-15T02:37:09.915Z"),
      updatedAt: new Date("2026-04-15T02:37:09.916Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359fb"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e3"),
      subject: "Crash when entering cave",
      message: "The game freezes after loading the cave map.",
      attachments: [
        {
          url: "https://cdn.ghostvillage.local/tickets/cave-crash.png",
          publicId: null,
          _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35b5f")
        }
      ],
      status: "IN_PROGRESS",
      adminReplies: [
        {
          content: "We reproduced the issue and are checking the camera pipeline.",
          repliedBy: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1"),
          repliedAt: new Date("2026-04-13T02:37:09.442Z"),
          _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35b60")
        }
      ],
      createdAt: new Date("2026-04-15T02:37:09.915Z"),
      updatedAt: new Date("2026-04-15T02:37:09.916Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359fd"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1"),
      subject: "Moderation policy question",
      message: "Need a quick clarification on how report thresholds are handled.",
      attachments: [],
      status: "CLOSED",
      adminReplies: [
        {
          content: "Policy updated: two valid reports are required before auto-hide.",
          repliedBy: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
          repliedAt: new Date("2026-04-10T02:37:09.442Z"),
          _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35b65")
        }
      ],
      createdAt: new Date("2026-04-15T02:37:09.915Z"),
      updatedAt: new Date("2026-04-20T02:04:15.673Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359fc"),
      userId: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e4"),
      subject: "Lost perk after reconnect",
      message: "One equipped perk disappeared after a disconnect.",
      attachments: [],
      status: "RESOLVED",
      adminReplies: [
        {
          content: "The perk was restored and the save record was corrected.",
          repliedBy: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
          repliedAt: new Date("2026-04-12T02:37:09.442Z"),
          _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35b62")
        },
        {
          content: "Please confirm the fix after your next session.",
          repliedBy: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1"),
          repliedAt: new Date("2026-04-12T02:37:09.442Z"),
          _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c35b63")
        }
      ],
      createdAt: new Date("2026-04-15T02:37:09.915Z"),
      updatedAt: new Date("2026-04-15T02:37:09.916Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5d7cc95f894707235b6a2"),
      userId: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      subject: "Content recovery",
      message: "I think my comment is not aspect to any one. Please give it back!",
      attachments: [],
      status: "CLOSED",
      adminReplies: [
        {
          content: "I think you should calm down!",
          repliedBy: new mongoose.Types.ObjectId("69e584bb9c44eeb58c8447ab"),
          repliedAt: new Date("2026-04-20T09:27:50.846Z"),
          _id: new mongoose.Types.ObjectId("69e5f19695f894707235b906")
        }
      ],
      createdAt: new Date("2026-04-20T07:37:48.054Z"),
      updatedAt: new Date("2026-04-20T09:28:07.585Z")
    }
  ]);
  console.log('✅ supporttickets: 5 docs inserted.');

  // =========================================================
  // USERS
  // =========================================================
  console.log('⏳ Seeding users...');
  await User.deleteMany({});
  await User.insertMany([
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e3"),
      email: "oracle@ghostvillage.local",
      fullname: "Iris Moon",
      password: null,
      googleId: "google-oracle-002",
      dateOfBirth: new Date("1997-05-09T00:00:00.000Z"),
      avatar: "/avatars/oracle.png",
      bio: "Reads patterns faster than anyone else.",
      isMute: true,
      moderation: {
        violationCount: 2,
        lastViolationAt: new Date("2026-04-11T02:37:09.442Z"),
        mutedUntil: new Date("2026-04-16T02:37:09.442Z"),
        lastAction: "mute",
        lastActionAt: new Date("2026-04-11T02:37:09.442Z")
      },
      role: "user",
      bookmarks: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359eb")
      ],
      verificationTokenHash: null,
      verificationUsed: true,
      isVerified: true,
      verificationExpires: null,
      resetPasswordTokenHash: "oracle-reset-hash",
      resetPasswordExpires: new Date("2026-04-16T02:37:09.442Z"),
      emailVisibility: false,
      friends: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0")
      ],
      savedPosts: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ee")
      ],
      createdAt: new Date("2026-04-15T02:37:09.549Z"),
      updatedAt: new Date("2026-04-15T02:37:09.549Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
      email: "admin@ghostvillage.local",
      fullname: "Avery Vale",
      password: "$2a$10$5jBLkepGWec4kPdHR681j.QaRdmhAw37Hm9RrqmsjL7q4b1.j7g1W",
      googleId: "google-admin-001",
      dateOfBirth: new Date("1990-02-14T00:00:00.000Z"),
      avatar: "/avatars/admin.png",
      bio: "Community admin and content curator.",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "none",
        lastActionAt: null
      },
      role: "admin",
      bookmarks: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea"),
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ee")
      ],
      verificationTokenHash: "admin-verification-hash",
      verificationUsed: true,
      isVerified: true,
      verificationExpires: new Date("2026-05-15T02:37:09.442Z"),
      resetPasswordTokenHash: "admin-reset-hash",
      resetPasswordExpires: new Date("2026-04-17T02:37:09.442Z"),
      emailVisibility: true,
      friends: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e2"),
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e3")
      ],
      savedPosts: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea"),
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ed")
      ],
      createdAt: new Date("2026-04-15T02:37:09.549Z"),
      updatedAt: new Date("2026-04-15T02:37:09.549Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1"),
      email: "support@ghostvillage.local",
      fullname: "Mara Chen",
      password: "$2a$10$d9SrB6PNfIBM51ChQ/rgPO2gpZSyDrEBKf9CYlRM8P5iE.N3kD58G",
      googleId: null,
      dateOfBirth: new Date("1992-08-21T00:00:00.000Z"),
      avatar: "/avatars/support.png",
      bio: "Support lead and moderator.",
      isMute: false,
      moderation: {
        violationCount: 1,
        lastViolationAt: new Date("2026-03-26T02:37:09.442Z"),
        mutedUntil: new Date("2026-04-18T02:37:09.442Z"),
        lastAction: "warning",
        lastActionAt: new Date("2026-03-26T02:37:09.442Z")
      },
      role: "admin",
      bookmarks: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ee")
      ],
      verificationTokenHash: "support-verification-hash",
      verificationUsed: true,
      isVerified: true,
      verificationExpires: new Date("2026-05-15T02:37:09.442Z"),
      resetPasswordTokenHash: "support-reset-hash",
      resetPasswordExpires: new Date("2026-04-20T02:37:09.442Z"),
      emailVisibility: false,
      friends: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e4")
      ],
      savedPosts: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359eb")
      ],
      createdAt: new Date("2026-04-15T02:37:09.549Z"),
      updatedAt: new Date("2026-04-15T02:37:09.549Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e2"),
      email: "hunter@ghostvillage.local",
      fullname: "Noah Fox",
      password: "$2a$10$18lBv6VWZ0H7FUX0eS3wQeyo1EACoQF5io8NQ7kQvi5n8s7Td9lG2",
      googleId: null,
      dateOfBirth: new Date("1996-11-03T00:00:00.000Z"),
      avatar: "/avatars/hunter.png",
      bio: "Front-line hunter and map runner.",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "none",
        lastActionAt: null
      },
      role: "user",
      bookmarks: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ed"),
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea")
      ],
      verificationTokenHash: null,
      verificationUsed: true,
      isVerified: true,
      verificationExpires: null,
      resetPasswordTokenHash: "hunter-reset-hash",
      resetPasswordExpires: new Date("2026-04-22T02:37:09.442Z"),
      emailVisibility: true,
      friends: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0")
      ],
      savedPosts: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ec"),
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea")
      ],
      createdAt: new Date("2026-04-15T02:37:09.549Z"),
      updatedAt: new Date("2026-04-15T02:37:09.549Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e4"),
      email: "wanderer@ghostvillage.local",
      fullname: "Leo Ward",
      password: "$2a$10$52B5B/93jFlteZ8ApJpLC.5KwMVKziuFwaYzGAXffAi1dsZh51iFO",
      googleId: "google-wanderer-003",
      dateOfBirth: new Date("1999-01-26T00:00:00.000Z"),
      avatar: "/avatars/wanderer.png",
      bio: "Explores every corner of the village.",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "merged_hide_only",
        lastActionAt: new Date("2026-04-14T02:37:09.442Z")
      },
      role: "user",
      bookmarks: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ed")
      ],
      verificationTokenHash: "wanderer-verification-hash",
      verificationUsed: false,
      isVerified: false,
      verificationExpires: new Date("2026-04-29T02:37:09.442Z"),
      resetPasswordTokenHash: "wanderer-reset-hash",
      resetPasswordExpires: new Date("2026-04-19T02:37:09.442Z"),
      emailVisibility: true,
      friends: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1")
      ],
      savedPosts: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359eb"),
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea")
      ],
      createdAt: new Date("2026-04-15T02:37:09.549Z"),
      updatedAt: new Date("2026-04-15T02:37:09.549Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      email: "phihungnguyenho@gmail.com",
      fullname: "Phi Hùng",
      password: "$2a$10$Cy41i.K7eFCnes3U3VojVOj9OXPGaeQL6EW3bwMmz75L.V08zy2au",
      googleId: null,
      dateOfBirth: new Date("1999-12-31T00:00:00.000Z"),
      avatar: "https://res.cloudinary.com/dpdizlimp/image/upload/v1776648684/ghostvillage/avatars/default/69e581d99c44eeb58c84424c/default_avatar_1776648683217.png",
      bio: "",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "none",
        lastActionAt: null
      },
      role: "user",
      bookmarks: [
        new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66")
      ],
      verificationTokenHash: null,
      verificationUsed: true,
      isVerified: true,
      verificationExpires: null,
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
      emailVisibility: true,
      friends: [],
      savedPosts: [],
      createdAt: new Date("2026-04-20T01:31:05.314Z"),
      updatedAt: new Date("2026-04-20T12:31:18.518Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      email: "lehhdang272@gmail.com",
      fullname: "Nhat Duong",
      password: "$2a$10$spa36ZN7SqN1gykis9zOau0BswHI9OrFjdAeHMaKEcalbfoASqVL2",
      googleId: "110201965858853175971",
      dateOfBirth: new Date("2000-01-31T00:00:00.000Z"),
      avatar: "https://res.cloudinary.com/dpdizlimp/image/upload/v1776648818/ghostvillage/avatars/google/69e582709c44eeb58c844258/google_avatar_1776648816837.jpg",
      bio: "",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "none",
        lastActionAt: null
      },
      role: "user",
      bookmarks: [
        new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66")
      ],
      verificationTokenHash: null,
      verificationUsed: false,
      isVerified: true,
      verificationExpires: null,
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
      emailVisibility: true,
      friends: [],
      savedPosts: [],
      createdAt: new Date("2026-04-20T01:33:36.083Z"),
      updatedAt: new Date("2026-04-21T09:36:13.077Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e584bb9c44eeb58c8447ab"),
      email: "admin@codebar.dev",
      fullname: "Admin",
      password: "$2a$10$xabsPgjIGpQhScY9qaCtW.84TxxGwNl9R2OdnvtMFCfzLbygfbL4m",
      googleId: null,
      dateOfBirth: new Date("1999-12-31T00:00:00.000Z"),
      avatar: "https://res.cloudinary.com/dpdizlimp/image/upload/v1776649767/ghostvillage/avatars/69e584bb9c44eeb58c8447ab/avatar_1776649765830.jpg",
      bio: "",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "none",
        lastActionAt: null
      },
      role: "admin",
      bookmarks: [],
      verificationTokenHash: "2bc0f460c81fed64db4d876277748012b35dae96a80da10d053f8518c211152f",
      verificationUsed: false,
      isVerified: true,
      verificationExpires: new Date("2026-04-20T01:58:23.465Z"),
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
      emailVisibility: true,
      friends: [],
      savedPosts: [],
      createdAt: new Date("2026-04-20T01:43:23.469Z"),
      updatedAt: new Date("2026-04-20T01:49:27.769Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      email: "ledang2722004@gmail.com",
      fullname: "Little girl",
      password: "$2a$10$akjVlj9QPhjGSe.TjWNzt.r66lU.Q8BRTY4gtqW/wY0QF2Pr29L0.",
      googleId: "115825259701904290982",
      dateOfBirth: new Date("2000-04-19T00:00:00.000Z"),
      avatar: "https://res.cloudinary.com/dpdizlimp/image/upload/v1776665596/ghostvillage/avatars/google/69e5c3f97dcb27e607293d84/google_avatar_1776665594583.jpg",
      bio: "",
      isMute: false,
      moderation: {
        violationCount: 3,
        lastViolationAt: new Date("2026-04-20T11:15:19.895Z"),
        mutedUntil: null,
        lastAction: "mute",
        lastActionAt: new Date("2026-04-23T11:54:27.857Z")
      },
      role: "user",
      bookmarks: [
        new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66")
      ],
      verificationTokenHash: null,
      verificationUsed: false,
      isVerified: true,
      verificationExpires: null,
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
      emailVisibility: true,
      friends: [],
      savedPosts: [],
      createdAt: new Date("2026-04-20T06:13:13.654Z"),
      updatedAt: new Date("2026-04-23T11:54:27.857Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69ea029f35a94491eabb96df"),
      email: "bob@codebar.dev",
      fullname: "Lê Huỳnh Hải Đăng",
      password: "$2a$10$QN26Ic9gdEGaL3HJYg/Uc.WzsK1L7BxQU5SO/QAkemtAwRJVUzZzq",
      googleId: null,
      dateOfBirth: new Date("1996-04-21T00:00:00.000Z"),
      avatar: null,
      bio: "",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "none",
        lastActionAt: null
      },
      role: "user",
      bookmarks: [],
      verificationTokenHash: "6ad8ef6cb40d78a038213a2fd07eef727d74ace26641afd0aab4a4cbd02a337f",
      verificationUsed: false,
      isVerified: false,
      verificationExpires: new Date("2026-04-23T11:44:35.983Z"),
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
      emailVisibility: true,
      friends: [],
      savedPosts: [],
      createdAt: new Date("2026-04-23T11:29:35.990Z"),
      updatedAt: new Date("2026-04-23T11:29:35.990Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69ea03ac35a94491eabb96fb"),
      email: "danglhh272@gmail.com",
      fullname: "Đăng Lê",
      password: null,
      googleId: "114741414612660979524",
      dateOfBirth: null,
      avatar: "https://res.cloudinary.com/dpdizlimp/image/upload/v1776944050/ghostvillage/avatars/google/69ea03ac35a94491eabb96fb/google_avatar_1776944045532.jpg",
      bio: "",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "none",
        lastActionAt: null
      },
      role: "user",
      bookmarks: [],
      verificationTokenHash: null,
      verificationUsed: false,
      isVerified: true,
      verificationExpires: null,
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
      emailVisibility: true,
      friends: [],
      savedPosts: [],
      createdAt: new Date("2026-04-23T11:34:04.604Z"),
      updatedAt: new Date("2026-04-23T11:34:08.631Z")
    }
  ]);
  console.log('✅ users: 11 docs inserted.');

  // =========================================================
  // WIKIS
  // =========================================================
  console.log('⏳ Seeding wikis...');
  await Wiki.deleteMany({});
  await Wiki.insertMany([
    {
      title: "Ong Ke - Boss Monster",
      slug: "monster-ong-ke",
      content: "# Ong Ke\n\n## Overview\nOng Ke is an active boss monster in the Ghost Village system.\n\n## Identity\n- **Monster ID**: ONG_KE\n- **Monster Type**: BOSS\n- **Prefab Name**: OngKeMonster\n- **Status**: Active\n\n## Movement Configuration\n- **Move Speed**: 3.4\n- **Stopping Distance**: 1.3\n- **Patrol Radius**: 28\n\n## Combat Configuration\n- **Chase Range**: 30\n- **Attack Range**: 1.8\n- **Attack Cooldown**: 1.6\n\n## Detection Configuration\n- **Detection Range**: 16\n- **Detection Angle**: 125\n\n## Special Skill Configuration\n```json\n{}\n```\n",
      excerpt: "Ong Ke is an active boss monster in the Ghost Village system.",
      category: "Monster Database",
      tags: [
        "monster",
        "boss",
        "ong-ke"
      ],
      gameData: {
        id: "ONG_KE",
        name: "Ong Ke",
        monsterType: "BOSS",
        prefabName: "OngKeMonster",
        isActive: true,
        movementConfig: {
          moveSpeed: 3.4,
          stoppingDistance: 1.3,
          patrolRadius: 28
        },
        combatConfig: {
          chaseRange: 30,
          attackRange: 1.8,
          attackCooldown: 1.6
        },
        detectionConfig: {
          detectionRange: 16,
          detectionAngle: 125
        },
        specialSkillConfig: {}
      },
      entityType: "monster",
      entityId: "ONG_KE",
      author: new mongoose.Types.ObjectId("679027c8993f8eb8a06b1598"),
      editors: [],
      status: "published",
      isPublic: true,
      isFeatured: false,
      views: 0,
      likes: [],
      version: 1,
      lastEditedBy: null,
      coverImage: null,
      gallery: [],
      videoGuide: null,
      relatedWikis: [],
      publishedAt: new Date("2026-04-04T21:18:33.870Z"),
      createdAt: new Date("2026-04-04T21:18:33.870Z"),
      updatedAt: new Date("2026-04-04T21:18:33.870Z")
    },
    {
      title: "Vong Nhi - Minion Monster",
      slug: "monster-vong-nhi",
      content: "# Vong Nhi\n\n## Overview\nVong Nhi is an active minion monster in the Ghost Village system.\n\n## Identity\n- **Monster ID**: VONG_NHI\n- **Monster Type**: MINION\n- **Prefab Name**: VongNhiMonster\n- **Status**: Active\n\n## Movement Configuration\n- **Move Speed**: 3.8\n- **Stopping Distance**: 1.2\n- **Patrol Radius**: 24\n\n## Combat Configuration\n- **Chase Range**: 18\n- **Attack Range**: 1.4\n- **Attack Cooldown**: 1.2\n\n## Detection Configuration\n- **Detection Range**: 14\n- **Detection Angle**: 120\n\n## Special Skill Configuration\n```json\n{}\n```\n",
      excerpt: "Vong Nhi is an active minion monster in the Ghost Village system.",
      category: "Monster Database",
      tags: [
        "monster",
        "minion",
        "vong-nhi"
      ],
      gameData: {
        id: "VONG_NHI",
        name: "Vong Nhi",
        monsterType: "MINION",
        prefabName: "VongNhiMonster",
        isActive: true,
        movementConfig: {
          moveSpeed: 3.8,
          stoppingDistance: 1.2,
          patrolRadius: 24
        },
        combatConfig: {
          chaseRange: 18,
          attackRange: 1.4,
          attackCooldown: 1.2
        },
        detectionConfig: {
          detectionRange: 14,
          detectionAngle: 120
        },
        specialSkillConfig: {}
      },
      entityType: "monster",
      entityId: "VONG_NHI",
      author: new mongoose.Types.ObjectId("679027c8993f8eb8a06b1598"),
      editors: [],
      status: "published",
      isPublic: true,
      isFeatured: false,
      views: 0,
      likes: [],
      version: 1,
      lastEditedBy: null,
      coverImage: null,
      gallery: [],
      videoGuide: null,
      relatedWikis: [],
      publishedAt: new Date("2026-04-04T21:18:33.897Z"),
      createdAt: new Date("2026-04-04T21:18:33.897Z"),
      updatedAt: new Date("2026-04-04T21:18:33.897Z")
    },
    {
      title: "Ma Da - Boss Monster",
      slug: "monster-boss-mada",
      content: "# Ma Da\n\n## Overview\nMa Da is an active boss monster in the Ghost Village system.\n\n## Identity\n- **Monster ID**: BOSS_MADA\n- **Monster Type**: BOSS\n- **Prefab Name**: MaDa_Boss\n- **Status**: Active\n\n## Movement Configuration\n- **Move Speed**: 1.5\n- **Stopping Distance**: 0\n- **Patrol Radius**: 30\n\n## Combat Configuration\n- **Chase Range**: 25\n- **Attack Range**: 1\n- **Attack Cooldown**: 1.5\n\n## Detection Configuration\n- **Detection Range**: 15\n- **Detection Angle**: 120\n\n## Special Skill Configuration\n```json\n{}\n```\n",
      excerpt: "Ma Da is an active boss monster in the Ghost Village system.",
      category: "Monster Database",
      tags: [
        "monster",
        "boss",
        "ma-da"
      ],
      gameData: {
        id: "BOSS_MADA",
        name: "Ma Da",
        monsterType: "BOSS",
        prefabName: "MaDa_Boss",
        isActive: true,
        movementConfig: {
          moveSpeed: 1.5,
          stoppingDistance: 0,
          patrolRadius: 30
        },
        combatConfig: {
          chaseRange: 25,
          attackRange: 1,
          attackCooldown: 1.5
        },
        detectionConfig: {
          detectionRange: 15,
          detectionAngle: 120
        },
        specialSkillConfig: {}
      },
      entityType: "monster",
      entityId: "BOSS_MADA",
      author: new mongoose.Types.ObjectId("679027c8993f8eb8a06b1598"),
      editors: [],
      status: "published",
      isPublic: true,
      isFeatured: false,
      views: 0,
      likes: [],
      version: 1,
      lastEditedBy: null,
      coverImage: null,
      gallery: [],
      videoGuide: null,
      relatedWikis: [],
      publishedAt: new Date("2026-04-23T09:00:00.000Z"),
      createdAt: new Date("2026-04-23T09:00:00.000Z"),
      updatedAt: new Date("2026-04-23T09:00:00.000Z")
    },
    {
      title: "Drowned - Minion Monster",
      slug: "monster-minion-drowned",
      content: "# Drowned\n\n## Overview\nDrowned is an active minion monster in the Ghost Village system.\n\n## Identity\n- **Monster ID**: MINION_DROWNED\n- **Monster Type**: MINION\n- **Prefab Name**: Drowned_Minion\n- **Status**: Active\n\n## Movement Configuration\n- **Move Speed**: 1\n- **Stopping Distance**: 0\n- **Patrol Radius**: 20\n\n## Combat Configuration\n- **Chase Range**: 15\n- **Attack Range**: 1\n- **Attack Cooldown**: 1\n\n## Detection Configuration\n- **Detection Range**: 15\n- **Detection Angle**: 120\n\n## Special Skill Configuration\n```json\n{}\n```\n",
      excerpt: "Drowned is an active minion monster in the Ghost Village system.",
      category: "Monster Database",
      tags: [
        "monster",
        "minion",
        "drowned"
      ],
      gameData: {
        id: "MINION_DROWNED",
        name: "Drowned",
        monsterType: "MINION",
        prefabName: "Drowned_Minion",
        isActive: true,
        movementConfig: {
          moveSpeed: 1,
          stoppingDistance: 0,
          patrolRadius: 20
        },
        combatConfig: {
          chaseRange: 15,
          attackRange: 1,
          attackCooldown: 1
        },
        detectionConfig: {
          detectionRange: 15,
          detectionAngle: 120
        },
        specialSkillConfig: {}
      },
      entityType: "monster",
      entityId: "MINION_DROWNED",
      author: new mongoose.Types.ObjectId("679027c8993f8eb8a06b1598"),
      editors: [],
      status: "published",
      isPublic: true,
      isFeatured: false,
      views: 0,
      likes: [],
      version: 1,
      lastEditedBy: null,
      coverImage: null,
      gallery: [],
      videoGuide: null,
      relatedWikis: [],
      publishedAt: new Date("2026-04-23T09:00:00.000Z"),
      createdAt: new Date("2026-04-23T09:00:00.000Z"),
      updatedAt: new Date("2026-04-23T09:00:00.000Z")
    },
    {
      title: "Flashlight - Equipment Item",
      slug: "item-item-flashlight",
      content: "# Flashlight\n\n## Overview\nFlashlight is an equipment item available in the Ghost Village system.\n\n## Identity\n- **Item ID**: ITEM_FLASHLIGHT\n- **Item Type**: EQUIPMENT\n- **Prefab Name**: FlashlightItem\n- **Status**: Active\n\n## Stats\n```json\n{\n  \"maxBattery\": 100,\n  \"drainRate\": 2\n}\n```\n",
      excerpt: "Flashlight is an equipment item available in the Ghost Village system.",
      category: "Item Database",
      tags: [
        "item",
        "equipment",
        "flashlight"
      ],
      gameData: {
        id: "ITEM_FLASHLIGHT",
        name: "Flashlight",
        itemType: "EQUIPMENT",
        prefabName: "FlashlightItem",
        isActive: true,
        stats: {
          maxBattery: 100,
          drainRate: 2
        }
      },
      entityType: "item",
      entityId: "ITEM_FLASHLIGHT",
      author: new mongoose.Types.ObjectId("679027c8993f8eb8a06b1598"),
      editors: [],
      status: "published",
      isPublic: true,
      isFeatured: false,
      views: 0,
      likes: [],
      version: 1,
      lastEditedBy: null,
      coverImage: null,
      gallery: [],
      videoGuide: null,
      relatedWikis: [],
      publishedAt: new Date("2026-04-23T09:00:00.000Z"),
      createdAt: new Date("2026-04-23T09:00:00.000Z"),
      updatedAt: new Date("2026-04-04T21:18:33.900Z")
    },
    {
      title: "Pin Dự Phòng - Consumable Item",
      slug: "item-item-battery",
      content: "# Pin Dự Phòng\n\n## Overview\nPin Dự Phòng is an consumable item available in the Ghost Village system.\n\n## Identity\n- **Item ID**: ITEM_BATTERY\n- **Item Type**: CONSUMABLE\n- **Prefab Name**: Prefab_Item_Battery\n- **Status**: Active\n\n## Stats\n```json\n{\n  \"rechargeAmount\": 50\n}\n```\n",
      excerpt: "Pin Dự Phòng is an consumable item available in the Ghost Village system.",
      category: "Item Database",
      tags: [
        "item",
        "consumable",
        "pin-d-ph-ng"
      ],
      gameData: {
        id: "ITEM_BATTERY",
        name: "Pin Dự Phòng",
        itemType: "CONSUMABLE",
        prefabName: "Prefab_Item_Battery",
        isActive: true,
        stats: {
          rechargeAmount: 50
        }
      },
      entityType: "item",
      entityId: "ITEM_BATTERY",
      author: new mongoose.Types.ObjectId("679027c8993f8eb8a06b1598"),
      editors: [],
      status: "published",
      isPublic: true,
      isFeatured: false,
      views: 0,
      likes: [],
      version: 1,
      lastEditedBy: null,
      coverImage: null,
      gallery: [],
      videoGuide: null,
      relatedWikis: [],
      publishedAt: new Date("2026-04-23T09:00:00.000Z"),
      createdAt: new Date("2026-04-23T09:00:00.000Z"),
      updatedAt: new Date("2026-04-23T09:00:00.000Z")
    },
    {
      title: "Medical Kit - Consumable Item",
      slug: "item-item-medkit",
      content: "# Medical Kit\n\n## Overview\nMedical Kit is an consumable item available in the Ghost Village system.\n\n## Identity\n- **Item ID**: ITEM_MEDKIT\n- **Item Type**: CONSUMABLE\n- **Prefab Name**: MedkitItem\n- **Status**: Active\n\n## Stats\n```json\n{\n  \"healAmount\": 10\n}\n```\n",
      excerpt: "Medical Kit is an consumable item available in the Ghost Village system.",
      category: "Item Database",
      tags: [
        "item",
        "consumable",
        "medical-kit"
      ],
      gameData: {
        id: "ITEM_MEDKIT",
        name: "Medical Kit",
        itemType: "CONSUMABLE",
        prefabName: "MedkitItem",
        isActive: true,
        stats: {
          healAmount: 10
        }
      },
      entityType: "item",
      entityId: "ITEM_MEDKIT",
      author: new mongoose.Types.ObjectId("679027c8993f8eb8a06b1598"),
      editors: [],
      status: "published",
      isPublic: true,
      isFeatured: false,
      views: 0,
      likes: [],
      version: 1,
      lastEditedBy: null,
      coverImage: null,
      gallery: [],
      videoGuide: null,
      relatedWikis: [],
      publishedAt: new Date("2026-04-23T09:00:00.000Z"),
      createdAt: new Date("2026-04-23T09:00:00.000Z"),
      updatedAt: new Date("2026-04-23T09:00:00.000Z")
    },
    {
      title: "Monster Caller - Consumable Item",
      slug: "item-item-whistle",
      content: "# Monster Caller\n\n## Overview\nMonster Caller is an consumable item available in the Ghost Village system.\n\n## Identity\n- **Item ID**: ITEM_WHISTLE\n- **Item Type**: CONSUMABLE\n- **Prefab Name**: WhistleItem\n- **Status**: Active\n\n## Stats\n```json\n{}\n```\n",
      excerpt: "Monster Caller is an consumable item available in the Ghost Village system.",
      category: "Item Database",
      tags: [
        "item",
        "consumable",
        "monster-caller"
      ],
      gameData: {
        id: "ITEM_WHISTLE",
        name: "Monster Caller",
        itemType: "CONSUMABLE",
        prefabName: "WhistleItem",
        isActive: true,
        stats: {}
      },
      entityType: "item",
      entityId: "ITEM_WHISTLE",
      author: new mongoose.Types.ObjectId("679027c8993f8eb8a06b1598"),
      editors: [],
      status: "published",
      isPublic: true,
      isFeatured: false,
      views: 0,
      likes: [],
      version: 1,
      lastEditedBy: null,
      coverImage: null,
      gallery: [],
      videoGuide: null,
      relatedWikis: [],
      publishedAt: new Date("2026-04-23T09:00:00.000Z"),
      createdAt: new Date("2026-04-23T09:00:00.000Z"),
      updatedAt: new Date("2026-04-23T09:00:00.000Z")
    },
    {
      title: "Làng Cổ - Ông Kẹ - Map Guide",
      slug: "map-map-01-ong-ke",
      content: "# Làng Cổ - Ông Kẹ\n\n## Overview\nNgôi làng chìm trong bóng tối. 'Hư là bị ông kẹ bắt' - Đừng để hắn thấy bạn.\n\n## Identity\n- **Map ID**: MAP_01_ONG_KE\n- **Scene Name**: Scene_Game_OngKe\n- **Thumbnail**: sprite_map_ongke\n- **Status**: Active\n\n## Consumable Configuration\n### Mandatory Items\n- **ITEM_FLASHLIGHT**: min 1, max 1\n\n### Random Consumable Pool\n- **Min Count**: 2\n- **Max Count**: 3\n- **ITEM_POTION** (weight: 100)\n\n## Equipment Configuration\n### Mandatory Equipment\n- **ITEM_FLASHLIGHT**: min 1, max 1\n\n### Random Equipment Pool\n- **Min Count**: 0\n- **Max Count**: 1\n- **ITEM_GHOST_DETECTOR** (weight: 40)\n- **ITEM_COMPASS** (weight: 60)\n\n## Monster System Configuration\n- **Boss Monster ID**: BOSS_ONG_KE\n- **Allowed Minion IDs**: MINION_SHADOW_HAND, MINION_CURSED_RAT\n\n## Reward Configuration\n- **Base EXP**: 500\n- **Base Coin**: 300\n",
      excerpt: "Ngôi làng chìm trong bóng tối. 'Hư là bị ông kẹ bắt' - Đừng để hắn thấy bạn.",
      category: "Map Guide",
      tags: [
        "map",
        "map-01-ong-ke"
      ],
      gameData: {
        id: "MAP_01_ONG_KE",
        displayName: "Làng Cổ - Ông Kẹ",
        sceneName: "Scene_Game_OngKe",
        shortDescription: "Ngôi làng chìm trong bóng tối. 'Hư là bị ông kẹ bắt' - Đừng để hắn thấy bạn.",
        thumbnailUrl: "sprite_map_ongke",
        isActive: true,
        consumableConfig: {
          mandatoryItems: [
            {
              itemId: "ITEM_FLASHLIGHT",
              minCount: 1,
              maxCount: 1
            }
          ],
          randomPoolConfig: {
            minCount: 2,
            maxCount: 3,
            pool: [
              {
                itemId: "ITEM_POTION",
                weight: 100
              }
            ]
          }
        },
        equipmentConfig: {
          mandatoryEquipment: [
            {
              itemId: "ITEM_FLASHLIGHT",
              minCount: 1,
              maxCount: 1
            }
          ],
          randomPoolConfig: {
            minCount: 0,
            maxCount: 1,
            pool: [
              {
                itemId: "ITEM_GHOST_DETECTOR",
                weight: 40
              },
              {
                itemId: "ITEM_COMPASS",
                weight: 60
              }
            ]
          }
        },
        monsterSystemConfig: {
          bossConfig: {
            monsterId: "BOSS_ONG_KE"
          },
          minionConfig: {
            allowedMonsterIds: [
              "MINION_SHADOW_HAND",
              "MINION_CURSED_RAT"
            ]
          }
        },
        rewardConfig: {
          baseExp: 500,
          baseCoin: 300
        }
      },
      entityType: "map",
      entityId: "MAP_01_ONG_KE",
      author: new mongoose.Types.ObjectId("679027c8993f8eb8a06b1598"),
      editors: [],
      status: "published",
      isPublic: true,
      isFeatured: true,
      views: 0,
      likes: [],
      version: 1,
      lastEditedBy: null,
      coverImage: "sprite_map_ongke",
      gallery: [],
      videoGuide: null,
      relatedWikis: [],
      publishedAt: new Date("2026-04-06T12:33:07.982Z"),
      createdAt: new Date("2026-04-06T12:33:07.982Z"),
      updatedAt: new Date("2026-04-06T12:33:07.982Z")
    },
    {
      title: "Bản Đồ Thử Nghiệm - Map Guide",
      slug: "map-map-99-test",
      content: "# Bản Đồ Thử Nghiệm\n\n## Overview\nMap chuyên dụng để test hệ thống spawn mới sau khi ép cân.\n\n## Identity\n- **Map ID**: MAP_99_TEST\n- **Scene Name**: Scene_Game_Test\n- **Thumbnail**: sprite_map_test\n- **Status**: Active\n\n## Consumable Configuration\n### Mandatory Items\n- **ITEM_MEDKIT**: min 2, max 4\n\n### Random Consumable Pool\n- **Min Count**: 3\n- **Max Count**: 6\n- **ITEM_MEDKIT** (weight: 40)\n\n## Equipment Configuration\n### Mandatory Equipment\n- **ITEM_FLASHLIGHT**: min 1, max 1\n\n### Random Equipment Pool\n- **Min Count**: 1\n- **Max Count**: 2\n- None\n\n## Monster System Configuration\n- **Boss Monster ID**: None\n- **Allowed Minion IDs**: None\n\n## Reward Configuration\n- **Base EXP**: 1000\n- **Base Coin**: 500\n",
      excerpt: "Map chuyên dụng để test hệ thống spawn mới sau khi ép cân.",
      category: "Map Guide",
      tags: [
        "map",
        "map-99-test"
      ],
      gameData: {
        id: "MAP_99_TEST",
        displayName: "Bản Đồ Thử Nghiệm",
        sceneName: "Scene_Game_Test",
        shortDescription: "Map chuyên dụng để test hệ thống spawn mới sau khi ép cân.",
        thumbnailUrl: "sprite_map_test",
        isActive: true,
        consumableConfig: {
          mandatoryItems: [
            {
              itemId: "ITEM_MEDKIT",
              minCount: 2,
              maxCount: 4
            }
          ],
          randomPoolConfig: {
            minCount: 3,
            maxCount: 6,
            pool: [
              {
                itemId: "ITEM_MEDKIT",
                weight: 40
              }
            ]
          }
        },
        equipmentConfig: {
          mandatoryEquipment: [
            {
              itemId: "ITEM_FLASHLIGHT",
              minCount: 1,
              maxCount: 1
            }
          ],
          randomPoolConfig: {
            minCount: 1,
            maxCount: 2,
            pool: []
          }
        },
        monsterSystemConfig: {
          bossConfig: {},
          minionConfig: {
            allowedMonsterIds: []
          }
        },
        rewardConfig: {
          baseExp: 1000,
          baseCoin: 500
        }
      },
      entityType: "map",
      entityId: "MAP_99_TEST",
      author: new mongoose.Types.ObjectId("679027c8993f8eb8a06b1598"),
      editors: [],
      status: "published",
      isPublic: true,
      isFeatured: false,
      views: 0,
      likes: [],
      version: 1,
      lastEditedBy: null,
      coverImage: "sprite_map_test",
      gallery: [],
      videoGuide: null,
      relatedWikis: [],
      publishedAt: new Date("2026-04-06T12:42:31.186Z"),
      createdAt: new Date("2026-04-06T12:42:31.186Z"),
      updatedAt: new Date("2026-04-06T12:42:31.186Z")
    },
    {
      title: "Ma Da Island - Map Guide",
      slug: "map-map-02-mada",
      content: "# Ma Da Island\n\n## Overview\nA haunted river island surrounded by dark waters. Survive the puzzles and escape before the drowned entities pull you under.\n\n## Identity\n- **Map ID**: MAP_02_MADA\n- **Scene Name**: Map2_Mada\n- **Thumbnail**: sprite_map2_mada\n- **Status**: Active\n\n## Consumable Configuration\n### Mandatory Items\n- **ITEM_MEDKIT**: min 4, max 5\n- **ITEM_BATTERY**: min 4, max 6\n\n### Random Consumable Pool\n- **Min Count**: 4\n- **Max Count**: 8\n- **ITEM_MEDKIT** (weight: 30)\n- **ITEM_BATTERY** (weight: 50)\n- **ITEM_WHISTLE** (weight: 20)\n\n## Equipment Configuration\n### Mandatory Equipment\n- **ITEM_FLASHLIGHT**: min 1, max 1\n\n### Random Equipment Pool\n- **Min Count**: 0\n- **Max Count**: 1\n- **ITEM_FLASHLIGHT** (weight: 100)\n\n## Monster System Configuration\n- **Boss Monster ID**: BOSS_MADA\n- **Allowed Minion IDs**: MINION_DROWNED\n\n## Reward Configuration\n- **Base EXP**: 1200\n- **Base Coin**: 600\n",
      excerpt: "A haunted river island surrounded by dark waters. Survive the puzzles and escape before the drowned entities pull you under.",
      category: "Map Guide",
      tags: [
        "map",
        "map-02-mada"
      ],
      gameData: {
        id: "MAP_02_MADA",
        displayName: "Ma Da Island",
        sceneName: "Map2_Mada",
        shortDescription: "A haunted river island surrounded by dark waters. Survive the puzzles and escape before the drowned entities pull you under.",
        thumbnailUrl: "sprite_map2_mada",
        isActive: true,
        consumableConfig: {
          mandatoryItems: [
            {
              itemId: "ITEM_MEDKIT",
              minCount: 4,
              maxCount: 5
            },
            {
              itemId: "ITEM_BATTERY",
              minCount: 4,
              maxCount: 6
            }
          ],
          randomPoolConfig: {
            minCount: 4,
            maxCount: 8,
            pool: [
              {
                itemId: "ITEM_MEDKIT",
                weight: 30
              },
              {
                itemId: "ITEM_BATTERY",
                weight: 50
              },
              {
                itemId: "ITEM_WHISTLE",
                weight: 20
              }
            ]
          }
        },
        equipmentConfig: {
          mandatoryEquipment: [
            {
              itemId: "ITEM_FLASHLIGHT",
              minCount: 1,
              maxCount: 1
            }
          ],
          randomPoolConfig: {
            minCount: 0,
            maxCount: 1,
            pool: [
              {
                itemId: "ITEM_FLASHLIGHT",
                weight: 100
              }
            ]
          }
        },
        monsterSystemConfig: {
          bossConfig: {
            monsterId: "BOSS_MADA"
          },
          minionConfig: {
            allowedMonsterIds: [
              "MINION_DROWNED"
            ]
          }
        },
        rewardConfig: {
          baseExp: 1200,
          baseCoin: 600
        }
      },
      entityType: "map",
      entityId: "MAP_02_MADA",
      author: new mongoose.Types.ObjectId("679027c8993f8eb8a06b1598"),
      editors: [],
      status: "published",
      isPublic: true,
      isFeatured: false,
      views: 0,
      likes: [],
      version: 1,
      lastEditedBy: null,
      coverImage: "sprite_map2_mada",
      gallery: [],
      videoGuide: null,
      relatedWikis: [],
      publishedAt: new Date("2026-04-23T09:00:00.000Z"),
      createdAt: new Date("2026-04-23T09:00:00.000Z"),
      updatedAt: new Date("2026-04-23T09:00:00.000Z")
    }
  ]);
  console.log('✅ wikis: 11 docs inserted.');


  // =========================================================
  // ANNOUNCEMENTS
  // =========================================================
  console.log('⏳ Seeding announcements...');
  await Announcement.deleteMany({});
  await Announcement.insertMany([
    {
      _id: new mongoose.Types.ObjectId("697082b8954cf578ad876c18"),
      title: "🎮 Welcome to Ghost Village!",
      slug: "welcome-to-ghost-village",
      content: "# Welcome to Ghost Village!\n\nWe are absolutely **thrilled** to welcome you to the official Ghost Village community!\n\n## What is Ghost Village?\n\nGhost Village is a multiplayer co-op ghost hunting game where you and your friends explore haunted locations, investigate paranormal activities, and survive encounters with supernatural entities.\n\n## Key Features\n\n- **Multiplayer Co-op**: Team up with up to 4 players\n- **Dynamic Ghost AI**: Each ghost has unique behaviors and abilities\n- **Investigation Tools**: Use EMF readers, spirit boxes, and more\n- **Progression System**: Unlock new equipment and abilities\n- **Cross-Platform Play**: Play with friends on different platforms\n\n## Getting Started\n\n1. Download the game from our website\n2. Complete the tutorial to learn the basics\n3. Join or create a team\n4. Start your first investigation!\n\n## Community Resources\n\n- **Wiki**: Check out our comprehensive game wiki for guides and strategies\n- **Forums**: Join discussions with other players\n- **Discord**: Connect with the community in real-time\n- **Bug Reports**: Help us improve by reporting issues\n\nThank you for joining us on this supernatural adventure!\n\n**The Ghost Village Team**",
      excerpt: "We are thrilled to announce the official launch of Ghost Village! Join thousands of players in this exciting multiplayer ghost hunting adventure.",
      author: new mongoose.Types.ObjectId("69e584bb9c44eeb58c8447ab"),
      isActive: true,
      isPinned: false,
      views: 4,
      coverImage: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800",
      createdAt: new Date("2026-01-21T07:39:36.482Z"),
      updatedAt: new Date("2026-02-04T08:41:24.291Z")
    },
    {
      _id: new mongoose.Types.ObjectId("697082b8954cf578ad876c1a"),
      title: "Day Of The Dead",
      slug: "day-of-the-dead",
      content: "🌕 New Content\n🗺️ Day of the Dead Variant Maps\n\nFamiliar locations are transformed during the event:\n\nOng Ke Village now decorated with altars, candles, and marigold paths\nMa Da Island covered in glowing spirit flowers and ritual shrines\nReduced visibility with stronger supernatural presence\n👻 Spirit-Enhanced Monsters\n\nDuring the event, monsters become empowered by ancestral energy:\n\nOng Ke (Boss): Increased detection range and faster chase speed\nMa Da (Boss): Gains stronger control over water zones\nVong Nhi & Drowned (Minions): Spawn more frequently in groups",
      excerpt: "Prepare your offerings, stay close to your team,\nand remember…\n\nThe spirits are not always friendly. 💀✨",
      author: new mongoose.Types.ObjectId("69e584bb9c44eeb58c8447ab"),
      isActive: true,
      isPinned: false,
      views: 2,
      coverImage: "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=800",
      createdAt: new Date("2026-01-21T07:39:36.483Z"),
      updatedAt: new Date("2026-04-23T16:32:40.551Z")
    },
    {
      _id: new mongoose.Types.ObjectId("697082b8954cf578ad876c1b"),
      title: "🛠️ Server Maintenance - Oct 15",
      slug: "server-maintenance-oct-15",
      content: "# Scheduled Server Maintenance\n\n## Maintenance Window\n**Date**: October 15th, 2024  \n**Time**: 2:00 AM - 6:00 AM UTC (approximately 4 hours)  \n**Status**: All game servers will be offline\n\n## What's Being Updated?\n\n- Database optimization for better performance\n- Network infrastructure upgrades\n- Security patches\n- Backend server updates\n- Matchmaking improvements\n\n## Impact\n\nDuring maintenance:\n- ❌ Game servers will be unavailable\n- ❌ Cannot join or create games\n- ❌ Leaderboards will not update\n- ✅ Website and forums remain accessible\n- ✅ Wiki and community features available\n\n## Compensation\n\nAll players will receive:\n- 1000 in-game currency\n- 24-hour XP boost (50%)\n- Exclusive \"Patient Ghost Hunter\" badge\n\n## What to Do?\n\n- Finish any active games before maintenance starts\n- Your progress is automatically saved\n- Check our Discord for live updates\n- Report any issues after maintenance\n\nThank you for your patience and understanding!\n\nQuestions? Contact support@ghostvillage.com",
      excerpt: "Scheduled server maintenance on October 15th from 2:00 AM to 6:00 AM UTC. Game will be temporarily unavailable.",
      author: new mongoose.Types.ObjectId("69e584bb9c44eeb58c8447ab"),
      isActive: true,
      isPinned: false,
      views: 0,
      coverImage: null,
      createdAt: new Date("2026-01-21T07:39:36.483Z"),
      updatedAt: new Date("2026-01-21T07:39:36.483Z")
    },
    {
      _id: new mongoose.Types.ObjectId("697082b8954cf578ad876c1d"),
      title: "💬 Community Feedback Survey",
      slug: "community-feedback-survey-2024",
      content: "# We Want Your Feedback!\n\nYour opinion matters! Help us improve Ghost Village by completing our community survey.\n\n## Survey Details\n\n**Duration**: 5-10 minutes  \n**Deadline**: October 31st, 2024  \n**Topics Covered**:\n- Gameplay experience\n- Content preferences\n- Technical performance\n- Community features\n- Future content ideas\n\n## Rewards\n\nComplete the survey to receive:\n- 500 in-game currency\n- Exclusive \"Community Voice\" badge\n- Entry into prize drawing\n\n### Prize Drawing\n- **Grand Prize**: Custom ghost design in-game\n- **2nd Prize**: $50 store credit\n- **3rd-10th Prize**: Premium cosmetic pack\n\n## Topics We're Interested In\n\n### Gameplay\n- Which ghost types do you enjoy most?\n- What difficulty level do you prefer?\n- How do you feel about current balance?\n- What features would improve gameplay?\n\n### Content\n- What new maps would you like?\n- Interest in new game modes?\n- Priority for new equipment?\n- Cosmetic preferences?\n\n### Technical\n- Performance satisfaction\n- Common issues you face\n- Platform-specific feedback\n- Preferred settings\n\n### Community\n- Forum usage\n- Discord activity\n- Wiki helpfulness\n- What community features to add?\n\n## How to Participate\n\n1. Visit: survey.ghostvillage.com\n2. Log in with your game account\n3. Complete the survey honestly\n4. Submit and claim your rewards!\n\n## Why This Matters\n\nYour feedback directly influences:\n- Development priorities\n- Future content roadmap\n- Bug fix priorities\n- Community features\n- Quality of life improvements\n\nWe read every response and take your suggestions seriously!\n\n## Previous Survey Results\n\nLast survey led to:\n- New solo difficulty option\n- Improved matchmaking\n- Better tutorial system\n- Equipment loadout presets\n- Quick-join feature\n\n## Questions?\n\n- Email: feedback@ghostvillage.com\n- Discord: #community-feedback\n- Forums: Survey Discussion thread\n\nThank you for being part of the Ghost Village community!\n\n**Your voice shapes our future.**",
      excerpt: "Help shape the future of Ghost Village! Take our 5-minute survey and earn exclusive rewards.",
      author: new mongoose.Types.ObjectId("69e584bb9c44eeb58c8447ab"),
      isActive: true,
      isPinned: false,
      views: 2,
      coverImage: null,
      createdAt: new Date("2026-01-21T07:39:36.483Z"),
      updatedAt: new Date("2026-04-23T16:35:33.616Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e4e42f69788235d24b60da"),
      title: "🔦 New Item Update: Flashlight Added!",
      slug: "-new-item-update-flashlight-added",
      content: "We’re excited to introduce a brand new item to enhance your exploration experience in GhostVillage — the Flashlight!\n\n✨ What’s new?\n🔦 Flashlight Item is now available in-game\n🌑 Helps players navigate dark environments and uncover hidden paths\n👁️ Improves visibility during exploration and investigation\n⚙️ Gameplay Impact\nThe flashlight allows players to better detect surroundings in low-light areas\nCan be essential when exploring haunted zones or solving puzzles\nAdds a new layer of strategy when managing inventory and resources\n⚠️ Notes\nThe flashlight consumes energy (if applicable in your design)\nUse it wisely to avoid being exposed to lurking dangers...",
      excerpt: "We’re excited to introduce a brand new item to enhance your exploration experience in GhostVillage — the Flashlight!\n\n✨ What’s new?\n🔦 Flashlight Item is now available in-game\n🌑 Helps players navigat",
      author: new mongoose.Types.ObjectId("659d4b1e9d3e2a1b3c4d5e6f"),
      isActive: true,
      isPinned: false,
      views: 16,
      coverImage: "",
      createdAt: new Date("2026-04-19T14:18:23.379Z"),
      updatedAt: new Date("2026-04-23T16:32:38.670Z")
    }
  ]);
  console.log('✅ announcements: 5 docs inserted.');

    console.log("=========================================");
    console.log("🎉 SEED DỮ LIỆU HOÀN TẤT!");
    console.log("=========================================");
  } catch (error) {
    console.error("❌ Có lỗi xảy ra:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

seedData();
