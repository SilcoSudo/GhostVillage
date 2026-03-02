import { MoonEventService } from "./moonEventService.js";

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
      await MoonEventService.deleteEvent(req.params.id);
      res.json({
        success: true,
        message: "Moon Event deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
