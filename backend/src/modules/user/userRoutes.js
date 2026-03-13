import express from "express";
import {
  getMyProfile,
  getUserIdProfile,
  updateMyProfile,
  updateName,
  toggleEmailVisibility,
  uploadAvatar,
  listUsersForAdmin,
  unmuteUserForAdmin,
} from "./userController.js";
import {
  authMiddleware,
  authorize,
} from "../../middlewares/auth.middleware.js";
import { uploadAvatar as uploadAvatarMiddleware } from "../../middlewares/uploadMiddleware.js";
import { getSavedPosts } from "./userController.js";

const router = express.Router();

/**
 * User Routes
 * GET  /api/web/user/profile/me              - Get own profile (auth required)
 * GET  /api/web/user/profile/:id             - Get public profile
 * PUT  /api/web/user/profile/me              - Update profile (auth required)
 * POST /api/web/user/avatar/upload           - Upload avatar (auth required)
 * PUT  /api/web/user/profile/update-name     - Update name (auth required, legacy)
 * PUT  /api/web/user/profile/toggle-email    - Toggle email visibility (auth required)
 */

/* =========================================================
 * SECTION A: WEB USER ROUTES
 * ========================================================= */

router.get("/profile/me", authMiddleware, getMyProfile);
router.get("/profile/:id", getUserIdProfile);
router.put("/profile/me", authMiddleware, updateMyProfile);
router.post(
  "/avatar/upload",
  authMiddleware,
  uploadAvatarMiddleware,
  uploadAvatar,
);
router.put("/profile/update-name", authMiddleware, updateName);
router.put(
  "/profile/toggle-email-visibility",
  authMiddleware,
  toggleEmailVisibility,
);
router.get("/saved-posts", authMiddleware, getSavedPosts);

/* =========================================================
 * SECTION B: ADMIN USER MANAGEMENT ROUTES
 * - Mounted at /api/admin/users
 * ========================================================= */

router.get("/", authMiddleware, authorize("admin"), listUsersForAdmin);
router.patch(
  "/:id/unmute",
  authMiddleware,
  authorize("admin"),
  unmuteUserForAdmin,
);

// TODO: Implement other user routes
// router.get('/profile', getUserProfile);
// router.put('/profile', updateUserProfile);

export default router;
