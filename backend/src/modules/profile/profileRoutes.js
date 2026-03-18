import express from 'express';
import { getProfile, getMatchHistory, getAchievements, updateMedals } from '../profile/profileController.js';
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);
router.get('/match-history', authMiddleware, getMatchHistory);
router.get('/achievements', authMiddleware, getAchievements);
router.post('/medals', authMiddleware, updateMedals);

export default router;