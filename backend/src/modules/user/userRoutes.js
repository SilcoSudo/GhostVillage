import express from "express";
import { getSavedPosts, completeProfile } from "./userController.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * User Routes
 * GET /api/web/user/saved-posts - Get user's saved/bookmarked posts
 * POST /api/web/user/complete-profile - Complete profile after OAuth
 */

router.get("/saved-posts", authMiddleware, getSavedPosts);
router.post("/complete-profile", authMiddleware, completeProfile);

// TODO: Implement other user routes
// router.get('/profile', getUserProfile);
// router.put('/profile', updateUserProfile);

export default router;
