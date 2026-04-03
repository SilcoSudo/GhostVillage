import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Edit2,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  Skull,
} from "lucide-react";
import monsterService from "../shared/services/monsterService";
import EditMonsterModal from "./components/EditMonsterModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import "./assets/styles/MonsterManagement.css";

/**
 * Monster Management Page
 * Trang quản lý quái vật với các chức năng CRUD
 */
const MonsterManagementPage = () => {
  const { t } = useTranslation();
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal states
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  /**
   * Fetch monsters từ API
   */
  const fetchMonsters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await monsterService.getAllMonsters({
        page: currentPage,
        limit: 20,
        isActive: filterStatus,
      });

      if (response.success) {
        setMonsters(response.data || []);
        setPagination(response.pagination || {});
      }
    } catch (err) {
      console.error("Error fetching monsters:", err);
      setError(err.response?.data?.message || "Lỗi khi tải danh sách quái vật");
    } finally {
      setLoading(false);
    }
  };

  // Fetch monsters khi component mount hoặc filter thay đổi
  useEffect(() => {
    fetchMonsters();
  }, [currentPage, filterStatus]);

  /**
   * Xử lý search
   */
  const filteredMonsters = monsters.filter((monster) => {
    const keyword = searchQuery.toLowerCase();
    const matchSearch =
      monster.monsterName?.toLowerCase().includes(keyword) ||
      monster.monsterId?.toLowerCase().includes(keyword) ||
      monster.prefabName?.toLowerCase().includes(keyword);
    return matchSearch;
  });

  /**
   * Xử lý toggle status
   */
  const handleToggleStatus = async (monster) => {
    try {
      const newStatus = !monster.isActive;
      const response = await monsterService.toggleMonsterStatus(
        monster._id,
        newStatus
      );

      if (response.success) {
        // Cập nhật UI
        setMonsters((prev) =>
          prev.map((m) =>
            m._id === monster._id ? { ...m, isActive: newStatus } : m
          )
        );
      }
    } catch (err) {
      console.error("Error toggling monster status:", err);
      alert(err.response?.data?.message || "Lỗi khi cập nhật trạng thái");
    }
  };

  /**
   * Xử lý mở modal edit
   */
  const handleEdit = (monster) => {
    setSelectedMonster(monster);
    setIsEditModalOpen(true);
  };

  /**
   * Xử lý mở modal delete
   */
  const handleDelete = (monster) => {
    setSelectedMonster(monster);
    setIsDeleteModalOpen(true);
  };

  /**
   * Xử lý sau khi update thành công
   */
  const handleUpdateSuccess = () => {
    fetchMonsters();
    setIsEditModalOpen(false);
  };

  /**
   * Xử lý sau khi delete thành công
   */
  const handleDeleteSuccess = () => {
    fetchMonsters();
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="monster-management-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="monster-management-header">
          <h1>
            <Skull size={28} />
            Quản lý Quái Vật
          </h1>
          <p>Quản lý thông tin monster theo schema backend mới</p>
        </div>

        {/* Toolbar */}
        <div className="monster-toolbar">
          <div className="toolbar-content">
            <div className="toolbar-row toolbar-row-top">
              {/* Search */}
              <div className="search-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm quái vật..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="toolbar-row toolbar-row-bottom">
              {/* Filter and Create Button */}
              <div className="filter-actions-group">
                <div className="filter-group">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả</option>
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Vô hiệu hóa</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" size={40} />
          </div>
        ) : (
          <>
            {/* Monster Table */}
            <div className="monsters-table-wrapper">
              <div className="overflow-x-auto">
                <table className="monsters-table">
                  <thead>
                    <tr>
                      <th>Monster ID</th>
                      <th>Tên quái</th>
                      <th className="center">Loại</th>
                      <th>Prefab</th>
                      <th className="center">Move Speed</th>
                      <th className="center">Attack CD</th>
                      <th className="center">Trạng thái</th>
                      <th className="center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMonsters.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="empty-state">
                          <p>Không tìm thấy quái vật nào</p>
                        </td>
                      </tr>
                    ) : (
                      filteredMonsters.map((monster) => (
                        <tr key={monster._id}>
                          <td>
                            <code>{monster.monsterId}</code>
                          </td>
                          <td>
                            <div className="monster-name">{monster.monsterName}</div>
                          </td>
                          <td className="center">
                            <span className="stat-atk">{monster.monsterType}</span>
                          </td>
                          <td>
                            <span className="stat-def">{monster.prefabName}</span>
                          </td>
                          <td className="center">
                            <span className="stat-spawn">{monster.movementConfig?.moveSpeed ?? "-"}</span>
                          </td>
                          <td className="center">
                            <span className="stat-spawn">{monster.combatConfig?.attackCooldown ?? "-"}</span>
                          </td>
                          <td className="center">
                            <button
                              onClick={() => handleToggleStatus(monster)}
                              className={`status-toggle-btn ${
                                monster.isActive ? "active" : "inactive"
                              }`}
                            >
                              {monster.isActive ? "Hoạt động" : "Vô hiệu"}
                            </button>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => handleEdit(monster)}
                                className="action-btn edit"
                                title="Chỉnh sửa"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(monster)}
                                className="action-btn delete"
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
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Trước
                </button>
                <span className="pagination-info">
                  Trang {currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(pagination.totalPages, prev + 1)
                    )
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="pagination-btn"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {isEditModalOpen && (
        <EditMonsterModal
          monster={selectedMonster}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteConfirmModal
          title="Xác nhận xóa quái vật"
          message={`Bạn có chắc chắn muốn xóa quái vật "${selectedMonster?.monsterName}"? Quái vật sẽ bị vô hiệu hóa.`}
          onConfirm={async () => {
            try {
              await monsterService.deleteMonster(selectedMonster._id);
              handleDeleteSuccess();
            } catch (err) {
              alert(err.response?.data?.message || "Lỗi khi xóa quái vật");
            }
          }}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
};

export default MonsterManagementPage;
