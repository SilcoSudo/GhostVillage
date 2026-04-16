import React, { useEffect, useMemo, useState } from "react";
import { Edit2, Search, Loader2, AlertCircle, Sparkles } from "lucide-react";
import perkService from "../shared/services/perkService";
import EditPerkModal from "./components/EditPerkModal";
import "./assets/styles/MonsterManagement.css";

const PerkManagementPage = () => {
  const [perks, setPerks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [selectedPerk, setSelectedPerk] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchPerks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await perkService.getAllPerks({
        page: currentPage,
        limit: 20,
        isActive: filterStatus,
        search: searchQuery || undefined,
      });

      if (response.success) {
        setPerks(response.data || []);
        setPagination(response.pagination || {});
      }
    } catch (err) {
      console.error("Error fetching perks:", err);
      setError(err.response?.data?.message || "Lỗi khi tải danh sách perk");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerks();
  }, [currentPage, filterStatus]);

  const filteredPerks = useMemo(() => {
    if (!searchQuery.trim()) return perks;

    const keyword = searchQuery.toLowerCase();
    return perks.filter(
      (perk) =>
        perk.perkId?.toLowerCase().includes(keyword) ||
        perk.perkName?.toLowerCase().includes(keyword) ||
        perk.prefabId?.toLowerCase().includes(keyword),
    );
  }, [perks, searchQuery]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPerks();
  };

  const handleToggleStatus = async (perk) => {
    try {
      const newStatus = !perk.isActive;
      const response = await perkService.togglePerkStatus(perk._id, newStatus);
      if (response.success) {
        setPerks((prev) =>
          prev.map((p) => (p._id === perk._id ? { ...p, isActive: newStatus } : p)),
        );
      }
    } catch (err) {
      console.error("Error toggling perk status:", err);
      alert(err.response?.data?.message || "Lỗi khi cập nhật trạng thái perk");
    }
  };

  const handleEdit = (perk) => {
    setSelectedPerk(perk);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchPerks();
    setIsEditModalOpen(false);
    setSelectedPerk(null);
  };

  return (
    <div className="monster-management-container">
      <div className="max-w-7xl mx-auto">
        <div className="monster-management-header">
          <h1>
            <Sparkles size={28} />
            Perk Management
          </h1>
          <p>Quản lý danh sách perk, chỉnh sửa thông tin và bật/tắt kích hoạt</p>
        </div>

        <div className="monster-toolbar">
          <div className="toolbar-content">
            <div className="toolbar-row toolbar-row-top">
              <div className="search-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Tìm perk theo ID, tên hoặc prefab..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  onBlur={handleSearch}
                  className="search-input"
                />
              </div>
            </div>

            <div className="toolbar-row toolbar-row-bottom">
              <div className="filter-actions-group">
                <div className="filter-group">
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="filter-select"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Vô hiệu hóa</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" size={40} />
          </div>
        ) : (
          <>
            <div className="monsters-table-wrapper">
              <div className="overflow-x-auto">
                <table className="monsters-table">
                  <thead>
                    <tr>
                      <th>Perk ID</th>
                      <th>Tên Perk</th>
                      <th className="center">Rarity</th>
                      <th className="center">Price</th>
                      <th>Prefab ID</th>
                      <th className="center">Trạng thái</th>
                      <th className="center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPerks.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-state">
                          <p>Không tìm thấy perk nào</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPerks.map((perk) => (
                        <tr key={perk._id}>
                          <td>
                            <code>{perk.perkId}</code>
                          </td>
                          <td>
                            <div className="monster-name">{perk.perkName}</div>
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 12,
                                color: "#8f7b61",
                                maxWidth: 320,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {perk.description || "-"}
                            </div>
                          </td>
                          <td className="center">
                            <span className="stat-atk">{perk.rarity}</span>
                          </td>
                          <td className="center">
                            <span className="stat-hp">{(perk.price || 0).toLocaleString()}</span>
                          </td>
                          <td>
                            <span className="stat-def">{perk.prefabId || "-"}</span>
                          </td>
                          <td className="center">
                            <button
                              onClick={() => handleToggleStatus(perk)}
                              className={`status-toggle-btn ${
                                perk.isActive ? "active" : "inactive"
                              }`}
                            >
                              {perk.isActive ? "Hoạt động" : "Vô hiệu"}
                            </button>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => handleEdit(perk)}
                                className="action-btn edit"
                                title="Chỉnh sửa"
                              >
                                <Edit2 size={16} />
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
                    setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
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

      {isEditModalOpen && selectedPerk && (
        <EditPerkModal
          perk={selectedPerk}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPerk(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default PerkManagementPage;
