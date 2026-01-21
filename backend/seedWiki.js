import mongoose from "mongoose";
import dotenv from "dotenv";
import Wiki from "./src/modules/forum/wiki/wikiModel.js";

dotenv.config();

// Game data from your JSON
const gameData = {
    monsters: [{
            id: "monster_001",
            name: "Ma Nữ Áo Trắng",
            title: "White Lady Ghost",
            description: "Một linh hồn lang thang trong làng, thường xuất hiện vào ban đêm.",
            lore: "Ma Nữ Áo Trắng là hồn ma của một người phụ nữ chết oan, mang theo oán khí mạnh mẽ. Cô ta bị thu hút bởi những kẻ đi lạc trong làng.",
            behavior: "Di chuyển chậm, nhưng sẽ tăng tốc khi người chơi quay lưng.",
            weakness: "Ánh sáng mạnh, đặc biệt là đèn pin đã được nâng cấp.",
            stats: {
                health: 150,
                speed: 2.5,
                damage: 25,
            },
            thumbnail: "/assets/monsters/white-lady.png",
        },
        {
            id: "monster_002",
            name: "Quỷ Gõ Cửa",
            title: "Door Knocking Demon",
            description: "Thực thể bí ẩn thường gõ cửa nhà hoang vào nửa đêm.",
            lore: "Người ta tin rằng nếu mở cửa sau tiếng gõ thứ ba, linh hồn sẽ bị kéo vào thế giới âm.",
            behavior: "Không tấn công trực tiếp, nhưng gây ảo giác và giảm sanity.",
            weakness: "Không phản ứng nếu người chơi giữ im lặng hoàn toàn.",
            stats: {
                health: 100,
                speed: 1.0,
                damage: 0,
                sanityDrain: 15,
            },
            thumbnail: "/assets/monsters/door-demon.png",
        },
    ],

    maps: [{
            id: "map_001",
            name: "Làng Hoang",
            title: "Abandoned Village",
            description: "Một ngôi làng bị bỏ hoang từ nhiều năm trước.",
            lore: "Sau một biến cố bí ẩn, toàn bộ dân làng biến mất chỉ trong một đêm.",
            areas: [{
                    name: "Nhà Trưởng Làng",
                    description: "Căn nhà lớn nhất làng, nơi ẩn chứa nhiều bí mật.",
                    spawnedMonsters: ["monster_001"],
                    itemsFound: ["item_k_001"],
                },
                {
                    name: "Miếu Cổ",
                    description: "Ngôi miếu thờ thần làng, nơi nguồn gốc thảm họa.",
                    spawnedMonsters: ["monster_002"],
                    itemsFound: ["item_c_001"],
                },
                {
                    name: "Khu Nhà Dân",
                    description: "Những căn nhà nhỏ đã bị bỏ hoang.",
                    itemsFound: ["item_c_002"],
                },
            ],
            dangerLevel: "High",
            recommendedLevel: "1-5",
            playerCount: "1-4",
            mapImage: "/assets/maps/village.jpg",
        },
        {
            id: "map_002",
            name: "Rừng Âm Hồn",
            title: "Whispering Forest",
            description: "Khu rừng dày đặc, nơi luôn vang lên những tiếng thì thầm kỳ lạ.",
            lore: "Rừng được cho là nơi linh hồn người chết lạc lối tụ họp.",
            areas: [{
                    name: "Lối Mòn Cũ",
                    description: "Con đường nhỏ xuyên qua rừng.",
                },
                {
                    name: "Cây Treo Cổ",
                    description: "Cây cổ thụ với dây thừng vẫn còn treo lủng lẳng.",
                    spawnedMonsters: ["monster_001"],
                },
                {
                    name: "Bìa Rừng",
                    description: "Lối vào rừng, nơi ánh sáng cuối cùng.",
                },
            ],
            dangerLevel: "Medium",
            recommendedLevel: "3-7",
            playerCount: "2-4",
            mapImage: "/assets/maps/forest.jpg",
        },
    ],

    items: {
        consumableItems: [{
                id: "item_c_001",
                name: "Bùa Trấn Hồn",
                title: "Spirit Seal Talisman",
                description: "Một lá bùa dùng để xua đuổi linh hồn trong thời gian ngắn.",
                effect: "Làm cho quái không thể tiếp cận người chơi trong 10 giây.",
                usage: "Single-use",
                rarity: "Uncommon",
                thumbnail: "/assets/items/talisman.png",
            },
            {
                id: "item_c_002",
                name: "Thuốc Ổn Định Tinh Thần",
                title: "Sanity Potion",
                description: "Giúp người chơi hồi phục trạng thái tinh thần.",
                effect: "Khôi phục 30% sanity.",
                usage: "Single-use",
                rarity: "Common",
                thumbnail: "/assets/items/potion.png",
            },
        ],
        keyItems: [{
                id: "item_k_001",
                name: "Chìa Khóa Nhà Trưởng Làng",
                title: "Village Chief's Key",
                description: "Chiếc chìa khóa cũ kỹ dẫn vào nhà trưởng làng.",
                lore: "Thuộc về người đứng đầu làng trước khi thảm họa xảy ra.",
                isQuestItem: true,
                thumbnail: "/assets/items/key.png",
            },
            {
                id: "item_k_002",
                name: "Nhật Ký Cũ",
                title: "Old Diary",
                description: "Cuốn nhật ký ghi chép những sự kiện kỳ lạ trước ngày làng biến mất.",
                lore: "Trang cuối bị xé mất, để lại nhiều câu hỏi chưa có lời giải.",
                isQuestItem: true,
                thumbnail: "/assets/items/diary.png",
            },
        ],
    },
};

