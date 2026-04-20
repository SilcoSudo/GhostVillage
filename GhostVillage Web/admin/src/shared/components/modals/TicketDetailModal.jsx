import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  AlertCircle,
  Clock,
  CheckCircle,
  MessageCircle,
  XCircle,
  User,
  CalendarDays,
  ImageOff,
  Send,
  Shield,
} from "lucide-react";
import axios from "../../services/axios";
import "./assets/styles/TicketDetailModal.css";

const STATUS_META = {
  OPEN: { cls: "status-open", Icon: AlertCircle },
  IN_PROGRESS: { cls: "status-in_progress", Icon: Clock },
  RESOLVED: { cls: "status-resolved", Icon: CheckCircle },
  CLOSED: { cls: "status-closed", Icon: XCircle },
};

const getStatusLabel = (status, t) => {
  switch (String(status || "OPEN").toUpperCase()) {
    case "OPEN":
      return t("tickets.statusLabels.open", { defaultValue: "Open" });
    case "IN_PROGRESS":
      return t("tickets.statusLabels.inProgress", {
        defaultValue: "In Progress",
      });
    case "RESOLVED":
      return t("tickets.statusLabels.resolved", { defaultValue: "Resolved" });
    case "CLOSED":
      return t("tickets.statusLabels.closed", { defaultValue: "Closed" });
    default:
      return String(status || "OPEN");
  }
};

const formatDateTime = (value, locale) =>
  new Date(value).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const AttachmentImage = ({ url, index, t }) => {
  const [broken, setBroken] = useState(false);

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="td-attachment-item"
      title={t("tickets.attachmentLabel", { index: index + 1 })}
    >
      {broken ? (
        <span className="td-attachment-broken">
          <ImageOff size={24} />
          <span>{t("tickets.unableToLoadAttachment")}</span>
        </span>
      ) : (
        <img
          src={url}
          alt={t("tickets.attachmentLabel", { index: index + 1 })}
          className="td-attachment-img"
          onError={() => setBroken(true)}
        />
      )}
    </a>
  );
};

const buildConversationTimeline = (
  ticket,
  attachments,
  replies,
  labels = {},
) => {
  const userLabel = labels.user || "User";
  const adminLabel = labels.admin || "Admin";

  const timeline = [
    {
      id: `ticket-msg-${ticket.id || ticket._id || "unknown"}`,
      role: "user",
      isOriginal: true,
      author: ticket.userName || userLabel,
      content: ticket.message || "",
      createdAt: ticket.createdAt,
      attachments,
    },
  ];

  if (Array.isArray(replies)) {
    replies.forEach((reply, index) => {
      timeline.push({
        id: String(reply?._id || `reply-${index}`),
        role: "admin",
        isOriginal: false,
        author: reply?.repliedBy?.fullname || adminLabel,
        content: reply?.content || "",
        createdAt: reply?.repliedAt || ticket.updatedAt,
        attachments: [],
      });
    });
  }

  return timeline
    .filter((entry) => entry.content || entry.attachments.length > 0)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
};

