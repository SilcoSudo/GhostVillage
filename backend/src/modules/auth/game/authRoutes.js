import express from "express";
import * as authController from "./authController.js";
import * as googleAuthController from "./googleAuthController.js";
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

// ===== GOOGLE OAUTH ROUTES (NEW) =====

// Get Google OAuth URL
router.get("/google", googleAuthController.getGoogleAuthUrl);

// Handle Google OAuth callback
router.get("/google/callback", googleAuthController.googleCallback);

// Complete profile (add date of birth after OAuth)
router.post("/complete-profile", authMiddleware, authController.completeProfile);

export default router;

