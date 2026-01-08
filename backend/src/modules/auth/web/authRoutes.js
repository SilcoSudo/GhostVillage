import express from 'express';
import { registerWeb, loginWeb, logoutWeb, getMeWeb } from './authController.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * Web Auth Routes
 * POST /api/web/auth/register
 * POST /api/web/auth/login
 * POST /api/web/auth/logout
 * GET  /api/web/auth/me
 */

router.post('/register', registerWeb);
router.post('/login', loginWeb);
router.post('/logout', logoutWeb);
router.get('/me', authMiddleware, getMeWeb);

export default router;
