import express from "express";
import { ActivityLogController } from "./activityLogController.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * Activity Log Routes
 * Định nghĩa các endpoint cho Activity Log Management (Read-only)
 */

// GET /api/activity-logs/stats/summary - Lấy thống kê (phải đặt trước /:id)
router.get("/stats/summary", ActivityLogController.getActivityLogStats);

// GET /api/activity-logs/user/:userId - Lấy logs của một user cụ thể
router.get("/user/:userId", ActivityLogController.getLogsByUser);

// GET /api/activity-logs - Lấy danh sách logs (có phân trang, filter, search)
router.get("/", ActivityLogController.getAllActivityLogs);

// GET /api/activity-logs/:id - Lấy chi tiết một log
router.get("/:id", ActivityLogController.getActivityLogById);

// DELETE /api/activity-logs/cleanup - Xóa logs cũ (Admin only)
router.delete("/cleanup", ActivityLogController.cleanupOldLogs);

export default router;
