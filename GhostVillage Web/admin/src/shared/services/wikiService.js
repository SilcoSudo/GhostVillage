import axiosInstance from "./axios";

/**
 * Wiki Service
 * API client for wiki management endpoints
 */

/**
 * Get all wikis with filters and pagination
 * @param {Object} params - Query parameters { page, limit, category, entityType, featured, status }
 * @returns {Promise}
 */
export const getAllWikis = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/web/wiki", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching wikis:", error);
    throw error;
  }
};

/**
 * Get wiki by ID
 * @param {String} id - Wiki ID
 * @returns {Promise}
 */
export const getWikiById = async (id) => {
  try {
    const response = await axiosInstance.get(`/web/wiki/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching wiki:", error);
    throw error;
  }
};

/**
 * Create new wiki
 * @param {Object} wikiData - Wiki data
 * @returns {Promise}
 */
export const createWiki = async (wikiData) => {
  try {
    const response = await axiosInstance.post("/web/wiki", wikiData);
    return response.data;
  } catch (error) {
    console.error("Error creating wiki:", error);
    throw error;
  }
};

/**
 * Update wiki
 * @param {String} id - Wiki ID
 * @param {Object} wikiData - Updated wiki data
 * @returns {Promise}
 */
export const updateWiki = async (id, wikiData) => {
  try {
    const response = await axiosInstance.put(`/web/wiki/${id}`, wikiData);
    return response.data;
  } catch (error) {
    console.error("Error updating wiki:", error);
    throw error;
  }
};

/**
 * Delete wiki
 * @param {String} id - Wiki ID
 * @returns {Promise}
 */
export const deleteWiki = async (id) => {
  try {
    const response = await axiosInstance.delete(`/web/wiki/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting wiki:", error);
    throw error;
  }
};

/**
 * Toggle wiki featured status
 * @param {String} id - Wiki ID
 * @param {Boolean} isFeatured - Featured status
 * @returns {Promise}
 */
export const toggleWikiFeatured = async (id, isFeatured) => {
  try {
    const response = await axiosInstance.put(`/web/wiki/${id}`, { isFeatured });
    return response.data;
  } catch (error) {
    console.error("Error toggling wiki featured:", error);
    throw error;
  }
};

/**
 * Update wiki status
 * @param {String} id - Wiki ID
 * @param {String} status - Status (draft/published/archived)
 * @returns {Promise}
 */
export const updateWikiStatus = async (id, status) => {
  try {
    const response = await axiosInstance.put(`/web/wiki/${id}`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating wiki status:", error);
    throw error;
  }
};

/**
 * Get featured wikis
 * @param {Number} limit - Number of wikis to fetch
 * @returns {Promise}
 */
export const getFeaturedWikis = async (limit = 10) => {
  try {
    const response = await axiosInstance.get("/web/wiki/featured", {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching featured wikis:", error);
    throw error;
  }
};

export default {
  getAllWikis,
  getWikiById,
  createWiki,
  updateWiki,
  deleteWiki,
  toggleWikiFeatured,
  updateWikiStatus,
  getFeaturedWikis,
};
