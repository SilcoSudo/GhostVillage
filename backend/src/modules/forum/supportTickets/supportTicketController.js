import * as supportTicketService from "./supportTicketService.js";
import NotificationService from "../notifications/notificationService.js";

const serializeTicket = (doc) => {
  const ticket = doc?.toObject ? doc.toObject() : doc;
  if (!ticket) return ticket;

  return {
    _id: ticket._id,
    userId:
      ticket?.userId && typeof ticket.userId === "object"
        ? {
            _id: ticket.userId._id,
            fullname: ticket.userId.fullname || "",
            email: ticket.userId.email || "",
          }
        : ticket.userId,
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
    adminReplies: Array.isArray(ticket.adminReplies)
      ? ticket.adminReplies.map((r) => ({
          _id: r._id,
          content: r.content,
          repliedBy:
            r.repliedBy && typeof r.repliedBy === "object"
              ? { _id: r.repliedBy._id, fullname: r.repliedBy.fullname || "" }
              : r.repliedBy
                ? { _id: r.repliedBy, fullname: "" }
                : null,
          repliedAt: r.repliedAt,
        }))
      : [],
  };
};

export const listMySupportTickets = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
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
      data: { tickets: items.map(serializeTicket), pagination },
    });
  } catch (err) {
    next(err);
  }
};

export const createSupportTicket = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
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
      return res
        .status(400)
        .json({ success: false, message: "You can attach up to 5 images" });
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
      return res
        .status(400)
        .json({ success: false, message: "Invalid image attachments" });
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

export const listAllSupportTicketsForAdmin = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const { items, pagination } =
      await supportTicketService.listAllSupportTicketsForAdmin({
        page,
        limit,
        status,
      });
    return res.status(200).json({
      success: true,
      data: { tickets: items.map(serializeTicket), pagination },
    });
  } catch (err) {
    next(err);
  }
};

export const updateSupportTicketStatusByAdmin = async (req, res, next) => {
  try {
    const ticketId = req.params?.ticketId;
    const rawStatus = req.body?.status;
    const nextStatus = String(rawStatus || "")
      .trim()
      .toUpperCase();

    const allowedStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed: OPEN, IN_PROGRESS, RESOLVED, CLOSED",
      });
    }

    const updated = await supportTicketService.updateSupportTicketStatusByAdmin(
      { ticketId, status: nextStatus },
    );
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Support ticket not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Support ticket status updated",
      data: serializeTicket(updated),
    });
  } catch (err) {
    next(err);
  }
};

export const addAdminReply = async (req, res, next) => {
  try {
    const ticketId = req.params?.ticketId;
    const adminId = req.user?._id;
    const rawContent = req.body?.content ?? "";
    const content = String(rawContent).trim();

    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "Reply content is required" });
    }
    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Reply must be at most 2000 characters",
      });
    }

    const updated = await supportTicketService.addAdminReplyToTicket({
      ticketId,
      content,
      adminId,
    });
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Support ticket not found" });
    }

    const ticketOwnerId =
      typeof updated.userId === "object" ? updated.userId?._id : updated.userId;
    if (ticketOwnerId && String(ticketOwnerId) !== String(adminId || "")) {
      try {
        const io = req.app.get("io");
        await NotificationService.createTicketRepliedNotification(
          {
            ticketOwnerId,
            adminUser: req.user,
            ticketId: updated._id,
            subject: updated.subject,
            content,
          },
          io,
        );
      } catch (notifyError) {
        console.error(
          "Error sending ticket replied notification:",
          notifyError,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Reply sent",
      data: serializeTicket(updated),
    });
  } catch (err) {
    next(err);
  }
};
