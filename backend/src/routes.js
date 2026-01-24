import express from "express";
import webAuthRoutes from "./modules/auth/web/authRoutes.js";
import gameAuthRoutes from "./modules/auth/game/authRoutes.js";
import userRoutes from "./modules/user/userRoutes.js";
import achievementRoutes from "./modules/achievement/achievementRoutes.js";
import postRoutes from "./modules/forum/posts/postRoutes.js";
import wikiRoutes from "./modules/forum/wiki/wikiRoutes.js";
import announcementRoutes from "./modules/forum/announcement/announcementRoutes.js";
import searchRoutes from "./modules/forum/search/searchRoutes.js";
import playerRoutes from "./modules/player/playerRoutes.js";
import profileRoutes from "./modules/profile/ProfileRoutes.js";
import { loginGame } from "./modules/auth/game/authController.js";

const router = express.Router();

// --- Profile routes (MUST be top-level /api/profile) ---
router.use("/profile", profileRoutes);
/**
 * Central Route Loader
 * Mounts all feature routes
 */

// Web Routes (mounted at /api/web)
const webRoutes = express.Router();
webRoutes.use("/auth", webAuthRoutes);
webRoutes.use("/user", userRoutes);
webRoutes.use("/achievement", achievementRoutes);
webRoutes.use("/forum", postRoutes);
webRoutes.use("/wiki", wikiRoutes);
webRoutes.use("/announcement", announcementRoutes);
webRoutes.use("/search", searchRoutes);
router.use("/web", webRoutes);

// --- HUNG'S GAME LOGIN LOGIC START ---
// HACK: Map route cũ "/api/auth/login" để Unity không phải sửa code
// Unity gọi: POST /api/auth/login
const legacyAuthRouter = express.Router();
legacyAuthRouter.post("/login", loginGame);

router.use("/auth", legacyAuthRouter);
// --- HUNG'S GAME LOGIN LOGIC END ---

// Game Routes (mounted at /api/game)
const gameRoutes = express.Router();
gameRoutes.use("/auth", gameAuthRoutes);
gameRoutes.use("/player", playerRoutes);

router.use("/game", gameRoutes);

export default router;