import express from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import * as shopController from './shopController.js';

const router = express.Router();
router.get('/', authMiddleware, shopController.getShop);
router.post('/buy', authMiddleware, shopController.buyItem);
export default router;