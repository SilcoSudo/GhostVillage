import mongoose from "mongoose";
import Monster from "./src/modules/monster/monsterModel.js";
import { config } from "dotenv";

config();

/**
 * Seed Data cho Monster
 * Tạo dữ liệu mẫu cho quái vật trong game
 */
const monsters = [
  {
    name: "Slime xanh",
    avatar: "/images/monsters/green-slime.png",
    hp: 50,
    atk: 5,
    def: 2,
    spawnRate: 80,
    isActive: true,
  },
  {
    name: "Goblin chiến binh",
    avatar: "/images/monsters/goblin-warrior.png",
    hp: 100,
    atk: 15,
    def: 8,
    spawnRate: 60,
    isActive: true,
  },
  {
    name: "Sói hoang",
    avatar: "/images/monsters/wild-wolf.png",
    hp: 80,
    atk: 20,
    def: 5,
    spawnRate: 50,
    isActive: true,
  },
  {
    name: "Rồng lửa nhỏ",
    avatar: "/images/monsters/baby-fire-dragon.png",
    hp: 200,
    atk: 35,
    def: 15,
    spawnRate: 30,
    isActive: true,
  },
  {
    name: "Zombie đói",
    avatar: "/images/monsters/hungry-zombie.png",
    hp: 120,
    atk: 18,
    def: 10,
    spawnRate: 45,
    isActive: true,
  },
  {
    name: "Skeleton lính",
    avatar: "/images/monsters/skeleton-soldier.png",
    hp: 90,
    atk: 22,
    def: 12,
    spawnRate: 55,
    isActive: true,
  },
  {
    name: "Orc chiến binh",
    avatar: "/images/monsters/orc-warrior.png",
    hp: 250,
    atk: 40,
    def: 20,
    spawnRate: 25,
    isActive: true,
  },
  {
    name: "Ma pháp sư bóng tối",
    avatar: "/images/monsters/dark-wizard.png",
    hp: 180,
    atk: 45,
    def: 10,
    spawnRate: 20,
    isActive: true,
  },
  {
    name: "Golem đá",
    avatar: "/images/monsters/stone-golem.png",
    hp: 400,
    atk: 30,
    def: 35,
    spawnRate: 15,
    isActive: true,
  },
  {
    name: "Rồng băng cổ đại",
    avatar: "/images/monsters/ancient-ice-dragon.png",
    hp: 800,
    atk: 80,
    def: 50,
    spawnRate: 5,
    isActive: true,
  },
  {
    name: "Goblin thợ săn",
    avatar: "/images/monsters/goblin-hunter.png",
    hp: 75,
    atk: 12,
    def: 6,
    spawnRate: 70,
    isActive: true,
  },
  {
    name: "Nhện độc khổng lồ",
    avatar: "/images/monsters/giant-spider.png",
    hp: 150,
    atk: 25,
    def: 8,
    spawnRate: 40,
    isActive: true,
  },
];

const seedMonsters = async () => {
  try {
    // Kết nối MongoDB
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
    const DB_NAME = process.env.DB_NAME || "GhostVillage";
    await mongoose.connect(`${MONGO_URI}/${DB_NAME}`);

    console.log("🔗 Connected to MongoDB");

    // Xóa dữ liệu cũ
    await Monster.deleteMany({});
    console.log("🗑️  Cleared existing monsters");

    // Thêm dữ liệu mới
    const insertedMonsters = await Monster.insertMany(monsters);
    console.log(` Successfully seeded ${insertedMonsters.length} monsters`);

    // Hiển thị danh sách
    console.log("\n📋 Seeded Monsters:");
    insertedMonsters.forEach((monster, index) => {
      console.log(
        `${index + 1}. ${monster.name} - HP: ${monster.hp}, ATK: ${monster.atk}, DEF: ${monster.def}, Spawn Rate: ${monster.spawnRate}%`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error(" Error seeding monsters:", error);
    process.exit(1);
  }
};

seedMonsters();
