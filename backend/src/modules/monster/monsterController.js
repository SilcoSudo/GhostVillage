import { MonsterService } from "./monsterService.js";
import { logActivity } from "../activityLog/activityLogController.js";

export const MonsterController = {
  getAllMonsters: async (req, res) => {
    try {
      const result = await MonsterService.getAllMonsters(req.query);
      return res.status(200).json({
        success: true,
        message: "Lấy danh sách quái vật thành công",
        ...result,
      });
    } catch (error) {
      console.error("❌ Error in MonsterController.getAllMonsters:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  getMonsterById: async (req, res) => {
    try {
      const monster = await MonsterService.getMonsterById(req.params.id);
      if (!monster)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy quái vật" });

      return res
        .status(200)
        .json({ success: true, message: "Thành công", data: monster });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  createMonster: async (req, res) => {
    try {
      const { monsterId, monsterName, monsterType, prefabName } = req.body;

      if (!monsterId || !monsterName || !monsterType || !prefabName) {
        return res.status(400).json({
          success: false,
          message:
            "Thiếu thông tin bắt buộc (monsterId, monsterName, monsterType, prefabName)",
        });
      }

      const newMonster = await MonsterService.createMonster(req.body);

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "CREATE",
        entityType: "MONSTER",
        entityId: newMonster._id,
        entityName: newMonster.monsterName,
        description: `Tạo quái vật: ${newMonster.monsterName}`,
        severity: "LOW",
        metadata: {
          monsterId: newMonster.monsterId,
          monsterType: newMonster.monsterType,
        },
        req,
      });

      return res
        .status(201)
        .json({ success: true, message: "Tạo thành công", data: newMonster });
    } catch (error) {
      if (error.message.includes("đã tồn tại")) {
        return res.status(409).json({ success: false, message: error.message });
      }
      return res.status(500).json({
        success: false,
        message: "Lỗi tạo quái vật",
        error: error.message,
      });
    }
  },

  updateMonster: async (req, res) => {
    try {
      const monster = await MonsterService.updateMonster(
        req.params.id,
        req.body,
      );
      if (!monster)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy quái vật" });

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "UPDATE",
        entityType: "MONSTER",
        entityId: monster._id,
        entityName: monster.monsterName,
        description: `Cập nhật quái vật: ${monster.monsterName}`,
        severity: "LOW",
        req,
      });

      return res
        .status(200)
        .json({ success: true, message: "Cập nhật thành công", data: monster });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi cập nhật",
        error: error.message,
      });
    }
  },

  toggleMonsterStatus: async (req, res) => {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== "boolean")
        return res
          .status(400)
          .json({ success: false, message: "isActive phải là boolean" });

      const monster = await MonsterService.toggleMonsterStatus(
        req.params.id,
        isActive,
      );

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "TOGGLE_STATUS",
        entityType: "MONSTER",
        entityId: monster._id,
        entityName: monster.monsterName,
        description: `${isActive ? "Kích hoạt" : "Vô hiệu hóa"} quái vật: ${monster.monsterName}`,
        severity: "LOW",
        req,
      });

      return res.status(200).json({
        success: true,
        message: "Đổi trạng thái thành công",
        data: monster,
      });
    } catch (error) {
      if (error.message === "Không tìm thấy quái vật")
        return res.status(404).json({ success: false, message: error.message });
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  deleteMonster: async (req, res) => {
    try {
      const monster = await MonsterService.deleteMonster(req.params.id);

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "DELETE",
        entityType: "MONSTER",
        entityId: monster._id,
        entityName: monster.monsterName,
        description: `Xóa (Vô hiệu hóa) quái vật: ${monster.monsterName}`,
        severity: "MEDIUM",
        req,
      });

      return res.status(200).json({
        success: true,
        message: "Đã xóa (ẩn) quái vật",
        data: monster,
      });
    } catch (error) {
      if (error.message === "Không tìm thấy quái vật")
        return res.status(404).json({ success: false, message: error.message });
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },
};
