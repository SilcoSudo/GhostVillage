import { PerkService } from "./perkService.js";
import { logActivity } from "../activityLog/activityLogController.js";

/**
 * Perk Controller
 * Xử lý các request liên quan đến quản lý kỹ năng bị động (Perk)
 */
export const PerkController = {
  getAllPerks: async (req, res) => {
    try {
      const result = await PerkService.getAllPerks(req.query);
      return res.status(200).json({
        success: true,
        message: "Lấy danh sách Perk thành công",
        ...result,
      });
    } catch (error) {
      console.error(" Error in PerkController.getAllPerks:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  getPerkById: async (req, res) => {
    try {
      const perk = await PerkService.getPerkById(req.params.id);
      if (!perk)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy Perk" });

      return res
        .status(200)
        .json({ success: true, message: "Thành công", data: perk });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  createPerk: async (req, res) => {
    try {
      const { perkId, perkName } = req.body;

      if (!perkId || !perkName) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bắt buộc (perkId, perkName)",
        });
      }

      const newPerk = await PerkService.createPerk(req.body);

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "CREATE",
        entityType: "PERK",
        entityId: newPerk._id,
        entityName: newPerk.perkId,
        description: `Tạo Perk: ${newPerk.perkName}`,
        severity: "LOW",
        metadata: { perkId: newPerk.perkId },
        req,
      });

      return res
        .status(201)
        .json({ success: true, message: "Tạo Perk thành công", data: newPerk });
    } catch (error) {
      if (error.message.includes("đã tồn tại")) {
        return res.status(409).json({ success: false, message: error.message });
      }
      return res.status(500).json({
        success: false,
        message: "Lỗi tạo Perk",
        error: error.message,
      });
    }
  },

  updatePerk: async (req, res) => {
    try {
      const perk = await PerkService.updatePerk(req.params.id, req.body);
      if (!perk)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy Perk" });

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "UPDATE",
        entityType: "PERK",
        entityId: perk._id,
        entityName: perk.perkId,
        description: `Cập nhật Perk: ${perk.perkName}`,
        severity: "LOW",
        req,
      });

      return res
        .status(200)
        .json({ success: true, message: "Cập nhật thành công", data: perk });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi cập nhật",
        error: error.message,
      });
    }
  },

  togglePerkStatus: async (req, res) => {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res
          .status(400)
          .json({ success: false, message: "isActive phải là boolean" });
      }

      const perk = await PerkService.togglePerkStatus(req.params.id, isActive);

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "TOGGLE_STATUS",
        entityType: "PERK",
        entityId: perk._id,
        entityName: perk.perkId,
        description: `${isActive ? "Kích hoạt" : "Vô hiệu hóa"} Perk: ${perk.perkName}`,
        severity: "LOW",
        req,
      });

      return res.status(200).json({
        success: true,
        message: "Đổi trạng thái thành công",
        data: perk,
      });
    } catch (error) {
      if (error.message === "Không tìm thấy Perk")
        return res.status(404).json({ success: false, message: error.message });
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  deletePerk: async (req, res) => {
    try {
      const perk = await PerkService.deletePerk(req.params.id);

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "DELETE",
        entityType: "PERK",
        entityId: perk._id,
        entityName: perk.perkId,
        description: `Xóa (ẩn) Perk: ${perk.perkName}`,
        severity: "MEDIUM",
        req,
      });

      return res
        .status(200)
        .json({ success: true, message: "Xóa Perk thành công", data: perk });
    } catch (error) {
      if (error.message === "Không tìm thấy Perk")
        return res.status(404).json({ success: false, message: error.message });
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },
};
