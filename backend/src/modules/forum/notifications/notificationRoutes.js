import express from "express";
import * as notificationController from "./notificationController.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Get all notifications
router.get("/", notificationController.getNotifications);

// Get unread count
router.get("/unread/count", notificationController.getUnreadCount);

// Get unread notifications
router.get("/unread", notificationController.getUnreadNotifications);

// Mark notification as read
router.patch("/:id/read", notificationController.markAsRead);

// Mark all as read
router.patch("/read-all", notificationController.markAllAsRead);

// Delete notification
router.delete("/:id", notificationController.deleteNotification);

// Delete all notifications
router.delete("/", notificationController.deleteAllNotifications);

export default router;
