import mongoose from "mongoose";
import MoonEvent from "./src/modules/moonEvent/moonEventModel.js";
import { config } from "dotenv";

config();

/**
 * Seed Data cho Moon Events (Đã đồng bộ cấu trúc với Unity DTO)
 */
const moonEvents = [
  {
    eventId: "EVENT_MOON_FULL",
    eventName: "Trăng Tròn",
    description: "Tầm nhìn rõ ràng. Ông Kẹ ở trạng thái bình thường.",
    uiIcon: "icon_moon_full",
    isActive: true,
    weight: 60, // Tỉ lệ ra nhiều nhất
    environmentModifiers: {
      globalLightIntensity: 1.0,
      fogDensity: 1.0,
    },
    monsterBuffMultipliers: {
      speedMultiplier: 1.0,
      detectionRangeMultiplier: 1.0,
      chaseRangeMultiplier: 1.0,
      cooldownMultiplier: 1.0,
    },
    rewardMultipliers: {
      expMultiplier: 1.0,
      coinMultiplier: 1.0,
    },
  },
  {
    eventId: "EVENT_MOON_NEW",
    eventName: "Trăng Khuyết",
    description:
      "Bóng tối bao trùm. Tầm nhìn hẹp lại nhưng bạn cũng khó bị phát hiện hơn.",
    uiIcon: "icon_moon_new",
    isActive: true,
    weight: 30, // Tỉ lệ vừa phải
    environmentModifiers: {
      globalLightIntensity: 0.5,
      fogDensity: 2.0,
    },
    monsterBuffMultipliers: {
      speedMultiplier: 1.0, // Tốc độ giữ nguyên
      detectionRangeMultiplier: 0.8, // Quái khó nhìn thấy người chơi hơn
      chaseRangeMultiplier: 1.0,
      cooldownMultiplier: 1.0,
    },
    rewardMultipliers: {
      expMultiplier: 1.2, // Tăng nhẹ do tối khó chơi
      coinMultiplier: 1.2,
    },
  },
  {
    eventId: "EVENT_MOON_RED",
    eventName: "Trăng Máu",
    description:
      "Bầu trời đỏ rực. Ông Kẹ phát điên, chạy nhanh và ra đòn liên tục.",
    uiIcon: "icon_moon_red",
    isActive: true,
    weight: 10, // Rất hiếm
    environmentModifiers: {
      globalLightIntensity: 0.8,
      fogDensity: 1.2,
    },
    monsterBuffMultipliers: {
      speedMultiplier: 1.3, // Chạy nhanh hơn 30%
      detectionRangeMultiplier: 1.5, // Nhìn xa hơn 50%
      chaseRangeMultiplier: 1.5,
      cooldownMultiplier: 0.7,
    },
    rewardMultipliers: {
      expMultiplier: 2.0, // Nhân đôi EXP
      coinMultiplier: 2.0, // Nhân đôi Tiền
    },
  },
];

async function seedMoonEvents() {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
    const DB_NAME = process.env.DB_NAME || "GhostVillage";
    await mongoose.connect(`${MONGO_URI}/${DB_NAME}`);
    console.log("✅ Connected to MongoDB");

    // Clear existing moon events
    await MoonEvent.deleteMany({});
    console.log("🗑️ Cleared existing Moon Events");

    // Insert new moon events
    const result = await MoonEvent.insertMany(moonEvents);
    console.log(`🎉 Successfully seeded ${result.length} Moon Events`);

    // Display seeded events
    console.log("\n📋 Seeded Moon Events:");
    result.forEach((event) => {
      console.log(
        `   - ${event.eventId} (${event.eventName}) - Tỉ lệ: ${event.weight} - Active: ${event.isActive}`,
      );
    });

    console.log("\n🚀 Moon Event seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding Moon Events:", error.message);
    process.exit(1);
  }
}

seedMoonEvents();
