import express from "express";
import { getProfile, equipSkin, equipPerks} from "./playerController.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getProfile);
router.put("/equip-skin", authMiddleware, equipSkin);
router.put("/equip-perk", authMiddleware, equipPerks);
export default router;