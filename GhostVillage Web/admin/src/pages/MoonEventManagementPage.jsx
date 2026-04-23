import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Edit2, Trash2, Moon, Zap } from "lucide-react";
import moonEventService from "../shared/services/moonEventService";
import CreateMoonEventModal from "./components/CreateMoonEventModal";
import EditMoonEventModal from "./components/EditMoonEventModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import "./assets/styles/MoonEventManagement.css";

const MoonEventManagementPage = () => {
  const { t } = useTranslation();
  const [moonEvents, setMoonEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchMoonEvents = async () => {
    try {
      setLoading(true);
      const response = await moonEventService.getAllMoonEvents({
        isActive: statusFilter,
        search: searchQuery,
      });
      setMoonEvents(response.data || []);
      setError(null);
    } catch (err) {
      setError(t("moonEvent.errors.loadList"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoonEvents();
  }, [statusFilter, searchQuery]);

  const handleToggleActive = async (event) => {
    try {
      await moonEventService.toggleMoonEventActive(event._id, !event.isActive);
      fetchMoonEvents();
    } catch (err) {
      console.error("Failed to toggle event active status:", err);
      alert(t("moonEvent.errors.toggleStatus"));
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;

    try {
      await moonEventService.deleteMoonEvent(selectedEvent._id);
      setShowDeleteModal(false);
      setSelectedEvent(null);
      fetchMoonEvents();
    } catch (err) {
      console.error("Failed to delete moon event:", err);
      alert(t("moonEvent.errors.delete"));
    }
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleDeleteClick = (event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const numberOrDash = (value) => {
    if (value === undefined || value === null) return "-";
    return Number(value).toFixed(2);
  };

  return (
    <div className="moon-event-management">
      <div className="page-header">
        <div className="header-left">
          <Moon className="header-icon" size={32} />
          <h1>{t("moonEvent.title")}</h1>
        </div>
        <button className="create-button" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          {t("moonEvent.create")}
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>{t("common.status")}:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t("common.all")}</option>
            <option value="true">{t("common.active")}</option>
            <option value="false">{t("common.inactive")}</option>
          </select>
        </div>

        <div className="search-group">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder={t("moonEvent.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">{t("moonEvent.loading")}</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : moonEvents.length === 0 ? (
        <div className="empty-state">
          <Moon size={64} />
          <p>{t("moonEvent.empty")}</p>
          <button className="create-button" onClick={() => setShowCreateModal(true)}>
            <Plus size={20} />
            {t("moonEvent.createFirst")}
          </button>
        </div>
      ) : (
        <div className="moon-event-table-container">
          <table className="moon-event-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>{t("moonEvent.columns.name")}</th>
                <th>Weight</th>
                <th>Environment</th>
                <th>Monster Buff</th>
                <th>Reward Multiplier</th>
                <th>{t("common.status")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {moonEvents.map((event) => (
                <tr key={event._id}>
                  <td className="event-id-cell">
                    <code>{event.eventId}</code>
                  </td>
                  <td className="event-name-cell">
                    <strong>{event.eventName}</strong>
                    <div className="effect-text">{event.description || "-"}</div>
                  </td>
                  <td>{event.weight ?? 10}</td>
                  <td className="multipliers-cell">
                    <div className="multipliers">
                      <span title={t("moonEvent.globalLightIntensity")}>
                        Light x{numberOrDash(event.environmentModifiers?.globalLightIntensity)}
                      </span>
                      <span title={t("moonEvent.fogDensity")}>
                        Fog x{numberOrDash(event.environmentModifiers?.fogDensity)}
                      </span>
                    </div>
                  </td>
                  <td className="multipliers-cell">
                    <div className="multipliers">
                      <span>{t("moonEvent.speed")} x{numberOrDash(event.monsterBuffMultipliers?.speedMultiplier)}</span>
                      <span>{t("moonEvent.detect")} x{numberOrDash(event.monsterBuffMultipliers?.detectionRangeMultiplier)}</span>
                      <span>{t("moonEvent.chase")} x{numberOrDash(event.monsterBuffMultipliers?.chaseRangeMultiplier)}</span>
                      <span>CD x{numberOrDash(event.monsterBuffMultipliers?.cooldownMultiplier)}</span>
                    </div>
                  </td>
                  <td className="multipliers-cell">
                    <div className="multipliers">
                      <span className="multiplier-coin">
                        {t("moonEvent.coin")} x{numberOrDash(event.rewardMultipliers?.coinMultiplier)}
                      </span>
                      <span className="multiplier-exp">
                        EXP x{numberOrDash(event.rewardMultipliers?.expMultiplier)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button
                      className={`toggle-btn ${event.isActive ? "active" : "inactive"}`}
                      onClick={() => handleToggleActive(event)}
                      title={event.isActive ? t("moonEvent.deactivate") : t("moonEvent.activate")}
                    >
                      <Zap size={16} />
                      {event.isActive ? t("common.active").toUpperCase() : t("common.inactive").toUpperCase()}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn" onClick={() => handleEdit(event)} title={t("common.edit")}>
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteClick(event)}
                        title={t("common.delete")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <CreateMoonEventModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchMoonEvents}
        />
      )}

      {showEditModal && selectedEvent && (
        <EditMoonEventModal
          event={selectedEvent}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
          onSuccess={fetchMoonEvents}
        />
      )}

      {showDeleteModal && selectedEvent && (
        <DeleteConfirmModal
          title={t("moonEvent.deleteTitle")}
          message={t("moonEvent.deleteMessage", {
            name: selectedEvent.eventName,
            id: selectedEvent.eventId,
          })}
          onConfirm={handleDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};

export default MoonEventManagementPage;
