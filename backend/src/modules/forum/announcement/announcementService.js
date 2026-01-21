import Announcement from "./announcementModel.js";

/**
 * List active announcements sorted by pinned & date
 */
export const listAnnouncements = async ({ page = 1, limit = 20, includeInactive = false }) => {
    const p = Math.max(parseInt(page) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (p - 1) * l;

    // Build query filter - only active by default
    const filter = includeInactive ? {} : { isActive: true };

    const [items, total] = await Promise.all([
        Announcement.find(filter)
            .sort({ isPinned: -1, createdAt: -1 }) // Pinned first, then newest
            .skip(skip)
            .limit(l)
            .populate("author", "fullname avatar"),
        Announcement.countDocuments(filter),
    ]);

    const hasMore = skip + items.length < total;
    return { items, pagination: { page: p, limit: l, total, hasMore } };
};

/**
 * Get announcement by slug
 */
export const getAnnouncementBySlug = async (slug, incrementViews = true) => {
    const announcement = await Announcement.findOne({ slug, isActive: true })
        .populate("author", "fullname avatar");

    if (announcement && incrementViews) {
        announcement.views += 1;
        await announcement.save();
    }

    return announcement;
};

/**
 * Get announcement by ID (for admin)
 */
export const getAnnouncementById = async (id) => {
    return await Announcement.findById(id)
        .populate("author", "fullname avatar");
};

/**
 * Create new announcement
 */
export const createAnnouncement = async (data) => {
    const announcement = await Announcement.create(data);
    return await announcement.populate("author", "fullname avatar");
};

/**
 * Update announcement
 */
export const updateAnnouncement = async (id, data) => {
    const updateData = {
        ...data,
        updatedAt: new Date(),
    };

    return await Announcement.findByIdAndUpdate(id, updateData, { new: true })
        .populate("author", "fullname avatar");
};

/**
 * Delete announcement
 */
export const deleteAnnouncement = async (id) => {
    return await Announcement.findByIdAndDelete(id);
};

/**
 * Toggle pin status
 */
export const togglePin = async (id) => {
    const announcement = await Announcement.findById(id);
    if (!announcement) return null;

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();
    return announcement;
};

/**
 * Toggle active status
 */
export const toggleActive = async (id) => {
    const announcement = await Announcement.findById(id);
    if (!announcement) return null;

    announcement.isActive = !announcement.isActive;
    await announcement.save();
    return announcement;
};

/**
 * Get pinned announcements
 */
export const getPinnedAnnouncements = async (limit = 5) => {
    return await Announcement.find({ isActive: true, isPinned: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("author", "fullname avatar");
};

/**
 * Search announcements
 */
export const searchAnnouncements = async (keyword, { page = 1, limit = 20 }) => {
    const skip = (page - 1) * limit;
    const regex = new RegExp(keyword, "i");

    const filter = {
        isActive: true,
        $or: [
            { $text: { $search: keyword } },
            { title: regex },
        ],
    };

    const [items, total] = await Promise.all([
        Announcement.find(filter)
            .sort({ isPinned: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("author", "fullname avatar"),
        Announcement.countDocuments(filter),
    ]);

    return { items, total };
};
