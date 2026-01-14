import express from 'express';
import { getUserIdProfile, updateName, toggleEmailVisibility } from './userController.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * User Routes
 */

router.get('/profile/:id', getUserIdProfile);
router.put('/profile/update-name', authMiddleware, updateName);
router.put('/profile/toggle-email-visibility', authMiddleware, toggleEmailVisibility);

export default router;
