import express from "express";
import { PerkController } from "./perkController.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * Perk Routes
 */

// GET /api/perks - Lấy danh sách
router.get("/", PerkController.getAllPerks);

// GET /api/perks/:id - Lấy chi tiết 1 Perk (bằng _id hoặc perkId)
router.get("/:id", PerkController.getPerkById);

// POST /api/perks - Tạo mới
router.post("/", PerkController.createPerk);

// PUT /api/perks/:id - Cập nhật
router.put("/:id", PerkController.updatePerk);

// PATCH /api/perks/:id/status - Bật/tắt trạng thái
router.patch("/:id/status", PerkController.togglePerkStatus);

// DELETE /api/perks/:id - Xóa mềm
router.delete("/:id", PerkController.deletePerk);

export default router;
