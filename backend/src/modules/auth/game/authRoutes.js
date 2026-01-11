import express from "express";
import { loginGame, logoutGame, getMeGame } from "./authController.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * GAME AUTH ROUTES
 * Prefix: /api/auth (Do hack route bên src/routes.js)
 */

router.post("/login", loginGame);
router.post("/logout", logoutGame);

// Route lấy thông tin bản thân (cần Token)
router.get("/me", authMiddleware, getMeGame);

export default router;
