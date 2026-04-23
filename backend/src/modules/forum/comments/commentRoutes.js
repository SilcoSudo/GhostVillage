import { Router } from "express";
import * as commentController from "./commentController.js";
import {
  authMiddleware,
  authorize,
} from "../../../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

// Get all comments for a post
router.get("/", commentController.getComments);

// Create a comment
router.post("/", authMiddleware, commentController.createComment);

// Update a comment
router.put("/:commentId", authMiddleware, commentController.updateComment);

// Delete a comment
router.delete("/:commentId", authMiddleware, commentController.deleteComment);

// Restore a moderation-hidden comment (admin only)
router.patch(
  "/:commentId/restore",
  authMiddleware,
  authorize("admin"),
  commentController.restoreCommentByAdmin,
);

// Report a comment
router.post(
  "/:commentId/report",
  authMiddleware,
  commentController.reportComment,
);

export default router;
