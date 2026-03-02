import express from "express";
import { MatchController } from "./matchController.js";

const router = express.Router();

// Định nghĩa route POST: http://localhost:5000/api/matches
router.post("/", MatchController.saveMatchResult);

export default router;
