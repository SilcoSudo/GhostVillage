import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, RotateCcw, Trash2 } from 'lucide-react';
import CommentDetailModal from '../shared/components/modals/CommentDetailModal';
import CommentRecoveryModal from '../shared/components/modals/CommentRecoveryModal';
import './assets/styles/ReportedComment.css';

const ReportedCommentPage = () => {
  const { t } = useTranslation();
  
  // Mock data - Replace with API call later
  const [reportedComments, setReportedComments] = useState([
    {
      id: 1,
      commentText: 'This product is scam! Do not buy!',
      author: 'John Doe',
      postTitle: 'Amazing Product Review',
      reportedBy: 'Admin User',
      reason: 'Spam and harassment',
      reportCount: 5,
      content: 'This product is scam! Do not buy! I lost my money...',
      createdAt: '2024-01-18',
      reportedDate: '2024-01-20',
      status: 'pending'
    },
    {
      id: 2,
      commentText: 'Offensive comment about users',
      author: 'Jane Smith',
      postTitle: 'Community Discussion',
      reportedBy: 'Community Members',
      reason: 'Offensive language',
      reportCount: 8,
      content: 'Offensive comment with inappropriate language and personal attacks...',
      createdAt: '2024-01-15',
      reportedDate: '2024-01-19',
      status: 'pending'
    },
    {
      id: 3,
      commentText: 'Advertisement hidden in comment',
      author: 'Bot Account',
      postTitle: 'Tech Discussion',
      reportedBy: 'Moderator',
      reason: 'Spam advertisement',
      reportCount: 3,
      content: 'Check out my website: www.suspicious-ads.com for amazing deals!!!',
      createdAt: '2024-01-10',
      reportedDate: '2024-01-18',
      status: 'pending'
    },
    {
      id: 4,
      commentText: 'Misinformation in comments',
      author: 'Fake News Account',
      postTitle: 'News Discussion',
      reportedBy: 'Fact Checkers',
      reason: 'Misinformation',
      reportCount: 12,
      content: 'False claim about current events without any sources or evidence...',
      createdAt: '2024-01-05',
      reportedDate: '2024-01-17',
      status: 'pending'
    },
    {
      id: 5,
      commentText: 'Suspicious link in comment',
      author: 'Unknown User',
      postTitle: 'Software Discussion',
      reportedBy: 'Security Team',
      reason: 'Phishing link',
      reportCount: 2,
      content: 'Click here to claim your prize: phishing-link.com',
      createdAt: '2024-01-12',
      reportedDate: '2024-01-16',
      status: 'pending'
    }
  ]);

  const [sortConfig, setSortConfig] = useState({ key: 'reportedDate', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComment, setSelectedComment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  // Filter comments based on search
  const filteredComments = reportedComments.filter(comment =>
    comment.commentText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.postTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort comments
  const sortedComments = [...filteredComments].sort((a, b) => {
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

  const openDetailModal = (comment) => {
    setSelectedComment(comment);
    setIsDetailModalOpen(true);
  };

  const openRecoveryModal = (comment) => {
    setSelectedComment(comment);
    setIsRecoveryModalOpen(true);
  };

  const handleRestoreComment = () => {
    if (selectedComment) {
      setReportedComments(prev => prev.filter(c => c.id !== selectedComment.id));
      setIsRecoveryModalOpen(false);
      setSelectedComment(null);
    }
  };

  const handleDeleteComment = (commentId) => {
    setReportedComments(prev => prev.filter(c => c.id !== commentId));
  };

  return (
    <div className="reported-comments-container">
      <div className="reported-comments-header">
        <h1>{t('comments.reported') || 'Reported Comments'}</h1>
        <p className="subtitle">{t('comments.reportedSubtitle') || 'Manage and review reported user comments'}</p>
      </div>

      <div className="search-and-filter">
        <input
          type="text"
          placeholder={t('common.search') || 'Search by comment, author, post, or reason...'}
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="reported-comments-table-wrapper">
        <table className="reported-comments-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('commentText')} className="sortable">
                {t('comments.commentText') || 'Comment'}
              </th>
              <th onClick={() => handleSort('author')} className="sortable">
                {t('comments.author') || 'Author'}
              </th>
              <th onClick={() => handleSort('postTitle')} className="sortable">
                {t('comments.postTitle') || 'Post'}
              </th>
              <th onClick={() => handleSort('reason')} className="sortable">
                {t('comments.reason') || 'Report Reason'}
              </th>
              <th>{t('comments.reportCount') || 'Reports'}</th>
              <th onClick={() => handleSort('reportedDate')} className="sortable">
                {t('comments.reportedDate') || 'Reported Date'}
              </th>
              <th>{t('common.actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {sortedComments.map(comment => (
              <tr key={comment.id}>
                <td className="comment-text-cell">
                  <span className="comment-text">{comment.commentText}</span>
                </td>
                <td className="comment-author-cell">
                  <span>{comment.author}</span>
                </td>
                <td className="comment-post-cell">
                  <span className="post-link">{comment.postTitle}</span>
                </td>
                <td className="comment-reason-cell">
                  <span className="reason-badge">{comment.reason}</span>
                </td>
                <td className="comment-report-count-cell">
                  <span className="report-count-badge">{comment.reportCount}</span>
                </td>
                <td className="comment-date-cell">
                  <span>{new Date(comment.reportedDate).toLocaleDateString()}</span>
                </td>
                <td className="comment-actions-cell">
                  <button
                    className="action-btn detail-btn"
                    onClick={() => openDetailModal(comment)}
                    title={t('common.view') || 'View Details'}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="action-btn restore-btn"
                    onClick={() => openRecoveryModal(comment)}
                    title={t('comments.restore') || 'Restore Comment'}
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteComment(comment.id)}
                    title={t('common.delete') || 'Delete Comment'}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedComments.length === 0 && (
          <div className="empty-state">
            <p>{t('common.noData') || 'No reported comments found'}</p>
          </div>
        )}
      </div>

      {/* Comment Detail Modal */}
      <CommentDetailModal
        isOpen={isDetailModalOpen}
        comment={selectedComment}
        onClose={() => setIsDetailModalOpen(false)}
      />

      {/* Comment Recovery Modal */}
      <CommentRecoveryModal
        isOpen={isRecoveryModalOpen}
        comment={selectedComment}
        onClose={() => setIsRecoveryModalOpen(false)}
        onConfirm={handleRestoreComment}
      />
    </div>
  );
};

export default ReportedCommentPage;
