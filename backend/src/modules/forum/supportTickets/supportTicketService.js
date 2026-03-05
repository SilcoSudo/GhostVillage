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
