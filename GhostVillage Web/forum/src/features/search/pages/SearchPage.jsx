import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Search, User, FileText, BookOpen, Megaphone, Calendar, Eye, Filter } from 'lucide-react';
import '../../../shared/assets/styles/SearchPage.css';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    collections: ['posts', 'users', 'wiki', 'announcements'],
    limit: 10
  });

  useEffect(() => {
    if (queryParam) {
      performSearch(queryParam);
    }
  }, [queryParam]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const collectionsParam = activeTab === 'all' 
        ? filters.collections.join(',')
        : activeTab;

      const response = await axios.get(`http://localhost:5000/api/web/search`, {
        params: {
          q: searchQuery,
          collections: collectionsParam,
          limit: filters.limit
        }
      });

      setResults(response.data.data);
    } catch (error) {
      console.error('Search error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to perform search. Please make sure the backend server is running.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (queryParam.trim()) {
      performSearch(queryParam);
    }
  };

  const toggleCollection = (collection) => {
    setFilters(prev => {
      const newCollections = prev.collections.includes(collection)
        ? prev.collections.filter(c => c !== collection)
        : [...prev.collections, collection];
      return { ...prev, collections: newCollections };
    });
  };

  const getResultCount = (type) => {
    if (!results || !results.results) return 0;
    return results.results[type]?.total || 0;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Search Results {queryParam && `for "${queryParam}"`}</h1>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="filter-toggle-btn"
        >
          <Filter size={18} />
          Filters
        </button>

        {showFilters && (
          <div className="filters-panel">
            <h3>Search In:</h3>
            <div className="filter-options">
              <label>
                <input
                  type="checkbox"
                  checked={filters.collections.includes('posts')}
                  onChange={() => toggleCollection('posts')}
                />
                Posts
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.collections.includes('wiki')}
                  onChange={() => toggleCollection('wiki')}
                />
                Wiki
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.collections.includes('announcements')}
                  onChange={() => toggleCollection('announcements')}
                />
                Announcements
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.collections.includes('users')}
                  onChange={() => toggleCollection('users')}
                />
                Users
              </label>
            </div>
          </div>
        )}
      </div>

      {results && (
        <div className="search-tabs">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            All Results ({results.totalResults})
          </button>
          <button
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => handleTabChange('posts')}
          >
            <FileText size={16} />
            Posts ({getResultCount('posts')})
          </button>
          <button
            className={`tab ${activeTab === 'wiki' ? 'active' : ''}`}
            onClick={() => handleTabChange('wiki')}
          >
            <BookOpen size={16} />
            Wiki ({getResultCount('wiki')})
          </button>
          <button
            className={`tab ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => handleTabChange('announcements')}
          >
            <Megaphone size={16} />
            Announcements ({getResultCount('announcements')})
          </button>
          <button
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleTabChange('users')}
          >
            <User size={16} />
            Users ({getResultCount('users')})
          </button>
        </div>
      )}

      <div className="search-results">
        {error && (
          <div className="error-message">
            <Search size={48} />
            <h2>Search Error</h2>
            <p>{error}</p>
            <p className="error-hint">Make sure the backend server is running on port 5000</p>
          </div>
        )}

        {!loading && !error&& <div className="loading">Searching...</div>}

        {!loading && results && (
          <>
            {results.totalResults === 0 && (
              <div className="no-results">
                <Search size={48} />
                <h2>No results found</h2>
                <p>Try different keywords or check your spelling</p>
              </div>
            )}

            {/* Posts Results */}
            {results.results.posts && results.results.posts.items.length > 0 && (
              <div className="results-section">
                <h2 className="section-title">
                  <FileText size={20} />
                  Posts ({results.results.posts.total})
                </h2>
                <div className="results-list">
                  {results.results.posts.items.map(post => (
                    <div key={post._id} className="result-item post-item">
                      <h3>{post.title}</h3>
                      <p className="result-excerpt">
                        {post.body.substring(0, 150)}...
                      </p>
                      <div className="result-meta">
                        <span className="category-badge">{post.category}</span>
                        {post.author && (
                          <span className="author">
                            <User size={14} />
                            {post.author.fullname || post.author.username}
                          </span>
                        )}
                        <span>
                          <Calendar size={14} />
                          {formatDate(post.createdAt)}
                        </span>
                        <span>{post.likesCount} likes</span>
                        <span>{post.commentCount} comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wiki Results */}
            {results.results.wiki && results.results.wiki.items.length > 0 && (
              <div className="results-section">
                <h2 className="section-title">
                  <BookOpen size={20} />
                  Wiki ({results.results.wiki.total})
                </h2>
                <div className="results-list">
                  {results.results.wiki.items.map(wiki => (
                    <Link
                      key={wiki._id}
                      to={`/wiki/${wiki.slug}`}
                      className="result-item wiki-item"
                    >
                      {wiki.coverImage && (
                        <img src={wiki.coverImage} alt={wiki.title} className="result-image" />
                      )}
                      <div className="result-content">
                        <h3>
                          {wiki.title}
                          {wiki.isFeatured && <span className="featured-badge">Featured</span>}
                        </h3>
                        {wiki.excerpt && <p className="result-excerpt">{wiki.excerpt}</p>}
                        <div className="result-meta">
                          <span className="category-badge">{wiki.category}</span>
                          {wiki.entityType && <span className="entity-type">{wiki.entityType}</span>}
                          {wiki.tags && wiki.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                          <span>
                            <Eye size={14} />
                            {wiki.views} views
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Announcements Results */}
            {results.results.announcements && results.results.announcements.items.length > 0 && (
              <div className="results-section">
                <h2 className="section-title">
                  <Megaphone size={20} />
                  Announcements ({results.results.announcements.total})
                </h2>
                <div className="results-list">
                  {results.results.announcements.items.map(announcement => (
                    <Link
                      key={announcement._id}
                      to={`/announcements/${announcement.slug}`}
                      className="result-item announcement-item"
                    >
                      {announcement.coverImage && (
                        <img src={announcement.coverImage} alt={announcement.title} className="result-image" />
                      )}
                      <div className="result-content">
                        <h3>
                          {announcement.isPinned && <span className="pinned-badge">📌</span>}
                          {announcement.title}
                        </h3>
                        {announcement.excerpt && <p className="result-excerpt">{announcement.excerpt}</p>}
                        <div className="result-meta">
                          <span>
                            <Calendar size={14} />
                            {formatDate(announcement.createdAt)}
                          </span>
                          <span>
                            <Eye size={14} />
                            {announcement.views} views
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Users Results */}
            {results.results.users && results.results.users.items.length > 0 && (
              <div className="results-section">
                <h2 className="section-title">
                  <User size={20} />
                  Users ({results.results.users.total})
                </h2>
                <div className="results-list users-grid">
                  {results.results.users.items.map(user => (
                    <Link
                      key={user._id}
                      to={`/profile/${user._id}`}
                      className="result-item user-item"
                    >
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.fullname || user.username}&background=f48024&color=fff`}
                        alt={user.fullname || user.username}
                        className="user-avatar"
                      />
                      <div className="user-info">
                        <h3>{user.fullname || user.username}</h3>
                        {user.username && <p className="username">@{user.username}</p>}
                        {user.bio && <p className="user-bio">{user.bio}</p>}
                        {user.role && <span className="role-badge">{user.role}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
