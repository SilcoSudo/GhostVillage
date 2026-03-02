import express from "express";
import { MoonEventController } from "./moonEventController.js";

const router = express.Router();

// Game Server routes (/api/game/moon-events)
router.get("/active", MoonEventController.getActiveEvents);

export default router;
