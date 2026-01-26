import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/modules/user/userModel.js";
import Player from "./src/modules/player/playerModel.js";
import { config } from "./src/config/env.js";
import UserMatchHistory from "./src/modules/profile/playerMatchHistoryModel.js";
import UserAchievement from "./src/modules/profile/playerAchievementModel.js";

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
    console.log("🗑️  Đã xóa dữ liệu cũ (PlayerMatchHistory, PlayerAchievement).");

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

    console.log("✅ KHỞI TẠO DỮ LIỆU THÀNH CÔNG!");
    console.log(
      "👤 User 1: hung@ghostvillage.com | 👤 User 2: lan.support@gmail.com | 👤 User 3: raccoon@ghostvillage.com"
    );
    console.log("🎮 Player 1: Hùng Đẹp Trai | 🎮 Player 2: Lan Support | 🎮 Player 3: Raccoon");

    // 5. Ngắt kết nối
    process.exit();
  } catch (error) {
    console.error("❌ Có lỗi xảy ra:", error);
    process.exit(1);
  }
};

seedData();
