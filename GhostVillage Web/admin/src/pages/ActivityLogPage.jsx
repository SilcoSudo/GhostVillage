import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Activity,
  Eye,
  Clock,
  User,
  Shield,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import activityLogService from "../shared/services/activityLogService";
import "./assets/styles/ActivityLog.css";

/**
 * Activity Log Page
 * Xem logs của hệ thống (admin actions, errors, system events)
 */
const ActivityLogPage = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntityType, setFilterEntityType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });

  // Statistics
  const [stats, setStats] = useState(null);

  /**
   * Fetch logs từ API
   */
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await activityLogService.getAllActivityLogs({
        page: currentPage,
        limit: 50,
        action: filterAction === "all" ? undefined : filterAction,
        entityType: filterEntityType === "all" ? undefined : filterEntityType,
        severity: filterSeverity === "all" ? undefined : filterSeverity,
        search: searchQuery || undefined,
      });

      if (response.success) {
        setLogs(response.data || []);
        setPagination(response.pagination || {});
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err.response?.data?.message || "Lỗi khi tải danh sách logs");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch statistics
   */
  const fetchStats = async () => {
    try {
      const response = await activityLogService.getActivityLogStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Fetch logs khi component mount hoặc filter thay đổi
  useEffect(() => {
    fetchLogs();
  }, [currentPage, filterAction, filterEntityType, filterSeverity]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  /**
   * Xử lý search khi nhấn Enter hoặc blur
   */
  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  /**
   * Xử lý xem chi tiết log
   */
  const handleViewDetail = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  /**
   * Get action color
   */
  const getActionColor = (action) => {
    const colors = {
      CREATE: "green",
      UPDATE: "blue",
      DELETE: "red",
      TOGGLE_STATUS: "purple",
      LOGIN: "cyan",
      LOGOUT: "gray",
      ERROR: "red",
      WARNING: "orange",
      INFO: "blue",
    };
    return colors[action] || "gray";
  };

  /**
   * Get severity icon
   */
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertCircle size={16} style={{ color: "#f44336" }} />;
      case "HIGH":
        return <AlertTriangle size={16} style={{ color: "#ff9800" }} />;
      case "MEDIUM":
        return <Info size={16} style={{ color: "#2196F3" }} />;
      default:
        return <Info size={16} style={{ color: "#9e9e9e" }} />;
    }
  };

  return (
    <div className="activity-log-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="activity-log-header">
          <h1>
            <Activity size={28} />
            Activity Log
          </h1>
          <p>Xem lịch sử hoạt động của hệ thống, admin actions và errors</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="activity-log-stats-grid">
            <div className="activity-log-stat-card">
              <div className="activity-log-stat-label">Total Logs</div>
              <div className="activity-log-stat-value total">{stats.total}</div>
            </div>
            <div className="activity-log-stat-card">
              <div className="activity-log-stat-label">Today</div>
              <div className="activity-log-stat-value today">{stats.today}</div>
            </div>
            <div className="activity-log-stat-card">
              <div className="activity-log-stat-label">This Week</div>
              <div className="activity-log-stat-value week">{stats.week}</div>
            </div>
            <div className="activity-log-stat-card">
              <div className="activity-log-stat-label">Errors</div>
              <div className="activity-log-stat-value errors">{stats.errors}</div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="activity-log-toolbar">
          <div className="activity-log-toolbar-content">
            <div className="activity-log-toolbar-row">
              {/* Search */}
              <div className="search-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  onBlur={handleSearch}
                  className="search-input"
                />
              </div>

              {/* Filters */}
              <div className="filter-actions-group">
                {/* Action Filter */}
                <div className="filter-group">
                  <Filter size={20} className="filter-icon" />
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả actions</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="TOGGLE_STATUS">Toggle Status</option>
                    <option value="LOGIN">Login</option>
                    <option value="LOGOUT">Logout</option>
                    <option value="ERROR">Error</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                  </select>
                </div>

                {/* Entity Type Filter */}
                <div className="filter-group">
                  <select
                    value={filterEntityType}
                    onChange={(e) => setFilterEntityType(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả entities</option>
                    <option value="USER">User</option>
                    <option value="MONSTER">Monster</option>
                    <option value="MAP">Map</option>
                    <option value="QUEST">Quest</option>
                    <option value="CONSUMABLE">Consumable</option>
                    <option value="COSTUME">Costume</option>
                    <option value="MOON_EVENT">Moon Event</option>
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="WIKI">Wiki</option>
                    <option value="SYSTEM">System</option>
                  </select>
                </div>

                {/* Severity Filter */}
                <div className="filter-group">
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả severity</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="activity-log-error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="activity-log-loading-state">
            <Loader2 className="activity-log-spinner" size={40} />
          </div>
        ) : (
          <>
            {/* Log Table */}
            <div className="activity-log-table-wrapper">
              <div className="overflow-x-auto">
                <table className="activity-log-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}></th>
                      <th style={{ width: "150px" }}>Timestamp</th>
                      <th style={{ width: "100px" }}>Action</th>
                      <th style={{ width: "120px" }}>Entity Type</th>
                      <th style={{ width: "100px" }}>Severity</th>
                      <th>Description</th>
                      <th style={{ width: "150px" }}>User</th>
                      <th style={{ width: "80px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="activity-log-empty-state">
                          <p>Không tìm thấy logs nào</p>
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log._id}>
                          <td className="center">
                            {getSeverityIcon(log.severity)}
                          </td>
                          <td>
                            <div className="activity-log-timestamp">
                              <Clock size={14} />
                              <span>{formatTimestamp(log.createdAt)}</span>
                            </div>
                          </td>
                          <td className="center">
                            <span
                              className={`activity-log-badge ${getActionColor(
                                log.action
                              )}`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="center">
                            <span className="activity-log-entity">
                              {log.entityType}
                            </span>
                          </td>
                          <td className="center">
                            <span
                              className={`activity-log-severity ${log.severity.toLowerCase()}`}
                            >
                              {log.severity}
                            </span>
                          </td>
                          <td>
                            <div className="activity-log-description">
                              {log.description}
                            </div>
                          </td>
                          <td>
                            {log.username ? (
                              <div className="activity-log-user">
                                <User size={14} />
                                <span>{log.username}</span>
                              </div>
                            ) : (
                              <span className="activity-log-system">System</span>
                            )}
                          </td>
                          <td className="center">
                            <button
                              onClick={() => handleViewDetail(log)}
                              className="activity-log-action-btn view"
                              title="Xem chi tiết"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="activity-log-pagination">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="activity-log-pagination-btn"
                >
                  Trước
                </button>
                <span className="activity-log-pagination-info">
                  Trang {currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(pagination.totalPages, prev + 1)
                    )
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="activity-log-pagination-btn"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: "48rem" }}>
            <div className="modal-header">
              <h2>Log Detail</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="modal-close-btn"
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="log-detail-grid">
                <div className="log-detail-item">
                  <label>Timestamp:</label>
                  <span>{formatTimestamp(selectedLog.createdAt)}</span>
                </div>

                <div className="log-detail-item">
                  <label>Action:</label>
                  <span
                    className={`activity-log-badge ${getActionColor(
                      selectedLog.action
                    )}`}
                  >
                    {selectedLog.action}
                  </span>
                </div>

                <div className="log-detail-item">
                  <label>Entity Type:</label>
                  <span>{selectedLog.entityType}</span>
                </div>

                <div className="log-detail-item">
                  <label>Entity ID:</label>
                  <span>{selectedLog.entityId || "N/A"}</span>
                </div>

                <div className="log-detail-item">
                  <label>Entity Name:</label>
                  <span>{selectedLog.entityName || "N/A"}</span>
                </div>

                <div className="log-detail-item">
                  <label>Severity:</label>
                  <span
                    className={`activity-log-severity ${selectedLog.severity.toLowerCase()}`}
                  >
                    {selectedLog.severity}
                  </span>
                </div>

                <div className="log-detail-item full-width">
                  <label>Description:</label>
                  <p>{selectedLog.description}</p>
                </div>

                <div className="log-detail-item">
                  <label>User:</label>
                  <span>{selectedLog.username || "System"}</span>
                </div>

                <div className="log-detail-item">
                  <label>IP Address:</label>
                  <span>{selectedLog.ipAddress || "N/A"}</span>
                </div>

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="log-detail-item full-width">
                    <label>Metadata:</label>
                    <pre className="log-metadata">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowDetailModal(false)}
                className="modal-btn modal-btn-secondary"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogPage;
