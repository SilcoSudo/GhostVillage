import React, { useState, useEffect } from "react";
import { 
  Search, Filter, Plus, Edit2, Trash2, Star, 
  BookOpen, Loader2, AlertCircle 
} from "lucide-react";
import wikiService from "../shared/services/wikiService";
import CreateWikiModal from "./components/CreateWikiModal";
import EditWikiModal from "./components/EditWikiModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import "../pages/assets/styles/WikiManagement.css";

/**
 * Wiki Management Page
 * Trang quản lý Wiki với table, filters, và CRUD operations
 */
const WikiManagementPage = () => {
  // State
  const [wikis, setWikis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWiki, setSelectedWiki] = useState(null);

  /**
   * Fetch wikis with filters
   */
  const fetchWikis = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
      };

      if (filterCategory !== "all") params.category = filterCategory;
      if (filterStatus !== "all") params.status = filterStatus;

      const response = await wikiService.getAllWikis(params);

      if (response.success) {
        setWikis(response.data.wikis || []);
        setPagination(response.data.pagination || pagination);
      }
    } catch (err) {
      console.error("Error fetching wikis:", err);
      setError(err.response?.data?.message || "Lỗi khi tải danh sách wiki");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load data on mount and filter change
   */
  useEffect(() => {
    fetchWikis();
  }, [pagination.currentPage, filterCategory, filterStatus]);

  /**
   * Filter wikis by search query (client-side)
   */
  const filteredWikis = wikis.filter((wiki) =>
    wiki.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Handle toggle featured status
   */
  const handleToggleFeatured = async (wiki) => {
    try {
      const newFeatured = !wiki.isFeatured;
      const response = await wikiService.toggleWikiFeatured(wiki._id, newFeatured);

      if (response.success) {
        fetchWikis();
      }
    } catch (err) {
      console.error("Error toggling featured:", err);
      setError("Lỗi khi thay đổi trạng thái featured");
    }
  };

  /**
   * Handle edit wiki
   */
  const handleEdit = (wiki) => {
    setSelectedWiki(wiki);
    setShowEditModal(true);
  };

  /**
   * Handle delete wiki
   */
  const handleDelete = (wiki) => {
    setSelectedWiki(wiki);
    setShowDeleteModal(true);
  };

  /**
   * Confirm delete wiki
   */
  const confirmDelete = async () => {
    try {
      const response = await wikiService.deleteWiki(selectedWiki._id);

      if (response.success) {
        setShowDeleteModal(false);
        setSelectedWiki(null);
        fetchWikis();
      }
    } catch (err) {
      console.error("Error deleting wiki:", err);
      setError("Lỗi khi xóa wiki");
    }
  };

  /**
   * Handle pagination
   */
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  /**
   * Get status badge class
   */
  const getStatusClass = (status) => {
    switch (status) {
      case "published":
        return "status-published";
      case "draft":
        return "status-draft";
      case "archived":
        return "status-archived";
      default:
        return "";
    }
  };

  /**
   * Get status label
   */
  const getStatusLabel = (status) => {
    switch (status) {
      case "published":
        return "Published";
      case "draft":
        return "Draft";
      case "archived":
        return "Archived";
      default:
        return status;
    }
  };

  return (
    <div className="wiki-management-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="wiki-management-header">
          <h1>
            <BookOpen size={28} />
            Quản lý Wiki
          </h1>
          <p>Quản lý wiki articles, guides, và database entries</p>
        </div>

        {/* Toolbar */}
        <div className="wiki-toolbar">
          <div className="toolbar-left">
            {/* Search */}
            <div className="search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm wiki..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <Filter size={20} className="filter-icon" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả danh mục</option>
                <option value="Monster Database">Monster Database</option>
                <option value="Map Guide">Map Guide</option>
                <option value="Item Database">Item Database</option>
                <option value="Game Guide">Game Guide</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Lore">Lore</option>
                <option value="FAQ">FAQ</option>
                <option value="Patch Notes">Patch Notes</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-create"
          >
            <Plus size={20} />
            <span>Tạo Wiki mới</span>
          </button>
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
            {/* Wiki Table */}
            <div className="wiki-table-wrapper">
              <table className="wiki-table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Danh mục</th>
                    <th>Tác giả</th>
                    <th>Trạng thái</th>
                    <th>Featured</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWikis.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-state">
                        Không tìm thấy wiki nào
                      </td>
                    </tr>
                  ) : (
                    filteredWikis.map((wiki) => (
                      <tr key={wiki._id}>
                        {/* Title */}
                        <td className="wiki-title">
                          <div className="title-wrapper">
                            <span className="title-text">{wiki.title}</span>
                            <span className="slug-text">{wiki.slug}</span>
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span className="category-badge">
                            {wiki.category}
                          </span>
                        </td>

                        {/* Author */}
                        <td className="author-cell">
                          {wiki.author?.fullname || "Unknown"}
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`status-badge ${getStatusClass(wiki.status)}`}>
                            {getStatusLabel(wiki.status)}
                          </span>
                        </td>

                        {/* Featured */}
                        <td>
                          <button
                            onClick={() => handleToggleFeatured(wiki)}
                            className={`featured-btn ${wiki.isFeatured ? "active" : ""}`}
                            title={wiki.isFeatured ? "Remove from featured" : "Add to featured"}
                          >
                            <Star size={18} fill={wiki.isFeatured ? "currentColor" : "none"} />
                          </button>
                        </td>

                        {/* Created Date */}
                        <td className="date-cell">
                          {formatDate(wiki.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="actions-cell">
                          <button
                            onClick={() => handleEdit(wiki)}
                            className="action-btn btn-edit"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(wiki)}
                            className="action-btn btn-delete"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="pagination-btn"
                >
                  Trước
                </button>

                <span className="pagination-info">
                  Trang {pagination.currentPage} / {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
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
      {showCreateModal && (
        <CreateWikiModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchWikis();
          }}
        />
      )}

      {showEditModal && selectedWiki && (
        <EditWikiModal
          wiki={selectedWiki}
          onClose={() => {
            setShowEditModal(false);
            setSelectedWiki(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedWiki(null);
            fetchWikis();
          }}
        />
      )}

      {showDeleteModal && selectedWiki && (
        <DeleteConfirmModal
          title="Xóa Wiki"
          message={`Bạn có chắc chắn muốn xóa wiki "${selectedWiki.title}"? Hành động này không thể hoàn tác.`}
          onConfirm={confirmDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedWiki(null);
          }}
        />
      )}
    </div>
  );
};

export default WikiManagementPage;
