import express from "express";
import {
    listAnnouncements,
    getPinnedAnnouncements,
    getAnnouncement,
} from "./announcementController.js";

const router = express.Router();

/**
 * Web Announcement Routes (Public)
 * GET /api/web/announcement         - List active announcements
 * GET /api/web/announcement/pinned  - Get pinned announcements
 * GET /api/web/announcement/:slug   - Get announcement by slug
 */

router.get("/pinned", getPinnedAnnouncements);
router.get("/:slug", getAnnouncement);
router.get("/", listAnnouncements);

export default router;
