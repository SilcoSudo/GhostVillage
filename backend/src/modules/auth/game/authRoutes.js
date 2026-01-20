import express from "express";
import * as authController from "./authController.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * GAME AUTH ROUTES
 * Các route này phục vụ riêng cho Client Unity
 */

// Đăng nhập: Không cần middleware vì là route công khai
router.post("/login", authController.loginGame);

// Đăng xuất
router.post("/logout", authController.logoutGame);

// Lấy thông tin: Cần authMiddleware để bảo mật dựa trên JWT Token
router.get("/me", authMiddleware, authController.getMeGame);

export default router;
