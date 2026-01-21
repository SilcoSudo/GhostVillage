import express from "express";
import {
    listWikis,
    getFeaturedWikis,
    getWiki,
    createWiki,
    updateWiki,
    deleteWiki,
    likeWiki,
    getWikisByEntity,
} from "./wikiController.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * Wiki Routes
 * GET    /api/web/wiki                          - List wikis (with filters)
 * GET    /api/web/wiki/featured                 - Get featured wikis
 * GET    /api/web/wiki/entity/:entityType/:id   - Get wikis by entity
 * GET    /api/web/wiki/:slug                    - Get wiki by slug
 * POST   /api/web/wiki                          - Create wiki (auth required)
 * PUT    /api/web/wiki/:id                      - Update wiki (auth required)
 * DELETE /api/web/wiki/:id                      - Delete wiki (auth required)
 * POST   /api/web/wiki/:id/like                 - Like wiki (auth required)
 */

// Public routes
router.get("/featured", getFeaturedWikis);
router.get("/entity/:entityType/:entityId", getWikisByEntity);
router.get("/:slug", getWiki);
router.get("/", listWikis);

// Protected routes
router.post("/", authMiddleware, createWiki);
router.put("/:id", authMiddleware, updateWiki);
router.delete("/:id", authMiddleware, deleteWiki);
router.post("/:id/like", authMiddleware, likeWiki);

export default router;