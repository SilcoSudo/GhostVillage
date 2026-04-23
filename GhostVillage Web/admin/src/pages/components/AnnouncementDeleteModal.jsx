import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { useDeleteAnnouncement } from '../../shared/hooks/useAnnouncements';
import '../assets/styles/AnnouncementModal.css';

const AnnouncementDeleteModal = ({ isOpen, announcement, onClose, onConfirm }) => {
  const { t, i18n } = useTranslation();
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
            <h2>{t('announcements.deleteAnnouncement')}</h2>
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
              {t('announcements.modal.deleteWarning')}
            </p>
          </div>

          {/* Announcement Info */}
          <div className="announcement-info">
            <div className="info-row">
              <span className="info-label">{t('announcements.title')}:</span>
              <span className="info-value">{announcement.title}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('announcements.author')}:</span>
              <span className="info-value">{announcement.author?.fullname || t('announcements.modal.anonymous')}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('announcements.status')}:</span>
              <span className="info-value status-badge" style={{
                background: announcement.isActive ? '#4CAF50' : '#9E9E9E',
                color: announcement.isActive ? '#A5D6A7' : '#C8C8C8',
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                {announcement.isActive ? t('common.active') : t('common.inactive')}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('announcements.created')}:</span>
              <span className="info-value">{new Date(announcement.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}</span>
            </div>
            <div className="info-row">
              <span className="info-label">{t('announcements.views')}:</span>
              <span className="info-value">{announcement.views?.toLocaleString() || 0}</span>
            </div>
          </div>

          <div className="delete-info">
            <Trash2 size={16} />
            <p>{t('announcements.modal.deleteInfo', { title: announcement.title })}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer delete-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </button>
          <button
            className="btn-danger"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spinner" style={{ marginRight: '8px' }} />
                {t('common.deleting')}
              </>
            ) : (
              t('announcements.deleteAnnouncement')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDeleteModal;
