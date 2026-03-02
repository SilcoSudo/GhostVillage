import axios from './axios';

/**
 * Announcement API Service
 * Admin Base URL: /api/admin/announcement
 * Web Base URL: /api/web/announcement
 */

// Admin APIs - for managing announcements
// Get list of announcements with pagination and filters (including inactive)
export const getAnnouncements = async ({ page = 1, limit = 10, includeInactive = true } = {}) => {
  const response = await axios.get('/admin/announcement', {
    params: { page, limit, includeInactive }
  });
  return response.data;
};

// Get single announcement by ID (admin)
export const getAnnouncementById = async (id) => {
  const response = await axios.get(`/admin/announcement/${id}`);
  return response.data;
};

// Create new announcement (admin only)
export const createAnnouncement = async (data) => {
  const response = await axios.post('/admin/announcement', data);
  return response.data;
};

// Update announcement (admin only)
export const updateAnnouncement = async (id, data) => {
  const response = await axios.put(`/admin/announcement/${id}`, data);
  return response.data;
};

// Delete announcement (admin only)
export const deleteAnnouncement = async (id) => {
  const response = await axios.delete(`/admin/announcement/${id}`);
  return response.data;
};

// Toggle pin status (admin only)
export const togglePin = async (id) => {
  const response = await axios.post(`/admin/announcement/${id}/toggle-pin`);
  return response.data;
};

// Toggle active status (admin only)
export const toggleActive = async (id) => {
  const response = await axios.post(`/admin/announcement/${id}/toggle-active`);
  return response.data;
};

// Web APIs - for public viewing
// Get pinned announcements (public)
export const getPinnedAnnouncements = async (limit = 5) => {
  const response = await axios.get('/web/announcement/pinned', {
    params: { limit }
  });
  return response.data;
};

// Get single announcement by slug (public)
export const getAnnouncementBySlug = async (slug) => {
  const response = await axios.get(`/web/announcement/${slug}`);
  return response.data;
};

// Helper: Generate slug from title
export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .substring(0, 100); // Limit length
};
