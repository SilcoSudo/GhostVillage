import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, RotateCcw } from 'lucide-react';
import './assets/styles/PostDetailModal.css';

const PostRecoveryModal = ({ isOpen, post, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [recoveryReason, setRecoveryReason] = useState('');

  const handleConfirm = () => {
    onConfirm();
    setRecoveryReason('');
  };

  const handleClose = () => {
    setRecoveryReason('');
    onClose();
  };

  if (!isOpen || !post) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content post-recovery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <RotateCcw size={20} className="header-icon" />
            <h2>{t('posts.restorePost') || 'Restore Post'}</h2>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Alert */}
          <div className="recovery-alert">
            <AlertCircle size={20} className="alert-icon" />
            <div className="alert-content">
              <p className="alert-title">
                {t('posts.restoreWarning') || 'Are you sure you want to restore this post?'}
              </p>
              <p className="alert-description">
                {t('posts.restoreWarningDesc') || 'The post will be made visible to users again. This action can be undone.'}
              </p>
            </div>
          </div>

          {/* Post Info */}
          <div className="recovery-post-info">
            <div className="info-item">
              <span className="info-label">{t('posts.postTitle') || 'Post Title'}</span>
              <span className="info-value">{post.postTitle}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('posts.author') || 'Author'}</span>
              <span className="info-value">{post.author}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('posts.reason') || 'Report Reason'}</span>
              <span className="info-value">{post.reason}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('posts.reportCount') || 'Total Reports'}</span>
              <span className="info-value report-count">{post.reportCount}</span>
            </div>
          </div>

          {/* Recovery Notes */}
          <div className="recovery-notes">
            <label className="notes-label">
              {t('posts.recoveryNotes') || 'Recovery Notes (Optional)'}
            </label>
            <textarea
              className="notes-textarea"
              placeholder={t('posts.recoveryNotesPlaceholder') || 'Enter notes about why this post is being restored...'}
              value={recoveryReason}
              onChange={(e) => setRecoveryReason(e.target.value)}
              rows="4"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn btn-cancel" onClick={handleClose}>
            {t('common.cancel') || 'Cancel'}
          </button>
          <button className="modal-btn btn-confirm restore-confirm" onClick={handleConfirm}>
            <RotateCcw size={16} />
            {t('posts.confirmRestore') || 'Restore Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostRecoveryModal;
