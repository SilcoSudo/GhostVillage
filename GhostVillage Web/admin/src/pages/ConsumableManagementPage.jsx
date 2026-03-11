import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Edit2,
  Trash2,
  Plus,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Package,
  Heart,
  Zap,
  Battery,
  ChevronDown,
} from "lucide-react";
import consumableService from "../shared/services/consumableService";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import CreateConsumableModal from "./components/CreateConsumableModal";
import EditConsumableModal from "./components/EditConsumableModal";
import "./assets/styles/ConsumableManagement.css";

/**
 * Consumable Item Management Page
 * Trang quản lý consumable items với các chức năng CRUD
 */
const ConsumableManagementPage = () => {
  const { t } = useTranslation();
  const [consumables, setConsumables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [filterCanDrop, setFilterCanDrop] = useState("all");

  // Modal states
  const [selectedConsumable, setSelectedConsumable] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedConsumable, setExpandedConsumable] = useState(null);

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
   * Fetch consumables từ API
   */
  const fetchConsumables = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await consumableService.getAllConsumables({
        page: currentPage,
        limit: 20,
        isActive: filterStatus,
        canDrop: filterCanDrop,
        type: filterType === "all" ? undefined : filterType,
        rarity: filterRarity === "all" ? undefined : filterRarity,
        search: searchQuery || undefined,
      });

      if (response.success) {
        setConsumables(response.data || []);
        setPagination(response.pagination || {});
      }
    } catch (err) {
      console.error("Error fetching consumables:", err);
      setError(err.response?.data?.message || "Lỗi khi tải danh sách consumable items");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch statistics
   */
  const fetchStats = async () => {
    try {
      const response = await consumableService.getConsumableStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Error fetching consumable stats:", err);
    }
  };

  // Fetch consumables khi component mount hoặc filter thay đổi
  useEffect(() => {
    fetchConsumables();
  }, [currentPage, filterStatus, filterType, filterRarity, filterCanDrop]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  /**
   * Xử lý search khi nhấn Enter hoặc blur
   */
  const handleSearch = () => {
    setCurrentPage(1);
    fetchConsumables();
  };

  /**
   * Xử lý toggle status
   */
  const handleToggleStatus = async (consumable) => {
    try {
      const newStatus = !consumable.isActive;
      const response = await consumableService.toggleConsumableStatus(
        consumable._id,
        newStatus
      );

      if (response.success) {
        // Cập nhật UI
        setConsumables((prev) =>
          prev.map((c) =>
            c._id === consumable._id ? { ...c, isActive: newStatus } : c
          )
        );
        fetchStats();
      }
    } catch (err) {
      console.error("Error toggling consumable status:", err);
      alert(err.response?.data?.message || "Lỗi khi cập nhật trạng thái");
    }
  };

  /**
   * Xử lý toggle drop availability
   */
  const handleToggleDropAvailability = async (consumable) => {
    try {
      const newStatus = !consumable.canDrop;
      const response = await consumableService.toggleDropAvailability(
        consumable._id,
        newStatus
      );

      if (response.success) {
        // Cập nhật UI
        setConsumables((prev) =>
          prev.map((c) =>
            c._id === consumable._id ? { ...c, canDrop: newStatus } : c
          )
        );
        fetchStats();
      }
    } catch (err) {
      console.error("Error toggling drop availability:", err);
      alert(err.response?.data?.message || "Lỗi khi cập nhật drop availability");
    }
  };

  /**
   * Xử lý mở modal delete
   */
  const handleDelete = (consumable) => {
    setSelectedConsumable(consumable);
    setIsDeleteModalOpen(true);
  };

  /**
   * Xử lý sau khi delete thành công
   */
  const handleDeleteSuccess = () => {
    fetchConsumables();
    fetchStats();
    setIsDeleteModalOpen(false);
  };

  /**
   * Xử lý mở modal edit
   */
  const handleEdit = (consumable) => {
    setSelectedConsumable(consumable);
    setIsEditModalOpen(true);
  };

  /**
   * Xử lý sau khi edit thành công
   */
  const handleEditSuccess = () => {
    fetchConsumables();
    fetchStats();
    setIsEditModalOpen(false);
    setSelectedConsumable(null);
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
    fetchConsumables();
    fetchStats();
    setIsCreateModalOpen(false);
  };

  /**
   * Toggle expand consumable details
   */
  const toggleExpand = (consumableId) => {
    setExpandedConsumable(expandedConsumable === consumableId ? null : consumableId);
  };

  /**
   * Get icon for consumable type
   */
  const getTypeIcon = (type) => {
    switch (type) {
      case "Health":
        return <Heart size={14} />;
      case "Stamina":
        return <Zap size={14} />;
      case "Battery":
        return <Battery size={14} />;
      default:
        return <Package size={14} />;
    }
  };

  return (
    <div className="consumable-management-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="consumable-management-header">
          <h1>
            <Package size={28} />
            Consumable Item Management
          </h1>
          <p>Quản lý consumable items, effects, stack size và drop availability</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="consumable-stats-grid">
            <div className="consumable-stat-card">
              <div className="consumable-stat-label">Total Items</div>
              <div className="consumable-stat-value total">{stats.total}</div>
            </div>
            <div className="consumable-stat-card">
              <div className="consumable-stat-label">Active</div>
              <div className="consumable-stat-value active">{stats.active}</div>
            </div>
            <div className="consumable-stat-card">
              <div className="consumable-stat-label">Inactive</div>
              <div className="consumable-stat-value inactive">{stats.inactive}</div>
            </div>
            <div className="consumable-stat-card">
              <div className="consumable-stat-label">Can Drop</div>
              <div className="consumable-stat-value drop">{stats.canDrop}</div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="consumable-toolbar">
          <div className="consumable-toolbar-content">
            <div className="consumable-toolbar-row">
              {/* Search */}
              <div className="search-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm consumable..."
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
                  <Filter size={20} className="filter-icon" />
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

                {/* Type Filter */}
                <div className="filter-group">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả loại</option>
                    <option value="Health">Health</option>
                    <option value="Stamina">Stamina</option>
                    <option value="Battery">Battery</option>
                    <option value="Buff">Buff</option>
                    <option value="Utility">Utility</option>
                    <option value="Special">Special</option>
                  </select>
                </div>

                {/* Rarity Filter */}
                <div className="filter-group">
                  <select
                    value={filterRarity}
                    onChange={(e) => setFilterRarity(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả độ hiếm</option>
                    <option value="Common">Common</option>
                    <option value="Rare">Rare</option>
                    <option value="Epic">Epic</option>
                    <option value="Legendary">Legendary</option>
                    <option value="Mythic">Mythic</option>
                  </select>
                </div>

                {/* Drop Filter */}
                <div className="filter-group">
                  <select
                    value={filterCanDrop}
                    onChange={(e) => setFilterCanDrop(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả drop</option>
                    <option value="true">Có thể drop</option>
                    <option value="false">Không drop</option>
                  </select>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreate}
                  className="btn-create"
                >
                  <Plus size={18} />
                  <span>Thêm Item</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="consumable-error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="consumable-loading-state">
            <Loader2 className="consumable-spinner" size={40} />
          </div>
        ) : (
          <>
            {/* Consumable Table */}
            <div className="consumable-table-wrapper">
              <div className="overflow-x-auto">
                <table className="consumable-table">
                  <thead>
                    <tr>
                      <th style={{ width: "30px" }}></th>
                      <th>Item ID</th>
                      <th>Name</th>
                      <th className="center">Type</th>
                      <th className="center">Rarity</th>
                      <th className="center">Stack Size</th>
                      <th className="center">Price</th>
                      <th className="center">Can Drop</th>
                      <th className="center">Status</th>
                      <th className="center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumables.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="consumable-empty-state">
                          <p>Không tìm thấy consumable item nào</p>
                        </td>
                      </tr>
                    ) : (
                      consumables.map((consumable) => (
                        <React.Fragment key={consumable._id}>
                          <tr>
                            <td>
                              <button
                                onClick={() => toggleExpand(consumable._id)}
                                className="consumable-expand-btn"
                                title="Xem chi tiết"
                              >
                                <ChevronDown
                                  size={18}
                                  style={{
                                    transform: expandedConsumable === consumable._id ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.3s ease"
                                  }}
                                />
                              </button>
                            </td>
                            <td>
                              <div className="consumable-id">
                                {consumable.itemId}
                              </div>
                            </td>
                            <td>
                              <div className="consumable-title">{consumable.name}</div>
                              <div className="consumable-description" style={{ maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {consumable.description}
                              </div>
                            </td>
                            <td className="center">
                              <span
                                className={`consumable-badge ${consumable.type.toLowerCase()}`}
                              >
                                {getTypeIcon(consumable.type)}
                                <span style={{ marginLeft: "4px" }}>{consumable.type}</span>
                              </span>
                            </td>
                            <td className="center">
                              <span
                                className={`consumable-badge ${consumable.rarity.toLowerCase()}`}
                              >
                                {consumable.rarity}
                              </span>
                            </td>
                            <td className="center">
                              <span>{consumable.stackSize}</span>
                            </td>
                            <td className="center">
                              <span className="consumable-price">{consumable.price} 🪙</span>
                            </td>
                            <td className="center">
                              <button
                                onClick={() => handleToggleDropAvailability(consumable)}
                                className={`consumable-drop-toggle ${
                                  consumable.canDrop ? "can-drop" : "no-drop"
                                }`}
                              >
                                {consumable.canDrop ? "Yes" : "No"}
                              </button>
                            </td>
                            <td className="center">
                              <button
                                onClick={() => handleToggleStatus(consumable)}
                                className={`consumable-status-toggle ${
                                  consumable.isActive ? "active" : "inactive"
                                }`}
                              >
                                {consumable.isActive ? "Active" : "Inactive"}
                              </button>
                            </td>
                            <td>
                              <div className="consumable-action-buttons">
                                <button
                                  onClick={() => handleEdit(consumable)}
                                  className="consumable-action-btn edit"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(consumable)}
                                  className="consumable-action-btn delete"
                                  title="Xóa"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Expanded Detail Row */}
                          {expandedConsumable === consumable._id && (
                            <tr className="consumable-details-row">
                              <td colSpan="10" className="consumable-details-content">
                                <div className="consumable-details-grid">
                                  {/* Effects */}
                                  <div className="consumable-details-section">
                                    <h4 className="consumable-details-title">
                                      <Zap size={16} />
                                      Effects
                                    </h4>
                                    <div className="consumable-effect-grid">
                                      {consumable.effects?.restoreHP > 0 && (
                                        <div className="consumable-effect-item">
                                          <span className="consumable-effect-label">Restore HP:</span>
                                          <span className="consumable-effect-value health">{consumable.effects.restoreHP}</span>
                                        </div>
                                      )}
                                      {consumable.effects?.restoreStamina > 0 && (
                                        <div className="consumable-effect-item">
                                          <span className="consumable-effect-label">Restore Stamina:</span>
                                          <span className="consumable-effect-value stamina">{consumable.effects.restoreStamina}</span>
                                        </div>
                                      )}
                                      {consumable.effects?.restoreBattery > 0 && (
                                        <div className="consumable-effect-item">
                                          <span className="consumable-effect-label">Restore Battery:</span>
                                          <span className="consumable-effect-value battery">{consumable.effects.restoreBattery}</span>
                                        </div>
                                      )}
                                      {consumable.effects?.speedBoost > 0 && (
                                        <div className="consumable-effect-item">
                                          <span className="consumable-effect-label">Speed Boost:</span>
                                          <span className="consumable-effect-value buff">{consumable.effects.speedBoost}%</span>
                                        </div>
                                      )}
                                      {consumable.effects?.defenseBoost > 0 && (
                                        <div className="consumable-effect-item">
                                          <span className="consumable-effect-label">Defense Boost:</span>
                                          <span className="consumable-effect-value buff">{consumable.effects.defenseBoost}%</span>
                                        </div>
                                      )}
                                      {consumable.effects?.duration > 0 && (
                                        <div className="consumable-effect-item">
                                          <span className="consumable-effect-label">Duration:</span>
                                          <span className="consumable-effect-value">{consumable.effects.duration}s</span>
                                        </div>
                                      )}
                                      {consumable.effects?.customEffect && (
                                        <div className="consumable-effect-item full-width">
                                          <span className="consumable-effect-label">Custom Effect:</span>
                                          <span className="consumable-effect-value">{consumable.effects.customEffect}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Additional Info */}
                                  <div className="consumable-details-section">
                                    <h4 className="consumable-details-title">
                                      <Package size={16} />
                                      Additional Info
                                    </h4>
                                    <div className="consumable-additional-info">
                                      <div className="consumable-info-item">
                                        <span className="consumable-info-label">Required Level:</span>
                                        <span className="consumable-info-value">{consumable.requiredLevel}</span>
                                      </div>
                                      <div className="consumable-info-item">
                                        <span className="consumable-info-label">Weight:</span>
                                        <span className="consumable-info-value">{consumable.weight}</span>
                                      </div>
                                      {consumable.cooldown > 0 && (
                                        <div className="consumable-info-item">
                                          <span className="consumable-info-label">Cooldown:</span>
                                          <span className="consumable-info-value">{consumable.cooldown}s</span>
                                        </div>
                                      )}
                                      <div className="consumable-info-item">
                                        <span className="consumable-info-label">Drop Rate:</span>
                                        <span className="consumable-info-value">{consumable.dropRate}%</span>
                                      </div>
                                      {consumable.sellPrice > 0 && (
                                        <div className="consumable-info-item">
                                          <span className="consumable-info-label">Sell Price:</span>
                                          <span className="consumable-info-value">{consumable.sellPrice} 🪙</span>
                                        </div>
                                      )}
                                      <div className="consumable-info-item">
                                        <span className="consumable-info-label">In Store:</span>
                                        <span className="consumable-info-value" style={{ color: consumable.isAvailableInStore ? "#4CAF50" : "#f44336" }}>
                                          {consumable.isAvailableInStore ? "Yes" : "No"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Tags */}
                                {consumable.tags && consumable.tags.length > 0 && (
                                  <div className="consumable-details-section" style={{ marginTop: "16px" }}>
                                    <h4 className="consumable-details-title">Tags</h4>
                                    <div className="consumable-tags">
                                      {consumable.tags.map((tag, idx) => (
                                        <span key={idx} className="consumable-tag">{tag}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
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
              <div className="consumable-pagination">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="consumable-pagination-btn"
                >
                  Trước
                </button>
                <span className="consumable-pagination-info">
                  Trang {currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(pagination.totalPages, prev + 1)
                    )
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="consumable-pagination-btn"
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
          title="Xác nhận xóa consumable item"
          message={`Bạn có chắc chắn muốn xóa item "${selectedConsumable?.name}" (${selectedConsumable?.itemId})? Hành động này không thể hoàn tác.`}
          onConfirm={async () => {
            try {
              await consumableService.deleteConsumable(selectedConsumable._id);
              handleDeleteSuccess();
            } catch (err) {
              alert(err.response?.data?.message || "Lỗi khi xóa consumable item");
            }
          }}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedConsumable && (
        <EditConsumableModal
          consumable={selectedConsumable}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedConsumable(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateConsumableModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default ConsumableManagementPage;
