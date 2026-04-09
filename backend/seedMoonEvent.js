import mongoose from "mongoose";
import MoonEvent from "./src/modules/moonEvent/moonEventModel.js";
import { config } from "dotenv";

config();

/**
 * Seed Data cho Moon Events
 * Tạo dữ liệu mẫu cho các sự kiện trăng trong game
 */
const moonEvents = [
  {
    eventId: "EVENT_MOON_FULL",
    displayName: "Trăng Tròn",
    description: "Đêm trăng tròn sáng rực, tầm nhìn xa hơn nhưng quái vật cũng dễ phát hiện người chơi hơn.",
    category: "MOON_PHASE",
    uiIcon: "moon_full",
    effectDescription: "Sáng, quái nhìn xa hơn",
    coinMultiplier: 2,
    expMultiplier: 1.5,
    isActive: true,
    scheduleType: "ALWAYS",
  },
  {
    eventId: "EVENT_MOON_NEW",
    displayName: "Trăng Non",
    description: "Đêm trăng non tối đen, tầm nhìn hạn chế nhưng dễ ẩn náu tránh quái.",
    category: "MOON_PHASE",
    uiIcon: "moon_new",
    effectDescription: "Tối, giảm tầm nhìn",
    coinMultiplier: 1.5,
    expMultiplier: 1.3,
    isActive: true,
    scheduleType: "ALWAYS",
  },
  {
    eventId: "EVENT_MOON_HALF",
    displayName: "Trăng Khuyết",
    description: "Đêm trăng khuyết, ánh sáng vừa phải, điều kiện chiến đấu cân bằng.",
    category: "MOON_PHASE",
    uiIcon: "moon_half",
    effectDescription: "Ánh sáng bình thường",
    coinMultiplier: 1,
    expMultiplier: 1,
    isActive: true,
    scheduleType: "ALWAYS",
  },
  {
    eventId: "EVENT_LUNAR_ECLIPSE",
    displayName: "Nguyệt Thực",
    description: "Hiện tượng nguyệt thực hiếm gặp, quái vật trở nên dữ tợn và mạnh hơn nhiều lần.",
    category: "SPECIAL",
    uiIcon: "moon_eclipse",
    effectDescription: "Quái Dữ, tăng sức mạnh quái vật",
    coinMultiplier: 3,
    expMultiplier: 2.5,
    isActive: true,
    scheduleType: "SCHEDULED",
  },
  {
    eventId: "EVENT_BLOOD_MOON",
    displayName: "Trăng Máu",
    description: "Sự kiện trăng máu đáng sợ, quái vật xuất hiện với số lượng và sức mạnh khủng khiếp.",
    category: "SPECIAL",
    uiIcon: "moon_blood",
    effectDescription: "Boss mạnh hơn, phần thưởng khủng",
    coinMultiplier: 3,
    expMultiplier: 2.5,
    isActive: true,
    scheduleType: "MANUAL",
  },
  {
    eventId: "EVENT_JUNGLE_ROAR",
    displayName: "Tiếng Gầm Rừng",
    description: "Tiếng gầm từ rừng sâu gây choáng và làm chậm người chơi.",
    category: "WEATHER",
    uiIcon: "icon_roar",
    effectDescription: "Âm thanh gây choáng",
    coinMultiplier: 1.5,
    expMultiplier: 1.5,
    isActive: true,
    scheduleType: "ALWAYS",
  },
  {
    eventId: "EVENT_SANDSTORM",
    displayName: "Bão Cát",
    description: "Cơn bão cát dữ dội che mờ tầm nhìn và gây sát thương theo thời gian.",
    category: "WEATHER",
    uiIcon: "sandstorm",
    effectDescription: "Giảm tầm nhìn, sát thương theo thời gian",
    coinMultiplier: 1.8,
    expMultiplier: 1.6,
    isActive: true,
    scheduleType: "ALWAYS",
  },
];

async function seedMoonEvents() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
    const DB_NAME = process.env.DB_NAME || "GhostVillage";
    await mongoose.connect(`${MONGO_URI}/${DB_NAME}`);
    console.log(" Connected to MongoDB");

    // Clear existing moon events
    await MoonEvent.deleteMany({});
    console.log("🗑️  Cleared existing Moon Events");

    // Insert new moon events
    const result = await MoonEvent.insertMany(moonEvents);
    console.log(` Successfully seeded ${result.length} Moon Events`);

    // Display seeded events
    console.log("\n📋 Seeded Moon Events:");
    result.forEach((event) => {
      console.log(
        `   - ${event.eventId} (${event.displayName}) - ${event.category} - ${
          event.isActive ? "ACTIVE" : "INACTIVE"
        }`
      );
    });

    console.log("\n Moon Event seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error(" Error seeding Moon Events:", error.message);
    process.exit(1);
  }
}

seedMoonEvents();
