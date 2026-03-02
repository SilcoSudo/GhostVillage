import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Plus, Edit2, Trash2, Pin, PinOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAnnouncementList, useTogglePin, useToggleActive } from '../shared/hooks/useAnnouncements';
import AnnouncementDetailModal from './components/AnnouncementDetailModal';
import AnnouncementCreationModal from './components/AnnouncementCreationModal';
import AnnouncementEditorModal from './components/AnnouncementEditorModal';
import AnnouncementDeleteModal from './components/AnnouncementDeleteModal';
import './assets/styles/Announcement.css';

const AnnouncementPage = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Fetch announcements from API
  const { data, isLoading, isError, error } = useAnnouncementList({
    page: currentPage,
    limit: pageSize,
    includeInactive: true,
  });

  // Toggle mutations
  const togglePinMutation = useTogglePin();
  const toggleActiveMutation = useToggleActive();

  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPinned, setFilterPinned] = useState('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Extract announcements from API response
  const announcements = data?.data?.announcements || [];
  const pagination = data?.data?.pagination || {};

  // Filter and sort announcements on client side
  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements.filter(announcement => {
      const matchSearch = 
        announcement.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.author?.fullname?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && announcement.isActive) ||
        (filterStatus === 'inactive' && !announcement.isActive);
      
      const matchPinned = filterPinned === 'all' || 
        (filterPinned === 'pinned' && announcement.isPinned) ||
        (filterPinned === 'unpinned' && !announcement.isPinned);
      
      return matchSearch && matchStatus && matchPinned;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue instanceof Date || typeof aValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [announcements, searchQuery, filterStatus, filterPinned, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const openDetailModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDetailModalOpen(true);
  };

  const openCreationModal = () => {
    setSelectedAnnouncement(null);
    setIsCreationModalOpen(true);
  };

  const openEditorModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsEditorModalOpen(true);
  };

  const openDeleteModal = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteModalOpen(true);
  };

  const handleTogglePin = async (announcement) => {
    await togglePinMutation.mutateAsync(announcement._id);
  };

  const handleToggleActive = async (announcement) => {
    await toggleActiveMutation.mutateAsync(announcement._id);
  };

  const handleCreateAnnouncement = (newAnnouncement) => {
    setIsCreationModalOpen(false);
  };

  const handleUpdateAnnouncement = (updatedData) => {
    setIsEditorModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const handleDeleteAnnouncement = () => {
    setIsDeleteModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const getStatusBadgeClass = (isActive) => {
    return isActive ? 'status-active' : 'status-inactive';
  };

  return (
    <div className="announcement-container">
      <div className="announcement-header">
        <div className="header-title">
          <h1>{t('announcements.title') || 'Announcements'}</h1>
          <p className="subtitle">{t('announcements.subtitle') || 'Manage game announcements'}</p>
        </div>
        <button 
          className="btn-create-announcement"
          onClick={openCreationModal}
          title={t('announcements.create') || 'Create New Announcement'}
        >
          <Plus size={18} />
          {t('announcements.create') || 'Create'}
        </button>
      </div>

      <div className="search-and-filter">
        <input
          type="text"
          placeholder={t('common.search') || 'Search announcements...'}
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <div className="filter-row">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">{t('announcements.allStatus') || 'All Status'}</option>
            <option value="active">{t('announcements.active') || 'Active'}</option>
            <option value="inactive">{t('announcements.inactive') || 'Inactive'}</option>
          </select>

          <select
            className="filter-select"
            value={filterPinned}
            onChange={(e) => setFilterPinned(e.target.value)}
          >
            <option value="all">{t('announcements.allPinned') || 'All'}</option>
            <option value="pinned">{t('announcements.pinned') || 'Pinned'}</option>
            <option value="unpinned">{t('announcements.unpinned') || 'Unpinned'}</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state" style={{ textAlign: 'center', padding: '40px' }}>
          <Loader2 size={48} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
          <p>{t('common.loading') || 'Loading announcements...'}</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="error-state" style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
          <XCircle size={48} />
          <p>{error?.response?.data?.message || t('common.error') || 'Failed to load announcements'}</p>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !isError && (
        <>
          <div className="announcements-table-wrapper">
            <table className="announcements-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('title')} className="sortable">
                    {t('announcements.title') || 'Title'}
                  </th>
                  <th>{t('announcements.author') || 'Author'}</th>
                  <th>{t('announcements.pinned') || 'Pinned'}</th>
                  <th>{t('announcements.status') || 'Status'}</th>
                  <th>{t('announcements.views') || 'Views'}</th>
                  <th onClick={() => handleSort('createdAt')} className="sortable">
                    {t('announcements.created') || 'Created'}
                  </th>
                  <th>{t('common.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedAnnouncements.map(announcement => (
                  <tr key={announcement._id}>
                    <td className="announcement-title-cell">
                      <span className="announcement-title">{announcement.title}</span>
                    </td>
                    <td className="announcement-author-cell">
                      <span>{announcement.author?.fullname || 'Anonymous'}</span>
                    </td>
                    <td className="announcement-pinned-cell">
                      <button
                        className={`pin-toggle-btn ${announcement.isPinned ? 'pinned' : ''}`}
                        onClick={() => handleTogglePin(announcement)}
                        disabled={togglePinMutation.isLoading}
                        title={announcement.isPinned ? 'Unpin' : 'Pin'}
                      >
                        {announcement.isPinned ? <Pin size={16} /> : <PinOff size={16} />}
                      </button>
                    </td>
                    <td className="announcement-status-cell">
                      <button
                        className={`status-toggle-btn ${announcement.isActive ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleActive(announcement)}
                        disabled={toggleActiveMutation.isLoading}
                        title={announcement.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {announcement.isActive ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        <span>{announcement.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="announcement-views-cell">
                      <span className="views-count">{announcement.views?.toLocaleString() || 0}</span>
                    </td>
                    <td className="announcement-date-cell">
                      <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="announcement-actions-cell">
                      <button
                        className="action-btn detail-btn"
                        onClick={() => openDetailModal(announcement)}
                        title={t('common.view') || 'View Details'}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="action-btn edit-btn"
                        onClick={() => openEditorModal(announcement)}
                        title={t('common.edit') || 'Edit'}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => openDeleteModal(announcement)}
                        title={t('common.delete') || 'Delete'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAndSortedAnnouncements.length === 0 && (
              <div className="empty-state">
                <p>{t('common.noData') || 'No announcements found'}</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{ padding: '8px 16px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span style={{ padding: '8px 16px' }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages}
                style={{ padding: '8px 16px', cursor: currentPage === pagination.totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <AnnouncementDetailModal
        isOpen={isDetailModalOpen}
        announcement={selectedAnnouncement}
        onClose={() => setIsDetailModalOpen(false)}
      />

      {/* Creation Modal */}
      <AnnouncementCreationModal
        isOpen={isCreationModalOpen}
        onClose={() => setIsCreationModalOpen(false)}
        onSubmit={handleCreateAnnouncement}
      />

      {/* Editor Modal */}
      <AnnouncementEditorModal
        isOpen={isEditorModalOpen}
        announcement={selectedAnnouncement}
        onClose={() => setIsEditorModalOpen(false)}
        onSubmit={handleUpdateAnnouncement}
      />

      {/* Delete Modal */}
      <AnnouncementDeleteModal
        isOpen={isDeleteModalOpen}
        announcement={selectedAnnouncement}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAnnouncement}
      />
    </div>
  );
};

export default AnnouncementPage;
