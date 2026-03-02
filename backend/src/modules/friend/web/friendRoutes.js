import express from "express";
import FriendController from "./friendController.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * Friend Management Routes
 * All routes protected with authentication
 */

// Apply auth middleware to all friend routes
router.use(authMiddleware);

/**
 * GET /api/web/friend/list
 * Get all accepted friends
 */
router.get("/list", FriendController.getFriendList);

/**
 * GET /api/web/friend/pending-requests
 * Get pending incoming friend requests
 */
router.get("/pending-requests", FriendController.getPendingRequests);

/**
 * GET /api/web/friend/sent-requests
 * Get sent outgoing friend requests
 */
router.get("/sent-requests", FriendController.getSentRequests);

/**
 * GET /api/web/friend/status/:targetUserId
 * Get friendship status with another user
 */
router.get("/status/:targetUserId", FriendController.getFriendshipStatus);

/**
 * POST /api/web/friend/add
 * Send friend request to another user
 */
router.post("/add", FriendController.addFriend);

/**
 * POST /api/web/friend/accept
 * Accept an incoming friend request
 */
router.post("/accept", FriendController.acceptFriendRequest);

/**
 * POST /api/web/friend/reject
 * Reject an incoming friend request
 */
router.post("/reject", FriendController.rejectFriendRequest);

/**
 * POST /api/web/friend/unfriend
 * Remove friend (unfriend)
 */
router.post("/unfriend", FriendController.unfriend);

export default router;
