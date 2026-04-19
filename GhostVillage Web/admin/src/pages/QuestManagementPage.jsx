import React, { useState, useEffect } from "react";
import {
  Edit2,
  Trash2,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Scroll,
  ChevronDown,
} from "lucide-react";
import questService from "../shared/services/questService";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import CreateQuestModal from "./components/CreateQuestModal";
import EditQuestModal from "./components/EditQuestModal";
import "./assets/styles/QuestManagement.css";

/**
 * Quest Management Page
 * Trang quản lý nhiệm vụ theo schema quest của game
 */
const QuestManagementPage = () => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterQuestType, setFilterQuestType] = useState("all");

  // Modal states
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedQuest, setExpandedQuest] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // Statistics
  const [stats, setStats] = useState(null);

  /**
   * Fetch quests từ API
   */
  const fetchQuests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await questService.getAllQuests({
        page: currentPage,
        limit: 20,
        isActive: filterStatus,
        questType: filterQuestType === "all" ? undefined : filterQuestType,
        search: searchQuery || undefined,
      });

      if (response.success) {
        setQuests(response.data || []);
        setPagination(response.pagination || {});
      }
    } catch (err) {
      console.error("Error fetching quests:", err);
      setError(err.response?.data?.message || "Lỗi khi tải danh sách quest");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch statistics
   */
  const fetchStats = async () => {
    try {
      const response = await questService.getQuestStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Error fetching quest stats:", err);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, [currentPage, filterStatus, filterQuestType]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchQuests();
  };

  const handleToggleStatus = async (quest) => {
    try {
      const newStatus = !quest.isActive;
      const response = await questService.toggleQuestStatus(quest._id, newStatus);

      if (response.success) {
        setQuests((prev) =>
          prev.map((q) => (q._id === quest._id ? { ...q, isActive: newStatus } : q)),
        );
        fetchStats();
      }
    } catch (err) {
      console.error("Error toggling quest status:", err);
      alert(err.response?.data?.message || "Lỗi khi cập nhật trạng thái");
    }
  };

  const handleDelete = (quest) => {
    setSelectedQuest(quest);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchQuests();
    fetchStats();
    setIsDeleteModalOpen(false);
  };

  const handleEdit = (quest) => {
    setSelectedQuest(quest);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchQuests();
    fetchStats();
    setIsEditModalOpen(false);
    setSelectedQuest(null);
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    fetchQuests();
    fetchStats();
    setIsCreateModalOpen(false);
  };

  const toggleExpand = (questId) => {
    setExpandedQuest(expandedQuest === questId ? null : questId);
  };

  return (
    <div className="quest-management-container">
      <div className="max-w-7xl mx-auto">
        <div className="quest-management-header">
          <h1>
            <Scroll size={28} />
            Quest Management
          </h1>
          <p>Quản lý nhiệm vụ theo schema runtime của game</p>
        </div>

        {stats && (
          <div className="quest-stats-grid">
            <div className="quest-stat-card">
              <div className="quest-stat-label">Total Quests</div>
              <div className="quest-stat-value total">{stats.total}</div>
            </div>
            <div className="quest-stat-card">
              <div className="quest-stat-label">Active</div>
              <div className="quest-stat-value active">{stats.active}</div>
            </div>
            <div className="quest-stat-card">
              <div className="quest-stat-label">Inactive</div>
              <div className="quest-stat-value inactive">{stats.inactive}</div>
            </div>
            <div className="quest-stat-card">
              <div className="quest-stat-label">Quest Types</div>
              <div className="quest-stat-value lines">{stats.byQuestType?.length || 0}</div>
            </div>
          </div>
        )}

        <div className="quest-toolbar">
          <div className="quest-toolbar-content">
            <div className="quest-toolbar-row">
              <div className="search-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm quest..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  onBlur={handleSearch}
                  className="search-input"
                />
              </div>

              <div className="filter-actions-group">
                <div className="filter-group">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="true">Hoạt động</option>
                    <option value="false">Vô hiệu hóa</option>
                  </select>
                </div>

                <div className="filter-group">
                  <select
                    value={filterQuestType}
                    onChange={(e) => setFilterQuestType(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả loại quest</option>
                    <option value="DAILY">DAILY</option>
                    <option value="ACHIEVEMENT">ACHIEVEMENT</option>
                  </select>
                </div>

                <button onClick={handleCreate} className="btn-create">
                  <Plus size={18} />
                  <span>Thêm Quest</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="quest-error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="quest-loading-state">
            <Loader2 className="quest-spinner" size={40} />
          </div>
        ) : (
          <>
            <div className="quest-table-wrapper">
              <div className="overflow-x-auto">
                <table className="quest-table">
                  <thead>
                    <tr>
                      <th style={{ width: "30px" }}></th>
                      <th>Quest ID</th>
                      <th>Quest Name</th>
                      <th className="center">Type</th>
                      <th className="center">Action</th>
                      <th className="center">Target</th>
                      <th className="center">Reward</th>
                      <th className="center">Status</th>
                      <th className="center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quests.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="quest-empty-state">
                          <p>Không tìm thấy quest nào</p>
                        </td>
                      </tr>
                    ) : (
                      quests.map((quest) => (
                        <React.Fragment key={quest._id}>
                          <tr>
                            <td>
                              <button
                                onClick={() => toggleExpand(quest._id)}
                                className="quest-expand-btn"
                                title="Xem chi tiết"
                              >
                                <ChevronDown
                                  size={18}
                                  style={{
                                    transform:
                                      expandedQuest === quest._id
                                        ? "rotate(180deg)"
                                        : "rotate(0deg)",
                                    transition: "transform 0.3s ease",
                                  }}
                                />
                              </button>
                            </td>
                            <td>
                              <div className="quest-id">{quest.questId}</div>
                            </td>
                            <td>
                              <div className="quest-title">{quest.questName}</div>
                              <div
                                className="quest-description"
                                style={{
                                  maxWidth: "300px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {quest.description}
                              </div>
                            </td>
                            <td className="center">
                              <span
                                className={`quest-badge ${(quest.questType || "unknown")
                                  .toLowerCase()
                                  .replace(" ", "-")}`}
                              >
                                {quest.questType}
                              </span>
                            </td>
                            <td className="center">
                              <span>{quest.actionType}</span>
                            </td>
                            <td className="center">
                              <span>{quest.targetCount || 0}</span>
                            </td>
                            <td className="center">
                              <span>
                                Coin: {quest.reward?.coin || 0} | EXP: {quest.reward?.exp || 0}
                              </span>
                            </td>
                            <td className="center">
                              <button
                                onClick={() => handleToggleStatus(quest)}
                                className={`quest-status-toggle ${
                                  quest.isActive ? "active" : "inactive"
                                }`}
                              >
                                {quest.isActive ? "Active" : "Inactive"}
                              </button>
                            </td>
                            <td>
                              <div className="quest-action-buttons">
                                <button
                                  onClick={() => handleEdit(quest)}
                                  className="quest-action-btn edit"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(quest)}
                                  className="quest-action-btn delete"
                                  title="Xóa"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {expandedQuest === quest._id && (
                            <tr className="quest-details-row">
                              <td colSpan="9" className="quest-details-content">
                                <div className="quest-details-grid">
                                  <div className="quest-details-section">
                                    <h4 className="quest-details-title">Description</h4>
                                    <p>{quest.description || "(Không có mô tả)"}</p>
                                  </div>
                                  <div className="quest-details-section">
                                    <h4 className="quest-details-title">Reward Details</h4>
                                    <div className="quest-additional-info">
                                      <div className="quest-info-item">
                                        <span className="quest-info-label">Coin:</span>
                                        <span className="quest-info-value">{quest.reward?.coin || 0}</span>
                                      </div>
                                      <div className="quest-info-item">
                                        <span className="quest-info-label">EXP:</span>
                                        <span className="quest-info-value">{quest.reward?.exp || 0}</span>
                                      </div>
                                      <div className="quest-info-item">
                                        <span className="quest-info-label">Title ID:</span>
                                        <span className="quest-info-value">
                                          {quest.reward?.titleId || "(none)"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination.totalPages > 1 && (
              <div className="quest-pagination">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="quest-pagination-btn"
                >
                  Trước
                </button>
                <span className="quest-pagination-info">
                  Trang {currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="quest-pagination-btn"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {isDeleteModalOpen && (
        <DeleteConfirmModal
          title="Xác nhận xóa quest"
          message={`Bạn có chắc chắn muốn xóa quest "${selectedQuest?.questName}" (${selectedQuest?.questId})? Hành động này không thể hoàn tác.`}
          onConfirm={async () => {
            try {
              await questService.deleteQuest(selectedQuest._id);
              handleDeleteSuccess();
            } catch (err) {
              alert(err.response?.data?.message || "Lỗi khi xóa quest");
            }
          }}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}

      {isEditModalOpen && selectedQuest && (
        <EditQuestModal
          quest={selectedQuest}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedQuest(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {isCreateModalOpen && (
        <CreateQuestModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default QuestManagementPage;
