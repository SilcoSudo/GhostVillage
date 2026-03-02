import express from "express";
import MessageController from "./messageController.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * Message Routes
 * All routes protected with authentication
 */

// Apply auth middleware to all message routes
router.use(authMiddleware);

/**
 * POST /api/web/message/send
 * Send a message
 */
router.post("/send", MessageController.sendMessage);

/**
 * GET /api/web/message/conversation/:userId
 * Get conversation with a specific user
 */
router.get("/conversation/:userId", MessageController.getConversation);

/**
 * GET /api/web/message/unread-count
 * Get total unread messages count
 */
router.get("/unread-count", MessageController.getUnreadCount);

/**
 * GET /api/web/message/last-messages
 * Get last message with each friend
 */
router.get("/last-messages", MessageController.getLastMessagesWithFriends);

export default router;
