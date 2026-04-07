import mongoose from "mongoose";
import dotenv from "dotenv";
import Quest from "./src/modules/quest/questModel.js";

dotenv.config();

const questsData = [
  // ==========================================
  // NHIỆM VỤ HÀNG NGÀY (DAILY) - titleId: null
  // ==========================================
  {
    questId: "QUEST_DAILY_PLAY_2",
    questName: "Hardworking Survivor",
    description: "Complete 2 matches.",
    questType: "DAILY",
    actionType: "PLAY_MATCH",
    targetCount: 2,
    reward: {
      coin: 100,
      exp: 100,
      titleId: null,
    },
    isActive: true,
  },
  {
    questId: "QUEST_DAILY_WIN_1",
    questName: "Taste of Victory",
    description: "Survive and escape the village 1 time.",
    questType: "DAILY",
    actionType: "WIN_MATCH",
    targetCount: 1,
    reward: {
      coin: 100,
      exp: 100,
      titleId: null,
    },
    isActive: true,
  },
  {
    questId: "QUEST_DAILY_KILL_5",
    questName: "Monster Hunter",
    description: "Kill 5 small monsters.",
    questType: "DAILY",
    actionType: "KILL_SMALL_MONSTER",
    targetCount: 5,
    reward: {
      coin: 100,
      exp: 100,
      titleId: null,
    },
    isActive: true,
  },
  {
    questId: "QUEST_DAILY_RESCUE_3",
    questName: "Combat Medic",
    description: "Rescue a knocked-down teammate 3 times.",
    questType: "DAILY",
    actionType: "RESCUE_TEAMMATE",
    targetCount: 3,
    reward: {
      coin: 300,
      exp: 50,
      titleId: null,
    },
    isActive: true,
  },

  // ==========================================
  // THÀNH TỰU (ACHIEVEMENT) - Đã chèn Medal ID vào titleId
  // ==========================================
  {
    questId: "QUEST_ACHV_RESCUE_100",
    questName: "Guardian Angel",
    description: "Rescue knocked-down teammates 100 times in total.",
    questType: "ACHIEVEMENT",
    actionType: "RESCUE_TEAMMATE",
    targetCount: 100,
    reward: {
      coin: 100,
      exp: 100,
      titleId: "RESCUE_100", // <-- Nhận được huy chương RESCUE_100
    },
    isActive: true,
  },
  {
    questId: "QUEST_ACHV_WIN_100",
    questName: "Escape Artist",
    description: "Successfully escape the map 100 times.",
    questType: "ACHIEVEMENT",
    actionType: "WIN_MATCH",
    targetCount: 100,
    reward: {
      coin: 100,
      exp: 100,
      titleId: "WIN_100", // <-- Nhận được huy chương WIN_100
    },
    isActive: true,
  },
  {
    questId: "QUEST_ACHV_PLAY_100",
    questName: "Veteran Survivor",
    description: "Play a total of 100 matches.",
    questType: "ACHIEVEMENT",
    actionType: "PLAY_MATCH",
    targetCount: 100,
    reward: {
      coin: 100,
      exp: 100,
      titleId: "PLAY_100", // <-- Nhận được huy chương PLAY_100
    },
    isActive: true,
  },
  {
    questId: "QUEST_ACHV_SIREN_20",
    questName: "Attention Seeker",
    description: "Use the siren item 20 times to alert the monster.",
    questType: "ACHIEVEMENT",
    actionType: "USE_SIREN",
    targetCount: 20,
    reward: {
      coin: 100,
      exp: 100,
      titleId: "SIREN_20", // <-- Nhận được huy chương SIREN_20
    },
    isActive: true,
  },
  {
    questId: "QUEST_ACHV_KILL_100",
    questName: "Exterminator",
    description: "Eliminate a total of 100 small monsters.",
    questType: "ACHIEVEMENT",
    actionType: "KILL_SMALL_MONSTER",
    targetCount: 100,
    reward: {
      coin: 100,
      exp: 100,
      titleId: "KILL_100", // <-- Nhận được huy chương KILL_100
    },
    isActive: true,
  },
  {
    questId: "QUEST_ACHV_SCREAM_20",
    questName: "Human Siren",
    description: "Scream into the microphone 20 times during matches.",
    questType: "ACHIEVEMENT",
    actionType: "SCREAM",
    targetCount: 20,
    reward: {
      coin: 100,
      exp: 100,
      titleId: "SCREAM_20", // <-- Nhận được huy chương SCREAM_20
    },
    isActive: true,
  },
  {
    questId: "QUEST_ACHV_KNOCK_100",
    questName: "Punching Bag",
    description: "Get knocked down by monsters 100 times. Are you okay? Lmaooo",
    questType: "ACHIEVEMENT",
    actionType: "GET_KNOCKED",
    targetCount: 100,
    reward: {
      coin: 100,
      exp: 100,
      titleId: "KNOCK_100", // <-- Nhận được huy chương KNOCK_100
    },
    isActive: true,
  },
];

async function seedQuests() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 Connected to MongoDB");

    // Clear existing quest data
    const deleteResult = await Quest.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing quests`);

    // Insert sample quests
    const insertedQuests = await Quest.insertMany(questsData);
    console.log(`✅ Successfully inserted ${insertedQuests.length} quests`);

    // Display summary
    console.log("\n📊 Quest Summary:");
    const summary = await Quest.aggregate([
      {
        $group: {
          _id: "$questType",
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    summary.forEach((item) => {
      console.log(
        `  - ${item._id}: ${item.count} quests (${item.active} active)`,
      );
    });

    console.log("\n🎉 Quest seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding quests:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the seeder
seedQuests();
