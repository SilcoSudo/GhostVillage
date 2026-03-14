import axios from "./axios";

/**
 * Activity Log API Service
 * Xử lý các request liên quan đến activity logs
 */
const activityLogService = {
  /**
   * Lấy danh sách tất cả activity logs
   * @param {Object} params - Query parameters (page, limit, action, entityType, severity, search, etc.)
   * @returns {Promise} Response data
   */
  getAllActivityLogs: async (params = {}) => {
    try {
      const response = await axios.get("/activity-logs", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      throw error;
    }
  },

  /**
   * Lấy thống kê tổng quan về activity logs
   * @returns {Promise} Response data
   */
  getActivityLogStats: async () => {
    try {
      const response = await axios.get("/activity-logs/stats/summary");
      return response.data;
    } catch (error) {
      console.error("Error fetching activity log stats:", error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết một activity log
   * @param {String} id - Log ID
   * @returns {Promise} Response data
   */
  getActivityLogById: async (id) => {
    try {
      const response = await axios.get(`/activity-logs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching activity log ${id}:`, error);
      throw error;
    }
  },

  /**
   * Lấy logs của một user cụ thể
   * @param {String} userId - User ID
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise} Response data
   */
  getLogsByUser: async (userId, params = {}) => {
    try {
      const response = await axios.get(`/activity-logs/user/${userId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching logs for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Xóa logs cũ (Admin only)
   * @param {Number} daysOld - Số ngày cũ
   * @returns {Promise} Response data
   */
  cleanupOldLogs: async (daysOld = 90) => {
    try {
      const response = await axios.delete("/activity-logs/cleanup", {
        data: { daysOld },
      });
      return response.data;
    } catch (error) {
      console.error("Error cleaning up old logs:", error);
      throw error;
    }
  },
};

export default activityLogService;
