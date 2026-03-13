import axios from "./axios";

/**
 * Costume API Service
 * Xử lý các request liên quan đến quản lý trang phục (Costume Management)
 */
const costumeService = {
  /**
   * Lấy danh sách tất cả costume
   * @param {Object} params - Query parameters (page, limit, isActive, isAvailableInStore, rarity, category, search)
   * @returns {Promise} Response data
   */
  getAllCostumes: async (params = {}) => {
    try {
      const response = await axios.get("/costumes", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching costumes:", error);
      throw error;
    }
  },

  /**
   * Lấy thống kê tổng quan về costumes
   * @returns {Promise} Response data
   */
  getCostumeStats: async () => {
    try {
      const response = await axios.get("/costumes/stats/summary");
      return response.data;
    } catch (error) {
      console.error("Error fetching costume stats:", error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết một costume
   * @param {String} id - Costume ID (MongoDB _id hoặc costumeId)
   * @returns {Promise} Response data
   */
  getCostumeById: async (id) => {
    try {
      const response = await axios.get(`/costumes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching costume ${id}:`, error);
      throw error;
    }
  },

  /**
   * Tạo costume mới
   * @param {Object} costumeData - Dữ liệu costume
   * @returns {Promise} Response data
   */
  createCostume: async (costumeData) => {
    try {
      const response = await axios.post("/costumes", costumeData);
      return response.data;
    } catch (error) {
      console.error("Error creating costume:", error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin costume
   * @param {String} id - Costume ID
   * @param {Object} costumeData - Dữ liệu cập nhật
   * @returns {Promise} Response data
   */
  updateCostume: async (id, costumeData) => {
    try {
      const response = await axios.put(`/costumes/${id}`, costumeData);
      return response.data;
    } catch (error) {
      console.error(`Error updating costume ${id}:`, error);
      throw error;
    }
  },

  /**
   * Xóa costume
   * @param {String} id - Costume ID
   * @returns {Promise} Response data
   */
  deleteCostume: async (id) => {
    try {
      const response = await axios.delete(`/costumes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting costume ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bật/tắt trạng thái active của costume
   * @param {String} id - Costume ID
   * @param {Boolean} isActive - Trạng thái mới
   * @returns {Promise} Response data
   */
  toggleCostumeStatus: async (id, isActive) => {
    try {
      const response = await axios.patch(`/costumes/${id}/status`, {
        isActive,
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling costume status ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bật/tắt hiển thị trong shop của costume
   * @param {String} id - Costume ID
   * @param {Boolean} isAvailableInStore - Trạng thái mới
   * @returns {Promise} Response data
   */
  toggleStoreAvailability: async (id, isAvailableInStore) => {
    try {
      const response = await axios.patch(`/costumes/${id}/store`, {
        isAvailableInStore,
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling store availability ${id}:`, error);
      throw error;
    }
  },
};

export default costumeService;
