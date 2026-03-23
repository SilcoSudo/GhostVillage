import { ItemService } from "./itemService.js";
import { logActivity } from "../activityLog/activityLogController.js";

/**
 * Item Controller
 * Xử lý các request liên quan đến quản lý vật phẩm (Consumable & Equipment)
 */
export const ItemController = {
  getAllItems: async (req, res) => {
    try {
      const result = await ItemService.getAllItems(req.query);
      return res.status(200).json({
        success: true,
        message: "Lấy danh sách vật phẩm thành công",
        ...result,
      });
    } catch (error) {
      console.error("❌ Error in ItemController.getAllItems:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  getItemById: async (req, res) => {
    try {
      const item = await ItemService.getItemById(req.params.id);
      if (!item)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy vật phẩm" });

      return res
        .status(200)
        .json({ success: true, message: "Thành công", data: item });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  createItem: async (req, res) => {
    try {
      const { itemId, itemName, itemType, prefabName } = req.body;

      if (!itemId || !itemName || !itemType || !prefabName) {
        return res.status(400).json({
          success: false,
          message:
            "Thiếu thông tin bắt buộc (itemId, itemName, itemType, prefabName)",
        });
      }

      const newItem = await ItemService.createItem(req.body);

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "CREATE",
        entityType: "ITEM",
        entityId: newItem._id,
        entityName: newItem.itemId,
        description: `Tạo vật phẩm: ${newItem.itemName}`,
        severity: "LOW",
        metadata: { itemId: newItem.itemId, itemType: newItem.itemType },
        req,
      });

      return res.status(201).json({
        success: true,
        message: "Tạo vật phẩm thành công",
        data: newItem,
      });
    } catch (error) {
      if (error.message.includes("đã tồn tại")) {
        return res.status(409).json({ success: false, message: error.message });
      }
      return res.status(500).json({
        success: false,
        message: "Lỗi tạo vật phẩm",
        error: error.message,
      });
    }
  },

  updateItem: async (req, res) => {
    try {
      const item = await ItemService.updateItem(req.params.id, req.body);
      if (!item)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy vật phẩm" });

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "UPDATE",
        entityType: "ITEM",
        entityId: item._id,
        entityName: item.itemId,
        description: `Cập nhật vật phẩm: ${item.itemName}`,
        severity: "LOW",
        req,
      });

      return res
        .status(200)
        .json({ success: true, message: "Cập nhật thành công", data: item });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi cập nhật",
        error: error.message,
      });
    }
  },

  toggleItemStatus: async (req, res) => {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res
          .status(400)
          .json({ success: false, message: "isActive phải là boolean" });
      }

      const item = await ItemService.toggleItemStatus(req.params.id, isActive);

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "TOGGLE_STATUS",
        entityType: "ITEM",
        entityId: item._id,
        entityName: item.itemId,
        description: `${isActive ? "Kích hoạt" : "Vô hiệu hóa"} vật phẩm: ${item.itemName}`,
        severity: "LOW",
        req,
      });

      return res.status(200).json({
        success: true,
        message: "Đổi trạng thái thành công",
        data: item,
      });
    } catch (error) {
      if (error.message === "Không tìm thấy vật phẩm")
        return res.status(404).json({ success: false, message: error.message });
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  deleteItem: async (req, res) => {
    try {
      const item = await ItemService.deleteItem(req.params.id);

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "DELETE",
        entityType: "ITEM",
        entityId: item._id,
        entityName: item.itemId,
        description: `Xóa (ẩn) vật phẩm: ${item.itemName}`,
        severity: "MEDIUM",
        req,
      });

      return res
        .status(200)
        .json({ success: true, message: "Đã xóa (ẩn) vật phẩm", data: item });
    } catch (error) {
      if (error.message === "Không tìm thấy vật phẩm")
        return res.status(404).json({ success: false, message: error.message });
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },
};
