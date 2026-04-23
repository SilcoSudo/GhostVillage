import axiosInstance from './axios';

const moonEventService = {
  /**
   * Get all moon events with filters
   * @param {Object} params - Query parameters (isActive, search)
   * @returns {Promise<Array>} - List of moon events
   */
  getAllMoonEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.isActive && params.isActive !== 'all') {
      queryParams.append('isActive', params.isActive);
    }

    if (params.search) {
      queryParams.append('search', params.search);
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/moon-events?${queryString}` : '/moon-events';

    const response = await axiosInstance.get(url);
    return response.data;
  },

  /**
   * Get active moon events (for Game Server)
   * @returns {Promise<Array>} - List of active moon events
   */
  getActiveMoonEvents: async () => {
    const response = await axiosInstance.get('/game/moon-events/active');
    return response.data;
  },

  /**
   * Get moon event by ID
   * @param {string} id - Moon Event ID
   * @returns {Promise<Object>} - Moon Event object
   */
  getMoonEventById: async (id) => {
    const response = await axiosInstance.get(`/moon-events/${id}`);
    return response.data;
  },

  /**
   * Create new moon event
   * @param {Object} eventData - Moon Event data
   * @returns {Promise<Object>} - Created moon event
   */
  createMoonEvent: async (eventData) => {
    const response = await axiosInstance.post('/moon-events', eventData);
    return response.data;
  },

  /**
   * Update moon event
   * @param {string} id - Moon Event ID
   * @param {Object} eventData - Updated moon event data
   * @returns {Promise<Object>} - Updated moon event
   */
  updateMoonEvent: async (id, eventData) => {
    const response = await axiosInstance.put(`/moon-events/${id}`, eventData);
    return response.data;
  },

  /**
   * Toggle moon event active status
   * @param {string} id - Moon Event ID
   * @param {boolean} isActive - New active status
   * @returns {Promise<Object>} - Updated moon event
   */
  toggleMoonEventActive: async (id, isActive) => {
    const response = await axiosInstance.patch(`/moon-events/${id}/status`, {
      isActive,
    });
    return response.data;
  },

  /**
   * Delete moon event
   * @param {string} id - Moon Event ID
   * @returns {Promise<Object>} - Deletion result
   */
  deleteMoonEvent: async (id) => {
    const response = await axiosInstance.delete(`/moon-events/${id}`);
    return response.data;
  },
};

export default moonEventService;
