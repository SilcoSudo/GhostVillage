import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Eye, Calendar, User, Pin } from "lucide-react";
import "../../../shared/assets/styles/AnnouncementDetailPage.css";

const AnnouncementDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    fetchAnnouncement();
  }, [slug]);

  const fetchAnnouncement = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/web/announcement/${slug}`,
      );
      setAnnouncement(response.data.data);
    } catch (error) {
      console.error("Error fetching announcement:", error);
    } finally {
      setLoading(false);
    }
  };

  const dateLocale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";

  if (loading) {
    return (
      <div className="loading-page">{t("announcements.detail.loading")}</div>
    );
  }

  if (!announcement) {
    return (
      <div className="error-page">
        <h2>{t("announcements.detail.notFound")}</h2>
        <Link to="/announcements">{t("announcements.detail.back")}</Link>
      </div>
    );
  }

  return (
    <div className="announcement-detail-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/announcements">
          {t("announcements.detail.breadcrumbRoot")}
        </Link>
        <span> / </span>
        <span>{announcement.title}</span>
      </div>

      {/* Cover Image */}
      {announcement.coverImage && (
        <div className="announcement-cover">
          <img src={announcement.coverImage} alt={announcement.title} />
        </div>
      )}

      {/* Header */}
      <div className="announcement-header">
        {announcement.isPinned && (
          <div className="pinned-badge">
            <Pin size={16} />
            <span>{t("announcements.detail.pinned")}</span>
          </div>
        )}
        <h1>{announcement.title}</h1>

        {/* Meta Info */}
        <div className="announcement-meta">
          <div className="meta-item">
            <User size={16} />
            <span>
              {announcement.author?.fullname ||
                t("announcements.detail.authorAnonymous")}
            </span>
          </div>
          <div className="meta-item">
            <Calendar size={16} />
            <span>
              {new Date(announcement.createdAt).toLocaleDateString(dateLocale)}
            </span>
          </div>
          <div className="meta-item">
            <Eye size={16} />
            <span>
              {t("announcements.detail.views", { count: announcement.views })}
            </span>
          </div>
        </div>
      </div>

      {/* Excerpt */}
      {announcement.excerpt && (
        <div className="announcement-excerpt">
          <p>{announcement.excerpt}</p>
        </div>
      )}

      {/* Content */}
      <div className="announcement-content">
        <ReactMarkdown>{announcement.content}</ReactMarkdown>
      </div>

      {/* Action Buttons */}
      <div className="announcement-actions">
        <Link to="/announcements" className="back-btn">
          {t("announcements.detail.back")}
        </Link>
      </div>
    </div>
  );
};

export default AnnouncementDetailPage;
