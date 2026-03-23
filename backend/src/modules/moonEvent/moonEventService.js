import MoonEvent from "./moonEventModel.js";

export const MoonEventService = {
  getAllEvents: async (query) => {
    const { page = 1, limit = 20, isActive = "all", search } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (isActive !== "all") filter.isActive = isActive === "true";

    // Tìm kiếm theo tên hoặc mã sự kiện
    if (search) {
      filter.$or = [
        { eventName: { $regex: search, $options: "i" } },
        { eventId: { $regex: search, $options: "i" } },
      ];
    }

    const events = await MoonEvent.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MoonEvent.countDocuments(filter);

    return {
      data: events,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  getEventById: async (id) => {
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      return await MoonEvent.findById(id).select("-__v");
    }
    return await MoonEvent.findOne({ eventId: id.toUpperCase() }).select(
      "-__v",
    );
  },

  createEvent: async (data) => {
    const {
      eventId,
      eventName,
      description,
      uiIcon,
      weight,
      environmentModifiers,
      monsterBuffMultipliers,
      rewardMultipliers, // <-- BỔ SUNG 1
    } = data;

    const existingEvent = await MoonEvent.findOne({
      eventId: eventId.toUpperCase(),
    });
    if (existingEvent) {
      throw new Error(`Event ID "${eventId}" đã tồn tại`);
    }

    const newEvent = new MoonEvent({
      eventId: eventId.toUpperCase(),
      eventName,
      description,
      uiIcon,
      weight: weight || 10,
      environmentModifiers: environmentModifiers || {},
      monsterBuffMultipliers: monsterBuffMultipliers || {},
      rewardMultipliers: rewardMultipliers || {}, // <-- BỔ SUNG 2
    });

    return await newEvent.save();
  },

  updateEvent: async (id, updateData) => {
    if (updateData.eventId) delete updateData.eventId; // Không cho phép sửa eventId

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      return await MoonEvent.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      );
    }
    return await MoonEvent.findOneAndUpdate(
      { eventId: id.toUpperCase() },
      { $set: updateData },
      { new: true, runValidators: true },
    );
  },

  toggleEventStatus: async (id, isActive) => {
    let event = id.match(/^[0-9a-fA-F]{24}$/)
      ? await MoonEvent.findById(id)
      : await MoonEvent.findOne({ eventId: id.toUpperCase() });

    if (!event) throw new Error("Không tìm thấy Moon Event");

    event.isActive = isActive;
    return await event.save();
  },

  deleteEvent: async (id) => {
    let event = id.match(/^[0-9a-fA-F]{24}$/)
      ? await MoonEvent.findById(id)
      : await MoonEvent.findOne({ eventId: id.toUpperCase() });

    if (!event) throw new Error("Không tìm thấy Moon Event");

    event.isActive = false; // Soft Delete chuẩn bài
    return await event.save();
  },
};
