import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle, Clock, Search, XCircle } from "lucide-react";
import TicketDetailModal from "../shared/components/modals/TicketDetailModal";
import axios from "../shared/services/axios";
import "./assets/styles/SupportTicket.css";

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

const SupportTicketPage = () => {
  const { t, i18n } = useTranslation();

  const [supportTickets, setSupportTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState("");

  const normalizeTicket = (ticket) => {
    const id = ticket?._id || ticket?.id;
    const createdAt = ticket?.createdAt || new Date().toISOString();
    const updatedAt = ticket?.updatedAt || createdAt;
    const status = String(ticket?.status || "OPEN").toUpperCase();
    const attachments = Array.isArray(ticket?.attachments)
      ? ticket.attachments
          .map((item) => ({
            url: String(item?.url || "").trim(),
            publicId: item?.publicId || null,
          }))
          .filter((item) => item.url)
      : [];

    return {
      id,
      _id: id,
      ticketNumber: id
        ? String(id)
        : t("tickets.notAvailable", { defaultValue: "N/A" }),
      userName:
        typeof ticket?.userId === "object"
          ? ticket?.userId?.fullname ||
            t("tickets.unknownUser", { defaultValue: "Unknown" })
          : t("tickets.unknownUser", { defaultValue: "Unknown" }),
      userId:
        typeof ticket?.userId === "object"
          ? ticket?.userId?._id ||
            t("tickets.notAvailable", { defaultValue: "N/A" })
          : String(
              ticket?.userId ||
                t("tickets.notAvailable", { defaultValue: "N/A" }),
            ),
      userEmail:
        typeof ticket?.userId === "object" ? ticket?.userId?.email || "" : "",
      subject:
        ticket?.subject || t("tickets.untitled", { defaultValue: "Untitled" }),
      message: ticket?.message || "",
      status,
      attachments,
      createdAt,
      updatedAt,
      adminReplies: Array.isArray(ticket?.adminReplies)
        ? ticket.adminReplies
        : [],
    };
  };

  const fetchSupportTickets = async () => {
    try {
      setLoading(true);
      setError("");

      let page = 1;
      let hasMore = true;
      const loadedTickets = [];

      while (hasMore && page <= 20) {
        const response = await axios.get("/web/support-tickets/admin/all", {
          params: { page, limit: 100 },
        });

        const tickets = response?.data?.data?.tickets || [];
        loadedTickets.push(...tickets.map(normalizeTicket));

        hasMore = Boolean(response?.data?.data?.pagination?.hasMore);
        page += 1;
      }

      setSupportTickets(loadedTickets);
    } catch (err) {
      console.error("Error fetching support tickets:", err);
      setError(
        err?.response?.data?.message ||
          t("tickets.loadFailed", {
            defaultValue: "Failed to load support tickets",
          }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportTickets();
  }, []);

  // Filter tickets
  const filteredTickets = supportTickets.filter((ticket) => {
    const query = searchQuery.toLowerCase().trim();

    const matchSearch =
      !query ||
      ticket.ticketNumber.toLowerCase().includes(query) ||
      String(ticket.userId).toLowerCase().includes(query) ||
      String(ticket.userName).toLowerCase().includes(query) ||
      String(ticket.userEmail).toLowerCase().includes(query) ||
      String(ticket.subject).toLowerCase().includes(query) ||
      String(ticket.message).toLowerCase().includes(query);

    const matchStatus =
      filterStatus === "all" || ticket.status === filterStatus;

    return matchSearch && matchStatus;
  });

  // Sort tickets
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (sortConfig.key === "createdAt" || sortConfig.key === "updatedAt") {
      const aTime = new Date(aValue || 0).getTime();
      const bTime = new Date(bValue || 0).getTime();
      return sortConfig.direction === "asc" ? aTime - bTime : bTime - aTime;
    }

    if (typeof aValue === "string") {
      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const openDetailModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };

  const handleReplySent = (updatedTicket) => {
    if (!updatedTicket) return;
    const normalized = normalizeTicket(updatedTicket);
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === normalized.id ? { ...t, ...normalized } : t)),
    );
    setSelectedTicket((prev) =>
      prev && prev.id === normalized.id ? { ...prev, ...normalized } : prev,
    );
  };

  const handleChangeTicketStatus = async (ticketId, nextStatus) => {
    if (!ticketId) {
      throw new Error("Ticket ID is required");
    }

    const normalizedStatus = String(nextStatus || "")
      .trim()
      .toUpperCase();

    const response = await axios.patch(
      `/web/support-tickets/admin/${ticketId}/status`,
      { status: normalizedStatus },
    );

    const updated = normalizeTicket(response?.data?.data || {});

    setSupportTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, ...updated } : ticket,
      ),
    );

    setSelectedTicket((prev) =>
      prev && prev.id === ticketId ? { ...prev, ...updated } : prev,
    );

    return updated;
  };

  const handleInlineStatusChange = async (ticket, nextStatus) => {
    const next = String(nextStatus || "").toUpperCase();
    if (!ticket?.id || !next || next === ticket.status) {
      return;
    }

    try {
      setUpdatingTicketId(ticket.id);
      await handleChangeTicketStatus(ticket.id, next);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          t("tickets.updateFailed", {
            defaultValue: "Failed to update ticket status",
          }),
      );
    } finally {
      setUpdatingTicketId("");
    }
  };

  const formatStatusLabel = (status) => getStatusLabel(status, t);

  const dateLocale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";

  const formatDate = (value) => new Date(value).toLocaleDateString(dateLocale);

  const formatTime = (value) =>
    new Date(value).toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusSelectClass = (status) => {
    switch (status) {
      case "OPEN":
        return "status-select-open";
      case "IN_PROGRESS":
        return "status-select-in-progress";
      case "RESOLVED":
        return "status-select-resolved";
      case "CLOSED":
        return "status-select-closed";
      default:
        return "";
    }
  };

  return (
    <div className="support-ticket-container">
      <div className="support-ticket-header">
        <div className="support-ticket-header-row">
          <div className="support-ticket-header-text">
            <h1>{t("tickets.supportTickets")}</h1>
            <p>
              {t("tickets.totalTickets")}: {filteredTickets.length}{" "}
              {t("tickets.ticketCountLabel")}
            </p>
            <span className="st-interaction-hint">
              {t("tickets.rowInteractionHint")}
            </span>
          </div>

          <div className="st-header-search">
            <div className="st-search-wrapper">
              <Search size={18} className="st-search-icon" />
              <input
                type="text"
                placeholder={t("tickets.searchPlaceholder")}
                className="st-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="st-filter-row">
          <select
            className="st-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">
              {t("tickets.allStatus") || "All Status"}
            </option>
            <option value="OPEN">{t("tickets.open") || "Open"}</option>
            <option value="IN_PROGRESS">
              {t("tickets.inProgress") || "In Progress"}
            </option>
            <option value="RESOLVED">
              {t("tickets.resolved") || "Resolved"}
            </option>
            <option value="CLOSED">{t("tickets.closed") || "Closed"}</option>
          </select>
        </div>
      </div>

      <div className="support-tickets-table-wrapper">
        {loading ? (
          <div className="empty-state">
            <p>{t("tickets.loading")}</p>
          </div>
        ) : (
          <>
            <table className="support-tickets-table">
              <colgroup>
                <col className="col-ticket-stt" />
                <col className="col-ticket-id" />
                <col className="col-ticket-subject" />
                <col className="col-ticket-user" />
                <col className="col-ticket-created" />
                <col className="col-ticket-status" />
              </colgroup>
              <thead>
                <tr>
                  <th className="stt-header">{t("tickets.rowNumber")}</th>
                  <th
                    onClick={() => handleSort("ticketNumber")}
                    className="sortable"
                  >
                    {t("tickets.ticketId") || "Ticket ID"}
                  </th>
                  <th
                    onClick={() => handleSort("subject")}
                    className="sortable"
                  >
                    {t("tickets.subject") || "Subject"}
                  </th>
                  <th
                    onClick={() => handleSort("userName")}
                    className="sortable"
                  >
                    {t("tickets.user") || "User"}
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="sortable align-center"
                  >
                    {t("tickets.created") || "Created"}
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="sortable align-center"
                  >
                    {t("tickets.status") || "Status"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTickets.map((ticket, index) => (
                  <tr
                    key={ticket.id}
                    className="ticket-row-clickable"
                    onClick={() => openDetailModal(ticket)}
                  >
                    <td className="stt-cell">{index + 1}</td>
                    <td className="ticket-id-cell">
                      <span
                        className="ticket-number"
                        title={ticket.ticketNumber}
                      >
                        {ticket.ticketNumber}
                      </span>
                    </td>
                    <td className="ticket-title-cell">
                      <span className="ticket-title" title={ticket.subject}>
                        {ticket.subject}
                      </span>
                    </td>
                    <td className="ticket-user-cell">
                      <span title={ticket.userEmail || ticket.userId}>
                        {ticket.userName}
                      </span>
                    </td>
                    <td className="ticket-date-cell">
                      <span className="ticket-date-main">
                        {formatDate(ticket.createdAt)}
                      </span>
                      <span className="ticket-date-sub">
                        {formatTime(ticket.createdAt)}
                      </span>
                    </td>
                    <td className="ticket-status-cell">
                      <div className="ticket-status-inline-wrapper">
                        <span className="ticket-status-icon" aria-hidden="true">
                          {ticket.status === "OPEN" && (
                            <AlertCircle size={14} />
                          )}
                          {ticket.status === "IN_PROGRESS" && (
                            <Clock size={14} />
                          )}
                          {ticket.status === "RESOLVED" && (
                            <CheckCircle size={14} />
                          )}
                          {ticket.status === "CLOSED" && <XCircle size={14} />}
                        </span>
                        <select
                          className={`ticket-status-select-inline ${getStatusSelectClass(ticket.status)}`}
                          value={ticket.status}
                          disabled={updatingTicketId === ticket.id}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleInlineStatusChange(ticket, e.target.value);
                          }}
                        >
                          <option value="OPEN">
                            {formatStatusLabel("OPEN")}
                          </option>
                          <option value="IN_PROGRESS">
                            {formatStatusLabel("IN_PROGRESS")}
                          </option>
                          <option value="RESOLVED">
                            {formatStatusLabel("RESOLVED")}
                          </option>
                          <option value="CLOSED">
                            {formatStatusLabel("CLOSED")}
                          </option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sortedTickets.length === 0 && (
              <div className="empty-state">
                <p>{error || t("tickets.noTicketsFound")}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        isOpen={isDetailModalOpen}
        ticket={selectedTicket}
        onClose={() => setIsDetailModalOpen(false)}
        onReplySent={handleReplySent}
      />
    </div>
  );
};

export default SupportTicketPage;
