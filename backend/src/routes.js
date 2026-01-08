import express from 'express';
import authRoutes from './modules/auth/authRoutes.js';
import userRoutes from './modules/user/userRoutes.js';
import achievementRoutes from './modules/achievement/achievementRoutes.js';
import postRoutes from './modules/forum/postRoutes.js';
import playerRoutes from './modules/player/playerRoutes.js';

const router = express.Router();

/**
 * Central Route Loader
 * Mounts all feature routes
 */

// Web Routes (mounted at /api/web)
const webRoutes = express.Router();
webRoutes.use('/auth', authRoutes);
webRoutes.use('/user', userRoutes);
webRoutes.use('/achievement', achievementRoutes);
webRoutes.use('/forum', postRoutes);

router.use('/web', webRoutes);

// Game Routes (mounted at /api/game - placeholder for future)
const gameRoutes = express.Router();
// gameRoutes.use('/auth', gameAuthRoutes);
// gameRoutes.use('/player', gamePlayerRoutes);

router.use('/game', gameRoutes);

export default router;
