import * as wikiService from "./wikiService.js";

const serializeWiki = (doc) => {
    const wiki = doc ?.toObject ? doc.toObject() : doc;
    if (!wiki) return wiki;

    return {
        ...wiki,
        likes: Array.isArray(wiki.likes) ? wiki.likes.length : 0,
        author: wiki.author ? {
            _id: wiki.author._id,
            fullname: wiki.author.fullname || "Anonymous",
            avatar: wiki.author.avatar || null,
        } : null,
    };
};

/**
 * GET /api/web/wiki
 * List wikis with filtering
 */
export const listWikis = async(req, res, next) => {
    try {
        const { page, limit, category, entityType, featured, status } = req.query;
        const { items, pagination } = await wikiService.listWikis({
            page,
            limit,
            category,
            entityType,
            featured,
            status,
        });

        return res.status(200).json({
            success: true,
            data: { wikis: items.map(serializeWiki), pagination },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/web/wiki/featured
 * Get featured wikis
 */
export const getFeaturedWikis = async(req, res, next) => {
    try {
        const { limit } = req.query;
        const wikis = await wikiService.getFeaturedWikis(limit);

        return res.status(200).json({
            success: true,
            data: wikis.map(serializeWiki),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/web/wiki/:slug
 * Get single wiki by slug
 */
export const getWiki = async(req, res, next) => {
    try {
        const wiki = await wikiService.getWikiBySlug(req.params.slug);

        if (!wiki) {
            return res.status(404).json({
                success: false,
                message: "Wiki not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: serializeWiki(wiki),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/web/wiki
 * Create new wiki (admin only)
 */
export const createWiki = async(req, res, next) => {
    try {
        const {
            title,
            slug,
            content,
            excerpt,
            category,
            tags,
            gameData,
            entityType,
            entityId,
            coverImage,
            gallery,
            videoGuide,
            status,
            isFeatured,
            relatedWikis,
        } = req.body;

        if (!title || !slug || !content || !category) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: title, slug, content, category",
            });
        }

        const effectiveAuthor = req.user ?._id || req.body.author;
        if (!effectiveAuthor) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const wikiData = {
            title,
            slug,
            content,
            excerpt,
            category,
            tags: tags || [],
            gameData,
            entityType,
            entityId,
            author: effectiveAuthor,
            coverImage,
            gallery: gallery || [],
            videoGuide,
            status: status || "draft",
            isFeatured: isFeatured || false,
            relatedWikis: relatedWikis || [],
        };

        if (status === "published") {
            wikiData.publishedAt = new Date();
        }

        const created = await wikiService.createWiki(wikiData);

        return res.status(201).json({
            success: true,
            data: serializeWiki(created),
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
 * PUT /api/web/wiki/:id
 * Update wiki (admin/author only)
 */
export const updateWiki = async(req, res, next) => {
    try {
        const userId = req.user ?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const {
            title,
            content,
            excerpt,
            category,
            tags,
            gameData,
            entityType,
            entityId,
            coverImage,
            gallery,
            videoGuide,
            status,
            isFeatured,
            relatedWikis,
        } = req.body;

        const updateData = {};
        if (title) updateData.title = title;
        if (content) updateData.content = content;
        if (excerpt !== undefined) updateData.excerpt = excerpt;
        if (category) updateData.category = category;
        if (tags) updateData.tags = tags;
        if (gameData !== undefined) updateData.gameData = gameData;
        if (entityType !== undefined) updateData.entityType = entityType;
        if (entityId !== undefined) updateData.entityId = entityId;
        if (coverImage !== undefined) updateData.coverImage = coverImage;
        if (gallery) updateData.gallery = gallery;
        if (videoGuide !== undefined) updateData.videoGuide = videoGuide;
        if (status) updateData.status = status;
        if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
        if (relatedWikis) updateData.relatedWikis = relatedWikis;

        updateData.version = { $inc: 1 };

        const updated = await wikiService.updateWiki(
            req.params.id,
            updateData,
            userId
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Wiki not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: serializeWiki(updated),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/web/wiki/:id
 * Delete wiki (admin only)
 */
export const deleteWiki = async(req, res, next) => {
    try {
        const deleted = await wikiService.deleteWiki(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Wiki not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Wiki deleted successfully",
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/web/wiki/:id/like
 * Toggle like on wiki
 */
export const likeWiki = async(req, res, next) => {
    try {
        const userId = req.user ?._id || req.body.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const wiki = await wikiService.toggleLike(req.params.id, userId);

        if (!wiki) {
            return res.status(404).json({
                success: false,
                message: "Wiki not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: { likes: Array.isArray(wiki.likes) ? wiki.likes.length : 0 },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/web/wiki/entity/:entityType/:entityId
 * Get wikis by entity
 */
export const getWikisByEntity = async(req, res, next) => {
    try {
        const { entityType, entityId } = req.params;
        const wikis = await wikiService.getWikisByEntity(entityType, entityId);

        return res.status(200).json({
            success: true,
            data: wikis.map(serializeWiki),
        });
    } catch (err) {
        next(err);
    }
};