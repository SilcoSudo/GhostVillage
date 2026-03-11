import Consumable from "./consumableModel.js";
import { logActivity } from "../activityLog/activityLogController.js";

/**
 * Consumable Item Controller
 * Xử lý logic CRUD cho Consumable Item Management
 */

export const ConsumableController = {
  /**
   * GET /api/consumables
   * Lấy danh sách consumable items với filter, search và pagination
   */
  getAllConsumables: async (req, res) => {
    try {
      const {
        page,
        limit,
        isActive,
        canDrop,
        isAvailableInStore,
        type,
        rarity,
        search,
      } = req.query;

      const result = await Consumable.getConsumables({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        isActive,
        canDrop,
        isAvailableInStore,
        type,
        rarity,
        search,
      });

      res.status(200).json({
        success: true,
        message: "Lấy danh sách consumable items thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error in getAllConsumables:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách consumable items",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/consumables/stats/summary
   * Lấy thống kê tổng quan về consumable items
   */
  getConsumableStats: async (req, res) => {
    try {
      const stats = await Consumable.getStats();

      res.status(200).json({
        success: true,
        message: "Lấy thống kê consumable items thành công",
        data: stats,
      });
    } catch (error) {
      console.error("Error in getConsumableStats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê consumable items",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/consumables/:id
   * Lấy thông tin chi tiết một consumable item
   * Hỗ trợ tìm kiếm bằng _id hoặc itemId
   */
  getConsumableById: async (req, res) => {
    try {
      const { id } = req.params;

      // Tìm theo _id hoặc itemId
      const consumable = await Consumable.findOne({
        $or: [{ _id: id }, { itemId: id.toUpperCase() }],
      });

      if (!consumable) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy consumable item với ID: ${id}`,
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy thông tin consumable item thành công",
        data: consumable,
      });
    } catch (error) {
      console.error("Error in getConsumableById:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin consumable item",
        error: error.message,
      });
    }
  },

  /**
   * POST /api/consumables
   * Tạo consumable item mới
   */
  createConsumable: async (req, res) => {
    try {
      const consumableData = req.body;

      // Kiểm tra itemId đã tồn tại chưa
      const existingItem = await Consumable.findOne({
        itemId: consumableData.itemId?.toUpperCase(),
      });

      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: `Item ID ${consumableData.itemId} đã tồn tại`,
        });
      }

      // Tạo consumable mới
      const newConsumable = await Consumable.create(consumableData);

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "CREATE",
        entityType: "CONSUMABLE",
        entityId: newConsumable._id,
        entityName: newConsumable.itemId,
        description: `Tạo consumable item: ${newConsumable.itemId}`,
        severity: "LOW",
        metadata: { consumableData },
        req,
      });

      res.status(201).json({
        success: true,
        message: "Tạo consumable item thành công",
        data: newConsumable,
      });
    } catch (error) {
      console.error("Error in createConsumable:", error);

      // Xử lý validation errors
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: messages,
        });
      }

      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo consumable item",
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/consumables/:id
   * Cập nhật thông tin consumable item
   */
  updateConsumable: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Không cho phép update itemId
      delete updateData.itemId;

      // Tìm và cập nhật
      const consumable = await Consumable.findOneAndUpdate(
        { $or: [{ _id: id }, { itemId: id.toUpperCase() }] },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!consumable) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy consumable item với ID: ${id}`,
        });
      }

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "UPDATE",
        entityType: "CONSUMABLE",
        entityId: consumable._id,
        entityName: consumable.itemId,
        description: `Cập nhật consumable item: ${consumable.itemId}`,
        severity: "LOW",
        metadata: { updateData },
        req,
      });

      res.status(200).json({
        success: true,
        message: "Cập nhật consumable item thành công",
        data: consumable,
      });
    } catch (error) {
      console.error("Error in updateConsumable:", error);

      // Xử lý validation errors
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: messages,
        });
      }

      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật consumable item",
        error: error.message,
      });
    }
  },

  /**
   * PATCH /api/consumables/:id/status
   * Toggle trạng thái isActive của consumable item
   */
  toggleConsumableStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive phải là boolean (true/false)",
        });
      }

      const consumable = await Consumable.findOneAndUpdate(
        { $or: [{ _id: id }, { itemId: id.toUpperCase() }] },
        { $set: { isActive } },
        { new: true }
      );

      if (!consumable) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy consumable item với ID: ${id}`,
        });
      }

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "TOGGLE_STATUS",
        entityType: "CONSUMABLE",
        entityId: consumable._id,
        entityName: consumable.itemId,
        description: `${isActive ? "Kích hoạt" : "Vô hiệu hóa"} consumable item: ${consumable.itemId}`,
        severity: "LOW",
        metadata: { isActive },
        req,
      });

      res.status(200).json({
        success: true,
        message: `${isActive ? "Kích hoạt" : "Vô hiệu hóa"} consumable item thành công`,
        data: consumable,
      });
    } catch (error) {
      console.error("Error in toggleConsumableStatus:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật trạng thái consumable item",
        error: error.message,
      });
    }
  },

  /**
   * PATCH /api/consumables/:id/drop
   * Toggle trạng thái canDrop của consumable item
   */
  toggleDropAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const { canDrop } = req.body;

      if (typeof canDrop !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "canDrop phải là boolean (true/false)",
        });
      }

      const consumable = await Consumable.findOneAndUpdate(
        { $or: [{ _id: id }, { itemId: id.toUpperCase() }] },
        { $set: { canDrop } },
        { new: true }
      );

      if (!consumable) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy consumable item với ID: ${id}`,
        });
      }

      res.status(200).json({
        success: true,
        message: `${canDrop ? "Bật" : "Tắt"} drop availability thành công`,
        data: consumable,
      });
    } catch (error) {
      console.error("Error in toggleDropAvailability:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật drop availability",
        error: error.message,
      });
    }
  },

  /**
   * PATCH /api/consumables/:id/store
   * Toggle trạng thái isAvailableInStore của consumable item
   */
  toggleStoreAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const { isAvailableInStore } = req.body;

      if (typeof isAvailableInStore !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isAvailableInStore phải là boolean (true/false)",
        });
      }

      const consumable = await Consumable.findOneAndUpdate(
        { $or: [{ _id: id }, { itemId: id.toUpperCase() }] },
        { $set: { isAvailableInStore } },
        { new: true }
      );

      if (!consumable) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy consumable item với ID: ${id}`,
        });
      }

      res.status(200).json({
        success: true,
        message: `${isAvailableInStore ? "Bật" : "Tắt"} store availability thành công`,
        data: consumable,
      });
    } catch (error) {
      console.error("Error in toggleStoreAvailability:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật store availability",
        error: error.message,
      });
    }
  },

  /**
   * DELETE /api/consumables/:id
   * Xóa consumable item
   */
  deleteConsumable: async (req, res) => {
    try {
      const { id } = req.params;

      const consumable = await Consumable.findOneAndDelete({
        $or: [{ _id: id }, { itemId: id.toUpperCase() }],
      });

      if (!consumable) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy consumable item với ID: ${id}`,
        });
      }

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "DELETE",
        entityType: "CONSUMABLE",
        entityId: consumable._id,
        entityName: consumable.itemId,
        description: `Xóa consumable item: ${consumable.itemId}`,
        severity: "MEDIUM",
        metadata: { deletedItem: consumable },
        req,
      });

      res.status(200).json({
        success: true,
        message: "Xóa consumable item thành công",
        data: consumable,
      });
    } catch (error) {
      console.error("Error in deleteConsumable:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa consumable item",
        error: error.message,
      });
    }
  },
};
