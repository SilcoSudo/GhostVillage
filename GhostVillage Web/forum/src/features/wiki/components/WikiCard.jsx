import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import PropTypes from 'prop-types';

const WikiCard = ({ wiki, featured = false }) => {
  const getCategoryColor = (category) => {
    const colors = {
      'Monster Database': '#ff6b6b',
      'Map Guide': '#4ecdc4',
      'Item Database': '#ffe66d',
      'Game Guide': '#95e1d3',
      'Tutorial': '#a8e6cf',
      'Lore': '#c7b3e5',
      'FAQ': '#ffd3b6',
      'Patch Notes': '#ffaaa5',
    };
    return colors[category] || '#ddd';
  };

  return (
    <Link
      to={`/wiki/${wiki.slug}`}
      className={`wiki-card ${featured ? 'featured' : ''}`}
    >
      {/* Cover Image */}
      {wiki.coverImage && (
        <div className="wiki-card-image">
          <img src={wiki.coverImage} alt={wiki.title} />
          {wiki.isFeatured && <span className="featured-badge">⭐ Featured</span>}
        </div>
      )}

      {/* Content */}
      <div className="wiki-card-content">
        {/* Category Badge */}
        <div
          className="wiki-category"
          style={{ backgroundColor: getCategoryColor(wiki.category) }}
        >
          {wiki.category}
        </div>

        {/* Title */}
        <h3 className="wiki-title">{wiki.title}</h3>

        {/* Excerpt */}
        {wiki.excerpt && (
          <p className="wiki-excerpt">
            {wiki.excerpt.length > 100
              ? `${wiki.excerpt.substring(0, 100)}...`
              : wiki.excerpt}
          </p>
        )}

        {/* Meta Info */}
        <div className="wiki-meta">
          <div className="meta-item">
            <Eye size={14} />
            <span>{wiki.views || 0}</span>
          </div>
          {wiki.author && (
            <div className="meta-author">
              {wiki.author.avatar && (
                <img
                  src={wiki.author.avatar}
                  alt={wiki.author.fullname}
                  className="author-avatar"
                />
              )}
              <span>{wiki.author.fullname}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {wiki.tags && wiki.tags.length > 0 && (
          <div className="wiki-tags">
            {wiki.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

WikiCard.propTypes = {
  wiki: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    excerpt: PropTypes.string,
    category: PropTypes.string.isRequired,
    coverImage: PropTypes.string,
    isFeatured: PropTypes.bool,
    views: PropTypes.number,
    tags: PropTypes.arrayOf(PropTypes.string),
    author: PropTypes.shape({
      fullname: PropTypes.string,
      avatar: PropTypes.string,
    }),
  }).isRequired,
  featured: PropTypes.bool,
};

export default WikiCard;
