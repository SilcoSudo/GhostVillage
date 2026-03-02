import express from "express";
import {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  bookmarkPost,
  lockPost,
  uploadPostImage,
  deletePostMedia,
} from "./postController.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { uploadAvatar } from "../../../middlewares/uploadMiddleware.js";
import commentRoutes from "../comments/commentRoutes.js";

const router = express.Router();

router.get("/", listPosts);

// Delete media from Cloudinary - MUST BE BEFORE /:id routes
router.delete("/delete-media", authMiddleware, deletePostMedia);
router.post("/upload-image", authMiddleware, uploadAvatar, uploadPostImage);

router.get("/:id", getPost);
router.post("/", authMiddleware, createPost);
router.put("/:id", authMiddleware, updatePost);
router.delete("/:id", authMiddleware, deletePost);
router.post("/:id/like", authMiddleware, likePost);
router.post("/:id/bookmark", authMiddleware, bookmarkPost);
router.post("/:id/lock", authMiddleware, lockPost);

// Comment routes
router.use("/:postId/comments", commentRoutes);

export default router;
