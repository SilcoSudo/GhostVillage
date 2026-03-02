import MoonEvent from "./moonEventModel.js";

export const MoonEventService = {
  /**
   * Get all moon events with filters
   */
  getAllEvents: async (filters = {}) => {
    const query = {};

    // Filter by category
    if (filters.category && filters.category !== "all") {
      query.category = filters.category;
    }

    // Filter by active status
    if (filters.status) {
      if (filters.status === "active") {
        query.isActive = true;
      } else if (filters.status === "inactive") {
        query.isActive = false;
      }
    }

    // Search by eventId or displayName
    if (filters.search) {
      query.$or = [
        { eventId: { $regex: filters.search, $options: "i" } },
        { displayName: { $regex: filters.search, $options: "i" } },
      ];
    }

    const events = await MoonEvent.find(query).sort({ createdAt: -1 });
    return events;
  },

  /**
   * Get active events (for Game Server)
   */
  getActiveEvents: async () => {
    const now = new Date();
    const events = await MoonEvent.find({
      isActive: true,
      $or: [
        { scheduleType: "ALWAYS" },
        { scheduleType: "MANUAL" },
        {
          scheduleType: "SCHEDULED",
          activeFrom: { $lte: now },
          activeTo: { $gte: now },
        },
      ],
    });
    return events;
  },

  /**
   * Get event by ID
   */
  getEventById: async (id) => {
    const event = await MoonEvent.findById(id);
    if (!event) {
      throw new Error("Moon Event not found");
    }
    return event;
  },

  /**
   * Get event by eventId (string identifier)
   */
  getEventByEventId: async (eventId) => {
    const event = await MoonEvent.findOne({ eventId: eventId.toUpperCase() });
    if (!event) {
      throw new Error("Moon Event not found");
    }
    return event;
  },

  /**
   * Create new moon event
   */
  createEvent: async (eventData) => {
    // Check if eventId already exists
    const existing = await MoonEvent.findOne({
      eventId: eventData.eventId.toUpperCase(),
    });
    if (existing) {
      throw new Error("Event ID already exists");
    }

    const event = new MoonEvent(eventData);
    await event.save();
    return event;
  },

  /**
   * Update moon event
   */
  updateEvent: async (id, updateData) => {
    // If eventId is being changed, check for duplicates
    if (updateData.eventId) {
      const existing = await MoonEvent.findOne({
        eventId: updateData.eventId.toUpperCase(),
        _id: { $ne: id },
      });
      if (existing) {
        throw new Error("Event ID already exists");
      }
    }

    const event = await MoonEvent.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      throw new Error("Moon Event not found");
    }

    return event;
  },

  /**
   * Toggle active status
   */
  toggleActive: async (id) => {
    const event = await MoonEvent.findById(id);
    if (!event) {
      throw new Error("Moon Event not found");
    }

    event.isActive = !event.isActive;
    await event.save();
    return event;
  },

  /**
   * Delete moon event
   */
  deleteEvent: async (id) => {
    const event = await MoonEvent.findByIdAndDelete(id);
    if (!event) {
      throw new Error("Moon Event not found");
    }
    return event;
  },
};
