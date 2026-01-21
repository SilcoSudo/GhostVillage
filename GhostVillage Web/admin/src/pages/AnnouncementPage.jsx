import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Plus, Edit2, Trash2 } from 'lucide-react';
import AnnouncementDetailModal from './components/AnnouncementDetailModal';
import AnnouncementCreationModal from './components/AnnouncementCreationModal';
import AnnouncementEditorModal from './components/AnnouncementEditorModal';
import AnnouncementDeleteModal from './components/AnnouncementDeleteModal';
import './assets/styles/Announcement.css';

const AnnouncementPage = () => {
  const { t } = useTranslation();
  
  // Mock data - Replace with API call later
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: 'Server Maintenance Scheduled',
      content: 'The game servers will be undergoing maintenance on January 25, 2024 from 02:00 AM to 06:00 AM UTC. During this time, players will not be able to access the game. We apologize for any inconvenience.',
      author: 'Admin',
      priority: 'high',
      status: 'active',
      createdAt: '2024-01-20',
      updatedAt: '2024-01-20',
      expiresAt: '2024-02-20',
      views: 1250
    },
    {
      id: 2,
      title: 'New Feature: Trading System',
      content: 'We are excited to announce the launch of our new trading system! Players can now trade items with each other. Visit the marketplace to start trading. Trading commission is 5% of the transaction value.',
      author: 'Admin',
      priority: 'medium',
      status: 'active',
      createdAt: '2024-01-18',
      updatedAt: '2024-01-18',
      expiresAt: '2024-03-18',
      views: 3420
    },
    {
      id: 3,
      title: 'Bug Fix: Inventory Issues',
      content: 'We have fixed several bugs related to the inventory system. Players experiencing inventory sync issues should now be able to access their items properly. Please clear your game cache if you continue to experience problems.',
      author: 'Support Team',
      priority: 'medium',
      status: 'active',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15',
      expiresAt: '2024-02-15',
      views: 892
    },
    {
      id: 4,
      title: 'Happy New Year Event',
      content: 'Join us for our special New Year event! Collect special event tokens and redeem them for exclusive rewards. Event runs until January 31, 2024. Limited time offer!',
      author: 'Admin',
      priority: 'high',
      status: 'active',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      expiresAt: '2024-01-31',
      views: 5680
    },
    {
      id: 5,
      title: 'Patch Notes v2.5.0',
      content: 'Version 2.5.0 patch notes:\n- Improved graphics performance\n- Added new maps\n- Rebalanced weapons\n- Fixed connection issues\n- Enhanced UI responsiveness',
      author: 'Dev Team',
      priority: 'low',
      status: 'inactive',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-10',
      expiresAt: '2024-01-20',
      views: 2150
    }
  ]);

  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Filter announcements
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchSearch = 
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchStatus = filterStatus === 'all' || announcement.status === filterStatus;
    const matchPriority = filterPriority === 'all' || announcement.priority === filterPriority;
    
    return matchSearch && matchStatus && matchPriority;
  });

  // Sort announcements
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (typeof aValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
  });

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

  const handleCreateAnnouncement = (newAnnouncement) => {
    const announcement = {
      id: Math.max(...announcements.map(a => a.id), 0) + 1,
      ...newAnnouncement,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      views: 0,
      status: 'active'
    };
    setAnnouncements(prev => [announcement, ...prev]);
    setIsCreationModalOpen(false);
  };

  const handleUpdateAnnouncement = (updatedData) => {
    setAnnouncements(prev => prev.map(a => 
      a.id === selectedAnnouncement.id 
        ? { ...a, ...updatedData, updatedAt: new Date().toISOString().split('T')[0] }
        : a
    ));
    setIsEditorModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const handleDeleteAnnouncement = () => {
    setAnnouncements(prev => prev.filter(a => a.id !== selectedAnnouncement.id));
    setIsDeleteModalOpen(false);
    setSelectedAnnouncement(null);
  };

  const getPriorityBadgeClass = (priority) => {
    switch(priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active' ? 'status-active' : 'status-inactive';
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
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">{t('announcements.allPriority') || 'All Priority'}</option>
            <option value="high">{t('announcements.high') || 'High'}</option>
            <option value="medium">{t('announcements.medium') || 'Medium'}</option>
            <option value="low">{t('announcements.low') || 'Low'}</option>
          </select>
        </div>
      </div>

      <div className="announcements-table-wrapper">
        <table className="announcements-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('title')} className="sortable">
                {t('announcements.title') || 'Title'}
              </th>
              <th>{t('announcements.author') || 'Author'}</th>
              <th>{t('announcements.priority') || 'Priority'}</th>
              <th>{t('announcements.status') || 'Status'}</th>
              <th>{t('announcements.views') || 'Views'}</th>
              <th onClick={() => handleSort('createdAt')} className="sortable">
                {t('announcements.created') || 'Created'}
              </th>
              <th onClick={() => handleSort('expiresAt')} className="sortable">
                {t('announcements.expires') || 'Expires'}
              </th>
              <th>{t('common.actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {sortedAnnouncements.map(announcement => (
              <tr key={announcement.id}>
                <td className="announcement-title-cell">
                  <span className="announcement-title">{announcement.title}</span>
                </td>
                <td className="announcement-author-cell">
                  <span>{announcement.author}</span>
                </td>
                <td className="announcement-priority-cell">
                  <span className={`priority-badge ${getPriorityBadgeClass(announcement.priority)}`}>
                    {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                  </span>
                </td>
                <td className="announcement-status-cell">
                  <span className={`status-badge ${getStatusBadgeClass(announcement.status)}`}>
                    {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                  </span>
                </td>
                <td className="announcement-views-cell">
                  <span className="views-count">{announcement.views.toLocaleString()}</span>
                </td>
                <td className="announcement-date-cell">
                  <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                </td>
                <td className="announcement-expires-cell">
                  <span>{new Date(announcement.expiresAt).toLocaleDateString()}</span>
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

        {sortedAnnouncements.length === 0 && (
          <div className="empty-state">
            <p>{t('common.noData') || 'No announcements found'}</p>
          </div>
        )}
      </div>

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
