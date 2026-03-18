import axios from "./axios";

/**
 * Consumable Item API Service
 * Xử lý các request liên quan đến quản lý consumable items
 */
const consumableService = {
  /**
   * Lấy danh sách tất cả consumable items
   * @param {Object} params - Query parameters (page, limit, isActive, canDrop, type, rarity, search)
   * @returns {Promise} Response data
   */
  getAllConsumables: async (params = {}) => {
    try {
      const response = await axios.get("/consumables", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching consumables:", error);
      throw error;
    }
  },

  /**
   * Lấy thống kê tổng quan về consumable items
   * @returns {Promise} Response data
   */
  getConsumableStats: async () => {
    try {
      const response = await axios.get("/consumables/stats/summary");
      return response.data;
    } catch (error) {
      console.error("Error fetching consumable stats:", error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết một consumable item
   * @param {String} id - Consumable ID (MongoDB _id hoặc itemId)
   * @returns {Promise} Response data
   */
  getConsumableById: async (id) => {
    try {
      const response = await axios.get(`/consumables/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching consumable ${id}:`, error);
      throw error;
    }
  },

  /**
   * Tạo consumable item mới
   * @param {Object} consumableData - Dữ liệu consumable
   * @returns {Promise} Response data
   */
  createConsumable: async (consumableData) => {
    try {
      const response = await axios.post("/consumables", consumableData);
      return response.data;
    } catch (error) {
      console.error("Error creating consumable:", error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin consumable item
   * @param {String} id - Consumable ID
   * @param {Object} consumableData - Dữ liệu cập nhật
   * @returns {Promise} Response data
   */
  updateConsumable: async (id, consumableData) => {
    try {
      const response = await axios.put(`/consumables/${id}`, consumableData);
      return response.data;
    } catch (error) {
      console.error(`Error updating consumable ${id}:`, error);
      throw error;
    }
  },

  /**
   * Xóa consumable item
   * @param {String} id - Consumable ID
   * @returns {Promise} Response data
   */
  deleteConsumable: async (id) => {
    try {
      const response = await axios.delete(`/consumables/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting consumable ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bật/tắt trạng thái active của consumable item
   * @param {String} id - Consumable ID
   * @param {Boolean} isActive - Trạng thái mới
   * @returns {Promise} Response data
   */
  toggleConsumableStatus: async (id, isActive) => {
    try {
      const response = await axios.patch(`/consumables/${id}/status`, {
        isActive,
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling consumable status ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bật/tắt drop availability của consumable item
   * @param {String} id - Consumable ID
   * @param {Boolean} canDrop - Trạng thái mới
   * @returns {Promise} Response data
   */
  toggleDropAvailability: async (id, canDrop) => {
    try {
      const response = await axios.patch(`/consumables/${id}/drop`, {
        canDrop,
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling drop availability ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bật/tắt store availability của consumable item
   * @param {String} id - Consumable ID
   * @param {Boolean} isAvailableInStore - Trạng thái mới
   * @returns {Promise} Response data
   */
  toggleStoreAvailability: async (id, isAvailableInStore) => {
    try {
      const response = await axios.patch(`/consumables/${id}/store`, {
        isAvailableInStore,
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling store availability ${id}:`, error);
      throw error;
    }
  },
};

export default consumableService;
