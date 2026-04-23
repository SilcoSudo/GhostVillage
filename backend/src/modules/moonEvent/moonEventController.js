import { MoonEventService } from "./moonEventService.js";
import { logActivity } from "../activityLog/activityLogController.js";

/**
 * Moon Event Controller
 * Xử lý các request liên quan đến sự kiện mặt trăng
 */
export const MoonEventController = {
  getAllEvents: async (req, res) => {
    try {
      const result = await MoonEventService.getAllEvents(req.query);
      return res.status(200).json({
        success: true,
        message: "Lấy danh sách Moon Event thành công",
        ...result,
      });
    } catch (error) {
      console.error(" Error in MoonEventController.getAllEvents:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  getEventById: async (req, res) => {
    try {
      const event = await MoonEventService.getEventById(req.params.id);
      if (!event)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy Moon Event" });

      return res
        .status(200)
        .json({ success: true, message: "Thành công", data: event });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  createEvent: async (req, res) => {
    try {
      const { eventId, eventName } = req.body;

      if (!eventId || !eventName) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bắt buộc (eventId, eventName)",
        });
      }

      const newEvent = await MoonEventService.createEvent(req.body);

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "CREATE",
        entityType: "MOON_EVENT",
        entityId: newEvent._id,
        entityName: newEvent.eventId,
        description: `Tạo Moon Event: ${newEvent.eventName}`,
        severity: "LOW",
        metadata: { eventId: newEvent.eventId },
        req,
      });

      return res.status(201).json({
        success: true,
        message: "Tạo Moon Event thành công",
        data: newEvent,
      });
    } catch (error) {
      if (error.message.includes("đã tồn tại")) {
        return res.status(409).json({ success: false, message: error.message });
      }
      return res.status(500).json({
        success: false,
        message: "Lỗi tạo Moon Event",
        error: error.message,
      });
    }
  },

  updateEvent: async (req, res) => {
    try {
      const event = await MoonEventService.updateEvent(req.params.id, req.body);
      if (!event)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy Moon Event" });

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "UPDATE",
        entityType: "MOON_EVENT",
        entityId: event._id,
        entityName: event.eventId,
        description: `Cập nhật Moon Event: ${event.eventName}`,
        severity: "LOW",
        req,
      });

      return res
        .status(200)
        .json({ success: true, message: "Cập nhật thành công", data: event });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi cập nhật",
        error: error.message,
      });
    }
  },

  toggleEventStatus: async (req, res) => {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res
          .status(400)
          .json({ success: false, message: "isActive phải là boolean" });
      }

      const event = await MoonEventService.toggleEventStatus(
        req.params.id,
        isActive,
      );

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "TOGGLE_STATUS",
        entityType: "MOON_EVENT",
        entityId: event._id,
        entityName: event.eventId,
        description: `${isActive ? "Kích hoạt" : "Vô hiệu hóa"} Moon Event: ${event.eventName}`,
        severity: "LOW",
        req,
      });

      return res.status(200).json({
        success: true,
        message: "Đổi trạng thái thành công",
        data: event,
      });
    } catch (error) {
      if (error.message === "Không tìm thấy Moon Event")
        return res.status(404).json({ success: false, message: error.message });
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },

  deleteEvent: async (req, res) => {
    try {
      const event = await MoonEventService.deleteEvent(req.params.id);

      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "DELETE",
        entityType: "MOON_EVENT",
        entityId: event._id,
        entityName: event.eventId,
        description: `Xóa (ẩn) Moon Event: ${event.eventName}`,
        severity: "MEDIUM",
        req,
      });

      return res.status(200).json({
        success: true,
        message: "Xóa Moon Event thành công",
        data: event,
      });
    } catch (error) {
      if (error.message === "Không tìm thấy Moon Event")
        return res.status(404).json({ success: false, message: error.message });
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error.message,
      });
    }
  },
};
