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
} from "./postController.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import commentRoutes from "../comments/commentRoutes.js";

const router = express.Router();

router.get("/", listPosts);
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
