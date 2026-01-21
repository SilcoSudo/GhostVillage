import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, RotateCcw } from 'lucide-react';
import './assets/styles/CommentDetailModal.css';

const CommentRecoveryModal = ({ isOpen, comment, onClose, onConfirm }) => {
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

  if (!isOpen || !comment) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content comment-recovery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <RotateCcw size={20} className="header-icon" />
            <h2>{t('comments.restoreComment') || 'Restore Comment'}</h2>
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
                {t('comments.restoreWarning') || 'Are you sure you want to restore this comment?'}
              </p>
              <p className="alert-description">
                {t('comments.restoreWarningDesc') || 'The comment will be made visible to users again. This action can be undone.'}
              </p>
            </div>
          </div>

          {/* Comment Info */}
          <div className="recovery-comment-info">
            <div className="info-item">
              <span className="info-label">{t('comments.commentText') || 'Comment'}</span>
              <span className="info-value comment-preview">{comment.commentText}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('comments.author') || 'Author'}</span>
              <span className="info-value">{comment.author}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('comments.postTitle') || 'Post'}</span>
              <span className="info-value">{comment.postTitle}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('comments.reason') || 'Report Reason'}</span>
              <span className="info-value">{comment.reason}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('comments.reportCount') || 'Total Reports'}</span>
              <span className="info-value report-count">{comment.reportCount}</span>
            </div>
          </div>

          {/* Recovery Notes */}
          <div className="recovery-notes">
            <label className="notes-label">
              {t('comments.recoveryNotes') || 'Recovery Notes (Optional)'}
            </label>
            <textarea
              className="notes-textarea"
              placeholder={t('comments.recoveryNotesPlaceholder') || 'Enter notes about why this comment is being restored...'}
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
            {t('comments.confirmRestore') || 'Restore Comment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentRecoveryModal;
