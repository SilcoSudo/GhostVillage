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
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * Web Auth Routes
 * POST /api/web/auth/register
 * POST /api/web/auth/login
 * POST /api/web/auth/logout
 * GET  /api/web/auth/me
 * POST /api/web/auth/resend-verification
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

export default router;
