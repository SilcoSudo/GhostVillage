import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/modules/user/userModel.js";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "GhostVillage";

const seedUsers = async () => {
  try {
    await mongoose.connect(`${MONGO_URI}/${DB_NAME}`);
    console.log("🔌 Đã kết nối MongoDB");
    console.log("=========================================");
    console.log("🗑️  Bắt đầu seed users...");
    console.log("=========================================");

  // =========================================================
  // USERS
  // =========================================================
  console.log('⏳ Seeding users...');
  await User.deleteMany({});
  await User.insertMany([
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e3"),
      email: "oracle@ghostvillage.local",
      fullname: "Iris Moon",
      password: "$2a$10$LCqayyyUvOtkU3UXIEx83eq2Uu9vaQHwQHnrnUw/NTyy4wI2x5yGC",
      googleId: "google-oracle-002",
      dateOfBirth: new Date("1997-05-09T00:00:00.000Z"),
      avatar: "/avatars/oracle.png",
      bio: "Reads patterns faster than anyone else.",
      isMute: true,
      moderation: {
        violationCount: 2,
        lastViolationAt: new Date("2026-04-11T02:37:09.442Z"),
        mutedUntil: new Date("2026-04-16T02:37:09.442Z"),
        lastAction: "mute",
        lastActionAt: new Date("2026-04-11T02:37:09.442Z")
      },
      role: "user",
      bookmarks: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359eb")
      ],
      verificationTokenHash: null,
      verificationUsed: true,
      isVerified: true,
      verificationExpires: null,
      resetPasswordTokenHash: "oracle-reset-hash",
      resetPasswordExpires: new Date("2026-04-16T02:37:09.442Z"),
      emailVisibility: false,
      friends: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0")
      ],
      savedPosts: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ee")
      ],
      createdAt: new Date("2026-04-15T02:37:09.549Z"),
      updatedAt: new Date("2026-04-15T02:37:09.549Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0"),
      email: "admin@ghostvillage.local",
      fullname: "Avery Vale",
      password: "$2a$10$LCqayyyUvOtkU3UXIEx83eq2Uu9vaQHwQHnrnUw/NTyy4wI2x5yGC",
      googleId: "google-admin-001",
      dateOfBirth: new Date("1990-02-14T00:00:00.000Z"),
      avatar: "/avatars/admin.png",
      bio: "Community admin and content curator.",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "none",
        lastActionAt: null
      },
      role: "admin",
      bookmarks: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea"),
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ee")
      ],
      verificationTokenHash: "admin-verification-hash",
      verificationUsed: true,
      isVerified: true,
      verificationExpires: new Date("2026-05-15T02:37:09.442Z"),
      resetPasswordTokenHash: "admin-reset-hash",
      resetPasswordExpires: new Date("2026-04-17T02:37:09.442Z"),
      emailVisibility: true,
      friends: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e2"),
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e3")
      ],
      savedPosts: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea"),
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ed")
      ],
      createdAt: new Date("2026-04-15T02:37:09.549Z"),
      updatedAt: new Date("2026-04-15T02:37:09.549Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1"),
      email: "support@ghostvillage.local",
      fullname: "Mara Chen",
      password: "$2a$10$LCqayyyUvOtkU3UXIEx83eq2Uu9vaQHwQHnrnUw/NTyy4wI2x5yGC",
      googleId: null,
      dateOfBirth: new Date("1992-08-21T00:00:00.000Z"),
      avatar: "/avatars/support.png",
      bio: "Support lead and moderator.",
      isMute: false,
      moderation: {
        violationCount: 1,
        lastViolationAt: new Date("2026-03-26T02:37:09.442Z"),
        mutedUntil: new Date("2026-04-18T02:37:09.442Z"),
        lastAction: "warning",
        lastActionAt: new Date("2026-03-26T02:37:09.442Z")
      },
      role: "admin",
      bookmarks: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ee")
      ],
      verificationTokenHash: "support-verification-hash",
      verificationUsed: true,
      isVerified: true,
      verificationExpires: new Date("2026-05-15T02:37:09.442Z"),
      resetPasswordTokenHash: "support-reset-hash",
      resetPasswordExpires: new Date("2026-04-20T02:37:09.442Z"),
      emailVisibility: false,
      friends: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e4")
      ],
      savedPosts: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359eb")
      ],
      createdAt: new Date("2026-04-15T02:37:09.549Z"),
      updatedAt: new Date("2026-04-15T02:37:09.549Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e2"),
      email: "hunter@ghostvillage.local",
      fullname: "Noah Fox",
      password: "$2a$10$LCqayyyUvOtkU3UXIEx83eq2Uu9vaQHwQHnrnUw/NTyy4wI2x5yGC",
      googleId: null,
      dateOfBirth: new Date("1996-11-03T00:00:00.000Z"),
      avatar: "/avatars/hunter.png",
      bio: "Front-line hunter and map runner.",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "none",
        lastActionAt: null
      },
      role: "user",
      bookmarks: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ed"),
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea")
      ],
      verificationTokenHash: null,
      verificationUsed: true,
      isVerified: true,
      verificationExpires: null,
      resetPasswordTokenHash: "hunter-reset-hash",
      resetPasswordExpires: new Date("2026-04-22T02:37:09.442Z"),
      emailVisibility: true,
      friends: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e0")
      ],
      savedPosts: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ec"),
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea")
      ],
      createdAt: new Date("2026-04-15T02:37:09.549Z"),
      updatedAt: new Date("2026-04-15T02:37:09.549Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e4"),
      email: "wanderer@ghostvillage.local",
      fullname: "Leo Ward",
      password: "$2a$10$LCqayyyUvOtkU3UXIEx83eq2Uu9vaQHwQHnrnUw/NTyy4wI2x5yGC",
      googleId: "google-wanderer-003",
      dateOfBirth: new Date("1999-01-26T00:00:00.000Z"),
      avatar: "/avatars/wanderer.png",
      bio: "Explores every corner of the village.",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "merged_hide_only",
        lastActionAt: new Date("2026-04-14T02:37:09.442Z")
      },
      role: "user",
      bookmarks: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ed")
      ],
      verificationTokenHash: "wanderer-verification-hash",
      verificationUsed: false,
      isVerified: false,
      verificationExpires: new Date("2026-04-29T02:37:09.442Z"),
      resetPasswordTokenHash: "wanderer-reset-hash",
      resetPasswordExpires: new Date("2026-04-19T02:37:09.442Z"),
      emailVisibility: true,
      friends: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359e1")
      ],
      savedPosts: [
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359eb"),
        new mongoose.Types.ObjectId("69def9d56b6ceed8e1c359ea")
      ],
      createdAt: new Date("2026-04-15T02:37:09.549Z"),
      updatedAt: new Date("2026-04-15T02:37:09.549Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e581d99c44eeb58c84424c"),
      email: "phihungnguyenho@gmail.com",
      fullname: "Phi Hùng",
      password: "$2a$10$LCqayyyUvOtkU3UXIEx83eq2Uu9vaQHwQHnrnUw/NTyy4wI2x5yGC",
      googleId: null,
      dateOfBirth: new Date("1999-12-31T00:00:00.000Z"),
      avatar: "https://res.cloudinary.com/dpdizlimp/image/upload/v1776648684/ghostvillage/avatars/default/69e581d99c44eeb58c84424c/default_avatar_1776648683217.png",
      bio: "",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "none",
        lastActionAt: null
      },
      role: "user",
      bookmarks: [
        new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66")
      ],
      verificationTokenHash: null,
      verificationUsed: true,
      isVerified: true,
      verificationExpires: null,
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
      emailVisibility: true,
      friends: [],
      savedPosts: [],
      createdAt: new Date("2026-04-20T01:31:05.314Z"),
      updatedAt: new Date("2026-04-20T12:31:18.518Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e582709c44eeb58c844258"),
      email: "lehhdang272@gmail.com",
      fullname: "Nhat Duong",
      password: "$2a$10$LCqayyyUvOtkU3UXIEx83eq2Uu9vaQHwQHnrnUw/NTyy4wI2x5yGC",
      googleId: "110201965858853175971",
      dateOfBirth: new Date("2000-01-31T00:00:00.000Z"),
      avatar: "https://res.cloudinary.com/dpdizlimp/image/upload/v1776648818/ghostvillage/avatars/google/69e582709c44eeb58c844258/google_avatar_1776648816837.jpg",
      bio: "",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "none",
        lastActionAt: null
      },
      role: "user",
      bookmarks: [
        new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66")
      ],
      verificationTokenHash: null,
      verificationUsed: false,
      isVerified: true,
      verificationExpires: null,
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
      emailVisibility: true,
      friends: [],
      savedPosts: [],
      createdAt: new Date("2026-04-20T01:33:36.083Z"),
      updatedAt: new Date("2026-04-21T09:36:13.077Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e584bb9c44eeb58c8447ab"),
      email: "admin@codebar.dev",
      fullname: "Admin",
      password: "$2a$10$LCqayyyUvOtkU3UXIEx83eq2Uu9vaQHwQHnrnUw/NTyy4wI2x5yGC",
      googleId: null,
      dateOfBirth: new Date("1999-12-31T00:00:00.000Z"),
      avatar: "https://res.cloudinary.com/dpdizlimp/image/upload/v1776649767/ghostvillage/avatars/69e584bb9c44eeb58c8447ab/avatar_1776649765830.jpg",
      bio: "",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "none",
        lastActionAt: null
      },
      role: "admin",
      bookmarks: [],
      verificationTokenHash: "2bc0f460c81fed64db4d876277748012b35dae96a80da10d053f8518c211152f",
      verificationUsed: false,
      isVerified: true,
      verificationExpires: new Date("2026-04-20T01:58:23.465Z"),
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
      emailVisibility: true,
      friends: [],
      savedPosts: [],
      createdAt: new Date("2026-04-20T01:43:23.469Z"),
      updatedAt: new Date("2026-04-20T01:49:27.769Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69e5c3f97dcb27e607293d84"),
      email: "ledang2722004@gmail.com",
      fullname: "Little girl",
      password: "$2a$10$LCqayyyUvOtkU3UXIEx83eq2Uu9vaQHwQHnrnUw/NTyy4wI2x5yGC",
      googleId: "115825259701904290982",
      dateOfBirth: new Date("2000-04-19T00:00:00.000Z"),
      avatar: "https://res.cloudinary.com/dpdizlimp/image/upload/v1776665596/ghostvillage/avatars/google/69e5c3f97dcb27e607293d84/google_avatar_1776665594583.jpg",
      bio: "",
      isMute: false,
      moderation: {
        violationCount: 3,
        lastViolationAt: new Date("2026-04-20T11:15:19.895Z"),
        mutedUntil: null,
        lastAction: "mute",
        lastActionAt: new Date("2026-04-23T11:54:27.857Z")
      },
      role: "user",
      bookmarks: [
        new mongoose.Types.ObjectId("69e5c3b97dcb27e607293d66")
      ],
      verificationTokenHash: null,
      verificationUsed: false,
      isVerified: true,
      verificationExpires: null,
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
      emailVisibility: true,
      friends: [],
      savedPosts: [],
      createdAt: new Date("2026-04-20T06:13:13.654Z"),
      updatedAt: new Date("2026-04-23T11:54:27.857Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69ea029f35a94491eabb96df"),
      email: "bob@codebar.dev",
      fullname: "Lê Huỳnh Hải Đăng",
      password: "$2a$10$LCqayyyUvOtkU3UXIEx83eq2Uu9vaQHwQHnrnUw/NTyy4wI2x5yGC",
      googleId: null,
      dateOfBirth: new Date("1996-04-21T00:00:00.000Z"),
      avatar: null,
      bio: "",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "none",
        lastActionAt: null
      },
      role: "user",
      bookmarks: [],
      verificationTokenHash: "6ad8ef6cb40d78a038213a2fd07eef727d74ace26641afd0aab4a4cbd02a337f",
      verificationUsed: false,
      isVerified: false,
      verificationExpires: new Date("2026-04-23T11:44:35.983Z"),
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
      emailVisibility: true,
      friends: [],
      savedPosts: [],
      createdAt: new Date("2026-04-23T11:29:35.990Z"),
      updatedAt: new Date("2026-04-23T11:29:35.990Z")
    },
    {
      _id: new mongoose.Types.ObjectId("69ea03ac35a94491eabb96fb"),
      email: "danglhh272@gmail.com",
      fullname: "Đăng Lê",
      password: "$2a$10$LCqayyyUvOtkU3UXIEx83eq2Uu9vaQHwQHnrnUw/NTyy4wI2x5yGC",
      googleId: "114741414612660979524",
      dateOfBirth: null,
      avatar: "https://res.cloudinary.com/dpdizlimp/image/upload/v1776944050/ghostvillage/avatars/google/69ea03ac35a94491eabb96fb/google_avatar_1776944045532.jpg",
      bio: "",
      isMute: false,
      moderation: {
        violationCount: 0,
        lastViolationAt: null,
        mutedUntil: null,
        lastAction: "none",
        lastActionAt: null
      },
      role: "user",
      bookmarks: [],
      verificationTokenHash: null,
      verificationUsed: false,
      isVerified: true,
      verificationExpires: null,
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
      emailVisibility: true,
      friends: [],
      savedPosts: [],
      createdAt: new Date("2026-04-23T11:34:04.604Z"),
      updatedAt: new Date("2026-04-23T11:34:08.631Z")
    }
  ]);
  console.log('✅ users: 11 docs inserted.');

    console.log("=========================================");
    console.log("🎉 SEED USERS HOÀN TẤT!");
    console.log("=========================================");
  } catch (error) {
    console.error("❌ Có lỗi xảy ra:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

seedUsers();
