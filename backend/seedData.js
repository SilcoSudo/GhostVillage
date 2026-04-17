import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/modules/user/userModel.js";
import Player from "./src/modules/player/playerModel.js";
import Quest from "./src/modules/quest/questModel.js";
import GameResult from "./src/modules/profile/gameResultModel.js"; // Model Trận đấu toàn cục
import { config } from "./src/config/env.js";
import UserAchievement from "./src/modules/profile/playerAchievementModel.js";
import MapConfig from "./src/modules/map/mapConfigModel.js";
import MatchResult from "./src/modules/match/matchModel.js";
import Perk from "./src/modules/perk/perkModel.js";
import ShopPool from "./src/modules/shop/shopPoolModel.js";
dotenv.config();

const seedData = async () => {
  try {
    // 1. KẾT NỐI DATABASE
    await mongoose.connect(config.mongodb.uri);
    console.log("🔌 Đã kết nối MongoDB");

    // =========================================================
    // 2. DỌN DẸP DỮ LIỆU CŨ (PHẢI GOM HẾT LÊN ĐÂY)
    // =========================================================
    console.log("🗑️  Đang dọn dẹp toàn bộ dữ liệu cũ...");
    await User.deleteMany({});
    await Player.deleteMany({});
    //await Achievement.deleteMany({});
    await Quest.deleteMany({}); // Thêm dòng này
    await GameResult.deleteMany({});
    await UserAchievement.deleteMany({});
    // await PlayerMatchHistory.deleteMany({})
    await Perk.deleteMany({});
    await ShopPool.deleteMany({});
    console.log("🗑️  Đã xóa dữ liệu cũ.");
    await MapConfig.deleteMany({});
    await MatchResult.deleteMany({});
    await UserAchievement.deleteMany({}); // <-- Bê lên đây là hết bị lỗi duplicate key
    console.log("  Đã dọn sạch database.");

    // =========================================================
    // 3. CHUẨN BỊ ID (Để link giữa các bảng)
    // =========================================================
    const user1_Id = new mongoose.Types.ObjectId("659d4b1e9d3e2a1b3c4d5e6f");
    const user2_Id = new mongoose.Types.ObjectId();
    const user3_Id = new mongoose.Types.ObjectId("696da0d5a6e42a937b80aaff");

    // TẠO ĐỊNH NGHĨA THÀNH TỰU (Global Achievements)
    // =========================================================
    // TẠO QUẢN LÝ NHIỆM VỤ & THÀNH TỰU (MỚI)
    // =========================================================
    console.log("⏳ Đang tạo Quest & Achievements...");
    await Quest.create([
      // --- DAILY QUESTS ---
      {
        questId: "QUEST_DAILY_PLAY_2",
        questName: "Hardworking Survivor",
        description: "Complete 2 matches.",
        questType: "DAILY",
        actionType: "PLAY_MATCH",
        targetCount: 2,
        reward: { coin: 100, exp: 100, titleId: null },
        isActive: true,
      },
      {
        questId: "QUEST_DAILY_WIN_1",
        questName: "Taste of Victory",
        description: "Survive and escape the village 1 time.",
        questType: "DAILY",
        actionType: "WIN_MATCH",
        targetCount: 1,
        reward: { coin: 100, exp: 100, titleId: null },
        isActive: true,
      },
      {
        questId: "QUEST_DAILY_KILL_5",
        questName: "Monster Hunter",
        description: "Kill 5 small monsters.",
        questType: "DAILY",
        actionType: "KILL_SMALL_MONSTER",
        targetCount: 5,
        reward: { coin: 100, exp: 100, titleId: null },
        isActive: true,
      },
      {
        questId: "QUEST_DAILY_RESCUE_3",
        questName: "Combat Medic",
        description: "Rescue a knocked-down teammate 3 times.",
        questType: "DAILY",
        actionType: "RESCUE_TEAMMATE",
        targetCount: 3,
        reward: { coin: 300, exp: 50, titleId: null },
        isActive: true,
      },

      // --- ACHIEVEMENTS (CÓ TITLE ID) ---
      {
        questId: "QUEST_ACHV_RESCUE_100",
        questName: "Guardian Angel",
        description: "Rescue knocked-down teammates 100 times in total.",
        questType: "ACHIEVEMENT",
        actionType: "RESCUE_TEAMMATE",
        targetCount: 100,
        reward: { coin: 100, exp: 100, titleId: "RESCUE_100" },
        isActive: true,
      },
      {
        questId: "QUEST_ACHV_WIN_100",
        questName: "Escape Artist",
        description: "Successfully escape the map 100 times.",
        questType: "ACHIEVEMENT",
        actionType: "WIN_MATCH",
        targetCount: 100,
        reward: { coin: 100, exp: 100, titleId: "WIN_100" },
        isActive: true,
      },
      {
        questId: "QUEST_ACHV_PLAY_100",
        questName: "Veteran Survivor",
        description: "Play a total of 100 matches.",
        questType: "ACHIEVEMENT",
        actionType: "PLAY_MATCH",
        targetCount: 100,
        reward: { coin: 100, exp: 100, titleId: "PLAY_100" },
        isActive: true,
      },
      {
        questId: "QUEST_ACHV_SIREN_20",
        questName: "Attention Seeker",
        description: "Use the siren item 20 times to alert the monster.",
        questType: "ACHIEVEMENT",
        actionType: "USE_SIREN",
        targetCount: 20,
        reward: { coin: 100, exp: 100, titleId: "SIREN_20" },
        isActive: true,
      },
      {
        questId: "QUEST_ACHV_KILL_100",
        questName: "Exterminator",
        description: "Eliminate a total of 100 small monsters.",
        questType: "ACHIEVEMENT",
        actionType: "KILL_SMALL_MONSTER",
        targetCount: 100,
        reward: { coin: 100, exp: 100, titleId: "KILL_100" },
        isActive: true,
      },
      {
        questId: "QUEST_ACHV_SCREAM_20",
        questName: "Human Siren",
        description: "Scream into the microphone 20 times during matches.",
        questType: "ACHIEVEMENT",
        actionType: "SCREAM",
        targetCount: 20,
        reward: { coin: 100, exp: 100, titleId: "SCREAM_20" },
        isActive: true,
      },
      {
        questId: "QUEST_ACHV_KNOCK_100",
        questName: "Punching Bag",
        description:
          "Get knocked down by monsters 100 times. Are you okay? Lmaooo",
        questType: "ACHIEVEMENT",
        actionType: "GET_KNOCKED",
        targetCount: 100,
        reward: { coin: 100, exp: 100, titleId: "KNOCK_100" },
        isActive: true,
      },

      // Mấy cái cũ sếp đang test (Cho thằng Raccoon nó có cái để xài)
      {
        questId: "FIRST_CLEAR",
        questName: "First Clear",
        description: "Complete a stage for the first time.",
        questType: "ACHIEVEMENT",
        actionType: "WIN_MATCH",
        targetCount: 1,
        reward: { coin: 100, exp: 0, titleId: "FIRST_CLEAR" },
        isActive: true,
      },
      {
        questId: "KILL_50",
        questName: "Slayer I",
        description: "Defeat 50 minions.",
        questType: "ACHIEVEMENT",
        actionType: "KILL_SMALL_MONSTER",
        targetCount: 50,
        reward: { coin: 200, exp: 0, titleId: "KILL_50" },
        isActive: true,
      },
      {
        questId: "KILL_500",
        questName: "Slayer II",
        description: "Defeat 500 minions to prove your dominance.",
        questType: "ACHIEVEMENT",
        actionType: "KILL_SMALL_MONSTER",
        targetCount: 500,
        reward: { coin: 500, exp: 0, titleId: "KILL_500" },
        isActive: true,
      },
      {
        questId: "WIN_5_STREAK",
        questName: "Unstoppable",
        description: "Win 5 matches in a row without losing.",
        questType: "ACHIEVEMENT",
        actionType: "WIN_MATCH",
        targetCount: 5,
        reward: { coin: 300, exp: 0, titleId: "WIN_5_STREAK" },
        isActive: true,
      },
    ]);

    //Shop (Perk)
    const perkData = [
      // --- EPIC PERKS ---
      {
        perkId: "PERK_EPIC_SPECTRAL_REFLEX",
        perkName: "Spectral Reflection",
        description:
          "When knocked down, automatically revive with 100% Stamina after 3 seconds. (Once per match)",
        rarity: "EPIC",
        price: 2000,
        prefabId: "PERK_EPIC_SPECTRAL_REFLEX",
        modifiers: {
          autoReviveCount: 1,
          reviveDelay: 3,
          reviveStaminaPercent: 1.0,
        },
      },
      {
        perkId: "PERK_EPIC_PROPHETIC_SIGHT",
        perkName: "Prophetic Sight",
        description:
          "Whenever a teammate completes a puzzle, reveal the Boss and all allies' outlines through walls for 7 seconds.",
        rarity: "EPIC",
        price: 2000,
        prefabId: "PERK_EPIC_PROPHETIC_SIGHT",
        modifiers: {
          revealDuration: 7,
          revealOutline: true,
        },
      },

      // --- RARE PERKS ---
      {
        perkId: "PERK_RARE_RELIC_BEARER",
        perkName: "Relic Bearer",
        description:
          "Rescue speed increased by 15%. After a successful rescue, both you and the rescued ally gain 15% Move Speed for 5 seconds.",
        rarity: "RARE",
        price: 800,
        prefabId: "PERK_RARE_RELIC_BEARER",
        modifiers: {
          reviveSpeedMult: 1.15,
          postReviveSpeedBoost: 0.15,
          boostDuration: 5,
        },
      },
      {
        perkId: "PERK_RARE_AGARWOOD_BEADS",
        perkName: "Agarwood Beads",
        description:
          "The Boss's detection range against you is reduced by 15%.",
        rarity: "RARE",
        price: 800,
        prefabId: "PERK_RARE_AGARWOOD_BEADS",
        modifiers: {
          bossDetectionRangeMult: 0.85,
        },
      },
      {
        perkId: "PERK_RARE_ANCESTRAL_VOW",
        perkName: "Ancestral Vow",
        description:
          "Gain permanent buffs for each teammate eliminated (stacks up to 3 times): +5% Move Speed and -10% Stamina consumption.",
        rarity: "RARE",
        price: 1000,
        prefabId: "PERK_RARE_ANCESTRAL_VOW",
        modifiers: {
          speedBoostPerDeath: 0.05,
          staminaSavePerDeath: 0.1,
          maxStacks: 3,
        },
      },

      // --- COMMON PERKS ---
      {
        perkId: "PERK_COM_BRAIDED_BELT",
        perkName: "Braided Grass Belt",
        description:
          "Increases Max Stamina by 15% and increases Stamina regeneration speed by 10%.",
        rarity: "COMMON",
        price: 200,
        prefabId: "PERK_COM_BRAIDED_BELT",
        modifiers: {
          maxStaminaMult: 1.15,
          staminaRegenMult: 1.1,
        },
      },
      {
        perkId: "PERK_COM_GLOOM_EYE",
        perkName: "Gloom Eye",
        description: "Reduces Flashlight battery consumption rate by 15%.",
        rarity: "COMMON",
        price: 150,
        prefabId: "PERK_COM_GLOOM_EYE",
        modifiers: {
          batteryDrainMult: 0.85,
        },
      },
      {
        perkId: "PERK_COM_TIRE_SANDALS",
        perkName: "Tire Tread Sandals",
        description: "Reduces Stamina consumption while sprinting by 15%.",
        rarity: "COMMON",
        price: 250,
        prefabId: "PERK_COM_TIRE_SANDALS",
        modifiers: {
          sprintStaminaDrainMult: 0.85,
        },
      },
      {
        perkId: "PERK_COM_INDIGO_POUCH",
        perkName: "Indigo Cloth Pouch",
        description:
          "Has a 10% chance to not consume Med-kits or Batteries upon use.",
        rarity: "COMMON",
        price: 300,
        prefabId: "PERK_COM_INDIGO_POUCH",
        modifiers: {
          preserveItemChance: 0.1,
        },
      },
    ];
    const createdPerks = await Perk.create(perkData);

    // --- TẠO USER 1: Web Auth User (Email-only) ---
    // Role: user | admin
    // Game sẽ dùng chung tài khoản này
    // =========================================================
    // 4. TẠO DỮ LIỆU USERS
    // =========================================================
    console.log("⏳ Đang tạo Users...");
    const user1 = {
      _id: user1_Id,
      email: "hung@ghostvillage.com",
      fullname: "Hùng Đẹp Trai",
      password: "12345678An.",
      dateOfBirth: new Date("1995-01-01"),
      avatar: "avatar_default_01",
      bio: "Hùng Đẹp Trai",
      role: "admin",
      isVerified: true,
      isActive: true,
      isBanned: false,
      lastLogin: new Date(),
    };

    const user2 = {
      _id: user2_Id,
      email: "belan.support@gmail.com",
      fullname: "Bé Lan Support",
      password: "12345678",
      dateOfBirth: new Date("2000-02-02"),
      avatar: "avatar_default_01",
      bio: "Bé Lan Support",
      role: "user",
      isVerified: true,
      isActive: true,
      isBanned: false,
    };

    const user3 = {
      _id: user3_Id,
      email: "raccoon@ghostvillage.com",
      fullname: "Raccoon",
      password: "raccoon123",
      dateOfBirth: new Date("1998-05-05"),
      avatar: "avatar_default_02",
      bio: "Raccoon the curious",
      role: "user",
      isVerified: true,
      isActive: true,
      isBanned: false,
      isMute: false,
    };

    await User.create([user1, user2, user3]);

    // =========================================================
    // 5. TẠO DỮ LIỆU PLAYERS (Game Profiles)
    // =========================================================
    // =========================================================
    // 5. TẠO DỮ LIỆU PLAYERS (Game Profiles)
    // =========================================================
    console.log("⏳ Đang tạo Players (Game Profiles)...");
    const player1 = {
      _id: new mongoose.Types.ObjectId("659d4b1e9d3e2a1b3c4d5e70"),
      userId: user1_Id,
      uid: "10000001",
      profile: {
        displayName: "Hùng Đẹp Trai",
        avatar: "avatar_default_01",
        level: 1,
        exp: 0,
        coin: 1000,
      },
      storage: {
        unlockedPerks: [],
      },
      // [FIX CHÍ MẠNG]: Bơm sẵn 3 huy chương cho sếp Hùng test UI!
      unlockedMedals: ["FIRST_CLEAR", "KILL_500", "WIN_5_STREAK"],
      selectedMedals: ["FIRST_CLEAR", "KILL_500", "WIN_5_STREAK"],
      achievementsProgress: [
        { questId: "QUEST_ACHV_RESCUE_100", current: 6, isClaimed: false },
        { questId: "QUEST_ACHV_WIN_100", current: 3, isClaimed: false },
        { questId: "QUEST_ACHV_PLAY_100", current: 8, isClaimed: false },
        { questId: "QUEST_ACHV_KILL_100", current: 7, isClaimed: false },
        { questId: "QUEST_ACHV_SCREAM_20", current: 1, isClaimed: false },
        { questId: "QUEST_ACHV_KNOCK_100", current: 2, isClaimed: false },
        { questId: "FIRST_CLEAR", current: 1, isClaimed: true },
        { questId: "KILL_50", current: 50, isClaimed: true },
        { questId: "KILL_500", current: 500, isClaimed: true },
        { questId: "WIN_5_STREAK", current: 5, isClaimed: true },
      ],
    };

    const player2 = {
      userId: user2_Id,
      uid: "10000002",
      profile: {
        displayName: "Bé Lan Support",
        avatar: "avatar_default_01",
        level: 1,
        exp: 0,
        coin: 1000,
      },
      storage: {
        unlockedPerks: [],
      },
    };

    const player3 = {
      userId: user3_Id,
      uid: "10000003",
      profile: {
        displayName: "Raccoon",
        avatar: "avatar_default_02",
        level: 10,
        exp: 450,
        coin: 5000,
      },
      unlockedPerks: ["PERK_COM_INDIGO_POUCH"],
      equippedPerks: ["PERK_COM_INDIGO_POUCH"],
      selectedMedals: ["FIRST_CLEAR", "KILL_500"],
      achievementsProgress: [
        { achievementCode: "FIRST_CLEAR", current: 1, isClaimed: true },
        { achievementCode: "KILL_50", current: 50, isClaimed: true },
        { achievementCode: "REACH_LV_10", current: 10, isClaimed: true },
        { achievementCode: "FAST_CLEAR", current: 1, isClaimed: true },
        { achievementCode: "KILL_500", current: 520, isClaimed: true },
        { achievementCode: "WIN_5_STREAK", current: 3, isClaimed: false },
        { achievementCode: "PLAY_100_MATCHES", current: 45, isClaimed: false },
        {
          achievementCode: "MAP_EXPERT_RUNG_CHET",
          current: 12,
          isClaimed: false,
        },
      ],
    };

    await Player.create([player1, player2, player3]);

    // =========================================================
    // 6. TẠO TIẾN ĐỘ THÀNH TỰU CHO Raccoon
    // =========================================================
    console.log("⏳ Creating Achievements (UserAchievement)...");
    await UserAchievement.insertMany([
      {
        userId: user3_Id,
        code: "FIRST_CLEAR",
        name: "First Clear",
        description: "Complete a stage for the first time.",
        progress: { current: 1, target: 1 },
        isUnlocked: true,
        unlockedAt: new Date("2026-01-19T03:11:17.259Z"),
      },
      {
        userId: user3_Id,
        code: "KILL_50",
        name: "Slayer I",
        description: "Defeat 50 minions.",
        progress: { current: 17, target: 50 },
        isUnlocked: false,
        unlockedAt: null,
      },
      {
        userId: user3_Id,
        code: "SURVIVE_30MIN",
        name: "Endurance",
        description: "Survive for a total of 30 minutes.",
        progress: { current: 22 * 60, target: 30 * 60 },
        isUnlocked: false,
        unlockedAt: null,
      },
    ]);

    // =========================================================
    // 7. TẠO DỮ LIỆU BẢN ĐỒ (MapConfig)
    // =========================================================
    console.log("⏳ Creating MapConfigs (5 Maps)...");
    const mapConfigs = [
      // MAP 1
      {
        identityConfig: {
          mapId: "MAP_01_ONG_KE",
          sceneName: "Scene_Game_OngKe",
          displayName: "Làng Cổ - Ông Kẹ",
          thumbnailUrl: "sprite_map_ongke",
          shortDescription:
            "Ngôi làng chìm trong bóng tối. 'Hư là bị ông kẹ bắt' - Đừng để hắn thấy bạn.",
          isActive: true,
        },
        environmentConfig: {
          baseLightingId: "LIGHT_PROFILE_DARK_FOG",
          moonEventPool: [
            {
              eventId: "EVENT_MOON_FULL",
              weight: 30,
              uiIcon: "icon_moon_full",
            },
            { eventId: "EVENT_MOON_NEW", weight: 40, uiIcon: "icon_moon_new" },
            { eventId: "EVENT_MOON_RED", weight: 10, uiIcon: "icon_moon_red" },
          ],
        },
        consumableConfig: {
          spawnPointIds: [
            "SP_Item_Crocodilo",
            "SP_Item_Skibidi",
            "SP_Item_Bombadilo",
            "SP_Item_Bruh",
            "SP_Item_Lmao",
          ],
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
          spawnPointIds: ["SP_Equip_Table_Main", "SP_Equip_Box_Gate"],
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
            spawnPointIds: [
              "SP_Boss_Center",
              "SP_Boss_OldHouse",
              "SP_Boss_Playground",
            ],
          },
          minionConfig: {
            allowedMonsterIds: ["MINION_SHADOW_HAND", "MINION_CURSED_RAT"],
            spawnPointIds: ["SP_Minion_Alley", "SP_Minion_Corner"],
          },
        },
        puzzleConfig: {
          spawnPointIds: ["SP_Puzzle_Main_Altar", "SP_Puzzle_Old_Clock"],
          puzzlePoolIds: ["PUZZLE_FIND_DOLL", "PUZZLE_FIX_LIGHT"],
        },
        rewardConfig: { baseExp: 500, baseCoin: 300, eventMultipliers: [] },
      },
      // MAP 2
      {
        identityConfig: {
          mapId: "MAP_02_MA_DA",
          sceneName: "Scene_Game_MaDa",
          displayName: "Bến Sông - Ma Da",
          thumbnailUrl: "sprite_map_mada",
          shortDescription:
            "Vùng nước chết chóc. Đừng đứng quá gần mép nước, Ma Da sẽ kéo chân bạn.",
          isActive: true,
        },
        environmentConfig: {
          baseLightingId: "LIGHT_PROFILE_WET_COLD",
          moonEventPool: [
            {
              eventId: "EVENT_TIDE_HIGH",
              weight: 40,
              uiIcon: "icon_tide_high",
            },
            { eventId: "EVENT_FOG_HEAVY", weight: 30, uiIcon: "icon_fog" },
          ],
        },
        consumableConfig: {
          spawnPointIds: [
            "SP_Item_Boat",
            "SP_Item_Pier",
            "SP_Item_Hut",
            "SP_Item_Reed",
          ],
          mandatoryItems: [
            { itemId: "ITEM_STAMINA_DRINK", minCount: 6, maxCount: 10 },
          ],
          randomPoolConfig: {
            minCount: 3,
            maxCount: 5,
            pool: [
              { itemId: "ITEM_HP_POTION_S", weight: 60 },
              { itemId: "ITEM_OXYGEN_TANK", weight: 40 },
            ],
          },
        },
        equipmentConfig: {
          spawnPointIds: ["SP_Equip_Boat_Storage", "SP_Equip_Pier_Box"],
          mandatoryEquipment: [
            { itemId: "ITEM_DIVING_GEAR", minCount: 1, maxCount: 1 },
          ],
          randomPoolConfig: {
            minCount: 0,
            maxCount: 1,
            pool: [
              { itemId: "ITEM_WATER_RADAR", weight: 50 },
              { itemId: "ITEM_FLARE_GUN", weight: 50 },
            ],
          },
        },
        monsterSystemConfig: {
          bossConfig: {
            monsterId: "BOSS_MA_DA",
            spawnPointIds: ["SP_Boss_River_Deep", "SP_Boss_Under_Bridge"],
          },
          minionConfig: {
            allowedMonsterIds: ["MINION_DROWNED_CORPSE", "MINION_WATER_LEECH"],
            spawnPointIds: ["SP_Minion_Shore", "SP_Minion_Puddle"],
          },
        },
        puzzleConfig: {
          spawnPointIds: ["SP_Puzzle_Boat_Engine", "SP_Puzzle_Fishing_Net"],
          puzzlePoolIds: ["PUZZLE_REPAIR_BOAT", "PUZZLE_OFFERING_RIVER"],
        },
        rewardConfig: { baseExp: 600, baseCoin: 400, eventMultipliers: [] },
      },
      // MAP 3
      {
        identityConfig: {
          mapId: "MAP_03_CHANG_TINH",
          sceneName: "Scene_Game_ChangTinh",
          displayName: "Rừng Già - Chằng Tinh",
          thumbnailUrl: "sprite_map_changtinh",
          shortDescription:
            "Khu rừng của loài yêu quái cổ xưa. Sức mạnh của nó có thể nghiền nát đá.",
          isActive: true,
        },
        environmentConfig: {
          baseLightingId: "LIGHT_PROFILE_JUNGLE",
          moonEventPool: [
            { eventId: "EVENT_JUNGLE_ROAR", weight: 50, uiIcon: "icon_roar" },
          ],
        },
        consumableConfig: {
          spawnPointIds: [
            "SP_Item_Cave_Ent",
            "SP_Item_Rock",
            "SP_Item_Tree_Hollow",
          ],
          mandatoryItems: [
            { itemId: "ITEM_TRAP_TOOL", minCount: 3, maxCount: 5 },
          ],
          randomPoolConfig: {
            minCount: 4,
            maxCount: 7,
            pool: [
              { itemId: "ITEM_HP_POTION_L", weight: 40 },
              { itemId: "ITEM_SPEED_BUFF", weight: 60 },
            ],
          },
        },
        equipmentConfig: {
          spawnPointIds: ["SP_Equip_Tent", "SP_Equip_Ruin_Altar"],
          mandatoryEquipment: [
            { itemId: "ITEM_NIGHT_VISION_GOGGLES", minCount: 1, maxCount: 1 },
          ],
          randomPoolConfig: {
            minCount: 0,
            maxCount: 1,
            pool: [
              { itemId: "ITEM_MACHETE", weight: 30 },
              { itemId: "ITEM_THERMAL_CAM", weight: 70 },
            ],
          },
        },
        monsterSystemConfig: {
          bossConfig: {
            monsterId: "BOSS_CHANG_TINH",
            spawnPointIds: ["SP_Boss_Cave_Throne", "SP_Boss_Clearing"],
          },
          minionConfig: {
            allowedMonsterIds: ["MINION_WILD_SNAKE", "MINION_FOREST_IMP"],
            spawnPointIds: ["SP_Minion_Tree_Top", "SP_Minion_Bush"],
          },
        },
        puzzleConfig: {
          spawnPointIds: ["SP_Puzzle_Stone_Gate", "SP_Puzzle_Ancient_Rune"],
          puzzlePoolIds: ["PUZZLE_MOVE_ROCK", "PUZZLE_TRIBAL_DRUM"],
        },
        rewardConfig: { baseExp: 800, baseCoin: 500, eventMultipliers: [] },
      },
      // MAP 4
      {
        identityConfig: {
          mapId: "MAP_04_MA_LAI",
          sceneName: "Scene_Game_MaLai",
          displayName: "Nhà Hoang - Ma Lai",
          thumbnailUrl: "sprite_map_malai",
          shortDescription:
            "Đầu người lơ lửng kéo theo bộ ruột. Cẩn thận cửa sổ và trần nhà.",
          isActive: true,
        },
        environmentConfig: {
          baseLightingId: "LIGHT_PROFILE_INDOOR_RED",
          moonEventPool: [
            {
              eventId: "EVENT_BLOOD_MOON",
              weight: 100,
              uiIcon: "icon_moon_blood",
            },
          ],
        },
        consumableConfig: {
          spawnPointIds: [
            "SP_Item_Cabinet",
            "SP_Item_Table",
            "SP_Item_Toilet",
            "SP_Item_Attic",
          ],
          mandatoryItems: [
            { itemId: "ITEM_SALT_BAG", minCount: 5, maxCount: 8 },
          ],
          randomPoolConfig: {
            minCount: 3,
            maxCount: 5,
            pool: [
              { itemId: "ITEM_BANDAGE", weight: 70 },
              { itemId: "ITEM_AMMO_BOX", weight: 30 },
            ],
          },
        },
        equipmentConfig: {
          spawnPointIds: ["SP_Equip_MasterBedroom", "SP_Equip_Basement_Shelf"],
          mandatoryEquipment: [
            { itemId: "ITEM_EMF_READER", minCount: 1, maxCount: 1 },
          ],
          randomPoolConfig: {
            minCount: 0,
            maxCount: 1,
            pool: [
              { itemId: "ITEM_SPIRIT_BOX", weight: 50 },
              { itemId: "ITEM_HOLY_CROSS", weight: 50 },
            ],
          },
        },
        monsterSystemConfig: {
          bossConfig: {
            monsterId: "BOSS_MA_LAI",
            spawnPointIds: ["SP_Boss_LivingRoom", "SP_Boss_Bedroom"],
          },
          minionConfig: {
            allowedMonsterIds: [
              "MINION_FLOATING_SKULL",
              "MINION_CURSED_INSECT",
            ],
            spawnPointIds: ["SP_Minion_Window", "SP_Minion_Vent"],
          },
        },
        puzzleConfig: {
          spawnPointIds: ["SP_Puzzle_Safe", "SP_Puzzle_Mirror"],
          puzzlePoolIds: ["PUZZLE_FIND_KEY_BODY", "PUZZLE_CLOSE_WINDOW"],
        },
        rewardConfig: { baseExp: 700, baseCoin: 450, eventMultipliers: [] },
      },
      // MAP 5
      {
        identityConfig: {
          mapId: "MAP_05_QUY_CAU",
          sceneName: "Scene_Game_QuyCau",
          displayName: "Nghĩa Địa - Quỷ Cẩu",
          thumbnailUrl: "sprite_map_quycau",
          shortDescription:
            "Tiếng chó sủa trong đêm. Chạy ngay đi trước khi nó đánh hơi thấy bạn.",
          isActive: true,
        },
        environmentConfig: {
          baseLightingId: "LIGHT_PROFILE_GRAVEYARD",
          moonEventPool: [
            { eventId: "EVENT_WIND_HOWL", weight: 50, uiIcon: "icon_wind" },
            { eventId: "EVENT_THUNDER", weight: 20, uiIcon: "icon_thunder" },
          ],
        },
        consumableConfig: {
          spawnPointIds: [
            "SP_Item_Tomb",
            "SP_Item_Crypt",
            "SP_Item_DeadTree",
            "SP_Item_Statue",
          ],
          mandatoryItems: [
            { itemId: "ITEM_SCENT_REMOVER", minCount: 4, maxCount: 6 },
          ],
          randomPoolConfig: {
            minCount: 4,
            maxCount: 6,
            pool: [
              { itemId: "ITEM_STAMINA_DRINK", weight: 70 },
              { itemId: "ITEM_MEAT_BAIT", weight: 30 },
            ],
          },
        },
        equipmentConfig: {
          spawnPointIds: ["SP_Equip_Caretaker_Shed", "SP_Equip_Old_Bench"],
          mandatoryEquipment: [
            { itemId: "ITEM_SILENT_BOOTS", minCount: 1, maxCount: 1 },
          ],
          randomPoolConfig: {
            minCount: 0,
            maxCount: 1,
            pool: [
              { itemId: "ITEM_OFFERING_BELL", weight: 40 },
              { itemId: "ITEM_DOG_WHISTLE", weight: 60 },
            ],
          },
        },
        monsterSystemConfig: {
          bossConfig: {
            monsterId: "BOSS_QUY_CAU",
            spawnPointIds: ["SP_Boss_Gate_Main", "SP_Boss_Hill"],
          },
          minionConfig: {
            allowedMonsterIds: ["MINION_MAD_DOG", "MINION_SKELETON"],
            spawnPointIds: ["SP_Minion_Grave_1", "SP_Minion_Grave_2"],
          },
        },
        puzzleConfig: {
          spawnPointIds: ["SP_Puzzle_Grave_Dig", "SP_Puzzle_Statue_Eyes"],
          puzzlePoolIds: ["PUZZLE_ARRANGE_TOMB", "PUZZLE_SILENCE_BELL"],
        },
        rewardConfig: { baseExp: 900, baseCoin: 600, eventMultipliers: [] },
      },
    ];

    await MapConfig.insertMany(mapConfigs);

    // =========================================================
    // 8. TẠO LỊCH SỬ ĐẤU CHUNG (Match Results)
    // =========================================================
    console.log("⏳ Creating Global Match Results...");
    const matchResults = [
      {
        mapId: "MAP_01_ONG_KE",
        sessionId: "Room_Dev_Test_01",
        startTime: new Date(Date.now() - 86400000),
        endTime: new Date(Date.now() - 86400000 + 900000),
        durationSec: 900,
        playerResults: [
          {
            userId: user1_Id,
            nickname: "Hùng Đẹp Trai",
            isWin: true,
            outcome: "ESCAPED",
            rewards: { exp: 1500, coin: 300 },
            titles: ["GrimReaper", "WalkingHospital"],
          },
          {
            userId: user3_Id,
            nickname: "Raccoon",
            isWin: true,
            outcome: "ESCAPED",
            rewards: { exp: 1200, coin: 250 },
            titles: ["Survivor"],
          },
        ],
      },
      {
        mapId: "MAP_02_MA_DA",
        sessionId: "Room_Dev_Test_02",
        startTime: new Date(Date.now() - 43200000),
        endTime: new Date(Date.now() - 43200000 + 600000),
        durationSec: 600,
        playerResults: [
          {
            userId: user2_Id,
            nickname: "Bé Lan Support",
            isWin: false,
            outcome: "CAUGHT",
            rewards: { exp: 50, coin: 10 },
            titles: ["PunchingBag"],
          },
          {
            userId: user3_Id,
            nickname: "Raccoon",
            isWin: false,
            outcome: "CAUGHT",
            rewards: { exp: 80, coin: 15 },
            titles: ["HumanSiren"],
          },
        ],
      },
      {
        mapId: "MAP_05_QUY_CAU",
        sessionId: "Room_Solo_Hunt",
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(Date.now() - 3600000 + 1200000),
        durationSec: 1200,
        playerResults: [
          {
            userId: user1_Id,
            nickname: "Hùng Đẹp Trai",
            isWin: true,
            outcome: "ESCAPED",
            rewards: { exp: 2000, coin: 500 },
            titles: ["GrimReaper", "Survivor", "WalkingHospital"],
          },
        ],
      },
    ];

    await MatchResult.insertMany(matchResults);
    console.log(` Đã tạo ${matchResults.length} trận đấu mẫu vào MatchResult.`);

    console.log("=========================================");
    console.log(" KHỞI TẠO DỮ LIỆU THÀNH CÔNG TOÀN BỘ!");
    console.log("👤 User 1: hung@ghostvillage.com | UID: 10000001");
    console.log("👤 User 2: belan.support@gmail.com | UID: 10000002");
    console.log("👤 User 3: raccoon@ghostvillage.com | UID: 10000003");
    console.log("=========================================");

    process.exit();
  } catch (error) {
    console.error(" Có lỗi xảy ra:", error);
    process.exit(1);
  }
};

seedData();
