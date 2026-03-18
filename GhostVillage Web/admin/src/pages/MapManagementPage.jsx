import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Edit2,
  Search,
  Loader2,
  AlertCircle,
  Map as MapIcon,
} from "lucide-react";
import mapService from "../shared/services/mapService";
import EditMapModal from "./components/EditMapModal";
import ToggleSwitch from "./components/ToggleSwitch";
import "./assets/styles/MapManagement.css";

/**
 * Map Management Page
 * Trang quản lý bản đồ với toggle status và edit metadata
 */
const MapManagementPage = () => {
  const { t } = useTranslation();
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal states
  const [selectedMap, setSelectedMap] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  /**
   * Fetch maps từ API
   */
  const fetchMaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mapService.getAllMaps({
        isActive: filterStatus,
      });

      if (response.success) {
        setMaps(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching maps:", err);
      setError(err.response?.data?.message || "Lỗi khi tải danh sách bản đồ");
    } finally {
      setLoading(false);
    }
  };

  // Fetch maps khi component mount hoặc filter thay đổi
  useEffect(() => {
    fetchMaps();
  }, [filterStatus]);

  /**
   * Xử lý search
   */
  const filteredMaps = maps.filter((map) => {
    const displayName = map.identityConfig?.displayName || "";
    const mapId = map.identityConfig?.mapId || "";
    const description = map.identityConfig?.shortDescription || "";

    const matchSearch =
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mapId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchSearch;
  });

  /**
   * Xử lý toggle status
   */
  const handleToggleStatus = async (map, newStatus) => {
    try {
      const response = await mapService.toggleMapStatus(map._id, newStatus);

      if (response.success) {
        // Cập nhật UI
        setMaps((prev) =>
          prev.map((m) =>
            m._id === map._id
              ? {
                  ...m,
                  identityConfig: {
                    ...m.identityConfig,
                    isActive: newStatus,
                  },
                }
              : m
          )
        );
      }
    } catch (err) {
      console.error("Error toggling map status:", err);
      alert(err.response?.data?.message || "Lỗi khi cập nhật trạng thái");
    }
  };

  /**
   * Xử lý mở modal edit
   */
  const handleEdit = (map) => {
    setSelectedMap(map);
    setIsEditModalOpen(true);
  };

  /**
   * Xử lý sau khi update thành công
   */
  const handleUpdateSuccess = () => {
    fetchMaps();
    setIsEditModalOpen(false);
  };

  return (
    <div className="map-management-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="map-management-header">
          <h1>
            <MapIcon size={28} />
            Quản lý Bản Đồ
          </h1>
          <p>Quản lý trạng thái và thông tin metadata của các bản đồ trong game</p>
        </div>

        {/* Toolbar */}
        <div className="map-toolbar">
          <div className="toolbar-content">
            {/* Search */}
            <div className="search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm bản đồ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Filter */}
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
            {/* Map Cards Grid */}
            <div className="maps-grid">
              {filteredMaps.length === 0 ? (
                <div className="empty-state">
                  <p>Không tìm thấy bản đồ nào</p>
                </div>
              ) : (
                filteredMaps.map((map) => (
                  <div key={map._id} className="map-card">
                    {/* Map Thumbnail */}
                    <div className="map-thumbnail">
                      {map.identityConfig?.thumbnailUrl ? (
                        <img
                          src={map.identityConfig.thumbnailUrl}
                          alt={map.identityConfig?.displayName}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="map-thumbnail-fallback">
                          <MapIcon size={64} />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <span className={`status-badge ${map.identityConfig?.isActive ? "active" : "inactive"}`}>
                        {map.identityConfig?.isActive ? "Hoạt động" : "Vô hiệu"}
                      </span>
                    </div>

                    {/* Map Info */}
                    <div className="map-info">
                      {/* Map Name */}
                      <h3 className="map-name">
                        {map.identityConfig?.displayName || "Chưa có tên"}
                      </h3>

                      {/* Map ID */}
                      <p className="map-id">
                        {map.identityConfig?.mapId}
                      </p>

                      {/* Required Level */}
                      <div className="required-level">
                        <span className="required-level-label">Cấp độ yêu cầu:</span>
                        <span className="required-level-badge">
                          Level {map.identityConfig?.requiredLevel || 1}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="map-description">
                        {map.identityConfig?.shortDescription || "Chưa có mô tả"}
                      </p>

                      {/* Actions */}
                      <div className="map-actions">
                        {/* Toggle Switch */}
                        <div className="toggle-group">
                          <span className="toggle-label">Trạng thái:</span>
                          <ToggleSwitch
                            checked={map.identityConfig?.isActive || false}
                            onChange={(checked) => handleToggleStatus(map, checked)}
                          />
                        </div>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleEdit(map)}
                          className="btn-edit"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={16} />
                          <span>Sửa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditMapModal
          map={selectedMap}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default MapManagementPage;
