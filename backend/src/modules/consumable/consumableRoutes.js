import express from "express";
import { ConsumableController } from "./consumableController.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * Consumable Item Routes
 * Định nghĩa các endpoint cho Consumable Item Management
 */

// GET /api/consumables/stats/summary - Lấy thống kê consumable items (phải đặt trước /:id)
router.get("/stats/summary", ConsumableController.getConsumableStats);

// GET /api/consumables - Lấy danh sách consumable items (có phân trang, filter, search)
router.get("/", ConsumableController.getAllConsumables);

// GET /api/consumables/:id - Lấy chi tiết một consumable item (hỗ trợ itemId hoặc _id)
router.get("/:id", ConsumableController.getConsumableById);

// POST /api/consumables - Tạo consumable item mới
router.post("/", ConsumableController.createConsumable);

// PUT /api/consumables/:id - Cập nhật thông tin consumable item
router.put("/:id", ConsumableController.updateConsumable);

// PATCH /api/consumables/:id/status - Bật/tắt trạng thái isActive (Toggle Activate)
router.patch("/:id/status", ConsumableController.toggleConsumableStatus);

// PATCH /api/consumables/:id/drop - Bật/tắt drop availability (Toggle Drop)
router.patch("/:id/drop", ConsumableController.toggleDropAvailability);

// PATCH /api/consumables/:id/store - Bật/tắt hiển thị trong shop (Toggle Store)
router.patch("/:id/store", ConsumableController.toggleStoreAvailability);

// DELETE /api/consumables/:id - Xóa consumable item
router.delete("/:id", ConsumableController.deleteConsumable);

export default router;
