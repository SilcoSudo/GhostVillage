import express from "express";
import { getProfile, getMatchHistory, getAchievements } from "./profileController.js";

const router = express.Router();

// /api/profile
router.get("/", getProfile);

// /api/profile/match-history
router.get("/match-history", getMatchHistory);

// /api/profile/achievements
router.get("/achievements", getAchievements);

export default router;
