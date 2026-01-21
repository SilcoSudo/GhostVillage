import Wiki from "./wikiModel.js";

/**
 * List wikis with filtering and pagination
 */
export const listWikis = async({
    page = 1,
    limit = 20,
    category,
    entityType,
    featured,
    status = "published",
}) => {
    const p = Math.max(parseInt(page) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (p - 1) * l;

    // Build query filter
    const filter = { status };

    if (category && category !== "all") {
        filter.category = category;
    }

    if (entityType && entityType !== "all") {
        filter.entityType = entityType;
    }

    if (featured === "true" || featured === true) {
        filter.isFeatured = true;
    }

    const [items, total] = await Promise.all([
        Wiki.find(filter)
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(l)
        .populate("author", "fullname avatar")
        .select("-content"), // Exclude full content in list view
        Wiki.countDocuments(filter),
    ]);

    const hasMore = skip + items.length < total;
    return { items, pagination: { page: p, limit: l, total, hasMore } };
};

/**
 * Get wiki by slug
 */
export const getWikiBySlug = async(slug, incrementViews = true) => {
    const wiki = await Wiki.findOne({ slug, status: "published" })
        .populate("author", "fullname avatar")
        .populate("lastEditedBy", "fullname")
        .populate("relatedWikis", "title slug category coverImage");

    if (wiki && incrementViews) {
        wiki.views += 1;
        await wiki.save();
    }

    return wiki;
};

/**
 * Get wiki by ID (for admin)
 */
export const getWikiById = async(id) => {
    return await Wiki.findById(id)
        .populate("author", "fullname avatar")
        .populate("lastEditedBy", "fullname")
        .populate("relatedWikis", "title slug category");
};

/**
 * Create new wiki
 */
export const createWiki = async(data) => {
    const wiki = await Wiki.create(data);
    return await wiki.populate("author", "fullname avatar");
};

/**
 * Update wiki
 */
export const updateWiki = async(id, data, userId) => {
    const updateData = {
        ...data,
        lastEditedBy: userId,
        updatedAt: new Date(),
    };

    if (data.status === "published" && !data.publishedAt) {
        updateData.publishedAt = new Date();
    }

    return await Wiki.findByIdAndUpdate(id, updateData, { new: true })
        .populate("author", "fullname avatar")
        .populate("lastEditedBy", "fullname");
};

/**
 * Delete wiki
 */
export const deleteWiki = async(id) => {
    return await Wiki.findByIdAndDelete(id);
};

/**
 * Toggle like
 */
export const toggleLike = async(id, userId) => {
    const wiki = await Wiki.findById(id);
    if (!wiki) return null;

    const idx = wiki.likes.findIndex((x) => String(x) === String(userId));
    if (idx >= 0) {
        wiki.likes.splice(idx, 1);
    } else {
        wiki.likes.push(userId);
    }

    await wiki.save();
    return wiki;
};

/**
 * Search wikis by keyword
 */
export const searchWikis = async(keyword, { page = 1, limit = 20 }) => {
    const skip = (page - 1) * limit;
    const regex = new RegExp(keyword, "i");

    const filter = {
        status: "published",
        $or: [
            { $text: { $search: keyword } },
            { title: regex },
            { tags: regex },
        ],
    };

    const [items, total] = await Promise.all([
        Wiki.find(filter)
        .sort({ isFeatured: -1, views: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "fullname avatar")
        .select("-content"),
        Wiki.countDocuments(filter),
    ]);

    return { items, total };
};

/**
 * Get featured wikis
 */
export const getFeaturedWikis = async(limit = 6) => {
    return await Wiki.find({ status: "published", isFeatured: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("author", "fullname avatar")
        .select("-content");
};

/**
 * Get wikis by entity
 */
export const getWikisByEntity = async(entityType, entityId) => {
    return await Wiki.find({
            status: "published",
            entityType,
            entityId,
        })
        .populate("author", "fullname avatar")
        .select("-content");
};