const TicketDetailModal = ({ isOpen, ticket, onClose, onReplySent }) => {
  const { t, i18n } = useTranslation();
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");

  if (!isOpen || !ticket) return null;

  const attachmentList = Array.isArray(ticket.attachments)
    ? ticket.attachments.filter((item) => item?.url)
    : [];

  const adminReplies = Array.isArray(ticket.adminReplies)
    ? ticket.adminReplies
    : [];
  const dateLocale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";
  const conversation = buildConversationTimeline(
    ticket,
    attachmentList,
    adminReplies,
    {
      user: t("tickets.labels.user", { defaultValue: "User" }),
      admin: t("tickets.labels.admin", { defaultValue: "Admin" }),
    },
  );

  const meta = STATUS_META[ticket.status] || STATUS_META.OPEN;
  const StatusIcon = meta.Icon;
  const statusLabel = getStatusLabel(ticket.status, t);

  const handleClose = () => {
    setReplyText("");
    setReplyError("");
    onClose();
  };

  const handleSendReply = async () => {
    const content = replyText.trim();
    if (!content) return;
    setSending(true);
    setReplyError("");

    try {
      const res = await axios.post(
        `/web/support-tickets/admin/${ticket.id || ticket._id}/replies`,
        { content },
      );
      const updatedTicket = res?.data?.data;
      setReplyText("");
      if (onReplySent && updatedTicket) onReplySent(updatedTicket);
    } catch (err) {
      setReplyError(
        err?.response?.data?.message ||
          t("tickets.replyFailed", {
            defaultValue: "Failed to send reply. Please try again.",
          }),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content ticket-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="header-title">
            <MessageCircle size={20} className="header-icon" />
            <h2>{t("tickets.ticketDetail")}</h2>
          </div>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            aria-label={t("common.close")}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="td-banner">
            <div className="td-banner-left">
              <span className="td-ticket-id">{ticket.ticketNumber}</span>
              <p className="td-subject">{ticket.subject}</p>
            </div>
            <span className={`td-status-badge ${meta.cls}`}>
              <StatusIcon size={14} />
              {statusLabel}
            </span>
          </div>

          <div className="td-meta-grid">
            <div className="td-meta-item">
              <span className="td-meta-icon">
                <User size={13} />
              </span>
              <div>
                <p className="td-meta-label">{t("tickets.user")}</p>
                <p className="td-meta-value">
                  {ticket.userName || ticket.userId}
                </p>
                {ticket.userEmail && (
                  <p className="td-meta-sub">{ticket.userEmail}</p>
                )}
              </div>
            </div>
            <div className="td-meta-item">
              <span className="td-meta-icon">
                <CalendarDays size={13} />
              </span>
              <div>
                <p className="td-meta-label">{t("tickets.created")}</p>
                <p className="td-meta-value">
                  {formatDateTime(ticket.createdAt, dateLocale)}
                </p>
              </div>
            </div>
          </div>

          <div className="td-section">
            <div className="td-conversation-list">
              {conversation.map((entry, index) => (
                <div
                  key={`${entry.id}-${index}`}
                  className={`td-chat-row ${entry.role === "admin" ? "is-admin" : "is-user"}`}
                >
                  {!entry.isOriginal && (
                    <div className="td-chat-head">
                      <span className="td-chat-author">
                        {entry.role === "admin" ? (
                          <Shield size={12} />
                        ) : (
                          <User size={12} />
                        )}
                        {entry.author}
                      </span>
                      <span className="td-chat-time">
                        {formatDateTime(entry.createdAt, dateLocale)}
                      </span>
                    </div>
                  )}

                  {entry.isOriginal && (
                    <span className="td-chat-original-tag">
                      {t("tickets.originalMessage")}
                    </span>
                  )}

                  <div
                    className={`td-chat-bubble ${entry.role === "admin" ? "admin" : "user"}`}
                  >
                    {entry.content}
                  </div>

                  {entry.attachments.length > 0 && (
                    <div className="td-chat-attachment-grid">
                      {entry.attachments.map((item, i) => (
                        <AttachmentImage
                          key={`${entry.id}-img-${i}`}
                          url={item.url}
                          index={i}
                          t={t}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="td-section td-reply-block">
            <h3 className="td-section-title">
              <Send size={13} />
              {t("tickets.sendReply")}
            </h3>

            <div className="td-reply-form">
              <textarea
                className="td-reply-textarea"
                placeholder={t("tickets.typeReply")}
                value={replyText}
                maxLength={2000}
                rows={4}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) handleSendReply();
                }}
              />
              <div className="td-reply-footer">
                <span className="td-reply-char">{replyText.length} / 2000</span>
                {replyError && (
                  <span className="td-reply-error">{replyError}</span>
                )}
                <button
                  className="modal-btn td-reply-send"
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sending}
                >
                  <Send size={14} />
                  {sending ? t("common.sending") : t("tickets.sendReply")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn btn-cancel" onClick={handleClose}>
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
