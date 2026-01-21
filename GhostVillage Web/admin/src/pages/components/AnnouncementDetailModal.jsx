import React from 'react';
import { X, Eye, Calendar, User, Zap } from 'lucide-react';
import '../assets/styles/AnnouncementModal.css';

const AnnouncementDetailModal = ({ isOpen, announcement, onClose }) => {
  if (!isOpen || !announcement) return null;

  const getPriorityStyle = (priority) => {
    const styles = {
      high: { background: '#FF6348', label: 'HIGH' },
      medium: { background: '#FFC107', label: 'MEDIUM' },
      low: { background: '#4CAF50', label: 'LOW' }
    };
    return styles[priority] || styles.low;
  };

  const getStatusStyle = (status) => {
    const styles = {
      active: { background: '#4CAF50', color: '#A5D6A7', label: 'ACTIVE' },
      inactive: { background: '#9E9E9E', color: '#C8C8C8', label: 'INACTIVE' }
    };
    return styles[status] || styles.inactive;
  };

  const priorityStyle = getPriorityStyle(announcement.priority);
  const statusStyle = getStatusStyle(announcement.status);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content announcement-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <Zap size={20} className="header-icon" />
            <h2>Announcement Details</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {/* Title Section */}
          <div className="detail-section">
            <h3 className="detail-title">{announcement.title}</h3>
            <div className="detail-meta">
              <span className="meta-badge" style={{ background: priorityStyle.background }}>
                {priorityStyle.label}
              </span>
              <span className="meta-badge" style={{ background: statusStyle.background, color: statusStyle.color }}>
                {statusStyle.label}
              </span>
              <span className="view-count">
                <Eye size={14} />
                {announcement.views.toLocaleString()} views
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="detail-section">
            <label className="section-label">Content</label>
            <div className="announcement-content">
              {announcement.content}
            </div>
          </div>

          {/* Info Grid */}
          <div className="info-grid">
            {/* Author */}
            <div className="info-item">
              <div className="info-label">
                <User size={16} />
                Author
              </div>
              <div className="info-value">{announcement.author}</div>
            </div>

            {/* Created Date */}
            <div className="info-item">
              <div className="info-label">
                <Calendar size={16} />
                Created
              </div>
              <div className="info-value">{formatDate(announcement.createdAt)}</div>
            </div>

            {/* Expires Date */}
            <div className="info-item">
              <div className="info-label">
                <Calendar size={16} />
                Expires
              </div>
              <div className="info-value">{formatDate(announcement.expiresAt)}</div>
            </div>

            {/* Updated Date */}
            <div className="info-item">
              <div className="info-label">
                <Calendar size={16} />
                Last Updated
              </div>
              <div className="info-value">{formatDate(announcement.updatedAt)}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-section">
            <div className="stat-item">
              <span className="stat-label">Total Views</span>
              <span className="stat-value">{announcement.views.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Status</span>
              <span className="stat-value" style={{ color: statusStyle.color, background: statusStyle.background }}>
                {statusStyle.label}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Priority</span>
              <span className="stat-value" style={{ color: '#FFF', background: priorityStyle.background }}>
                {priorityStyle.label}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetailModal;
