import { MatchService } from "./matchService.js";

export const MatchController = {
  saveMatchResult: async (req, res) => {
    try {
      const matchData = req.body;

      // Validate cơ bản (Có thể dùng Joi hoặc Express-validator để kỹ hơn)
      if (!matchData.mapId || !matchData.playerResults) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bắt buộc (mapId hoặc playerResults).",
        });
      }

      // Gọi Service để tạo
      const savedMatch = await MatchService.createMatchResult(matchData);

      return res.status(201).json({
        success: true,
        message: "Lưu kết quả trận đấu thành công!",
        data: savedMatch,
      });
    } catch (error) {
      console.error("❌ Error in MatchController.saveMatchResult:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lưu kết quả trận đấu.",
        error: error.message,
      });
    }
  },
};
