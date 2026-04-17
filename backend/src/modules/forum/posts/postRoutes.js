import express from "express";
import {
  listPosts,
  getPost,
  createPost,
  checkPostingRestriction,
  updatePost,
  deletePost,
  restorePost,
  likePost,
  bookmarkPost,
  lockPost,
  uploadPostMedia,
  deletePostMedia,
  reportPost,
} from "./postController.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/auth.middleware.js";
import { uploadMedia } from "../../../middlewares/uploadMiddleware.js";
import commentRoutes from "../comments/commentRoutes.js";
import { listReportedCommentsForAdmin } from "../comments/commentController.js";

const router = express.Router();

router.get("/", listPosts);
router.get(
  "/reported-comments",
  authMiddleware,
  authorize("admin"),
  listReportedCommentsForAdmin,
);

// Delete media from Cloudinary - MUST BE BEFORE /:id routes
router.delete("/delete-media", authMiddleware, deletePostMedia);
router.get("/posting-restriction", authMiddleware, checkPostingRestriction);
// Upload endpoint for post media (images/videos)
router.post("/upload-media", authMiddleware, uploadMedia, uploadPostMedia);

router.get("/:id", getPost);
router.post("/", authMiddleware, createPost);
router.put("/:id", authMiddleware, updatePost);
router.delete("/:id", authMiddleware, deletePost);
router.patch("/:id/restore", authMiddleware, authorize("admin"), restorePost);
router.post("/:id/like", authMiddleware, likePost);
router.post("/:id/bookmark", authMiddleware, bookmarkPost);
router.post("/:id/lock", authMiddleware, lockPost);
router.post("/:id/report", authMiddleware, reportPost);

// Comment routes
router.use("/:postId/comments", commentRoutes);

export default router;
