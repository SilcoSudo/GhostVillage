import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/modules/user/userModel.js";
import Player from "./src/modules/player/playerModel.js";
import { config } from "./src/config/env.js";
import UserMatchHistory from "./src/modules/profile/playerMatchHistoryModel.js";
import UserAchievement from "./src/modules/profile/playerAchievementModel.js";
import MapConfig from "./src/modules/map/mapConfigModel.js";

dotenv.config();

const seedData = async () => {
  try {
    // 1. KẾT NỐI DATABASE
    await mongoose.connect(config.mongodb.uri);
    console.log("🔌 Đã kết nối MongoDB");

    // 2. DỌN DẸP DỮ LIỆU CŨ
    await User.deleteMany({});
    await Player.deleteMany({});
    console.log("🗑️  Đã xóa dữ liệu cũ (Users & Players).");
    await UserMatchHistory.deleteMany({});
    await UserAchievement.deleteMany({});
    console.log(
      "🗑️  Đã xóa dữ liệu cũ (PlayerMatchHistory, PlayerAchievement).",
    );
    await MapConfig.deleteMany({});
    console.log("🗑️  Đã xóa dữ liệu cũ (MapConfig).");

    // 3. CHUẨN BỊ ID (Để link giữa các bảng)
    const user1_Id = new mongoose.Types.ObjectId("659d4b1e9d3e2a1b3c4d5e6f");
    const user2_Id = new mongoose.Types.ObjectId();
    const user3_Id = new mongoose.Types.ObjectId("696da0d5a6e42a937b80aaff");

    // --- TẠO USER 1: Web Auth User (Email-only) ---
    // Role: user | admin
    // Game sẽ dùng chung tài khoản này
    const user1 = {
      _id: user1_Id,
      email: "hung@ghostvillage.com",
      fullname: "Hùng Đẹp Trai",
      password: "12345678", // Sẽ được hash bởi pre-save hook
      dateOfBirth: new Date("1995-01-01"),
      avatar: "avatar_default_01",
      bio: "Hùng Đẹp Trai",
      role: "admin", // Chỉ có user hoặc admin
      isVerified: true,
      isActive: true,
      isBanned: false,
      lastLogin: new Date(),
    };

    // --- TẠO USER 2: Web Auth User thứ 2 ---
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

    // --- TẠO USER 3: Web Auth User thứ 3 (Raccoon) ---
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

    // --- TẠO PLAYER 1: Game Profile của User 1 ---
    // Player tham chiếu User qua userId
    // Chứa game-specific data: level, exp, coin, skins, perks
    const player1 = {
      _id: new mongoose.Types.ObjectId("659d4b1e9d3e2a1b3c4d5e70"),
      userId: user1_Id,
      profile: {
        displayName: "Hùng Đẹp Trai",
        avatar: "avatar_default_01",
        bio: "Hùng Đẹp Trai",
        level: 1,
        exp: 0,
        coin: 1000,
      },
      inventory: {
        unlockedSkins: ["skin_default"],
        unlockedPerks: [],
      },
    };

    // --- TẠO PLAYER 2: Game Profile của User 2 ---
    const player2 = {
      userId: user2_Id,
      profile: {
        displayName: "Bé Lan Support",
        avatar: "avatar_default_01",
        bio: "Bé Lan Support",
        level: 1,
        exp: 0,
        coin: 1000,
      },
      inventory: {
        unlockedSkins: ["skin_default"],
        unlockedPerks: [],
      },
    };

    // --- TẠO PLAYER 3: Game Profile của User 3 (Raccoon) ---
    const player3 = {
      userId: user3_Id,
      profile: {
        displayName: "Raccoon",
        avatar: "avatar_default_02",
        bio: "Raccoon the curious",
        level: 1,
        exp: 0,
        coin: 1000,
      },
      inventory: {
        unlockedSkins: ["skin_default"],
        unlockedPerks: [],
      },
    };

    // 4. LƯU VÀO DB
    console.log("⏳ Đang tạo Users...");
    await User.create([user1, user2, user3]);

    console.log("⏳ Đang tạo Players (Game Profiles)...");
    await Player.create([player1, player2, player3]);
    console.log("⏳ Đang tạo Match History (UserMatchHistory)...");

    //add match-hisory
    await UserMatchHistory.insertMany([
      // --- Raccoon (user3) ---
      {
        userId: user3_Id,
        mapId: "MAP_02",
        isWin: true,
        durationSec: 612,
        exp: 120,
        coin: 60,
        titles: ["Survivor", "Medic"],
        createdAt: new Date("2026-01-19T03:11:17.259Z"),
      },
      {
        userId: user3_Id,
        mapId: "MAP_04",
        isWin: false,
        durationSec: 287,
        exp: 45,
        coin: 15,
        titles: ["Slayer"],
        createdAt: new Date("2026-01-18T20:05:10.000Z"),
      },
      {
        userId: user3_Id,
        mapId: "MAP_03",
        isWin: true,
        durationSec: 503,
        exp: 90,
        coin: 40,
        titles: ["Survivor", "Keymaster"],
        createdAt: new Date("2026-01-17T15:22:31.000Z"),
      },

      // --- (Tuỳ chọn) Hùng / Lan để test nhiều user ---
      {
        userId: user1_Id,
        mapId: "MAP_01",
        isWin: true,
        durationSec: 800,
        exp: 110,
        coin: 70,
        titles: ["Survivor"],
        createdAt: new Date("2026-01-16T10:00:00.000Z"),
      },
      {
        userId: user2_Id,
        mapId: "MAP_02",
        isWin: false,
        durationSec: 350,
        exp: 30,
        coin: 10,
        titles: ["Medic"],
        createdAt: new Date("2026-01-15T12:30:00.000Z"),
      },
    ]);

    console.log("⏳ Creating Achievements (UserAchievement)...");
    await UserAchievement.insertMany([
      // --- Raccoon achievements ---
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
        progress: { current: 22 * 60, target: 30 * 60 }, // seconds
        isUnlocked: false,
        unlockedAt: null,
      },
    ]);

    // ---------------------------------------------------------
    // BẮT ĐẦU PHẦN MAP CONFIG MỚI (5 MAPS)
    // ---------------------------------------------------------
    console.log("⏳ Creating MapConfigs (5 Maps)...");

    const mapConfigs = [
      // =========================================================================
      // MAP 1: ÔNG KẸ (THE BOOGEYMAN) - Bối cảnh: Làng Cổ (Tối tăm, lẩn trốn)
      // =========================================================================
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
            {
              itemId: "ITEM_FLASHLIGHT",
              minCount: 1,
              maxCount: 1,
            },
          ],
          randomPoolConfig: {
            minCount: 2,
            maxCount: 3,
            pool: [
              {
                itemId: "ITEM_POTION",
                weight: 100,
              },
            ],
          },
        },
        equipmentConfig: {
          spawnPointIds: [
            "SP_Equip_Table_Main",
            "SP_Equip_Shelf_OldHouse",
            "SP_Equip_Box_Gate",
          ],
          mandatoryEquipment: [
            { itemId: "ITEM_FLASHLIGHT_PRO", minCount: 1, maxCount: 1 },
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
            spawnPointIds: [
              "SP_Minion_Alley_1",
              "SP_Minion_Alley_2",
              "SP_Minion_Corner",
            ],
          },
        },
        puzzleConfig: {
          spawnPointIds: ["SP_Puzzle_Main_Altar", "SP_Puzzle_Old_Clock"],
          puzzlePoolIds: ["PUZZLE_FIND_DOLL", "PUZZLE_FIX_LIGHT"],
        },
        rewardConfig: { baseExp: 500, baseCoin: 300, eventMultipliers: [] },
      },

      // =========================================================================
      // MAP 2: MA DA (THE WATER GHOST) - Bối cảnh: Bến Sông (Nước, stamina)
      // =========================================================================
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

      // =========================================================================
      // MAP 3: CHẰNG TINH (THE OGRE) - Bối cảnh: Rừng Già / Hang Động
      // =========================================================================
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

      // =========================================================================
      // MAP 4: MA LAI (THE FLYING HEAD) - Bối cảnh: Nhà Hoang (Chật hẹp, Kinh dị)
      // =========================================================================
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

      // =========================================================================
      // MAP 5: QUỶ CẨU (DEMON DOG) - Bối cảnh: Nghĩa Địa (Rộng, Rượt đuổi)
      // =========================================================================
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
    // ---------------------------------------------------------
    // KẾT THÚC PHẦN MAP CONFIG MỚI
    // ---------------------------------------------------------

    console.log("✅ KHỞI TẠO DỮ LIỆU THÀNH CÔNG!");
    console.log(
      "👤 User 1: hung@ghostvillage.com | 👤 User 2: lan.support@gmail.com | 👤 User 3: raccoon@ghostvillage.com",
    );
    console.log(
      "🎮 Player 1: Hùng Đẹp Trai | 🎮 Player 2: Lan Support | 🎮 Player 3: Raccoon",
    );

    // 5. Ngắt kết nối
    process.exit();
  } catch (error) {
    console.error("❌ Có lỗi xảy ra:", error);
    process.exit(1);
  }
};

seedData();
