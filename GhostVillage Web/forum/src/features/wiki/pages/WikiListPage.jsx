import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import WikiCard from '../components/WikiCard';
import '../../../shared/assets/styles/WikiPage.css';

const WikiListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [wikis, setWikis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [featuredWikis, setFeaturedWikis] = useState([]);

  const category = searchParams.get('category') || 'all';
  const page = parseInt(searchParams.get('page')) || 1;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'Monster Database', label: 'Quái vật' },
    { value: 'Map Guide', label: 'Bản đồ' },
    { value: 'Item Database', label: 'Vật phẩm' },
    { value: 'Game Guide', label: 'Hướng dẫn' },
    { value: 'Tutorial', label: 'Tutorial' },
    { value: 'Lore', label: 'Lore' },
    { value: 'FAQ', label: 'FAQ' },
  ];

  useEffect(() => {
    fetchWikis();
  }, [category, page]);

  useEffect(() => {
    fetchFeaturedWikis();
  }, []);

  const fetchWikis = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/web/wiki`, {
        params: { category, page, limit: 12 },
      });
      setWikis(response.data.data.wikis);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching wikis:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedWikis = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/web/wiki/featured`);
      setFeaturedWikis(response.data.data);
    } catch (error) {
      console.error('Error fetching featured wikis:', error);
    }
  };

  const handleCategoryChange = (newCategory) => {
    setSearchParams({ category: newCategory, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ category, page: newPage });
  };

  return (
    <div className="wiki-page">
      <div className="wiki-header">
        <h1>📚 GhostVillage Wiki</h1>
        <p>Kho tài liệu và hướng dẫn đầy đủ về thế giới GhostVillage</p>
      </div>

      {/* Featured Wikis */}
      {featuredWikis.length > 0 && (
        <section className="featured-section">
          <h2>⭐ Nổi bật</h2>
          <div className="featured-grid">
            {featuredWikis.map((wiki) => (
              <WikiCard key={wiki._id} wiki={wiki} featured />
            ))}
          </div>
        </section>
      )}

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map((cat) => (
          <button
            key={cat.value}
            className={`category-btn ${category === cat.value ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Wiki List */}
      <section className="wiki-list-section">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : wikis.length > 0 ? (
          <>
            <div className="wiki-grid">
              {wikis.map((wiki) => (
                <WikiCard key={wiki._id} wiki={wiki} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total > pagination.limit && (
              <div className="pagination">
                <button
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Trang trước
                </button>
                <span>
                  Trang {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
                </span>
                <button
                  disabled={!pagination.hasMore}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Trang sau
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-results">Không tìm thấy wiki nào</div>
        )}
      </section>
    </div>
  );
};

export default WikiListPage;
