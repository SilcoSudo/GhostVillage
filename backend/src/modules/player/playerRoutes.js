import express from "express";
// 1. SỬA DÒNG NÀY: Import PlayerController thay vì getProfile
import { PlayerController } from "./playerController.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Áp dụng auth middleware cho tất cả các route ở dưới
router.use(authMiddleware);

// 2. SỬA DÒNG NÀY: Gọi thông qua object PlayerController
router.get("/", PlayerController.getProfile);

// Route tìm kiếm người chơi
router.get("/search/:uid", PlayerController.searchPlayer);
router.put("/equip-skin", authMiddleware, equipSkin);
router.put("/equip-perk", authMiddleware, equipPerks);

export default router;
