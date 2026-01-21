import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../../../app/context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import PostDetailModal from '../components/PostDetailModal';
import './PostsPage.css';

const PostsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [showSharedPost, setShowSharedPost] = useState(false);
  const [sharedPostId, setSharedPostId] = useState(null);
  
  // Check for postId in URL params
  useEffect(() => {
    const postId = searchParams.get('postId');
    if (postId) {
      setSharedPostId(postId);
      setShowSharedPost(true);
    }
  }, [searchParams]);

  const handleCloseSharedPost = () => {
    setShowSharedPost(false);
    setSharedPostId(null);
    // Remove postId from URL
    searchParams.delete('postId');
    setSearchParams(searchParams);
  };

  const { data, isLoading, isError, error } = usePosts({ 
    page, 
    limit: 10,
    category: selectedCategory 
  });

  const posts = data?.data?.posts || [];
  const hasMore = data?.data?.pagination?.hasMore || false;
  
  const categories = ['General', 'Discussion', 'Trading', 'Team Up', 'Bug Report'];

  if (isLoading && page === 1) {
    return (
      <div className="posts-page-wrapper">
        <Container className="posts-page py-4">
          <div className="loading-container">
            <div className="blood-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <p className="loading-text">{t('common.loading')}</p>
          </div>
        </Container>
      </div>
    );
  }

  if (isError) {
    return (
      <Container className="posts-page py-4">
        <Alert variant="danger">
          <Alert.Heading>{t('common.error')}</Alert.Heading>
          <p>{error?.message || 'Failed to load posts'}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            {t('common.retry')}
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="posts-page-wrapper">
      <Container className="posts-page py-4">
        <Row>
          <Col lg={8} className="mx-auto">
            {/* Category Tabs */}
            <div className="category-tabs mb-4">
              <div className="d-flex gap-2 flex-wrap justify-content-between">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'primary' : 'outline-secondary'}
                    className="category-tab-btn flex-fill"
                    onClick={() => {
                      setSelectedCategory(category);
                      setPage(1);
                    }}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Posts List */}
            {posts.length === 0 ? (
              <div className="no-posts text-center py-5">
                <p className="no-posts-text mb-4">No posts yet. Be the first to create one!</p>
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-4">
                    <Button
                      variant="outline-primary"
                      className="load-more-btn"
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="mini-blood-spinner">
                            <div className="mini-ring"></div>
                          </div>
                          <span className="ms-2">Loading...</span>
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>

      {/* Floating Action Button */}
      {user && (
        <button 
          className="floating-create-btn"
          onClick={() => setShowCreateModal(true)}
          aria-label="Create Post"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal 
          show={showCreateModal} 
          onHide={() => setShowCreateModal(false)} 
        />
      )}

      {/* Shared Post Detail Modal */}
      {showSharedPost && sharedPostId && (
        <PostDetailModal
          show={showSharedPost}
          onHide={handleCloseSharedPost}
          postId={sharedPostId}
          scrollToComments={false}
        />
      )}
    </div>
  );
};

export default PostsPage;
