import axios from "./axios";

/**
 * Item API Service
 * Tương thích với schema item JSON của game
 */
const consumableService = {
  /**
   * Lấy danh sách tất cả items
   * @param {Object} params - Query parameters (page, limit, isActive, type, search)
   * @returns {Promise} Response data
   */
  getAllConsumables: async (params = {}) => {
    try {
      const { type, ...rest } = params;
      const response = await axios.get("/items", {
        params: {
          ...rest,
          itemType: type,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching items:", error);
      throw error;
    }
  },

  /**
   * Lấy thống kê nhanh từ danh sách item
   * @returns {Promise} Response data
   */
  getConsumableStats: async () => {
    try {
      const response = await axios.get("/items", {
        params: { page: 1, limit: 1000, isActive: "all" },
      });

      const list = response.data?.data || [];
      return {
        success: true,
        data: {
          total: list.length,
          active: list.filter((item) => item.isActive).length,
          inactive: list.filter((item) => !item.isActive).length,
        },
      };
    } catch (error) {
      console.error("Error fetching item stats:", error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết một item
   * @param {String} id - Item ID (MongoDB _id hoặc itemId)
   * @returns {Promise} Response data
   */
  getConsumableById: async (id) => {
    try {
      const response = await axios.get(`/items/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
      throw error;
    }
  },

  /**
   * Tạo item mới
   * @param {Object} consumableData - Dữ liệu item
   * @returns {Promise} Response data
   */
  createConsumable: async (consumableData) => {
    try {
      const response = await axios.post("/items", consumableData);
      return response.data;
    } catch (error) {
      console.error("Error creating item:", error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin item
   * @param {String} id - Item ID
   * @param {Object} consumableData - Dữ liệu cập nhật
   * @returns {Promise} Response data
   */
  updateConsumable: async (id, consumableData) => {
    try {
      const response = await axios.put(`/items/${id}`, consumableData);
      return response.data;
    } catch (error) {
      console.error(`Error updating item ${id}:`, error);
      throw error;
    }
  },

  /**
   * Xóa item (soft delete)
   * @param {String} id - Item ID
   * @returns {Promise} Response data
   */
  deleteConsumable: async (id) => {
    try {
      const response = await axios.delete(`/items/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting item ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bật/tắt trạng thái active của item
   * @param {String} id - Item ID
   * @param {Boolean} isActive - Trạng thái mới
   * @returns {Promise} Response data
   */
  toggleConsumableStatus: async (id, isActive) => {
    try {
      const response = await axios.patch(`/items/${id}/status`, {
        isActive,
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling item status ${id}:`, error);
      throw error;
    }
  },

};

export default consumableService;
