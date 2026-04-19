import React, { useState, useEffect } from "react";
import {
  Edit2,
  Trash2,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Package,
} from "lucide-react";
import consumableService from "../shared/services/consumableService";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import CreateConsumableModal from "./components/CreateConsumableModal";
import EditConsumableModal from "./components/EditConsumableModal";
import "./assets/styles/ConsumableManagement.css";

const ConsumableManagementPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const [selectedItem, setSelectedItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await consumableService.getAllConsumables({
        page: currentPage,
        limit: 20,
        isActive: filterStatus,
        type: filterType === "all" ? undefined : filterType,
        search: searchQuery || undefined,
      });

      if (response.success) {
        setItems(response.data || []);
        setPagination(response.pagination || {});
      }
    } catch (err) {
      console.error("Error fetching items:", err);
      setError(err.response?.data?.message || "Lỗi khi tải danh sách item");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentPage, filterStatus, filterType]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchItems();
  };

  const handleToggleStatus = async (item) => {
    try {
      const newStatus = !item.isActive;
      const response = await consumableService.toggleConsumableStatus(
        item._id,
        newStatus
      );

      if (response.success) {
        setItems((prev) =>
          prev.map((it) =>
            it._id === item._id ? { ...it, isActive: newStatus } : it
          )
        );
      }
    } catch (err) {
      console.error("Error toggling item status:", err);
      alert(err.response?.data?.message || "Lỗi khi cập nhật trạng thái");
    }
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchItems();
    setIsDeleteModalOpen(false);
  };

  const handleEditSuccess = () => {
    fetchItems();
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleCreateSuccess = () => {
    fetchItems();
    setIsCreateModalOpen(false);
  };

  const renderStatsSummary = (stats) => {
    if (!stats || typeof stats !== "object") return "{}";
    const keys = Object.keys(stats);
    if (keys.length === 0) return "{}";
    return keys
      .map((key) => `${key}: ${stats[key]}`)
      .join(" | ");
  };

  return (
    <div className="consumable-management-container">
      <div className="max-w-7xl mx-auto">
        <div className="consumable-management-header">
          <h1>
            <Package size={28} />
            Item Management
          </h1>
          <p>Quản lý item theo schema game: itemId, itemName, itemType, prefabName, stats</p>
        </div>

        <div className="consumable-toolbar">
          <div className="consumable-toolbar-content">
            <div className="consumable-toolbar-row">
              <div className="search-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả loại</option>
                    <option value="CONSUMABLE">CONSUMABLE</option>
                    <option value="EQUIPMENT">EQUIPMENT</option>
                  </select>
                </div>

                <button onClick={handleCreate} className="btn-create">
                  <Plus size={18} />
                  <span>Thêm Item</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="consumable-error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="consumable-loading-state">
            <Loader2 className="consumable-spinner" size={40} />
          </div>
        ) : (
          <>
            <div className="consumable-table-wrapper">
              <div className="overflow-x-auto">
                <table className="consumable-table">
                  <thead>
                    <tr>
                      <th>Item ID</th>
                      <th>Tên Item</th>
                      <th className="center">Loại</th>
                      <th>Prefab</th>
                      <th>Stats</th>
                      <th className="center">Trạng thái</th>
                      <th className="center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="consumable-empty-state">
                          <p>Không tìm thấy item nào</p>
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item._id}>
                          <td>
                            <div className="consumable-id">{item.itemId}</div>
                          </td>
                          <td>
                            <div className="consumable-title">{item.itemName}</div>
                          </td>
                          <td className="center">
                            <span
                              className={`consumable-badge ${String(
                                item.itemType || ""
                              ).toLowerCase()}`}
                            >
                              {item.itemType}
                            </span>
                          </td>
                          <td>{item.prefabName}</td>
                          <td>
                            <span className="consumable-description">
                              {renderStatsSummary(item.stats)}
                            </span>
                          </td>
                          <td className="center">
                            <button
                              onClick={() => handleToggleStatus(item)}
                              className={`consumable-status-toggle ${
                                item.isActive ? "active" : "inactive"
                              }`}
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td>
                            <div className="consumable-action-buttons">
                              <button
                                onClick={() => handleEdit(item)}
                                className="consumable-action-btn edit"
                                title="Chỉnh sửa"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="consumable-action-btn delete"
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

      {isDeleteModalOpen && (
        <DeleteConfirmModal
          title="Xác nhận xóa item"
          message={`Bạn có chắc chắn muốn xóa item "${selectedItem?.itemName}" (${selectedItem?.itemId})?`}
          onConfirm={async () => {
            try {
              await consumableService.deleteConsumable(selectedItem._id);
              handleDeleteSuccess();
            } catch (err) {
              alert(err.response?.data?.message || "Lỗi khi xóa item");
            }
          }}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}

      {isEditModalOpen && selectedItem && (
        <EditConsumableModal
          consumable={selectedItem}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedItem(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

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
