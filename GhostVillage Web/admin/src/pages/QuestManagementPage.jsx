import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Edit2,
  Trash2,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Scroll,
  Target,
  Award,
  ChevronDown,
} from "lucide-react";
import questService from "../shared/services/questService";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import CreateQuestModal from "./components/CreateQuestModal";
import EditQuestModal from "./components/EditQuestModal";
import "./assets/styles/QuestManagement.css";

/**
 * Quest Management Page
 * Trang quản lý nhiệm vụ với các chức năng CRUD
 */
const QuestManagementPage = () => {
  const { t } = useTranslation();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterQuestLine, setFilterQuestLine] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");

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
        questLine: filterQuestLine === "all" ? undefined : filterQuestLine,
        difficulty: filterDifficulty === "all" ? undefined : filterDifficulty,
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

  // Fetch quests khi component mount hoặc filter thay đổi
  useEffect(() => {
    fetchQuests();
  }, [currentPage, filterStatus, filterQuestLine, filterDifficulty]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  /**
   * Xử lý search khi nhấn Enter hoặc blur
   */
  const handleSearch = () => {
    setCurrentPage(1);
    fetchQuests();
  };

  /**
   * Xử lý toggle status
   */
  const handleToggleStatus = async (quest) => {
    try {
      const newStatus = !quest.isActive;
      const response = await questService.toggleQuestStatus(
        quest._id,
        newStatus
      );

      if (response.success) {
        // Cập nhật UI
        setQuests((prev) =>
          prev.map((q) =>
            q._id === quest._id ? { ...q, isActive: newStatus } : q
          )
        );
        fetchStats();
      }
    } catch (err) {
      console.error("Error toggling quest status:", err);
      alert(err.response?.data?.message || "Lỗi khi cập nhật trạng thái");
    }
  };

  /**
   * Xử lý mở modal delete
   */
  const handleDelete = (quest) => {
    setSelectedQuest(quest);
    setIsDeleteModalOpen(true);
  };

  /**
   * Xử lý sau khi delete thành công
   */
  const handleDeleteSuccess = () => {
    fetchQuests();
    fetchStats();
    setIsDeleteModalOpen(false);
  };

  /**
   * Xử lý mở modal edit
   */
  const handleEdit = (quest) => {
    setSelectedQuest(quest);
    setIsEditModalOpen(true);
  };

  /**
   * Xử lý sau khi edit thành công
   */
  const handleEditSuccess = () => {
    fetchQuests();
    fetchStats();
    setIsEditModalOpen(false);
    setSelectedQuest(null);
  };

  /**
   * Xử lý mở modal create
   */
  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  /**
   * Xử lý sau khi create thành công
   */
  const handleCreateSuccess = () => {
    fetchQuests();
    fetchStats();
    setIsCreateModalOpen(false);
  };

  /**
   * Toggle expand quest details
   */
  const toggleExpand = (questId) => {
    setExpandedQuest(expandedQuest === questId ? null : questId);
  };

  return (
    <div className="quest-management-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="quest-management-header">
          <h1>
            <Scroll size={28} />
            Quest Management
          </h1>
          <p>Quản lý nhiệm vụ, objectives, rewards và quest lines</p>
        </div>

        {/* Statistics Cards */}
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
              <div className="quest-stat-label">Quest Lines</div>
              <div className="quest-stat-value lines">
                {stats.byQuestLine?.length || 0}
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="quest-toolbar">
          <div className="quest-toolbar-content">
            <div className="quest-toolbar-row">
              {/* Search */}
              <div className="search-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm quest..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  onBlur={handleSearch}
                  className="search-input"
                />
              </div>

              {/* Filters */}
              <div className="filter-actions-group">
                {/* Status Filter */}
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

                {/* Quest Line Filter */}
                <div className="filter-group">
                  <select
                    value={filterQuestLine}
                    onChange={(e) => setFilterQuestLine(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả loại</option>
                    <option value="Main Story">Main Story</option>
                    <option value="Side Quest">Side Quest</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Event">Event</option>
                    <option value="Tutorial">Tutorial</option>
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div className="filter-group">
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả độ khó</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                    <option value="Nightmare">Nightmare</option>
                  </select>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreate}
                  className="btn-create"
                >
                  <Plus size={18} />
                  <span>Thêm Quest</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="quest-error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="quest-loading-state">
            <Loader2 className="quest-spinner" size={40} />
          </div>
        ) : (
          <>
            {/* Quest Table */}
            <div className="quest-table-wrapper">
              <div className="overflow-x-auto">
                <table className="quest-table">
                  <thead>
                    <tr>
                      <th style={{ width: "30px" }}></th>
                      <th>Quest ID</th>
                      <th>Title</th>
                      <th className="center">Type</th>
                      <th className="center">Difficulty</th>
                      <th className="center">Level</th>
                      <th className="center">Objectives</th>
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
                                    transform: expandedQuest === quest._id ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.3s ease"
                                  }}
                                />
                              </button>
                            </td>
                            <td>
                              <div className="quest-id">
                                {quest.questId}
                              </div>
                            </td>
                            <td>
                              <div className="quest-title">{quest.title}</div>
                              <div className="quest-description" style={{ maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {quest.description}
                              </div>
                            </td>
                            <td className="center">
                              <span
                                className={`quest-badge ${quest.questLine.toLowerCase().replace(' ', '-')}`}
                              >
                                {quest.questLine}
                              </span>
                            </td>
                            <td className="center">
                              <span
                                className={`quest-badge ${quest.difficulty.toLowerCase()}`}
                              >
                                {quest.difficulty}
                              </span>
                            </td>
                            <td className="center">
                              <span>Lv.{quest.levelRequired}</span>
                            </td>
                            <td className="center">
                              <div className="quest-objective-count">
                                <Target size={14} />
                                <span>
                                  {quest.objectives?.length || 0}
                                </span>
                              </div>
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
                          {/* Expanded Detail Row */}
                          {expandedQuest === quest._id && (
                            <tr className="quest-details-row">
                              <td colSpan="9" className="quest-details-content">
                                <div className="quest-details-grid">
                                  {/* Objectives */}
                                  <div className="quest-details-section">
                                    <h4 className="quest-details-title">
                                      <Target size={16} />
                                      Objectives
                                    </h4>
                                    <ul className="quest-objective-list">
                                      {quest.objectives?.map((obj, idx) => (
                                        <li key={idx} className="quest-objective-item">
                                          <span className="quest-objective-bullet">•</span>
                                          <span>
                                            <span className="quest-objective-type">{obj.type}:</span>{" "}
                                            {obj.description} ({obj.required}x)
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Rewards */}
                                  <div className="quest-details-section">
                                    <h4 className="quest-details-title">
                                      <Award size={16} />
                                      Rewards
                                    </h4>
                                    <div className="quest-reward-grid">
                                      {quest.rewards?.exp > 0 && (
                                        <div className="quest-reward-item">
                                          <span className="quest-reward-label">EXP:</span>
                                          <span className="quest-reward-value exp">{quest.rewards.exp}</span>
                                        </div>
                                      )}
                                      {quest.rewards?.coin > 0 && (
                                        <div className="quest-reward-item">
                                          <span className="quest-reward-label">Coin:</span>
                                          <span className="quest-reward-value coin">{quest.rewards.coin}</span>
                                        </div>
                                      )}
                                      {quest.rewards?.items?.length > 0 && (
                                        <div className="quest-reward-item">
                                          <span className="quest-reward-label">Items:</span>
                                          <span className="quest-reward-value items">
                                            {quest.rewards.items.map(item => `${item.itemId} (x${item.quantity})`).join(", ")}
                                          </span>
                                        </div>
                                      )}
                                      {quest.rewards?.titles?.length > 0 && (
                                        <div className="quest-reward-item">
                                          <span className="quest-reward-label">Titles:</span>
                                          <span className="quest-reward-value titles">{quest.rewards.titles.join(", ")}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Additional Info */}
                                <div className="quest-details-section" style={{ marginTop: "16px" }}>
                                  <div className="quest-additional-info">
                                    {quest.npcGiver && (
                                      <div className="quest-info-item">
                                        <span className="quest-info-label">NPC:</span>
                                        <span className="quest-info-value">{quest.npcGiver}</span>
                                      </div>
                                    )}
                                    {quest.location && (
                                      <div className="quest-info-item">
                                        <span className="quest-info-label">Location:</span>
                                        <span className="quest-info-value">{quest.location}</span>
                                      </div>
                                    )}
                                    {quest.isRepeatable && (
                                      <div className="quest-info-item">
                                        <span className="quest-info-label">Repeatable:</span>
                                        <span className="quest-info-value" style={{ color: "#4CAF50" }}>
                                          Yes {quest.cooldown > 0 && `(${quest.cooldown}s CD)`}
                                        </span>
                                      </div>
                                    )}
                                    {quest.timeLimit && (
                                      <div className="quest-info-item">
                                        <span className="quest-info-label">Time Limit:</span>
                                        <span className="quest-info-value">{quest.timeLimit}s</span>
                                      </div>
                                    )}
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

            {/* Pagination */}
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
                    setCurrentPage((prev) =>
                      Math.min(pagination.totalPages, prev + 1)
                    )
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

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <DeleteConfirmModal
          title="Xác nhận xóa quest"
          message={`Bạn có chắc chắn muốn xóa quest "${selectedQuest?.title}" (${selectedQuest?.questId})? Hành động này không thể hoàn tác.`}
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

      {/* Edit Modal */}
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

      {/* Create Modal */}
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
