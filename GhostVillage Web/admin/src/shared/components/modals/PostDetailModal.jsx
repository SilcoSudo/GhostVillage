import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import './assets/styles/PostDetailModal.css';

const PostDetailModal = ({ isOpen, post, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen || !post) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content post-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('posts.postDetail') || 'Post Details'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Post Title */}
          <div className="detail-section">
            <h3 className="detail-label">{t('posts.postTitle') || 'Post Title'}</h3>
            <p className="detail-value">{post.postTitle}</p>
          </div>

          {/* Author */}
          <div className="detail-section">
            <h3 className="detail-label">{t('posts.author') || 'Author'}</h3>
            <p className="detail-value">{post.author}</p>
          </div>

          {/* Report Info */}
          <div className="detail-row">
            <div className="detail-section">
              <h3 className="detail-label">{t('posts.reportedBy') || 'Reported By'}</h3>
              <p className="detail-value">{post.reportedBy}</p>
            </div>
            <div className="detail-section">
              <h3 className="detail-label">{t('posts.reason') || 'Reason'}</h3>
              <p className="detail-value reason-text">{post.reason}</p>
            </div>
          </div>

          {/* Report Count & Date */}
          <div className="detail-row">
            <div className="detail-section">
              <h3 className="detail-label">{t('posts.reportCount') || 'Total Reports'}</h3>
              <div className="report-count-display">{post.reportCount}</div>
            </div>
            <div className="detail-section">
              <h3 className="detail-label">{t('posts.reportedDate') || 'Reported Date'}</h3>
              <p className="detail-value">
                {new Date(post.reportedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Post Content */}
          <div className="detail-section">
            <h3 className="detail-label">{t('posts.content') || 'Post Content'}</h3>
            <div className="post-content-box">
              {post.content}
            </div>
          </div>

          {/* Post Metadata */}
          <div className="detail-row">
            <div className="detail-section">
              <h3 className="detail-label">{t('posts.createdDate') || 'Created Date'}</h3>
              <p className="detail-value">
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="detail-section">
              <h3 className="detail-label">{t('posts.status') || 'Status'}</h3>
              <span className="status-badge pending">
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
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

export default PostDetailModal;
