import axios from "./axios";

/**
 * Quest API Service
 * Xử lý các request liên quan đến quản lý nhiệm vụ (Quest Management)
 */
const questService = {
  /**
   * Lấy danh sách tất cả quest
   * @param {Object} params - Query parameters (page, limit, isActive, questLine, difficulty, search)
   * @returns {Promise} Response data
   */
  getAllQuests: async (params = {}) => {
    try {
      const response = await axios.get("/quests", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching quests:", error);
      throw error;
    }
  },

  /**
   * Lấy thống kê tổng quan về quests
   * @returns {Promise} Response data
   */
  getQuestStats: async () => {
    try {
      const response = await axios.get("/quests/stats/summary");
      return response.data;
    } catch (error) {
      console.error("Error fetching quest stats:", error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết một quest
   * @param {String} id - Quest ID (MongoDB _id hoặc questId)
   * @returns {Promise} Response data
   */
  getQuestById: async (id) => {
    try {
      const response = await axios.get(`/quests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching quest ${id}:`, error);
      throw error;
    }
  },

  /**
   * Tạo quest mới
   * @param {Object} questData - Dữ liệu quest
   * @returns {Promise} Response data
   */
  createQuest: async (questData) => {
    try {
      const response = await axios.post("/quests", questData);
      return response.data;
    } catch (error) {
      console.error("Error creating quest:", error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin quest
   * @param {String} id - Quest ID
   * @param {Object} questData - Dữ liệu cập nhật
   * @returns {Promise} Response data
   */
  updateQuest: async (id, questData) => {
    try {
      const response = await axios.put(`/quests/${id}`, questData);
      return response.data;
    } catch (error) {
      console.error(`Error updating quest ${id}:`, error);
      throw error;
    }
  },

  /**
   * Xóa quest
   * @param {String} id - Quest ID
   * @returns {Promise} Response data
   */
  deleteQuest: async (id) => {
    try {
      const response = await axios.delete(`/quests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting quest ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bật/tắt trạng thái active của quest
   * @param {String} id - Quest ID
   * @param {Boolean} isActive - Trạng thái mới
   * @returns {Promise} Response data
   */
  toggleQuestStatus: async (id, isActive) => {
    try {
      const response = await axios.patch(`/quests/${id}/status`, {
        isActive,
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling quest status ${id}:`, error);
      throw error;
    }
  },
};

export default questService;
