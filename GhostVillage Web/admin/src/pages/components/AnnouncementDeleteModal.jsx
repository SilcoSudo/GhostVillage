import React from 'react';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { useDeleteAnnouncement } from '../../shared/hooks/useAnnouncements';
import '../assets/styles/AnnouncementModal.css';

const AnnouncementDeleteModal = ({ isOpen, announcement, onClose, onConfirm }) => {
  const deleteMutation = useDeleteAnnouncement();

  const handleConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(announcement._id);
      onConfirm?.(); // Call parent callback if provided
      onClose();
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  if (!isOpen || !announcement) return null;

  const isLoading = deleteMutation.isLoading;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content announcement-delete-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header delete-header">
          <div className="header-content">
            <AlertTriangle size={20} className="header-icon alert-icon" />
            <h2>Delete Announcement</h2>
          </div>
          <button className="close-btn" onClick={onClose} disabled={isLoading}>
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
              <span className="info-value">{announcement.author?.fullname || 'Anonymous'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="info-value status-badge" style={{
                background: announcement.isActive ? '#4CAF50' : '#9E9E9E',
                color: announcement.isActive ? '#A5D6A7' : '#C8C8C8',
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                {announcement.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Created:</span>
              <span className="info-value">{new Date(announcement.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Views:</span>
              <span className="info-value">{announcement.views?.toLocaleString() || 0}</span>
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
            {isLoading ? (
              <>
                <Loader2 size={16} className="spinner" style={{ marginRight: '8px' }} />
                Deleting...
              </>
            ) : (
              'Delete Announcement'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDeleteModal;
