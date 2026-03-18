import express from "express";
import { MonsterController } from "./monsterController.js"; // Đã sửa từ ../ thành ./
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", MonsterController.getAllMonsters);
router.get("/:id", MonsterController.getMonsterById);
router.post("/", MonsterController.createMonster);
router.put("/:id", MonsterController.updateMonster);
router.patch("/:id/status", MonsterController.toggleMonsterStatus);
router.delete("/:id", MonsterController.deleteMonster);

export default router;
