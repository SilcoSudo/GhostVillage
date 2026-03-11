import express from "express";
import { CostumeController } from "./costumeController.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * Costume Routes
 * Định nghĩa các endpoint cho Costume Management
 */

// GET /api/costumes/stats/summary - Lấy thống kê costume (phải đặt trước /:id)
router.get("/stats/summary", CostumeController.getCostumeStats);

// GET /api/costumes - Lấy danh sách costume (có phân trang, filter, search)
router.get("/", CostumeController.getAllCostumes);

// GET /api/costumes/:id - Lấy chi tiết một costume (hỗ trợ costumeId hoặc _id)
router.get("/:id", CostumeController.getCostumeById);

// POST /api/costumes - Tạo costume mới
router.post("/", CostumeController.createCostume);

// PUT /api/costumes/:id - Cập nhật thông tin costume
router.put("/:id", CostumeController.updateCostume);

// PATCH /api/costumes/:id/status - Bật/tắt trạng thái isActive (Toggle Activate)
router.patch("/:id/status", CostumeController.toggleCostumeStatus);

// PATCH /api/costumes/:id/store - Bật/tắt hiển thị trong shop (Toggle Store)
router.patch("/:id/store", CostumeController.toggleStoreAvailability);

// DELETE /api/costumes/:id - Xóa costume
router.delete("/:id", CostumeController.deleteCostume);

export default router;
