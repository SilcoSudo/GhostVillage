import axios from "./axios";

/**
 * Perk API Service
 * Xử lý các request liên quan đến quản lý Perk
 */
const perkService = {
  /**
   * Lấy danh sách tất cả perk
   * @param {Object} params - Query parameters (page, limit, isActive, search)
   * @returns {Promise} Response data
   */
  getAllPerks: async (params = {}) => {
    try {
      const response = await axios.get("/perks", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching perks:", error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết một perk
   * @param {String} id - Perk ID (_id hoặc perkId)
   * @returns {Promise} Response data
   */
  getPerkById: async (id) => {
    try {
      const response = await axios.get(`/perks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching perk ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin perk
   * @param {String} id - Perk ID
   * @param {Object} perkData - Dữ liệu cập nhật
   * @returns {Promise} Response data
   */
  updatePerk: async (id, perkData) => {
    try {
      const response = await axios.put(`/perks/${id}`, perkData);
      return response.data;
    } catch (error) {
      console.error(`Error updating perk ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bật/tắt trạng thái active của perk
   * @param {String} id - Perk ID
   * @param {Boolean} isActive - Trạng thái mới
   * @returns {Promise} Response data
   */
  togglePerkStatus: async (id, isActive) => {
    try {
      const response = await axios.patch(`/perks/${id}/status`, {
        isActive,
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling perk status ${id}:`, error);
      throw error;
    }
  },
};

export default perkService;
