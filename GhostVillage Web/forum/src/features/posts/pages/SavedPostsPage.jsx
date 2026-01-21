import { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Bookmark } from 'lucide-react';
import PostCard from '../components/PostCard';
import api from '../../../shared/services/axios';
import './SavedPostsPage.css';

const SavedPostsPage = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/web/user/saved-posts');
      
      if (response.data.success) {
        setPosts(response.data.data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch saved posts:', err);
      setError(err.response?.data?.message || 'Failed to load saved posts');
    } finally {
      setLoading(false);
    }
  };

  // Callback when post is unbookmarked
  const handlePostUpdate = (updatedPost) => {
    // Remove post from list if it was unbookmarked
    setPosts(prevPosts => prevPosts.filter(post => post._id !== updatedPost._id));
  };

  return (
    <div className="posts-page-wrapper">
      <Container className="posts-page py-4">
        <Row>
          <Col lg={8} className="mx-auto">
            {/* Loading State */}
          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Loading saved posts...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
          )}

          {/* Empty State */}
          {!loading && !error && posts.length === 0 && (
            <div className="no-posts text-center py-5">
              <Bookmark size={64} className="mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-muted mb-4">No saved posts yet. Start bookmarking posts you like!</p>
            </div>
          )}

          {/* Posts List */}
          {!loading && !error && posts.length > 0 && (
            <>
              {posts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post}
                  onPostUpdate={handlePostUpdate}
                  isSavedPostsPage={true}
                />
              ))}
            </>
          )}
        </Col>
      </Row>
    </Container>
    </div>
  );
};

export default SavedPostsPage;
