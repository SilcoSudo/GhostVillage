import express from 'express';
import { loginGame, logoutGame, getMeGame } from './authController.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * Game Auth Routes
 * POST /api/game/auth/login
 * POST /api/game/auth/logout
 * GET  /api/game/auth/me
 * 
 * Note: Game registration is handled through Web registration
 * Game login logic implemented by game team
 */

router.post('/login', loginGame);
router.post('/logout', logoutGame);
router.get('/me', authMiddleware, getMeGame);

export default router;
