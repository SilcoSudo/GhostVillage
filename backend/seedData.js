/**
 * GhostVillage-Web seedData.js — Node.js seeder (MongoDB Node driver)
 *
 * Usage:
 *   1) npm i mongodb
 *   2) PowerShell (Windows):
 *        $env:MONGO_URI="mongodb://localhost:27017"
 *        $env:DB_NAME="Ghostvillage_web_test"
 *        node backend/seedData.js
 *      Bash:
 *        MONGO_URI="mongodb://localhost:27017" DB_NAME="Ghostvillage_web_test" node backend/seedData.js
 *
 * ENV:
 *   - MONGO_URI   (default: mongodb://localhost:27017)
 *   - DB_NAME     (default: Ghostvillage_web_test)
 *
 * All users have password: "Password123"
 */

import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "Ghostvillage_web_test";

const oid = (s) => new ObjectId(s);
const d = (s) => new Date(s);

async function main() {
  const startSeed = Date.now();
  console.log("🌱 Starting GhostVillage-Web data seeding...");
  const client = new MongoClient(MONGO_URI, { ignoreUndefined: true });

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log(`🔗 Connected: ${MONGO_URI}/${DB_NAME}`);
    console.log("🧹 Dropping database (clean slate)...");
    await db.dropDatabase();

    // -------------------------
    // Collections data (minimal example)
    // -------------------------
    const users = [
      {
        _id: oid("66f000000000000000000001"),
        email: "admin@ghostvillage.dev",
        username: "admin",
        passwordHash:
          "$2a$10$SxeMzRb1oRXYbmYDcemu1uXojh0IU6srY6QbZoOrJUCmddUVDtDpS", // Password123
        roles: ["admin"],
        bio: "Site admin.",
        avatarUrl: "https://i.pravatar.cc/150?img=1",
        isDeactivated: false,
        karma: 100,
        lastLoginAt: null,
        emailVerifiedAt: d("2025-09-02T00:00:00Z"),
        verification: {},
        createdAt: d("2025-09-01T09:00:00Z"),
        updatedAt: d("2025-09-01T09:00:00Z"),
      },
      {
        _id: oid("66f000000000000000000002"),
        email: "user@ghostvillage.dev",
        username: "user",
        passwordHash:
          "$2a$10$SxeMzRb1oRXYbmYDcemu1uXojh0IU6srY6QbZoOrJUCmddUVDtDpS",
        roles: ["user"],
        bio: "Regular user.",
        avatarUrl: "https://i.pravatar.cc/150?img=2",
        isDeactivated: false,
        karma: 10,
        lastLoginAt: null,
        emailVerifiedAt: d("2025-09-02T00:00:00Z"),
        verification: {},
        createdAt: d("2025-09-02T01:00:00Z"),
        updatedAt: d("2025-09-02T01:00:00Z"),
      },
    ];

    const posts = [
      {
        _id: oid("66f130000000000000000001"),
        title: "Welcome to GhostVillage!",
        body: "This is the first post.",
        authorId: oid("66f000000000000000000001"),
        status: "approved",
        score: 1,
        deletedAt: null,
        createdAt: d("2025-11-26T08:00:00Z"),
        updatedAt: d("2025-11-26T08:00:00Z"),
      },
    ];

    // -------------------------
    // Insert (order matters)
    // -------------------------
    console.log("🧩 Inserting documents...");
    await db.collection("users").insertMany(users);
    await db.collection("posts").insertMany(posts);

    // -------------------------
    // Indexes (minimal)
    // -------------------------
    console.log("📚 Creating indexes...");
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    await db.collection("posts").createIndex({ authorId: 1 });
    await db.collection("posts").createIndex({ createdAt: -1 });

    console.log("✅ Seeded GhostVillage-Web database successfully.");
    console.log(`🌱 Seeding completed in ${Date.now() - startSeed}ms`);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
