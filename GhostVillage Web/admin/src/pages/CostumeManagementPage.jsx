import React, { useState, useEffect } from "react";
import {
  Edit2,
  Trash2,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Shirt,
  DollarSign,
  Store,
} from "lucide-react";
import costumeService from "../shared/services/costumeService";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import CreateCostumeModal from "./components/CreateCostumeModal";
import EditCostumeModal from "./components/EditCostumeModal";
import "./assets/styles/CostumeManagement.css";

/**
 * Costume Management Page
 * Trang quản lý trang phục với các chức năng CRUD
 */
const CostumeManagementPage = () => {
  const [costumes, setCostumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStore, setFilterStore] = useState("all");

  // Modal states
  const [selectedCostume, setSelectedCostume] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
   * Fetch costumes từ API
   */
  const fetchCostumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await costumeService.getAllCostumes({
        page: currentPage,
        limit: 20,
        isActive: filterStatus === "all" ? undefined : filterStatus,
        isAvailableInStore: filterStore === "all" ? undefined : filterStore,
        rarity: filterRarity === "all" ? undefined : filterRarity,
        category: filterCategory === "all" ? undefined : filterCategory,
        search: searchQuery || undefined,
      });

      if (response.success) {
        setCostumes(response.data || []);
        setPagination(response.pagination || {});
      }
    } catch (err) {
      console.error("Error fetching costumes:", err);
      setError(err.response?.data?.message || "Lỗi khi tải danh sách costume");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch statistics
   */
  const fetchStats = async () => {
    try {
      const response = await costumeService.getCostumeStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Error fetching costume stats:", err);
    }
  };

  // Fetch costumes khi component mount hoặc filter thay đổi
  useEffect(() => {
    fetchCostumes();
  }, [currentPage, filterStatus, filterRarity, filterCategory, filterStore]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  /**
   * Xử lý search khi nhấn Enter hoặc blur
   */
  const handleSearch = () => {
    setCurrentPage(1);
    fetchCostumes();
  };

  /**
   * Xử lý toggle status (isActive)
   */
  const handleToggleStatus = async (costume) => {
    try {
      const newStatus = !costume.isActive;
      const response = await costumeService.toggleCostumeStatus(
        costume._id,
        newStatus
      );

      if (response.success) {
        setCostumes((prev) =>
          prev.map((c) =>
            c._id === costume._id ? { ...c, isActive: newStatus } : c
          )
        );
        fetchStats();
      }
    } catch (err) {
      console.error("Error toggling costume status:", err);
      alert(err.response?.data?.message || "Lỗi khi cập nhật trạng thái");
    }
  };

  /**
   * Xử lý toggle store availability
   */
  const handleToggleStore = async (costume) => {
    try {
      const newStatus = !costume.isAvailableInStore;
      const response = await costumeService.toggleStoreAvailability(
        costume._id,
        newStatus
      );

      if (response.success) {
        setCostumes((prev) =>
          prev.map((c) =>
            c._id === costume._id
              ? { ...c, isAvailableInStore: newStatus }
              : c
          )
        );
        fetchStats();
      }
    } catch (err) {
      console.error("Error toggling store availability:", err);
      alert(
        err.response?.data?.message ||
          "Lỗi khi cập nhật hiển thị trong shop"
      );
    }
  };

  /**
   * Xử lý mở modal delete
   */
  const handleDelete = (costume) => {
    setSelectedCostume(costume);
    setIsDeleteModalOpen(true);
  };

  /**
   * Xử lý sau khi delete thành công
   */
  const handleDeleteSuccess = () => {
    fetchCostumes();
    fetchStats();
    setIsDeleteModalOpen(false);
  };

  /**
   * Xử lý mở modal edit
   */
  const handleEdit = (costume) => {
    setSelectedCostume(costume);
    setIsEditModalOpen(true);
  };

  /**
   * Xử lý sau khi edit thành công
   */
  const handleEditSuccess = () => {
    fetchCostumes();
    fetchStats();
    setIsEditModalOpen(false);
    setSelectedCostume(null);
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
    fetchCostumes();
    fetchStats();
    setIsCreateModalOpen(false);
  };

  return (
    <div className="costume-management-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="costume-management-header">
          <h1>
            <Shirt size={28} />
            Costume Management
          </h1>
          <p>Quản lý trang phục, rarity, giá cả và khả dụng trong shop</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="costume-stats-grid">
            <div className="costume-stat-card">
              <div className="costume-stat-label">Total Costumes</div>
              <div className="costume-stat-value total">{stats.total}</div>
            </div>
            <div className="costume-stat-card">
              <div className="costume-stat-label">Active</div>
              <div className="costume-stat-value active">{stats.active}</div>
            </div>
            <div className="costume-stat-card">
              <div className="costume-stat-label">Inactive</div>
              <div className="costume-stat-value inactive">
                {stats.inactive}
              </div>
            </div>
            <div className="costume-stat-card">
              <div className="costume-stat-label">In Store</div>
              <div className="costume-stat-value store">{stats.inStore}</div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="costume-toolbar">
          <div className="costume-toolbar-content">
            <div className="costume-toolbar-row">
              {/* Search */}
              <div className="search-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm costume..."
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

                {/* Category Filter */}
                <div className="filter-group">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả loại</option>
                    <option value="Full Body">Full Body</option>
                    <option value="Head">Head</option>
                    <option value="Body">Body</option>
                    <option value="Accessory">Accessory</option>
                    <option value="Weapon">Weapon</option>
                    <option value="Pet">Pet</option>
                  </select>
                </div>

                {/* Store Filter */}
                <div className="filter-group">
                  <select
                    value={filterStore}
                    onChange={(e) => setFilterStore(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả shop</option>
                    <option value="true">Trong shop</option>
                    <option value="false">Không trong shop</option>
                  </select>
                </div>

                {/* Create Button */}
                <button onClick={handleCreate} className="btn-create">
                  <Plus size={18} />
                  <span>Thêm Costume</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="costume-error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="costume-loading-state">
            <Loader2 className="costume-spinner" size={40} />
          </div>
        ) : (
          <>
            {/* Costume Table */}
            <div className="costume-table-wrapper">
              <div className="overflow-x-auto">
                <table className="costume-table">
                  <thead>
                    <tr>
                      <th>Costume ID</th>
                      <th>Name</th>
                      <th className="center">Thumbnail</th>
                      <th className="center">Rarity</th>
                      <th className="center">Category</th>
                      <th className="center">Price</th>
                      <th className="center">Status</th>
                      <th className="center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costumes.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="costume-empty-state">
                          <p>Không tìm thấy costume nào</p>
                        </td>
                      </tr>
                    ) : (
                      costumes.map((costume) => (
                        <tr key={costume._id}>
                          <td>
                            <div className="costume-id">
                              {costume.costumeId}
                            </div>
                          </td>
                          <td>
                            <div className="costume-name">{costume.name}</div>
                            <div
                              className="costume-description"
                              style={{
                                maxWidth: "300px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {costume.description}
                            </div>
                          </td>
                          <td className="center">
                            {costume.thumbnailAsset || costume.visualAsset ? (
                              <img
                                src={
                                  costume.thumbnailAsset || costume.visualAsset
                                }
                                alt={costume.name}
                                className="costume-thumbnail"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="costume-thumbnail-placeholder"
                              style={{
                                display:
                                  costume.thumbnailAsset || costume.visualAsset
                                    ? "none"
                                    : "flex",
                              }}
                            >
                              <Shirt size={24} />
                            </div>
                          </td>
                          <td className="center">
                            <span
                              className={`costume-badge ${costume.rarity.toLowerCase()}`}
                            >
                              {costume.rarity}
                            </span>
                          </td>
                          <td className="center">
                            <span
                              className={`costume-badge ${costume.category
                                .toLowerCase()
                                .replace(" ", "-")}`}
                            >
                              {costume.category}
                            </span>
                          </td>
                          <td className="center">
                            {costume.specialPrice &&
                            costume.specialPrice < costume.price ? (
                              <div className="costume-price-special">
                                <div className="costume-price-original">
                                  {costume.price.toLocaleString()} 🪙
                                </div>
                                <div className="costume-price-sale">
                                  <DollarSign size={14} />
                                  {costume.specialPrice.toLocaleString()}
                                </div>
                              </div>
                            ) : (
                              <div className="costume-price">
                                <DollarSign size={14} />
                                {costume.price.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="center">
                            <div className="costume-toggle-buttons">
                              {/* Active/Inactive Toggle */}
                              <button
                                onClick={() => handleToggleStatus(costume)}
                                className={`costume-toggle-btn ${
                                  costume.isActive ? "active" : "inactive"
                                }`}
                                title="Toggle Active Status"
                              >
                                {costume.isActive ? "Active" : "Inactive"}
                              </button>
                              {/* Store Toggle */}
                              <button
                                onClick={() => handleToggleStore(costume)}
                                className={`costume-toggle-btn ${
                                  costume.isAvailableInStore
                                    ? "in-store"
                                    : "not-in-store"
                                }`}
                                title="Toggle Store Availability"
                              >
                                <Store size={12} />
                                {costume.isAvailableInStore
                                  ? "In Store"
                                  : "Hidden"}
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="costume-action-buttons">
                              <button
                                onClick={() => handleEdit(costume)}
                                className="costume-action-btn edit"
                                title="Chỉnh sửa"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(costume)}
                                className="costume-action-btn delete"
                                title="Xóa"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
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
              <div className="costume-pagination">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="costume-pagination-btn"
                >
                  Trước
                </button>
                <span className="costume-pagination-info">
                  Trang {currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(pagination.totalPages, prev + 1)
                    )
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="costume-pagination-btn"
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
          title="Xác nhận xóa costume"
          message={`Bạn có chắc chắn muốn xóa costume "${selectedCostume?.name}" (${selectedCostume?.costumeId})? Hành động này không thể hoàn tác.`}
          onConfirm={async () => {
            try {
              await costumeService.deleteCostume(selectedCostume._id);
              handleDeleteSuccess();
            } catch (err) {
              alert(err.response?.data?.message || "Lỗi khi xóa costume");
            }
          }}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedCostume && (
        <EditCostumeModal
          costume={selectedCostume}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCostume(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateCostumeModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default CostumeManagementPage;
