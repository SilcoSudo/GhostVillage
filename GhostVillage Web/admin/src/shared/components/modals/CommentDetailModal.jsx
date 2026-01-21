import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, MessageCircle } from 'lucide-react';
import './assets/styles/CommentDetailModal.css';

const CommentDetailModal = ({ isOpen, comment, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen || !comment) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content comment-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <MessageCircle size={20} className="header-icon" />
            <h2>{t('comments.commentDetail') || 'Comment Details'}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Comment Text */}
          <div className="detail-section">
            <h3 className="detail-label">{t('comments.commentText') || 'Comment'}</h3>
            <div className="comment-content-box">
              {comment.content}
            </div>
          </div>

          {/* Author & Post Info */}
          <div className="detail-row">
            <div className="detail-section">
              <h3 className="detail-label">{t('comments.author') || 'Author'}</h3>
              <p className="detail-value">{comment.author}</p>
            </div>
            <div className="detail-section">
              <h3 className="detail-label">{t('comments.postTitle') || 'Post'}</h3>
              <p className="detail-value post-name">{comment.postTitle}</p>
            </div>
          </div>

          {/* Report Info */}
          <div className="detail-row">
            <div className="detail-section">
              <h3 className="detail-label">{t('comments.reportedBy') || 'Reported By'}</h3>
              <p className="detail-value">{comment.reportedBy}</p>
            </div>
            <div className="detail-section">
              <h3 className="detail-label">{t('comments.reason') || 'Reason'}</h3>
              <p className="detail-value reason-text">{comment.reason}</p>
            </div>
          </div>

          {/* Report Count & Date */}
          <div className="detail-row">
            <div className="detail-section">
              <h3 className="detail-label">{t('comments.reportCount') || 'Total Reports'}</h3>
              <div className="report-count-display">{comment.reportCount}</div>
            </div>
            <div className="detail-section">
              <h3 className="detail-label">{t('comments.reportedDate') || 'Reported Date'}</h3>
              <p className="detail-value">
                {new Date(comment.reportedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Comment Metadata */}
          <div className="detail-row">
            <div className="detail-section">
              <h3 className="detail-label">{t('comments.createdDate') || 'Created Date'}</h3>
              <p className="detail-value">
                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="detail-section">
              <h3 className="detail-label">{t('comments.status') || 'Status'}</h3>
              <span className="status-badge pending">
                {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn btn-cancel" onClick={onClose}>
            {t('common.close') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentDetailModal;
