import express from "express";
import { MoonEventController } from "./moonEventController.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Admin routes (/api/web/moon-events)
router.get("/", MoonEventController.getAllEvents);
router.get("/:id", MoonEventController.getEventById);
router.post("/", MoonEventController.createEvent);
router.put("/:id", MoonEventController.updateEvent);
router.patch("/:id/toggle-active", MoonEventController.toggleActive);
router.delete("/:id", MoonEventController.deleteEvent);

export default router;
