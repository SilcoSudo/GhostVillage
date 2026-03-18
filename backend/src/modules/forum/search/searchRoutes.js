import express from 'express';
import * as searchController from './searchController.js';

const router = express.Router();

/**
 * @route   GET /api/web/search
 * @desc    Search across all collections (Posts, Users, Wiki, Announcements)
 * @query   q or query - Search string
 * @query   collections - Comma-separated list (optional): posts,users,wiki,announcements
 * @query   limit - Results per collection (default: 10)
 * @query   page - Page number (default: 1)
 * @access  Public
 */
router.get('/', searchController.searchAll);

/**
 * @route   GET /api/web/search/suggestions
 * @desc    Get search suggestions (autocomplete)
 * @query   q or query - Search string
 * @query   limit - Max suggestions (default: 5)
 * @access  Public
 */
router.get('/suggestions', searchController.getSearchSuggestions);

/**
 * @route   GET /api/web/search/:collection
 * @desc    Search in specific collection only
 * @param   collection - One of: posts, users, wiki, announcements
 * @query   q or query - Search string
 * @query   limit - Results limit (default: 10)
 * @query   page - Page number (default: 1)
 * @access  Public
 */
router.get('/:collection', searchController.searchByCollection);

/**
 * @route   POST /api/web/search/advanced
 * @desc    Advanced search with filters
 * @body    query - Search string
 * @body    filters - Filter object (collections, dateFrom, dateTo, category, etc.)
 * @access  Public
 */
router.post('/advanced', searchController.searchWithFilters);

export default router;
