import { Link } from 'react-router-dom';
import { Eye, Calendar, Pin } from 'lucide-react';
import PropTypes from 'prop-types';

const AnnouncementCard = ({ announcement }) => {
  return (
    <Link
      to={`/announcements/${announcement.slug}`}
      className={`announcement-card ${announcement.isPinned ? 'pinned' : ''}`}
    >
      {/* Pinned Badge */}
      {announcement.isPinned && (
        <div className="pinned-indicator">
          <Pin size={16} />
          <span>Ghim</span>
        </div>
      )}

      {/* Cover Image (if exists) */}
      {announcement.coverImage && (
        <div className="announcement-card-image">
          <img src={announcement.coverImage} alt={announcement.title} />
        </div>
      )}

      {/* Content */}
      <div className="announcement-card-content">
        {/* Title */}
        <h3 className="announcement-title">{announcement.title}</h3>

        {/* Excerpt */}
        {announcement.excerpt && (
          <p className="announcement-excerpt">
            {announcement.excerpt.length > 150
              ? `${announcement.excerpt.substring(0, 150)}...`
              : announcement.excerpt}
          </p>
        )}

        {/* Meta Info */}
        <div className="announcement-meta">
          <div className="meta-item">
            <Calendar size={14} />
            <span>{new Date(announcement.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
          <div className="meta-item">
            <Eye size={14} />
            <span>{announcement.views || 0}</span>
          </div>
          {announcement.author && (
            <div className="meta-author">
              {announcement.author.avatar && (
                <img
                  src={announcement.author.avatar}
                  alt={announcement.author.fullname}
                  className="author-avatar"
                />
              )}
              <span>{announcement.author.fullname}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

AnnouncementCard.propTypes = {
  announcement: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    excerpt: PropTypes.string,
    coverImage: PropTypes.string,
    isPinned: PropTypes.bool,
    views: PropTypes.number,
    createdAt: PropTypes.string.isRequired,
    author: PropTypes.shape({
      fullname: PropTypes.string,
      avatar: PropTypes.string,
    }),
  }).isRequired,
};

export default AnnouncementCard;
