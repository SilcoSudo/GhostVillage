import express from "express";
import {
    listAllAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePin,
    toggleActive,
} from "./announcementController.js";
import { authMiddleware } from "../../../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * Admin Announcement Routes (All require authentication)
 * GET    /api/admin/announcement                    - List all announcements (including inactive)
 * GET    /api/admin/announcement/:id                - Get announcement by ID
 * POST   /api/admin/announcement                    - Create announcement
 * PUT    /api/admin/announcement/:id                - Update announcement
 * DELETE /api/admin/announcement/:id                - Delete announcement
 * POST   /api/admin/announcement/:id/toggle-pin     - Toggle pin status
 * POST   /api/admin/announcement/:id/toggle-active  - Toggle active status
 */

// All routes require authentication
router.use(authMiddleware);

router.get("/:id", getAnnouncementById);
router.get("/", listAllAnnouncements);
router.post("/", createAnnouncement);
router.put("/:id", updateAnnouncement);
router.delete("/:id", deleteAnnouncement);
router.post("/:id/toggle-pin", togglePin);
router.post("/:id/toggle-active", toggleActive);

export default router;
