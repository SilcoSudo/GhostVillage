import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import '../assets/styles/AnnouncementModal.css';

const AnnouncementDeleteModal = ({ isOpen, announcement, onClose, onConfirm }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    onConfirm();
    setIsLoading(false);
    onClose();
  };

  if (!isOpen || !announcement) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content announcement-delete-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header delete-header">
          <div className="header-content">
            <AlertTriangle size={20} className="header-icon alert-icon" />
            <h2>Delete Announcement</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body delete-body">
          <div className="delete-warning">
            <AlertTriangle size={48} className="warning-icon" />
            <p className="warning-text">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </p>
          </div>

          {/* Announcement Info */}
          <div className="announcement-info">
            <div className="info-row">
              <span className="info-label">Title:</span>
              <span className="info-value">{announcement.title}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Author:</span>
              <span className="info-value">{announcement.author}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="info-value status-badge" style={{
                background: announcement.status === 'active' ? '#4CAF50' : '#9E9E9E',
                color: announcement.status === 'active' ? '#A5D6A7' : '#C8C8C8',
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                {announcement.status.toUpperCase()}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Created:</span>
              <span className="info-value">{new Date(announcement.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="delete-info">
            <Trash2 size={16} />
            <p>The announcement "{announcement.title}" will be permanently deleted.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer delete-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn-danger"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Announcement'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDeleteModal;
