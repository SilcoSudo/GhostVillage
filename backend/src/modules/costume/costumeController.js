import Costume from "./costumeModel.js";
import { logActivity } from "../activityLog/activityLogController.js";

/**
 * Costume Controller
 * Xử lý logic CRUD cho Costume Management
 */

export const CostumeController = {
  /**
   * GET /api/costumes
   * Lấy danh sách costume với filter, search và pagination
   */
  getAllCostumes: async (req, res) => {
    try {
      const { page, limit, isActive, isAvailableInStore, rarity, category, search } =
        req.query;

      const result = await Costume.getCostumes({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        isActive,
        isAvailableInStore,
        rarity,
        category,
        search,
      });

      res.status(200).json({
        success: true,
        message: "Lấy danh sách costume thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error in getAllCostumes:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách costume",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/costumes/stats/summary
   * Lấy thống kê tổng quan về costumes
   */
  getCostumeStats: async (req, res) => {
    try {
      const stats = await Costume.getStats();

      res.status(200).json({
        success: true,
        message: "Lấy thống kê costume thành công",
        data: stats,
      });
    } catch (error) {
      console.error("Error in getCostumeStats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê costume",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/costumes/:id
   * Lấy thông tin chi tiết một costume
   * Hỗ trợ tìm kiếm bằng _id hoặc costumeId
   */
  getCostumeById: async (req, res) => {
    try {
      const { id } = req.params;

      // Tìm theo _id hoặc costumeId
      const costume = await Costume.findOne({
        $or: [{ _id: id }, { costumeId: id.toUpperCase() }],
      });

      if (!costume) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy costume với ID: ${id}`,
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy thông tin costume thành công",
        data: costume,
      });
    } catch (error) {
      console.error("Error in getCostumeById:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin costume",
        error: error.message,
      });
    }
  },

  /**
   * POST /api/costumes
   * Tạo costume mới
   */
  createCostume: async (req, res) => {
    try {
      const costumeData = req.body;

      // Kiểm tra costumeId đã tồn tại chưa
      const existingCostume = await Costume.findOne({
        costumeId: costumeData.costumeId?.toUpperCase(),
      });

      if (existingCostume) {
        return res.status(400).json({
          success: false,
          message: `Costume ID ${costumeData.costumeId} đã tồn tại`,
        });
      }

      // Tạo costume mới
      const newCostume = await Costume.create(costumeData);

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "CREATE",
        entityType: "COSTUME",
        entityId: newCostume._id,
        entityName: newCostume.costumeId,
        description: `Tạo costume: ${newCostume.costumeId}`,
        severity: "LOW",
        metadata: { costumeData },
        req,
      });

      res.status(201).json({
        success: true,
        message: "Tạo costume thành công",
        data: newCostume,
      });
    } catch (error) {
      console.error("Error in createCostume:", error);

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
        message: "Lỗi khi tạo costume",
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/costumes/:id
   * Cập nhật thông tin costume
   */
  updateCostume: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Không cho phép update costumeId
      delete updateData.costumeId;

      // Tìm và cập nhật
      const costume = await Costume.findOneAndUpdate(
        { $or: [{ _id: id }, { costumeId: id.toUpperCase() }] },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!costume) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy costume với ID: ${id}`,
        });
      }

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "UPDATE",
        entityType: "COSTUME",
        entityId: costume._id,
        entityName: costume.costumeId,
        description: `Cập nhật costume: ${costume.costumeId}`,
        severity: "LOW",
        metadata: { updateData },
        req,
      });

      res.status(200).json({
        success: true,
        message: "Cập nhật costume thành công",
        data: costume,
      });
    } catch (error) {
      console.error("Error in updateCostume:", error);

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
        message: "Lỗi khi cập nhật costume",
        error: error.message,
      });
    }
  },

  /**
   * PATCH /api/costumes/:id/status
   * Toggle trạng thái isActive của costume
   */
  toggleCostumeStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive phải là boolean (true/false)",
        });
      }

      const costume = await Costume.findOneAndUpdate(
        { $or: [{ _id: id }, { costumeId: id.toUpperCase() }] },
        { $set: { isActive } },
        { new: true }
      );

      if (!costume) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy costume với ID: ${id}`,
        });
      }
      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "TOGGLE_STATUS",
        entityType: "COSTUME",
        entityId: costume._id,
        entityName: costume.costumeId,
        description: `${isActive ? "Kích hoạt" : "Vô hiệu hóa"} costume: ${costume.costumeId}`,
        severity: "LOW",
        metadata: { isActive },
        req,
      });
      res.status(200).json({
        success: true,
        message: `${isActive ? "Kích hoạt" : "Vô hiệu hóa"} costume thành công`,
        data: costume,
      });
    } catch (error) {
      console.error("Error in toggleCostumeStatus:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật trạng thái costume",
        error: error.message,
      });
    }
  },

  /**
   * PATCH /api/costumes/:id/store
   * Toggle trạng thái isAvailableInStore của costume
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

      const costume = await Costume.findOneAndUpdate(
        { $or: [{ _id: id }, { costumeId: id.toUpperCase() }] },
        { $set: { isAvailableInStore } },
        { new: true }
      );

      if (!costume) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy costume với ID: ${id}`,
        });
      }

      res.status(200).json({
        success: true,
        message: `${
          isAvailableInStore ? "Hiển thị" : "Ẩn"
        } costume trong shop thành công`,
        data: costume,
      });
    } catch (error) {
      console.error("Error in toggleStoreAvailability:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật trạng thái shop",
        error: error.message,
      });
    }
  },

  /**
   * DELETE /api/costumes/:id
   * Xóa costume
   */
  deleteCostume: async (req, res) => {
    try {
      const { id } = req.params;

      const costume = await Costume.findOneAndDelete({
        $or: [{ _id: id }, { costumeId: id.toUpperCase() }],
      });

      if (!costume) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy costume với ID: ${id}`,
        });
      }

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "DELETE",
        entityType: "COSTUME",
        entityId: costume._id,
        entityName: costume.costumeId,
        description: `Xóa costume: ${costume.costumeId}`,
        severity: "MEDIUM",
        metadata: { deletedCostume: costume },
        req,
      });

      res.status(200).json({
        success: true,
        message: "Xóa costume thành công",
        data: costume,
      });
    } catch (error) {
      console.error("Error in deleteCostume:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa costume",
        error: error.message,
      });
    }
  },
};
