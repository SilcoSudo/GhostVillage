import axios from "./axios";

/**
 * Map API Service
 * Xử lý các request liên quan đến quản lý bản đồ
 */
const mapService = {
  /**
   * Lấy danh sách tất cả maps
   * @param {Object} params - Query parameters (isActive)
   * @returns {Promise} Response data
   */
  getAllMaps: async (params = {}) => {
    try {
      const response = await axios.get("/maps", {
        params: {
          ...params,
          _ts: Date.now(),
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching maps:", error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết một map
   * @param {String} id - Map ID
   * @returns {Promise} Response data
   */
  getMapById: async (id) => {
    try {
      const response = await axios.get(`/maps/${id}`, {
        params: { _ts: Date.now() },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching map ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bật/tắt trạng thái active của map
   * @param {String} id - Map ID
   * @param {Boolean} isActive - Trạng thái mới
   * @returns {Promise} Response data
   */
  toggleMapStatus: async (id, isActive) => {
    try {
      const response = await axios.patch(`/maps/${id}/status`, {
        isActive,
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling map status ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cập nhật metadata của map
   * @param {String} id - Map ID
   * @param {Object} metadata - Dữ liệu metadata (displayName, requiredLevel, shortDescription, thumbnailUrl)
   * @returns {Promise} Response data
   */
  updateMapMetadata: async (id, metadata) => {
    try {
      const response = await axios.put(`/maps/${id}`, metadata);
      return response.data;
    } catch (error) {
      console.error(`Error updating map metadata ${id}:`, error);
      throw error;
    }
  },
};

export default mapService;
