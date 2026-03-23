import { QuestService } from "./questService.js";
import { logActivity } from "../activityLog/activityLogController.js";

/**
 * Quest Controller
 * Xử lý các request liên quan đến quản lý nhiệm vụ
 */
export const QuestController = {
  getAllQuests: async (req, res) => {
    try {
      const result = await QuestService.getAllQuests(req.query);
      return res.status(200).json({
        success: true,
        message: "Lấy danh sách quest thành công",
        ...result,
      });
    } catch (error) {
      console.error("❌ Error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  getQuestById: async (req, res) => {
    try {
      const quest = await QuestService.getQuestById(req.params.id);
      if (!quest)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy quest" });

      return res
        .status(200)
        .json({ success: true, message: "Thành công", data: quest });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  createQuest: async (req, res) => {
    try {
      const { questId, questName, questType, actionType } = req.body;
      if (!questId || !questName || !questType || !actionType) {
        return res
          .status(400)
          .json({ success: false, message: "Thiếu thông tin bắt buộc" });
      }

      const newQuest = await QuestService.createQuest(req.body);

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "CREATE",
        entityType: "QUEST",
        entityId: newQuest._id,
        entityName: newQuest.questId,
        description: `Tạo quest: ${newQuest.questName} (${newQuest.questId})`,
        severity: "LOW",
        req,
      });

      return res.status(201).json({
        success: true,
        message: "Tạo quest thành công",
        data: newQuest,
      });
    } catch (error) {
      if (error.message.includes("đã tồn tại")) {
        return res.status(409).json({ success: false, message: error.message });
      }
      return res.status(500).json({
        success: false,
        message: "Lỗi tạo quest",
        error: error.message,
      });
    }
  },

  updateQuest: async (req, res) => {
    try {
      const quest = await QuestService.updateQuest(req.params.id, req.body);
      if (!quest)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy quest" });

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "UPDATE",
        entityType: "QUEST",
        entityId: quest._id,
        entityName: quest.questId,
        description: `Cập nhật quest: ${quest.questName}`,
        severity: "LOW",
        req,
      });

      return res
        .status(200)
        .json({ success: true, message: "Cập nhật thành công", data: quest });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi cập nhật",
        error: error.message,
      });
    }
  },

  toggleQuestStatus: async (req, res) => {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== "boolean")
        return res
          .status(400)
          .json({ success: false, message: "isActive phải là boolean" });

      const quest = await QuestService.toggleQuestStatus(
        req.params.id,
        isActive,
      );

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "TOGGLE_STATUS",
        entityType: "QUEST",
        entityId: quest._id,
        entityName: quest.questId,
        description: `${isActive ? "Kích hoạt" : "Vô hiệu hóa"} quest: ${quest.questName}`,
        severity: "LOW",
        req,
      });

      return res.status(200).json({
        success: true,
        message: "Đổi trạng thái thành công",
        data: quest,
      });
    } catch (error) {
      if (error.message === "Không tìm thấy quest")
        return res.status(404).json({ success: false, message: error.message });
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  deleteQuest: async (req, res) => {
    try {
      const quest = await QuestService.deleteQuest(req.params.id);

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "DELETE",
        entityType: "QUEST",
        entityId: quest._id,
        entityName: quest.questId,
        description: `Xóa (ẩn) quest: ${quest.questName}`,
        severity: "MEDIUM",
        req,
      });

      return res
        .status(200)
        .json({ success: true, message: "Xóa quest thành công", data: quest });
    } catch (error) {
      if (error.message === "Không tìm thấy quest")
        return res.status(404).json({ success: false, message: error.message });
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  getQuestStats: async (req, res) => {
    try {
      const stats = await QuestService.getQuestStats();
      return res.status(200).json({ success: true, data: stats });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },
};
