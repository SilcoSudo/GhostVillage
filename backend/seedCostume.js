import mongoose from "mongoose";
import dotenv from "dotenv";
import Costume from "./src/modules/costume/costumeModel.js";

// Load environment variables
dotenv.config();

/**
 * Seed Costume Data
 * Script để khởi tạo dữ liệu mẫu cho costumes
 */

const costumesData = [
  {
    costumeId: "COSTUME_GHOST_KIMONO",
    name: "Ghost Kimono",
    description: "Traditional Japanese ghost kimono with ethereal white fabric and flowing sleeves. Perfect for haunting in style.",
    rarity: "Epic",
    category: "Full Body",
    visualAsset: "Assets/Costumes/GhostKimono.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/GhostKimono.png",
    price: 5000,
    isAvailableInStore: true,
    isActive: true,
    requiredLevel: 10,
    tags: ["japanese", "traditional", "elegant"],
    stats: {
      defense: 15,
      speed: 5,
      luck: 10,
    },
  },
  {
    costumeId: "COSTUME_SKELETON_SUIT",
    name: "Skeleton Suit",
    description: "Classic skeleton costume with realistic bone details. Glow in the dark feature included!",
    rarity: "Common",
    category: "Full Body",
    visualAsset: "Assets/Costumes/SkeletonSuit.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/SkeletonSuit.png",
    price: 1000,
    isAvailableInStore: true,
    isActive: true,
    requiredLevel: 1,
    tags: ["halloween", "classic", "spooky"],
    stats: {
      defense: 5,
      speed: 0,
      luck: 5,
    },
  },
  {
    costumeId: "COSTUME_PUMPKIN_HEAD",
    name: "Pumpkin Head",
    description: "Giant carved pumpkin head mask with glowing jack-o-lantern face. Halloween classic!",
    rarity: "Rare",
    category: "Head",
    visualAsset: "Assets/Costumes/PumpkinHead.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/PumpkinHead.png",
    price: 2500,
    specialPrice: 1500,
    isAvailableInStore: true,
    isActive: true,
    requiredLevel: 5,
    tags: ["halloween", "pumpkin", "festive"],
    stats: {
      defense: 8,
      speed: -2,
      luck: 15,
    },
  },
  {
    costumeId: "COSTUME_VAMPIRE_CLOAK",
    name: "Vampire Cloak",
    description: "Elegant vampire cloak with red satin lining and high collar. Includes bat transformation ability!",
    rarity: "Legendary",
    category: "Body",
    visualAsset: "Assets/Costumes/VampireCloak.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/VampireCloak.png",
    price: 15000,
    isAvailableInStore: true,
    isActive: true,
    isExclusive: true,
    requiredLevel: 25,
    tags: ["vampire", "legendary", "premium"],
    stats: {
      defense: 25,
      speed: 10,
      luck: 20,
    },
  },
  {
    costumeId: "COSTUME_WITCH_HAT",
    name: "Witch's Pointed Hat",
    description: "Classic black witch hat with purple ribbon. Increases spell casting speed.",
    rarity: "Rare",
    category: "Head",
    visualAsset: "Assets/Costumes/WitchHat.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/WitchHat.png",
    price: 3000,
    isAvailableInStore: true,
    isActive: true,
    requiredLevel: 8,
    tags: ["witch", "magic", "halloween"],
    stats: {
      defense: 5,
      speed: 3,
      luck: 25,
    },
  },
  {
    costumeId: "COSTUME_GHOST_SHEET",
    name: "Classic Ghost Sheet",
    description: "Simple white sheet with eye holes. The most traditional ghost costume ever. Ironically perfect for a ghost village!",
    rarity: "Common",
    category: "Full Body",
    visualAsset: "Assets/Costumes/GhostSheet.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/GhostSheet.png",
    price: 500,
    isAvailableInStore: true,
    isActive: true,
    requiredLevel: 1,
    tags: ["classic", "simple", "beginner"],
    stats: {
      defense: 3,
      speed: 5,
      luck: 5,
    },
  },
  {
    costumeId: "COSTUME_ZOMBIE_RAGS",
    name: "Zombie Rags",
    description: "Torn and tattered clothes covered in dirt and fake blood. Perfect zombie apocalypse look.",
    rarity: "Common",
    category: "Full Body",
    visualAsset: "Assets/Costumes/ZombieRags.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/ZombieRags.png",
    price: 800,
    isAvailableInStore: true,
    isActive: true,
    requiredLevel: 1,
    tags: ["zombie", "horror", "apocalypse"],
    stats: {
      defense: 2,
      speed: -3,
      luck: 3,
    },
  },
  {
    costumeId: "COSTUME_DEMON_HORNS",
    name: "Demon Horns",
    description: "Curved red demon horns with flame effects. Makes you look devilishly good.",
    rarity: "Epic",
    category: "Head",
    visualAsset: "Assets/Costumes/DemonHorns.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/DemonHorns.png",
    price: 6000,
    isAvailableInStore: true,
    isActive: true,
    requiredLevel: 15,
    tags: ["demon", "horns", "fire"],
    stats: {
      defense: 10,
      speed: 5,
      luck: 15,
    },
  },
  {
    costumeId: "COSTUME_ANGEL_WINGS",
    name: "Angel Wings",
    description: "Beautiful white feathered angel wings with golden glow. Grants slow fall ability.",
    rarity: "Epic",
    category: "Accessory",
    visualAsset: "Assets/Costumes/AngelWings.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/AngelWings.png",
    price: 7000,
    isAvailableInStore: true,
    isActive: true,
    requiredLevel: 18,
    tags: ["angel", "wings", "holy"],
    stats: {
      defense: 8,
      speed: 15,
      luck: 20,
    },
  },
  {
    costumeId: "COSTUME_NINJA_MASK",
    name: "Ninja Mask",
    description: "Sleek black ninja mask for stealthy ghost operations. Increases movement speed in shadows.",
    rarity: "Rare",
    category: "Head",
    visualAsset: "Assets/Costumes/NinjaMask.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/NinjaMask.png",
    price: 3500,
    isAvailableInStore: true,
    isActive: true,
    requiredLevel: 12,
    tags: ["ninja", "stealth", "speed"],
    stats: {
      defense: 7,
      speed: 20,
      luck: 10,
    },
  },
  {
    costumeId: "COSTUME_SANTA_SUIT",
    name: "Santa Claus Suit",
    description: "Festive Santa suit with fur trim. Ho ho ho! Only available during Christmas event.",
    rarity: "Legendary",
    category: "Full Body",
    visualAsset: "Assets/Costumes/SantaSuit.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/SantaSuit.png",
    price: 10000,
    specialPrice: 8000,
    isAvailableInStore: false,
    isActive: true,
    isExclusive: true,
    requiredLevel: 20,
    tags: ["christmas", "event", "limited"],
    stats: {
      defense: 20,
      speed: 5,
      luck: 30,
    },
  },
  {
    costumeId: "COSTUME_PIRATE_HAT",
    name: "Pirate Captain Hat",
    description: "Jolly Roger pirate hat with skull and crossbones. Arr matey!",
    rarity: "Rare",
    category: "Head",
    visualAsset: "Assets/Costumes/PirateHat.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/PirateHat.png",
    price: 2800,
    isAvailableInStore: true,
    isActive: true,
    requiredLevel: 7,
    tags: ["pirate", "adventure", "sea"],
    stats: {
      defense: 6,
      speed: 8,
      luck: 18,
    },
  },
  {
    costumeId: "COSTUME_SAMURAI_ARMOR",
    name: "Samurai Armor",
    description: "Traditional Japanese samurai armor with oni mask. Honor and strength embodied.",
    rarity: "Mythic",
    category: "Full Body",
    visualAsset: "Assets/Costumes/SamuraiArmor.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/SamuraiArmor.png",
    price: 25000,
    isAvailableInStore: true,
    isActive: true,
    isExclusive: true,
    requiredLevel: 30,
    tags: ["samurai", "legendary", "warrior"],
    stats: {
      defense: 40,
      speed: -5,
      luck: 25,
    },
  },
  {
    costumeId: "COSTUME_BUNNY_EARS",
    name: "Bunny Ears",
    description: "Cute fluffy bunny ears with pink bow. Hop hop!",
    rarity: "Common",
    category: "Head",
    visualAsset: "Assets/Costumes/BunnyEars.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/BunnyEars.png",
    price: 1200,
    isAvailableInStore: true,
    isActive: true,
    requiredLevel: 1,
    tags: ["cute", "bunny", "easter"],
    stats: {
      defense: 2,
      speed: 10,
      luck: 8,
    },
  },
  {
    costumeId: "COSTUME_CYBER_VISOR",
    name: "Cyber Visor",
    description: "Futuristic LED visor with HUD display. Enter the cyberpunk ghost era.",
    rarity: "Epic",
    category: "Head",
    visualAsset: "Assets/Costumes/CyberVisor.prefab",
    thumbnailAsset: "Assets/Costumes/Thumbnails/CyberVisor.png",
    price: 5500,
    isAvailableInStore: true,
    isActive: true,
    requiredLevel: 15,
    tags: ["cyberpunk", "tech", "futuristic"],
    stats: {
      defense: 12,
      speed: 12,
      luck: 12,
    },
  },
];

/**
 * Seed function
 */
async function seedCostumes() {
  try {
    // Kết nối MongoDB
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Xóa dữ liệu cũ (optional)
    console.log("🗑️  Clearing old costume data...");
    await Costume.deleteMany({});
    console.log("✅ Old data cleared");

    // Insert dữ liệu mới
    console.log("📦 Seeding costume data...");
    const result = await Costume.insertMany(costumesData);
    console.log(`✅ Successfully seeded ${result.length} costumes`);

    // Hiển thị thống kê
    const stats = await Costume.getStats();
    console.log("\n📊 COSTUME STATISTICS:");
    console.log(`   Total: ${stats.total}`);
    console.log(`   Active: ${stats.active}`);
    console.log(`   In Store: ${stats.inStore}`);
    console.log("\n   By Rarity:");
    stats.byRarity.forEach((item) => {
      console.log(`      ${item._id}: ${item.count}`);
    });
    console.log("\n   By Category:");
    stats.byCategory.forEach((item) => {
      console.log(`      ${item._id}: ${item.count}`);
    });

    console.log("\n✨ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding costumes:", error);
    process.exit(1);
  }
}

// Run seed
seedCostumes();
