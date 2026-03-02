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
 * GET /api/admin/announcement
 * List all announcements including inactive ones (Admin only)
 */
export const listAllAnnouncements = async (req, res, next) => {
    try {
        const { page, limit, includeInactive } = req.query;
        const { items, pagination } = await announcementService.listAnnouncements({
            page,
            limit,
            includeInactive: includeInactive === "true" || true, // Admin can see all
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
 * GET /api/admin/announcement/:id
 * Get single announcement by ID (Admin only)
 */
export const getAnnouncementById = async (req, res, next) => {
    try {
        const announcement = await announcementService.getAnnouncementById(req.params.id);

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
 * POST /api/admin/announcement
 * Create new announcement (Admin only)
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
 * PUT /api/admin/announcement/:id
 * Update announcement (Admin only)
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
 * DELETE /api/admin/announcement/:id
 * Delete announcement (Admin only)
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
 * POST /api/admin/announcement/:id/toggle-pin
 * Toggle pin status (Admin only)
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
 * POST /api/admin/announcement/:id/toggle-active
 * Toggle active status (Admin only)
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
