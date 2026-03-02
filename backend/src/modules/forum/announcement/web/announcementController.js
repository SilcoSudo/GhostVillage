import * as announcementService from "../announcementService.js";

const serializeAnnouncement = (doc) => {
    const announcement = doc?.toObject ? doc.toObject() : doc;
    if (!announcement) return announcement;

    return {
        ...announcement,
        author: announcement.author
            ? {
                  _id: announcement.author._id,
                  fullname: announcement.author.fullname || "Anonymous",
                  avatar: announcement.author.avatar || null,
              }
            : null,
    };
};

/**
 * GET /api/web/announcement
 * List active announcements (Public)
 */
export const listAnnouncements = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const { items, pagination } = await announcementService.listAnnouncements({
            page,
            limit,
            includeInactive: false, // Only show active announcements for public
        });

        return res.status(200).json({
            success: true,
            data: { announcements: items.map(serializeAnnouncement), pagination },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/web/announcement/pinned
 * Get pinned announcements (Public)
 */
export const getPinnedAnnouncements = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const announcements = await announcementService.getPinnedAnnouncements(limit);

        return res.status(200).json({
            success: true,
            data: announcements.map(serializeAnnouncement),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/web/announcement/:slug
 * Get single announcement by slug (Public)
 */
export const getAnnouncement = async (req, res, next) => {
    try {
        const announcement = await announcementService.getAnnouncementBySlug(req.params.slug);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: serializeAnnouncement(announcement),
        });
    } catch (err) {
        next(err);
    }
};
