import axios from "./axios";

/**
 * Monster API Service
 * Xử lý các request liên quan đến quản lý quái vật
 */
const monsterService = {
  /**
   * Lấy danh sách tất cả quái vật
   * @param {Object} params - Query parameters (page, limit, isActive)
   * @returns {Promise} Response data
   */
  getAllMonsters: async (params = {}) => {
    try {
      const response = await axios.get("/monsters", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching monsters:", error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết một quái vật
   * @param {String} id - Monster ID
   * @returns {Promise} Response data
   */
  getMonsterById: async (id) => {
    try {
      const response = await axios.get(`/monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Tạo quái vật mới
   * @param {Object} monsterData - Dữ liệu quái vật
   * @returns {Promise} Response data
   */
  createMonster: async (monsterData) => {
    try {
      const response = await axios.post("/monsters", monsterData);
      return response.data;
    } catch (error) {
      console.error("Error creating monster:", error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin quái vật
   * @param {String} id - Monster ID
   * @param {Object} monsterData - Dữ liệu cập nhật
   * @returns {Promise} Response data
   */
  updateMonster: async (id, monsterData) => {
    try {
      const response = await axios.put(`/monsters/${id}`, monsterData);
      return response.data;
    } catch (error) {
      console.error(`Error updating monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Xóa quái vật (soft delete)
   * @param {String} id - Monster ID
   * @returns {Promise} Response data
   */
  deleteMonster: async (id) => {
    try {
      const response = await axios.delete(`/monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bật/tắt trạng thái active của quái vật
   * @param {String} id - Monster ID
   * @param {Boolean} isActive - Trạng thái mới
   * @returns {Promise} Response data
   */
  toggleMonsterStatus: async (id, isActive) => {
    try {
      const response = await axios.patch(`/monsters/${id}/status`, {
        isActive,
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling monster status ${id}:`, error);
      throw error;
    }
  },
};

export default monsterService;
