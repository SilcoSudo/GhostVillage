import { Router } from "express";
import * as commentController from "./commentController.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

// Get all comments for a post
router.get("/", commentController.getComments);

// Create a comment
router.post("/", authMiddleware, commentController.createComment);

// Update a comment
router.put("/:commentId", authMiddleware, commentController.updateComment);

// Delete a comment
router.delete("/:commentId", authMiddleware, commentController.deleteComment);

export default router;
