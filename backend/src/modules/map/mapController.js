import { MapService } from "./mapService.js";

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
};
