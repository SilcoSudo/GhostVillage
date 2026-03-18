import axiosInstance from './axios';

const moonEventService = {
  /**
   * Get all moon events with filters
   * @param {Object} params - Query parameters (category, status, search)
   * @returns {Promise<Array>} - List of moon events
   */
  getAllMoonEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.category && params.category !== 'all') {
      queryParams.append('category', params.category);
    }
    
    if (params.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    
    if (params.search) {
      queryParams.append('search', params.search);
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `/web/moon-events?${queryString}` : '/web/moon-events';
    
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
    const response = await axiosInstance.get(`/web/moon-events/${id}`);
    return response.data;
  },

  /**
   * Create new moon event
   * @param {Object} eventData - Moon Event data
   * @returns {Promise<Object>} - Created moon event
   */
  createMoonEvent: async (eventData) => {
    const response = await axiosInstance.post('/web/moon-events', eventData);
    return response.data;
  },

  /**
   * Update moon event
   * @param {string} id - Moon Event ID
   * @param {Object} eventData - Updated moon event data
   * @returns {Promise<Object>} - Updated moon event
   */
  updateMoonEvent: async (id, eventData) => {
    const response = await axiosInstance.put(`/web/moon-events/${id}`, eventData);
    return response.data;
  },

  /**
   * Toggle moon event active status
   * @param {string} id - Moon Event ID
   * @returns {Promise<Object>} - Updated moon event
   */
  toggleMoonEventActive: async (id) => {
    const response = await axiosInstance.patch(`/web/moon-events/${id}/toggle-active`);
    return response.data;
  },

  /**
   * Delete moon event
   * @param {string} id - Moon Event ID
   * @returns {Promise<Object>} - Deletion result
   */
  deleteMoonEvent: async (id) => {
    const response = await axiosInstance.delete(`/web/moon-events/${id}`);
    return response.data;
  },
};

export default moonEventService;
