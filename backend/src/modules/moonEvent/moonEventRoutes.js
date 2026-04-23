import express from "express";
import { MoonEventController } from "./moonEventController.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * Moon Event Routes
 */

router.get("/", MoonEventController.getAllEvents);
router.get("/:id", MoonEventController.getEventById);
router.post("/", MoonEventController.createEvent);
router.put("/:id", MoonEventController.updateEvent);
router.patch("/:id/status", MoonEventController.toggleEventStatus);
router.delete("/:id", MoonEventController.deleteEvent);

export default router;
