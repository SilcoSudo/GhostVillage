import express from "express";
import {
  registerWeb,
  loginWeb,
  logoutWeb,
  getMeWeb,
  verifyWeb,
  resendVerificationWeb,
  changePasswordWeb,
  forgotPasswordWeb,
  resetPasswordWeb,
} from "./authController.js";
import { getGoogleAuthUrl, googleCallback } from "./googleAuthController.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * Web Auth Routes
 * POST /api/web/auth/register
 * POST /api/web/auth/login
 * POST /api/web/auth/logout
 * GET  /api/web/auth/me
 * POST /api/web/auth/resend-verification
 * GET  /api/web/auth/google - Get Google OAuth URL
 * GET  /api/web/auth/google/callback - Handle Google callback
 */

router.post("/register", registerWeb);
router.get("/verify", verifyWeb);
router.post("/resend-verification", resendVerificationWeb);
router.post("/login", loginWeb);
router.post("/logout", logoutWeb);
router.get("/me", authMiddleware, getMeWeb);
router.post("/change-password", authMiddleware, changePasswordWeb);
router.post("/forgot-password", forgotPasswordWeb);
router.post("/reset-password", resetPasswordWeb);

// Google OAuth routes
router.get("/google", getGoogleAuthUrl);
router.get("/google/callback", googleCallback);

export default router;