// Seed wikis
const seedWikis = async() => {
        try {
            // Connect to MongoDB - use same DB name as server
            const dbUri = process.env.MONGO_URI ?
                `${process.env.MONGO_URI}/${process.env.DB_NAME || "GhostVillage"}` :
                "mongodb://localhost:27017/GhostVillage";
            await mongoose.connect(dbUri);
            console.log("✅ Connected to MongoDB:", dbUri);
            // Check if wikis already exist
            const existingCount = await Wiki.countDocuments({
                entityType: { $in: ['monster', 'map', 'item'] }
            });

            if (existingCount > 0) {
                console.log(`\n⚠️  Found ${existingCount} existing game wikis in database`);
                console.log("🗑️  Clearing existing game wikis...");
                const deleteResult = await Wiki.deleteMany({
                    entityType: { $in: ['monster', 'map', 'item'] }
                });
                console.log(`✅ Deleted ${deleteResult.deletedCount} existing wikis\n`);
            }

            // Create a default admin user ID (replace with actual admin ID)
            const defaultAuthorId = "679027c8993f8eb8a06b1598"; // Replace with real admin user ID

            const wikisToCreate = [];

            // === MONSTERS ===
            gameData.monsters.forEach((monster) => {
                        const content = `# ${monster.name} (${monster.title})

## Mô tả
${monster.description}

## Lore
${monster.lore}

## Hành vi
${monster.behavior}

## Điểm yếu
${monster.weakness}

## Thông số
- **HP**: ${monster.stats.health}
- **Tốc độ**: ${monster.stats.speed}
- **Sát thương**: ${monster.stats.damage}
${monster.stats.sanityDrain ? `- **Sanity Drain**: ${monster.stats.sanityDrain}` : ""}

## Chiến thuật
- Luôn giữ khoảng cách an toàn
- Sử dụng ánh sáng để làm yếu đi
- Không quay lưng lại nếu có thể
`;

      wikisToCreate.push({
        title: `${monster.name} - ${monster.title}`,
        slug: `monster-${monster.id}`,
        content,
        excerpt: monster.description,
        category: "Monster Database",
        tags: ["monster", "enemy", monster.name.toLowerCase()],
        gameData: monster,
        entityType: "monster",
        entityId: monster.id,
        author: defaultAuthorId,
        coverImage: monster.thumbnail,
        status: "published",
        isFeatured: false,
        publishedAt: new Date(),
      });
    });

    // === MAPS ===
    gameData.maps.forEach((map) => {
      const areasText = map.areas
        .map(
          (area) => `### ${area.name}
${area.description}
${area.spawnedMonsters ? `- **Monsters**: ${area.spawnedMonsters.join(", ")}` : ""}
${area.itemsFound ? `- **Items**: ${area.itemsFound.join(", ")}` : ""}
`
        )
        .join("\n");

      const content = `# ${map.name} (${map.title})

## Mô tả
${map.description}

## Lore
${map.lore}

## Thông tin
- **Danger Level**: ${map.dangerLevel}
- **Recommended Level**: ${map.recommendedLevel}
- **Player Count**: ${map.playerCount}

## Khu vực
${areasText}

## Lời khuyên
- Chuẩn bị đầy đủ vật phẩm trước khi vào
- Đi theo nhóm để tăng cơ hội sống sót
- Chú ý đến danger level
`;

      wikisToCreate.push({
        title: `${map.name} - ${map.title}`,
        slug: `map-${map.id}`,
        content,
        excerpt: map.description,
        category: "Map Guide",
        tags: ["map", "location", map.dangerLevel.toLowerCase()],
        gameData: map,
        entityType: "map",
        entityId: map.id,
        author: defaultAuthorId,
        coverImage: map.mapImage,
        status: "published",
        isFeatured: map.id === "map_001", // Featured first map
        publishedAt: new Date(),
      });
    });

    // === ITEMS (Consumable) ===
    gameData.items.consumableItems.forEach((item) => {
      const content = `# ${item.name} (${item.title})

## Mô tả
${item.description}

## Hiệu ứng
${item.effect}

## Thông tin
- **Usage**: ${item.usage}
- **Rarity**: ${item.rarity}

## Cách sử dụng
Nhấn phím tương ứng trong inventory để sử dụng ngay lập tức.

## Lời khuyên
- Chỉ sử dụng khi thực sự cần thiết
- Ưu tiên giữ cho các tình huống khẩn cấp
`;

      wikisToCreate.push({
        title: `${item.name} - ${item.title}`,
        slug: `item-${item.id}`,
        content,
        excerpt: item.description,
        category: "Item Database",
        tags: ["item", "consumable", item.rarity.toLowerCase()],
        gameData: item,
        entityType: "item",
        entityId: item.id,
        author: defaultAuthorId,
        coverImage: item.thumbnail,
        status: "published",
        isFeatured: false,
        publishedAt: new Date(),
      });
    });

    // === ITEMS (Key Items) ===
    gameData.items.keyItems.forEach((item) => {
      const content = `# ${item.name} (${item.title})

## Mô tả
${item.description}

## Lore
${item.lore}

## Loại vật phẩm
Quest Item - Không thể bỏ đi

## Cách lấy
Tìm thấy trong các khu vực đặc biệt trên bản đồ.

## Công dụng
Vật phẩm nhiệm vụ cần thiết để tiến triển trong game.
`;

      wikisToCreate.push({
        title: `${item.name} - ${item.title}`,
        slug: `item-${item.id}`,
        content,
        excerpt: item.description,
        category: "Item Database",
        tags: ["item", "quest-item", "key-item"],
        gameData: item,
        entityType: "item",
        entityId: item.id,
        author: defaultAuthorId,
        coverImage: item.thumbnail,
        status: "published",
        isFeatured: false,
        publishedAt: new Date(),
      });
    });

    // Insert all wikis
    const created = await Wiki.insertMany(wikisToCreate);
    console.log(`✅ Created ${created.length} wiki entries`);

    // Summary
    console.log("\n📊 Summary:");
    console.log(`   - Monsters: ${gameData.monsters.length}`);
    console.log(`   - Maps: ${gameData.maps.length}`);
    console.log(
      `   - Items: ${gameData.items.consumableItems.length + gameData.items.keyItems.length}`
    );
    console.log(`   - Total wikis: ${created.length}`);

    console.log("\n✨ Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding wikis:", error);
    process.exit(1);
  }
};

// Run seed
seedWikis();