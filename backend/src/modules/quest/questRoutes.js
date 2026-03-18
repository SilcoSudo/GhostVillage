import express from "express";
import { QuestController } from "./questController.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * Quest Routes
 * Định nghĩa các endpoint cho Quest Management
 */

// GET /api/quests/stats/summary - Lấy thống kê quest (phải đặt trước /:id)
router.get("/stats/summary", QuestController.getQuestStats);

// GET /api/quests - Lấy danh sách quest (có phân trang, filter, search)
router.get("/", QuestController.getAllQuests);

// GET /api/quests/:id - Lấy chi tiết một quest (hỗ trợ questId hoặc _id)
router.get("/:id", QuestController.getQuestById);

// POST /api/quests - Tạo quest mới
router.post("/", QuestController.createQuest);

// PUT /api/quests/:id - Cập nhật thông tin quest (objectives, rewards, quest lines)
router.put("/:id", QuestController.updateQuest);

// PATCH /api/quests/:id/status - Bật/tắt trạng thái quest (Toggle Activate)
router.patch("/:id/status", QuestController.toggleQuestStatus);

// DELETE /api/quests/:id - Xóa quest
router.delete("/:id", QuestController.deleteQuest);

export default router;
