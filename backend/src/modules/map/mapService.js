import MapConfig from "./mapConfigModel.js";

export const MapService = {
  /**
   * Lấy toàn bộ danh sách map đang hoạt động kèm cấu hình chi tiết
   */
  getAllActiveMaps: async () => {
    // Chỉ lấy những map có isActive = true
    return await MapConfig.find({ "identityConfig.isActive": true }).lean();
  },
};
