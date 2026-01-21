import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, RotateCcw, Trash2 } from 'lucide-react';
import PostDetailModal from '../shared/components/modals/PostDetailModal';
import PostRecoveryModal from '../shared/components/modals/PostRecoveryModal';
import './assets/styles/ReportedPost.css';

const ReportedPostPage = () => {
  const { t } = useTranslation();
  
  // Mock data - Replace with API call later
  const [reportedPosts, setReportedPosts] = useState([
    {
      id: 1,
      postTitle: 'Spam Advertisement Post',
      author: 'John Doe',
      reportedBy: 'Admin User',
      reason: 'Spam and advertisement',
      reportCount: 5,
      content: 'Buy now! Get 50% off on our amazing products! Click here for more info...',
      createdAt: '2024-01-18',
      reportedDate: '2024-01-20',
      status: 'pending'
    },
    {
      id: 2,
      postTitle: 'Inappropriate Content',
      author: 'Jane Smith',
      reportedBy: 'Community Members',
      reason: 'Offensive language and harassment',
      reportCount: 8,
      content: 'This is inappropriate content with offensive language...',
      createdAt: '2024-01-15',
      reportedDate: '2024-01-19',
      status: 'pending'
    },
    {
      id: 3,
      postTitle: 'Copyright Violation',
      author: 'Bot Account',
      reportedBy: 'Copyright Owner',
      reason: 'Copyright infringement',
      reportCount: 3,
      content: 'Copyrighted material posted without permission...',
      createdAt: '2024-01-10',
      reportedDate: '2024-01-18',
      status: 'pending'
    },
    {
      id: 4,
      postTitle: 'Misinformation Campaign',
      author: 'Fake News Account',
      reportedBy: 'Fact Checkers',
      reason: 'False and misleading information',
      reportCount: 12,
      content: 'False claims about current events...',
      createdAt: '2024-01-05',
      reportedDate: '2024-01-17',
      status: 'pending'
    },
    {
      id: 5,
      postTitle: 'Suspicious Link',
      author: 'Unknown User',
      reportedBy: 'Security Team',
      reason: 'Phishing attempt',
      reportCount: 2,
      content: 'Click here to verify your account: malicious-link.com',
      createdAt: '2024-01-12',
      reportedDate: '2024-01-16',
      status: 'pending'
    }
  ]);

  const [sortConfig, setSortConfig] = useState({ key: 'reportedDate', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  // Filter posts based on search
  const filteredPosts = reportedPosts.filter(post =>
    post.postTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
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

  const openDetailModal = (post) => {
    setSelectedPost(post);
    setIsDetailModalOpen(true);
  };

  const openRecoveryModal = (post) => {
    setSelectedPost(post);
    setIsRecoveryModalOpen(true);
  };

  const handleRestorePost = () => {
    if (selectedPost) {
      setReportedPosts(prev => prev.filter(p => p.id !== selectedPost.id));
      setIsRecoveryModalOpen(false);
      setSelectedPost(null);
    }
  };

  const handleDeletePost = (postId) => {
    setReportedPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="reported-posts-container">
      <div className="reported-posts-header">
        <h1>{t('posts.reported') || 'Reported Posts'}</h1>
        <p className="subtitle">{t('posts.reportedSubtitle') || 'Manage and review reported user posts'}</p>
      </div>

      <div className="search-and-filter">
        <input
          type="text"
          placeholder={t('common.search') || 'Search by title, author, or reason...'}
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="reported-posts-table-wrapper">
        <table className="reported-posts-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('postTitle')} className="sortable">
                {t('posts.postTitle') || 'Post Title'}
              </th>
              <th onClick={() => handleSort('author')} className="sortable">
                {t('posts.author') || 'Author'}
              </th>
              <th onClick={() => handleSort('reason')} className="sortable">
                {t('posts.reason') || 'Report Reason'}
              </th>
              <th>{t('posts.reportCount') || 'Reports'}</th>
              <th onClick={() => handleSort('reportedDate')} className="sortable">
                {t('posts.reportedDate') || 'Reported Date'}
              </th>
              <th>{t('common.actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {sortedPosts.map(post => (
              <tr key={post.id}>
                <td className="post-title-cell">
                  <span className="post-title">{post.postTitle}</span>
                </td>
                <td className="post-author-cell">
                  <span>{post.author}</span>
                </td>
                <td className="post-reason-cell">
                  <span className="reason-badge">{post.reason}</span>
                </td>
                <td className="post-report-count-cell">
                  <span className="report-count-badge">{post.reportCount}</span>
                </td>
                <td className="post-date-cell">
                  <span>{new Date(post.reportedDate).toLocaleDateString()}</span>
                </td>
                <td className="post-actions-cell">
                  <button
                    className="action-btn detail-btn"
                    onClick={() => openDetailModal(post)}
                    title={t('common.view') || 'View Details'}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="action-btn restore-btn"
                    onClick={() => openRecoveryModal(post)}
                    title={t('posts.restore') || 'Restore Post'}
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeletePost(post.id)}
                    title={t('common.delete') || 'Delete Post'}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedPosts.length === 0 && (
          <div className="empty-state">
            <p>{t('common.noData') || 'No reported posts found'}</p>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      <PostDetailModal
        isOpen={isDetailModalOpen}
        post={selectedPost}
        onClose={() => setIsDetailModalOpen(false)}
      />

      {/* Post Recovery Modal */}
      <PostRecoveryModal
        isOpen={isRecoveryModalOpen}
        post={selectedPost}
        onClose={() => setIsRecoveryModalOpen(false)}
        onConfirm={handleRestorePost}
      />
    </div>
  );
};

export default ReportedPostPage;
