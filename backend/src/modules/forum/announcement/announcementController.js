import * as announcementService from "./announcementService.js";

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
 * List active announcements
 */
export const listAnnouncements = async (req, res, next) => {
    try {
        const { page, limit, includeInactive } = req.query;
        const { items, pagination } = await announcementService.listAnnouncements({
            page,
            limit,
            includeInactive: includeInactive === "true",
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
 * Get pinned announcements
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
 * Get single announcement by slug
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

/**
 * POST /api/web/announcement
 * Create new announcement (admin only)
 */
export const createAnnouncement = async (req, res, next) => {
    try {
        const { title, slug, content, excerpt, coverImage, isPinned, isActive } = req.body;

        if (!title || !slug || !content) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: title, slug, content",
            });
        }

        const effectiveAuthor = req.user?._id || req.body.author;
        if (!effectiveAuthor) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const announcementData = {
            title,
            slug,
            content,
            excerpt,
            author: effectiveAuthor,
            coverImage,
            isPinned: isPinned || false,
            isActive: isActive !== undefined ? isActive : true,
        };

        const created = await announcementService.createAnnouncement(announcementData);

        return res.status(201).json({
            success: true,
            data: serializeAnnouncement(created),
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Slug already exists",
            });
        }
        next(err);
    }
};

/**
 * PUT /api/web/announcement/:id
 * Update announcement (admin only)
 */
export const updateAnnouncement = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const { title, content, excerpt, coverImage, isPinned, isActive } = req.body;

        const updateData = {};
        if (title) updateData.title = title;
        if (content) updateData.content = content;
        if (excerpt !== undefined) updateData.excerpt = excerpt;
        if (coverImage !== undefined) updateData.coverImage = coverImage;
        if (isPinned !== undefined) updateData.isPinned = isPinned;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updated = await announcementService.updateAnnouncement(req.params.id, updateData);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: serializeAnnouncement(updated),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/web/announcement/:id
 * Delete announcement (admin only)
 */
export const deleteAnnouncement = async (req, res, next) => {
    try {
        const deleted = await announcementService.deleteAnnouncement(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Announcement deleted successfully",
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/web/announcement/:id/toggle-pin
 * Toggle pin status (admin only)
 */
export const togglePin = async (req, res, next) => {
    try {
        const announcement = await announcementService.togglePin(req.params.id);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: { isPinned: announcement.isPinned },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/web/announcement/:id/toggle-active
 * Toggle active status (admin only)
 */
export const toggleActive = async (req, res, next) => {
    try {
        const announcement = await announcementService.toggleActive(req.params.id);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: { isActive: announcement.isActive },
        });
    } catch (err) {
        next(err);
    }
};
