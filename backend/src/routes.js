import express from "express";
import webAuthRoutes from "./modules/auth/web/authRoutes.js";
import gameAuthRoutes from "./modules/auth/game/authRoutes.js";
import userRoutes from "./modules/user/userRoutes.js";
//import achievementRoutes from "./modules/achievement/achievementRoutes.js";
import postRoutes from "./modules/forum/posts/postRoutes.js";
import wikiRoutes from "./modules/forum/wiki/wikiRoutes.js";
import webAnnouncementRoutes from "./modules/forum/announcement/web/announcementRoutes.js";
import adminAnnouncementRoutes from "./modules/forum/announcement/admin/announcementRoutes.js";
import searchRoutes from "./modules/forum/search/searchRoutes.js";
import notificationRoutes from "./modules/forum/notifications/notificationRoutes.js";
import supportTicketRoutes from "./modules/forum/supportTickets/supportTicketRoutes.js";
import friendRoutes from "./modules/friend/web/friendRoutes.js";
import messageRoutes from "./modules/message/web/messageRoutes.js";
import playerRoutes from "./modules/player/playerRoutes.js";
import profileRoutes from "./modules/profile/ProfileRoutes.js";
import { loginGame } from "./modules/auth/game/authController.js";
import mapRoute from "./modules/map/mapRoute.js";
import matchRoutes from "./modules/match/matchRoutes.js";
import monsterRoutes from "./modules/monster/monsterRoutes.js";
import questRoutes from "./modules/quest/questRoutes.js";
import costumeRoutes from "./modules/costume/costumeRoutes.js";
import moonEventRoutes from "./modules/moonEvent/moonEventRoutes.js";
import moonEventGameRoutes from "./modules/moonEvent/gameRoutes.js";

const router = express.Router();

/**
 * Central Route Loader
 * Mounts all feature routes
 */

// Map Routes (mounted at /api/maps)
router.use("/maps", mapRoute);
// End of Map Routes

router.use("/matches", matchRoutes);
// Monster Routes (mounted at /api/monsters)
router.use("/monsters", monsterRoutes);
// End of Monster Routes

// Quest Routes (mounted at /api/quests)
router.use("/quests", questRoutes);
// End of Quest Routes

// Costume Routes (mounted at /api/costumes)
router.use("/costumes", costumeRoutes);
// End of Costume Routes

// Web Routes (mounted at /api/web)
const webRoutes = express.Router();
webRoutes.use("/auth", webAuthRoutes);
webRoutes.use("/user", userRoutes);
//webRoutes.use("/achievement", achievementRoutes);
webRoutes.use("/forum", postRoutes);
webRoutes.use("/wiki", wikiRoutes);
webRoutes.use("/announcement", webAnnouncementRoutes);
webRoutes.use("/search", searchRoutes);
webRoutes.use("/moon-events", moonEventRoutes);
webRoutes.use("/notifications", notificationRoutes);
webRoutes.use("/support-tickets", supportTicketRoutes);
webRoutes.use("/friend", friendRoutes);
webRoutes.use("/message", messageRoutes);
router.use("/web", webRoutes);

// Admin Routes (mounted at /api/admin)
const adminRoutes = express.Router();
adminRoutes.use("/announcement", adminAnnouncementRoutes);
adminRoutes.use("/users", userRoutes);
router.use("/admin", adminRoutes);

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
gameRoutes.use("/moon-events", moonEventGameRoutes);
gameRoutes.use("/player", playerRoutes);

router.use("/game", gameRoutes);

export default router;
