import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle, Clock, Search, XCircle } from "lucide-react";
import TicketDetailModal from "../shared/components/modals/TicketDetailModal";
import axios from "../shared/services/axios";
import "./assets/styles/SupportTicket.css";

const SupportTicketPage = () => {
  const { t } = useTranslation();

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
      ticketNumber: id ? String(id) : "N/A",
      userName:
        typeof ticket?.userId === "object"
          ? ticket?.userId?.fullname || "Unknown"
          : "Unknown",
      userId:
        typeof ticket?.userId === "object"
          ? ticket?.userId?._id || "Unknown"
          : String(ticket?.userId || "Unknown"),
      userEmail:
        typeof ticket?.userId === "object" ? ticket?.userId?.email || "" : "",
      subject: ticket?.subject || "Untitled",
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
        err?.response?.data?.message || "Failed to load support tickets",
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
        err?.response?.data?.message || "Failed to update ticket status",
      );
    } finally {
      setUpdatingTicketId("");
    }
  };

  const formatStatusLabel = (status) =>
    String(status || "OPEN")
      .replace("_", " ")
      .toLowerCase()
      .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

  const formatDate = (value) => new Date(value).toLocaleDateString();

  const formatTime = (value) =>
    new Date(value).toLocaleTimeString([], {
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
            <h1>{t("tickets.supportTickets") || "Support Tickets"}</h1>
            <p>
              {t("tickets.totalTickets") || "Total"}: {filteredTickets.length}{" "}
              {t("tickets.ticketCountLabel") || "tickets"}
            </p>
            <span className="st-interaction-hint">
              {t("tickets.rowInteractionHint") ||
                "Click on a row to view details. Change status directly from the last column."}
            </span>
          </div>

          <div className="st-header-search">
            <div className="st-search-wrapper">
              <Search size={18} className="st-search-icon" />
              <input
                type="text"
                placeholder={
                  t("common.search") ||
                  "Search by ticket ID, subject, user name..."
                }
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
            <p>{t("common.loading") || "Loading support tickets..."}</p>
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
                  <th className="stt-header">STT</th>
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
                <p>
                  {error || t("common.noData") || "No support tickets found"}
                </p>
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
