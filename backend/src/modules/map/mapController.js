import { MapService } from "./mapService.js";
import MapConfig from "./mapConfigModel.js";
import { logActivity } from "../activityLog/activityLogController.js";

export const MapController = {
  getMaps: async (req, res) => {
    try {
      const maps = await MapService.getAllActiveMaps();

      return res.status(200).json({
        success: true,
        count: maps.length,
        data: maps,
      });
    } catch (error) {
      console.error("❌ Error in MapController.getMaps:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy danh sách Map Config.",
      });
    }
  },

  /**
   * GET /api/maps - Lấy tất cả maps (bao gồm cả inactive)
   * Query params: isActive (all/true/false)
   */
  getAllMaps: async (req, res) => {
    try {
      const { isActive = "all" } = req.query;

      let filter = {};
      if (isActive !== "all") {
        filter["identityConfig.isActive"] = isActive === "true";
      }

      const maps = await MapConfig.find(filter)
        .sort({ "identityConfig.displayName": 1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: maps.length,
        data: maps,
      });
    } catch (error) {
      console.error("❌ Error in MapController.getAllMaps:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy danh sách maps",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/maps/:id - Lấy chi tiết một map
   */
  getMapById: async (req, res) => {
    try {
      const { id } = req.params;

      const map = await MapConfig.findById(id).lean();

      if (!map) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy map",
        });
      }

      return res.status(200).json({
        success: true,
        data: map,
      });
    } catch (error) {
      console.error("❌ Error in MapController.getMapById:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy thông tin map",
        error: error.message,
      });
    }
  },

  /**
   * PATCH /api/maps/:id/status
   * Bật/tắt trạng thái active của map
   */
  toggleMapStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive phải là giá trị boolean",
        });
      }

      const map = await MapConfig.findById(id);

      if (!map) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy map",
        });
      }

      map.identityConfig.isActive = isActive;
      await map.save();

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "TOGGLE_STATUS",
        entityType: "MAP",
        entityId: map._id,
        entityName: map.identityConfig.displayName,
        description: `${isActive ? "Kích hoạt" : "Vô hiệu hóa"} map: ${map.identityConfig.displayName}`,
        severity: "LOW",
        metadata: { isActive },
        req,
      });

      return res.status(200).json({
        success: true,
        message: `${isActive ? "Kích hoạt" : "Vô hiệu hóa"} map thành công`,
        data: {
          _id: map._id,
          identityConfig: map.identityConfig,
        },
      });
    } catch (error) {
      console.error("❌ Error in MapController.toggleMapStatus:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi cập nhật trạng thái map",
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/maps/:id
   * Cập nhật metadata của map (displayName, requiredLevel, shortDescription)
   */
  updateMapMetadata: async (req, res) => {
    try {
      const { id } = req.params;
      const { displayName, requiredLevel, shortDescription, thumbnailUrl } =
        req.body;

      const map = await MapConfig.findById(id);

      if (!map) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy map",
        });
      }

      // Validate requiredLevel
      if (requiredLevel !== undefined && requiredLevel < 1) {
        return res.status(400).json({
          success: false,
          message: "Required Level phải lớn hơn 0",
        });
      }

      // Cập nhật các trường trong identityConfig
      if (displayName !== undefined) {
        map.identityConfig.displayName = displayName;
      }
      if (requiredLevel !== undefined) {
        map.identityConfig.requiredLevel = requiredLevel;
      }
      if (shortDescription !== undefined) {
        map.identityConfig.shortDescription = shortDescription;
      }
      if (thumbnailUrl !== undefined) {
        map.identityConfig.thumbnailUrl = thumbnailUrl;
      }

      await map.save();

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "UPDATE",
        entityType: "MAP",
        entityId: map._id,
        entityName: map.identityConfig.displayName,
        description: `Cập nhật metadata map: ${map.identityConfig.displayName}`,
        severity: "LOW",
        metadata: { displayName, requiredLevel, shortDescription, thumbnailUrl },
        req,
      });

      return res.status(200).json({
        success: true,
        message: "Cập nhật metadata map thành công",
        data: {
          _id: map._id,
          identityConfig: map.identityConfig,
        },
      });
    } catch (error) {
      console.error("❌ Error in MapController.updateMapMetadata:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi cập nhật metadata map",
        error: error.message,
      });
    }
  },
};
