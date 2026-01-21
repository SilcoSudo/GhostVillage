import * as searchService from './searchService.js';

/**
 * GET /api/web/search
 * Search across all collections
 */
export const searchAll = async (req, res, next) => {
  try {
    const { q, query, collections, limit, page } = req.query;
    const searchQuery = q || query;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const options = {
      collections: collections ? collections.split(',') : undefined,
      limit: limit ? parseInt(limit) : 10,
      page: page ? parseInt(page) : 1
    };

    const results = await searchService.searchAll(searchQuery, options);

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/web/search/:collection
 * Search in specific collection
 */
export const searchByCollection = async (req, res, next) => {
  try {
    const { collection } = req.params;
    const { q, query, limit, page } = req.query;
    const searchQuery = q || query;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const validCollections = ['posts', 'users', 'wiki', 'announcements'];
    if (!validCollections.includes(collection)) {
      return res.status(400).json({
        success: false,
        message: `Invalid collection. Must be one of: ${validCollections.join(', ')}`
      });
    }

    const options = {
      limit: limit ? parseInt(limit) : 10,
      page: page ? parseInt(page) : 1
    };

    const results = await searchService.searchByCollection(collection, searchQuery, options);

    return res.status(200).json({
      success: true,
      data: {
        query: searchQuery,
        collection,
        ...results
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/web/search/suggestions
 * Get search suggestions
 */
export const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q, query, limit } = req.query;
    const searchQuery = q || query;

    if (!searchQuery || searchQuery.length < 2) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const suggestions = await searchService.getSearchSuggestions(
      searchQuery,
      limit ? parseInt(limit) : 5
    );

    return res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/web/search/advanced
 * Advanced search with filters
 */
export const searchWithFilters = async (req, res, next) => {
  try {
    const { query, filters } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = await searchService.searchWithFilters(query, filters || {});

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};
