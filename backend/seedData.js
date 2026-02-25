import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/modules/user/userModel.js";
import Player from "./src/modules/player/playerModel.js";
import Achievement from "./src/modules/achievement/achievementModel.js"; // Model Định nghĩa
import GameResult from "./src/modules/profile/gameResultModel.js"; // Model Trận đấu toàn cục
import PlayerMatchHistory from "./src/modules/profile/playerMatchHistoryModel.js"; // Model Lịch sử cá nhân
import { config } from "./src/config/env.js";

dotenv.config();

const seedData = async () => {
  try {
    // 1. KẾT NỐI DATABASE
    await mongoose.connect(config.mongodb.uri);
    console.log("🔌 Đã kết nối MongoDB");

    // 2. DỌN DẸP DỮ LIỆU CŨ
    await Promise.all([
      User.deleteMany({}),
      Player.deleteMany({}),
      Achievement.deleteMany({}),
      GameResult.deleteMany({}),
      PlayerMatchHistory.deleteMany({}),
    ]);
    console.log("🗑️  Đã dọn dẹp sạch sẽ database.");

    // 3. CHUẨN BỊ ID (Để link giữa các bảng)
    const user1_Id = new mongoose.Types.ObjectId("659d4b1e9d3e2a1b3c4d5e6f");
    const user2_Id = new mongoose.Types.ObjectId();
    const user3_Id = new mongoose.Types.ObjectId("696da0d5a6e42a937b80aaff");

    // TẠO ĐỊNH NGHĨA THÀNH TỰU (Global Achievements)
    console.log("⏳ Đang tạo Achievement Definitions...");
    const achievements = await Achievement.create([
      {
        _id: "FIRST_CLEAR",
        title: "First Clear",
        desc: "Complete a stage for the first time.",
        target: 1,
        reward: { coin: 100, titleId: "Survivor" }
      },
      {
        _id: "KILL_50",
        title: "Slayer I",
        desc: "Defeat 50 minions.",
        target: 50,
        reward: { coin: 200, titleId: "Ghost Hunter" }
      },
      {
        _id: "KILL_500",
        title: "Slayer II",
        desc: "Defeat 500 minions to prove your dominance.",
        target: 500,
        reward: { coin: 500, titleId: "Executioner" }
      },
      {
        _id: "WIN_5_STREAK",
        title: "Unstoppable",
        desc: "Win 5 matches in a row without losing.",
        target: 5,
        reward: { coin: 300, titleId: "Invincible" }
      },
      {
        _id: "REACH_LV_10",
        title: "Veteran",
        desc: "Reach player level 10.",
        target: 10,
        reward: { coin: 400, titleId: "Elite Survivor" }
      },
      {
        _id: "PLAY_100_MATCHES",
        title: "Dedicated",
        desc: "Play 100 total matches in GhostVillage.",
        target: 100,
        reward: { coin: 1000, titleId: "Ghost Resident" }
      },
      {
        _id: "FAST_CLEAR",
        title: "Phantom",
        desc: "Clear any stage in less than 5 minutes.",
        target: 1,
        reward: { coin: 600, titleId: "The Flash" }
      },
      {
        _id: "MAP_EXPERT_RUNG_CHET",
        title: "Forest Master",
        desc: "Win 20 matches on the 'Dead Forest' map.",
        target: 20,
        reward: { coin: 500, titleId: "Forest Stalker" }
      }
    ]);

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
        level: 1,
        exp: 0,
        coin: 1000,
      },
      inventory: {
        unlockedSkins: ["skin_default"],
        unlockedPerks: [],
      },
    };

    // --- TẠO PLAYER 3: Game Profile của User 3 ---
    const player3 = {
      userId: user3_Id,
      profile: {
        displayName: "Raccoon",
        avatar: "avatar_default_02",
        level: 10,
        exp: 450,
        coin: 5000,
      },
      selectedMedals: ["FIRST_CLEAR", "KILL_500"],
      achievementsProgress: [
        { achievementCode: "FIRST_CLEAR", current: 1, isClaimed: true },
        { achievementCode: "KILL_50", current: 50, isClaimed: true },
        { achievementCode: "REACH_LV_10", current: 10, isClaimed: true },
        { achievementCode: "FAST_CLEAR", current: 1, isClaimed: true },
        { achievementCode: "KILL_500", current: 520, isClaimed: true },
        { achievementCode: "WIN_5_STREAK", current: 3, isClaimed: false },
        { achievementCode: "PLAY_100_MATCHES", current: 45, isClaimed: false },
        { achievementCode: "MAP_EXPERT_RUNG_CHET", current: 12, isClaimed: false }
      ]
    };
    
    // 5. TẠO DỮ LIỆU TRẬN ĐẤU (Game Results & 11 History của Raccoon)
    console.log("⏳ Đang tạo 11 trận đấu cho Raccoon...");
    const matchIds = Array.from({ length: 11 }, () => new mongoose.Types.ObjectId());

    // Tạo GameResult (Dữ liệu chung)
    const gameResultsData = matchIds.map((id, index) => ({
      _id: id,
      mapId: index % 2 === 0 ? "MAP_VILLAGE" : "MAP_FOREST",
      roomName: index % 2 === 0 ? "Ông Kẹ" : "Rừng Chết",
      durationSec: 300 + (index * 60),
      startTime: new Date(Date.now() - (10 - index) * 24 * 60 * 60 * 1000)
    }));
    await GameResult.create(gameResultsData);

    // Tạo PlayerMatchHistory (Dữ liệu cá nhân Raccoon - Collection: playermatchhistories)
    const historyData = [
      { userId: user3_Id, matchId: matchIds[0], isWin: true, expGained: 100, coinGained: 50, titles: ["GrimReaper"] },
      { userId: user3_Id, matchId: matchIds[1], isWin: false, expGained: 20, coinGained: 5, titles: ["PrimeTarget"] },
      { userId: user3_Id, matchId: matchIds[2], isWin: true, expGained: 120, coinGained: 60, titles: ["WalkingHospital"] },
      { userId: user3_Id, matchId: matchIds[3], isWin: false, expGained: 10, coinGained: 0, titles: ["PunchingBag"] },
      { userId: user3_Id, matchId: matchIds[4], isWin: true, expGained: 150, coinGained: 70, titles: ["HumanSiren"] },
      { userId: user3_Id, matchId: matchIds[5], isWin: true, expGained: 110, coinGained: 55, titles: ["GrimReaper", "PrimeTarget"] },
      { userId: user3_Id, matchId: matchIds[6], isWin: false, expGained: 30, coinGained: 10, titles: ["PunchingBag", "HumanSiren"] },
      { userId: user3_Id, matchId: matchIds[7], isWin: true, expGained: 130, coinGained: 65, titles: ["WalkingHospital"] },
      { userId: user3_Id, matchId: matchIds[8], isWin: true, expGained: 140, coinGained: 75, titles: ["GrimReaper"] },
      { userId: user3_Id, matchId: matchIds[9], isWin: false, expGained: 15, coinGained: 2, titles: ["PrimeTarget"] },
      { userId: user3_Id, matchId: matchIds[10], isWin: true, expGained: 200, coinGained: 100, titles: ["GrimReaper", "WalkingHospital", "HumanSiren"] },
    ];
    await PlayerMatchHistory.create(historyData);

    // 4. LƯU VÀO DB
    console.log("⏳ Đang tạo Users...");
    await User.create([user1, user2, user3]);

    console.log("⏳ Đang tạo Players (Game Profiles)...");
    await Player.create([player1, player2, player3]);
    console.log("⏳ Đang tạo Match History (UserMatchHistory)...");
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
