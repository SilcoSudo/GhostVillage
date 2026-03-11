import SupportTicket from "./supportTicketModel.js";

export const createSupportTicket = async (ticketData) => {
  const ticket = new SupportTicket(ticketData);
  return ticket.save();
};

export const listUserSupportTickets = async ({
  userId,
  page = 1,
  limit = 20,
}) => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (pageNumber - 1) * pageSize;

  const [items, total] = await Promise.all([
    SupportTicket.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("adminReplies.repliedBy", "fullname")
      .lean(),
    SupportTicket.countDocuments({ userId }),
  ]);

  return {
    items,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      hasMore: skip + items.length < total,
    },
  };
};

export const listAllSupportTicketsForAdmin = async ({
  page = 1,
  limit = 20,
  status,
}) => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (pageNumber - 1) * pageSize;

  const filter = {};
  const normalizedStatus = String(status || "")
    .trim()
    .toUpperCase();
  if (normalizedStatus) {
    filter.status = normalizedStatus;
  }

  const [items, total] = await Promise.all([
    SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("userId", "fullname email")
      .populate("adminReplies.repliedBy", "fullname")
      .lean(),
    SupportTicket.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      hasMore: skip + items.length < total,
    },
  };
};

export const updateSupportTicketStatusByAdmin = async ({
  ticketId,
  status,
}) => {
  const updated = await SupportTicket.findByIdAndUpdate(
    ticketId,
    {
      status,
      updatedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("userId", "fullname email")
    .populate("adminReplies.repliedBy", "fullname")
    .lean();

  return updated;
};

export const addAdminReplyToTicket = async ({ ticketId, content, adminId }) => {
  const updated = await SupportTicket.findByIdAndUpdate(
    ticketId,
    {
      $push: {
        adminReplies: {
          content,
          repliedBy: adminId || null,
          repliedAt: new Date(),
        },
      },
      $set: { updatedAt: new Date() },
    },
    { new: true, runValidators: true },
  )
    .populate("userId", "fullname email")
    .populate("adminReplies.repliedBy", "fullname")
    .lean();

  return updated;
};
