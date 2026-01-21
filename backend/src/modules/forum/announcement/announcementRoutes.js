import express from "express";
import {
    listAnnouncements,
    getPinnedAnnouncements,
    getAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePin,
    toggleActive,
} from "./announcementController.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * Announcement Routes
 * GET    /api/web/announcement                    - List active announcements
 * GET    /api/web/announcement/pinned             - Get pinned announcements
 * GET    /api/web/announcement/:slug              - Get announcement by slug
 * POST   /api/web/announcement                    - Create announcement (auth required)
 * PUT    /api/web/announcement/:id                - Update announcement (auth required)
 * DELETE /api/web/announcement/:id                - Delete announcement (auth required)
 * POST   /api/web/announcement/:id/toggle-pin     - Toggle pin (auth required)
 * POST   /api/web/announcement/:id/toggle-active  - Toggle active (auth required)
 */

// Public routes
router.get("/pinned", getPinnedAnnouncements);
router.get("/:slug", getAnnouncement);
router.get("/", listAnnouncements);

// Protected routes
router.post("/", authMiddleware, createAnnouncement);
router.put("/:id", authMiddleware, updateAnnouncement);
router.delete("/:id", authMiddleware, deleteAnnouncement);
router.post("/:id/toggle-pin", authMiddleware, togglePin);
router.post("/:id/toggle-active", authMiddleware, toggleActive);

export default router;
