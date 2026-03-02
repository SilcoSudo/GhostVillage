import express from "express";
import { MonsterController } from "./monsterController.js";

const router = express.Router();

/**
 * Monster Routes
 * Định nghĩa các endpoint cho Monster Management
 */

// GET /api/monsters - Lấy danh sách quái vật
router.get("/", MonsterController.getAllMonsters);

// GET /api/monsters/:id - Lấy chi tiết một quái vật
router.get("/:id", MonsterController.getMonsterById);

// POST /api/monsters - Tạo quái vật mới
router.post("/", MonsterController.createMonster);

// PUT /api/monsters/:id - Cập nhật thông tin quái vật
router.put("/:id", MonsterController.updateMonster);

// PATCH /api/monsters/:id/status - Bật/tắt trạng thái quái vật
router.patch("/:id/status", MonsterController.toggleMonsterStatus);

// DELETE /api/monsters/:id - Xóa quái vật (soft delete)
router.delete("/:id", MonsterController.deleteMonster);

export default router;
