import { MoonEventService } from "./moonEventService.js";
import { logActivity } from "../activityLog/activityLogController.js";

export const MoonEventController = {
  /**
   * GET /api/web/moon-events - Get all moon events (Admin)
   */
  getAllEvents: async (req, res, next) => {
    try {
      const { category, status, search } = req.query;
      const events = await MoonEventService.getAllEvents({
        category,
        status,
        search,
      });
      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/game/moon-events/active - Get active events (Game Server)
   */
  getActiveEvents: async (req, res, next) => {
    try {
      const events = await MoonEventService.getActiveEvents();
      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/web/moon-events/:id - Get single event
   */
  getEventById: async (req, res, next) => {
    try {
      const event = await MoonEventService.getEventById(req.params.id);
      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/web/moon-events - Create new event
   */
  createEvent: async (req, res, next) => {
    try {
      const event = await MoonEventService.createEvent(req.body);

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "CREATE",
        entityType: "MOON_EVENT",
        entityId: event._id,
        entityName: event.eventId,
        description: `Tạo moon event: ${event.displayName} (${event.eventId})`,
        severity: "LOW",
        metadata: { eventId: event.eventId, category: event.category },
        req,
      });

      res.status(201).json({
        success: true,
        data: event,
        message: "Moon Event created successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/web/moon-events/:id - Update event
   */
  updateEvent: async (req, res, next) => {
    try {
      const event = await MoonEventService.updateEvent(req.params.id, req.body);

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "UPDATE",
        entityType: "MOON_EVENT",
        entityId: event._id,
        entityName: event.eventId,
        description: `Cập nhật moon event: ${event.displayName} (${event.eventId})`,
        severity: "LOW",
        metadata: { updateData: req.body },
        req,
      });

      res.json({
        success: true,
        data: event,
        message: "Moon Event updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/web/moon-events/:id/toggle-active - Toggle active status
   */
  toggleActive: async (req, res, next) => {
    try {
      const event = await MoonEventService.toggleActive(req.params.id);

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "TOGGLE_STATUS",
        entityType: "MOON_EVENT",
        entityId: event._id,
        entityName: event.eventId,
        description: `${event.isActive ? "Kích hoạt" : "Vô hiệu hóa"} moon event: ${event.displayName} (${event.eventId})`,
        severity: "LOW",
        metadata: { isActive: event.isActive },
        req,
      });

      res.json({
        success: true,
        data: event,
        message: `Moon Event ${event.isActive ? "activated" : "deactivated"}`,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/web/moon-events/:id - Delete event
   */
  deleteEvent: async (req, res, next) => {
    try {
      const event = await MoonEventService.getEventById(req.params.id);
      await MoonEventService.deleteEvent(req.params.id);

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "DELETE",
        entityType: "MOON_EVENT",
        entityId: event._id,
        entityName: event.eventId,
        description: `Xóa moon event: ${event.displayName} (${event.eventId})`,
        severity: "HIGH",
        metadata: { deletedEvent: event },
        req,
      });

      res.json({
        success: true,
        message: "Moon Event deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
