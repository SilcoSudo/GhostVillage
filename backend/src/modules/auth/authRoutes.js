import express from 'express';
import { registerWeb, loginWeb, logoutWeb, getMeWeb, verifyWeb } from './web/authController.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Web Auth Routes
 * POST /api/web/auth/register
 * POST /api/web/auth/login
 * POST /api/web/auth/logout
 * GET  /api/web/auth/me
 * GET  /api/web/auth/verify
 */

router.post('/register', registerWeb);
router.post('/verify-email', verifyWeb);
router.post('/login', loginWeb);
router.post('/logout', logoutWeb);
router.get('/me', authMiddleware, getMeWeb);

export default router;
