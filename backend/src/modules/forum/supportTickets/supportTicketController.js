import * as supportTicketService from "./supportTicketService.js";

const serializeTicket = (doc) => {
  const ticket = doc?.toObject ? doc.toObject() : doc;
  if (!ticket) return ticket;

  return {
    _id: ticket._id,
    userId: ticket.userId,
    subject: ticket.subject,
    message: ticket.message,
    attachments: Array.isArray(ticket.attachments)
      ? ticket.attachments.map((item) => ({
          url: item?.url || "",
          publicId: item?.publicId || null,
        }))
      : [],
    status: ticket.status,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
};

/**
 * GET /api/web/support-tickets
 * List current user's support tickets (auth required)
 */
export const listMySupportTickets = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { page, limit } = req.query;
    const { items, pagination } =
      await supportTicketService.listUserSupportTickets({
        userId,
        page,
        limit,
      });

    return res.status(200).json({
      success: true,
      data: {
        tickets: items.map(serializeTicket),
        pagination,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/web/support-tickets
 * Submit support ticket (auth required)
 */
export const createSupportTicket = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const rawSubject = req.body?.subject ?? "";
    const rawMessage = req.body?.message ?? "";
    const rawAttachments = req.body?.attachments;

    const subject = String(rawSubject).trim();
    const message = String(rawMessage).trim();
    const attachments = Array.isArray(rawAttachments) ? rawAttachments : [];

    if (subject.length < 5 || subject.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Subject must be between 5 and 150 characters",
      });
    }

    if (message.length < 15 || message.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 15 and 3000 characters",
      });
    }

    if (attachments.length > 5) {
      return res.status(400).json({
        success: false,
        message: "You can attach up to 5 images",
      });
    }

    const normalizedAttachments = attachments.map((item) => ({
      url: String(item?.url || "").trim(),
      publicId: item?.publicId ? String(item.publicId) : null,
    }));

    const hasInvalidAttachment = normalizedAttachments.some(
      (item) =>
        !item.url ||
        !(
          item.url.startsWith("http://") ||
          item.url.startsWith("https://") ||
          item.url.startsWith("data:image/")
        ),
    );

    if (hasInvalidAttachment) {
      return res.status(400).json({
        success: false,
        message: "Invalid image attachments",
      });
    }

    const created = await supportTicketService.createSupportTicket({
      userId,
      subject,
      message,
      attachments: normalizedAttachments,
      status: "OPEN",
    });

    return res.status(201).json({
      success: true,
      message: "Support ticket submitted successfully",
      data: serializeTicket(created),
    });
  } catch (err) {
    next(err);
  }
};
