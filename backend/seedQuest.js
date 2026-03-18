import mongoose from "mongoose";
import dotenv from "dotenv";
import Quest from "./src/modules/quest/questModel.js";

dotenv.config();

const questsData = [
  {
    questId: "QUEST_MAIN_001",
    title: "The Awakening",
    description: "Investigate the strange occurrences in the village and discover the truth behind the ghostly presence.",
    story: "Strange lights have been seen near the old temple. The village elder believes an ancient evil has awakened. You must investigate and find out what's happening.",
    questLine: "Main Story",
    chapter: "Chapter 1: The Beginning",
    prerequisites: [],
    objectives: [
      {
        type: "reach",
        description: "Reach the Old Temple",
        target: "MAP_TEMPLE_GATE",
        required: 1,
        current: 0,
      },
      {
        type: "interact",
        description: "Talk to the Priestess",
        target: "NPC_PRIESTESS",
        required: 1,
        current: 0,
      },
    ],
    rewards: {
      exp: 500,
      coin: 200,
      items: [
        { itemId: "ITEM_SACRED_TALISMAN", quantity: 1 },
      ],
      titles: [],
    },
    difficulty: "Easy",
    levelRequired: 1,
    timeLimit: null,
    isRepeatable: false,
    cooldown: 0,
    isActive: true,
    npcGiver: "NPC_ELDER",
    location: "Village Center",
    tags: ["main", "story", "tutorial"],
  },
  {
    questId: "QUEST_MAIN_002",
    title: "Purify the Temple",
    description: "Clear the temple of evil spirits and restore its sanctity.",
    story: "The temple has been corrupted by dark forces. You must defeat the spirits within and cleanse the sacred grounds.",
    questLine: "Main Story",
    chapter: "Chapter 1: The Beginning",
    prerequisites: ["QUEST_MAIN_001"],
    objectives: [
      {
        type: "kill",
        description: "Defeat Temple Spirits",
        target: "MONSTER_TEMPLE_SPIRIT",
        required: 5,
        current: 0,
      },
      {
        type: "interact",
        description: "Light the Sacred Flame",
        target: "OBJECT_SACRED_FLAME",
        required: 1,
        current: 0,
      },
    ],
    rewards: {
      exp: 1000,
      coin: 500,
      items: [
        { itemId: "ITEM_BLESSED_WATER", quantity: 3 },
      ],
      titles: ["Temple Guardian"],
    },
    difficulty: "Medium",
    levelRequired: 3,
    timeLimit: 1800, // 30 minutes
    isRepeatable: false,
    cooldown: 0,
    isActive: true,
    npcGiver: "NPC_PRIESTESS",
    location: "Old Temple",
    tags: ["main", "story", "combat"],
  },
  {
    questId: "QUEST_SIDE_001",
    title: "Lost Child",
    description: "A child has gone missing near the forest. Find and bring them back safely.",
    story: "A worried mother asks for your help finding her child who wandered into the haunted forest.",
    questLine: "Side Quest",
    chapter: null,
    prerequisites: [],
    objectives: [
      {
        type: "reach",
        description: "Search the Haunted Forest",
        target: "MAP_HAUNTED_FOREST",
        required: 1,
        current: 0,
      },
      {
        type: "escort",
        description: "Escort the child back to village",
        target: "NPC_LOST_CHILD",
        required: 1,
        current: 0,
      },
    ],
    rewards: {
      exp: 300,
      coin: 150,
      items: [
        { itemId: "ITEM_HEALTH_POTION", quantity: 2 },
      ],
      titles: [],
    },
    difficulty: "Easy",
    levelRequired: 1,
    timeLimit: null,
    isRepeatable: false,
    cooldown: 0,
    isActive: true,
    npcGiver: "NPC_WORRIED_MOTHER",
    location: "Village Center",
    tags: ["side", "rescue", "easy"],
  },
  {
    questId: "QUEST_DAILY_001",
    title: "Spirit Hunter",
    description: "Eliminate wandering spirits to keep the village safe.",
    story: "Every day, new spirits emerge. Help protect the villagers by hunting them down.",
    questLine: "Daily",
    chapter: null,
    prerequisites: [],
    objectives: [
      {
        type: "kill",
        description: "Defeat any spirits",
        target: "ANY_SPIRIT",
        required: 10,
        current: 0,
      },
    ],
    rewards: {
      exp: 200,
      coin: 100,
      items: [
        { itemId: "ITEM_SPIRIT_ESSENCE", quantity: 5 },
      ],
      titles: [],
    },
    difficulty: "Easy",
    levelRequired: 1,
    timeLimit: 86400, // 24 hours
    isRepeatable: true,
    cooldown: 86400, // Reset daily
    isActive: true,
    npcGiver: "NPC_GUARD_CAPTAIN",
    location: "Village Gate",
    tags: ["daily", "combat", "repeatable"],
  },
  {
    questId: "QUEST_WEEKLY_001",
    title: "The Collector",
    description: "Gather rare items for the village researcher.",
    story: "The village researcher needs rare materials for her experiments. Help her collect these items.",
    questLine: "Weekly",
    chapter: null,
    prerequisites: [],
    objectives: [
      {
        type: "collect",
        description: "Collect Ghost Orbs",
        target: "ITEM_GHOST_ORB",
        required: 20,
        current: 0,
      },
      {
        type: "collect",
        description: "Collect Cursed Artifacts",
        target: "ITEM_CURSED_ARTIFACT",
        required: 5,
        current: 0,
      },
    ],
    rewards: {
      exp: 1500,
      coin: 1000,
      items: [
        { itemId: "ITEM_RESEARCH_NOTES", quantity: 1 },
        { itemId: "ITEM_LEGENDARY_CHEST", quantity: 1 },
      ],
      titles: ["Collector"],
    },
    difficulty: "Hard",
    levelRequired: 10,
    timeLimit: 604800, // 7 days
    isRepeatable: true,
    cooldown: 604800, // Reset weekly
    isActive: true,
    npcGiver: "NPC_RESEARCHER",
    location: "Research Lab",
    tags: ["weekly", "collection", "hard"],
  },
  {
    questId: "QUEST_SIDE_002",
    title: "The Haunted Well",
    description: "Investigate the mysterious sounds coming from the old well.",
    story: "Villagers have reported hearing strange voices from the abandoned well. Discover what lurks below.",
    questLine: "Side Quest",
    chapter: null,
    prerequisites: ["QUEST_MAIN_001"],
    objectives: [
      {
        type: "reach",
        description: "Investigate the Old Well",
        target: "MAP_OLD_WELL",
        required: 1,
        current: 0,
      },
      {
        type: "kill",
        description: "Defeat the Well Spirit",
        target: "MONSTER_WELL_SPIRIT",
        required: 1,
        current: 0,
      },
    ],
    rewards: {
      exp: 800,
      coin: 400,
      items: [
        { itemId: "ITEM_WATER_STONE", quantity: 1 },
      ],
      titles: ["Well Cleaner"],
    },
    difficulty: "Medium",
    levelRequired: 5,
    timeLimit: null,
    isRepeatable: false,
    cooldown: 0,
    isActive: true,
    npcGiver: "NPC_VILLAGE_ELDER",
    location: "Village Square",
    tags: ["side", "combat", "mystery"],
  },
  {
    questId: "QUEST_TUTORIAL_001",
    title: "First Steps",
    description: "Learn the basics of surviving in the ghost village.",
    story: "Welcome to Ghost Village. Let's learn the basics before you venture out.",
    questLine: "Tutorial",
    chapter: "Tutorial",
    prerequisites: [],
    objectives: [
      {
        type: "interact",
        description: "Talk to the Guide",
        target: "NPC_GUIDE",
        required: 1,
        current: 0,
      },
      {
        type: "collect",
        description: "Pick up a Torch",
        target: "ITEM_TORCH",
        required: 1,
        current: 0,
      },
      {
        type: "reach",
        description: "Reach the Training Ground",
        target: "MAP_TRAINING_GROUND",
        required: 1,
        current: 0,
      },
    ],
    rewards: {
      exp: 100,
      coin: 50,
      items: [
        { itemId: "ITEM_STARTER_KIT", quantity: 1 },
      ],
      titles: [],
    },
    difficulty: "Easy",
    levelRequired: 1,
    timeLimit: null,
    isRepeatable: false,
    cooldown: 0,
    isActive: true,
    npcGiver: "NPC_GUIDE",
    location: "Starting Area",
    tags: ["tutorial", "beginner", "guide"],
  },
  {
    questId: "QUEST_EVENT_001",
    title: "Harvest Moon Festival",
    description: "Participate in the special Harvest Moon event and earn exclusive rewards.",
    story: "During the Harvest Moon, spirits are more active. The village holds a festival to keep them at bay. Join the celebration!",
    questLine: "Event",
    chapter: "Harvest Moon Event",
    prerequisites: [],
    objectives: [
      {
        type: "collect",
        description: "Collect Moon Tokens",
        target: "ITEM_MOON_TOKEN",
        required: 50,
        current: 0,
      },
      {
        type: "kill",
        description: "Defeat Moon Spirits",
        target: "MONSTER_MOON_SPIRIT",
        required: 15,
        current: 0,
      },
    ],
    rewards: {
      exp: 2000,
      coin: 1500,
      items: [
        { itemId: "ITEM_MOON_CROWN", quantity: 1 },
        { itemId: "ITEM_EVENT_CHEST", quantity: 1 },
      ],
      titles: ["Moon Festival Hero"],
    },
    difficulty: "Hard",
    levelRequired: 8,
    timeLimit: 259200, // 3 days
    isRepeatable: false,
    cooldown: 0,
    isActive: false, // Event not active by default
    npcGiver: "NPC_FESTIVAL_ORGANIZER",
    location: "Festival Square",
    tags: ["event", "limited", "special"],
  },
];

async function seedQuests() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

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
          _id: "$questLine",
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
        `  - ${item._id}: ${item.count} quests (${item.active} active)`
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
