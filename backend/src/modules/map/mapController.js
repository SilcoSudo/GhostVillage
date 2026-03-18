import { MapService } from "./mapService.js";
import { logActivity } from "../activityLog/activityLogController.js";

export const MapController = {
  getAllMaps: async (req, res) => {
    try {
      const maps = await MapService.getAllMaps(req.query);
      return res
        .status(200)
        .json({ success: true, count: maps.length, data: maps });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  getMapById: async (req, res) => {
    try {
      const map = await MapService.getMapById(req.params.id);
      if (!map)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy map" });
      return res.status(200).json({ success: true, data: map });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  toggleMapStatus: async (req, res) => {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res
          .status(400)
          .json({ success: false, message: "isActive phải là boolean" });
      }

      const map = await MapService.toggleMapStatus(req.params.id, isActive);

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "TOGGLE_STATUS",
        entityType: "MAP",
        entityId: map._id,
        entityName: map.identityConfig.displayName,
        description: `${isActive ? "Kích hoạt" : "Vô hiệu hóa"} map: ${map.identityConfig.displayName}`,
        severity: "LOW",
        req,
      });

      return res
        .status(200)
        .json({ success: true, message: "Cập nhật thành công", data: map });
    } catch (error) {
      if (error.message === "Không tìm thấy map")
        return res.status(404).json({ success: false, message: error.message });
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  updateMapMetadata: async (req, res) => {
    try {
      const map = await MapService.updateMapMetadata(req.params.id, req.body);

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "UPDATE",
        entityType: "MAP",
        entityId: map._id,
        entityName: map.identityConfig.displayName,
        description: `Cập nhật metadata map: ${map.identityConfig.displayName}`,
        severity: "LOW",
        req,
      });

      return res
        .status(200)
        .json({ success: true, message: "Cập nhật thành công", data: map });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi cập nhật",
        error: error.message,
      });
    }
  },

  createMap: async (req, res) => {
    try {
      const newMap = await MapService.createMap(req.body);

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "CREATE",
        entityType: "MAP",
        entityId: newMap._id,
        entityName: newMap.identityConfig.displayName,
        description: `Tạo map mới: ${newMap.identityConfig.displayName}`,
        severity: "LOW",
        metadata: { mapId: newMap.identityConfig.mapId },
        req,
      });

      return res
        .status(201)
        .json({ success: true, message: "Tạo Map thành công", data: newMap });
    } catch (error) {
      if (error.message.includes("đã tồn tại")) {
        return res.status(409).json({ success: false, message: error.message });
      }
      return res
        .status(500)
        .json({ success: false, message: "Lỗi tạo map", error: error.message });
    }
  },

  /**
   * GET /api/maps/:id/game-data
   * API dành riêng cho Unity gọi khi vào game
   */
  getAggregatedGameData: async (req, res) => {
    try {
      const gameData = await MapService.getAggregatedGameData(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Tải Game Data thành công",
        data: gameData,
      });
    } catch (error) {
      console.error("❌ Lỗi tải Game Data:", error);
      if (error.message === "Không tìm thấy Map")
        return res.status(404).json({ success: false, message: error.message });
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },
};
