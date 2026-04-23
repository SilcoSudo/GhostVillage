import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { ThumbsUp, Eye, Calendar, User, Tag } from "lucide-react";
import "../../../shared/assets/styles/WikiDetailPage.css";

const WikiDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const [wiki, setWiki] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    fetchWiki();
  }, [slug]);

  const fetchWiki = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/web/wiki/${slug}`);
      setWiki(response.data.data);
    } catch (error) {
      console.error("Error fetching wiki:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/web/wiki/${wiki._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setLiked(!liked);
      setWiki({ ...wiki, likes: liked ? wiki.likes - 1 : wiki.likes + 1 });
    } catch (error) {
      console.error("Error liking wiki:", error);
    }
  };

  const dateLocale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";

  if (loading) {
    return <div className="loading-page">{t("wiki.detail.loading")}</div>;
  }

  if (!wiki) {
    return (
      <div className="error-page">
        <h2>{t("wiki.detail.notFound")}</h2>
        <Link to="/wiki">{t("wiki.detail.back")}</Link>
      </div>
    );
  }

  return (
    <div className="wiki-detail-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/wiki">{t("wiki.detail.breadcrumbRoot")}</Link>
        <span> / </span>
        <Link to={`/wiki?category=${encodeURIComponent(wiki.category)}`}>
          {wiki.category}
        </Link>
        <span> / </span>
        <span>{wiki.title}</span>
      </div>

      {/* Cover Image */}
      {wiki.coverImage && (
        <div className="wiki-cover">
          <img src={wiki.coverImage} alt={wiki.title} />
        </div>
      )}

      {/* Header */}
      <div className="wiki-header">
        <div className="category-badge">{wiki.category}</div>
        <h1>{wiki.title}</h1>

        {/* Meta Info */}
        <div className="wiki-meta">
          <div className="meta-item">
            <User size={16} />
            <span>
              {wiki.author?.fullname || t("wiki.detail.authorAnonymous")}
            </span>
          </div>
          <div className="meta-item">
            <Calendar size={16} />
            <span>
              {new Date(wiki.createdAt).toLocaleDateString(dateLocale)}
            </span>
          </div>
          <div className="meta-item">
            <Eye size={16} />
            <span>{t("wiki.detail.views", { count: wiki.views })}</span>
          </div>
          <div className="meta-item">
            <ThumbsUp size={16} />
            <span>{t("wiki.detail.likes", { count: wiki.likes })}</span>
          </div>
        </div>

        {/* Tags */}
        {wiki.tags && wiki.tags.length > 0 && (
          <div className="wiki-tags">
            <Tag size={16} />
            {wiki.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Excerpt */}
      {wiki.excerpt && (
        <div className="wiki-excerpt">
          <p>{wiki.excerpt}</p>
        </div>
      )}

      {/* Content */}
      <div className="wiki-content">
        <ReactMarkdown>{wiki.content}</ReactMarkdown>
      </div>

      {/* Game Data Display (if exists) */}
      {wiki.gameData && (
        <div className="game-data-section">
          <h2>{t("wiki.detail.detailsHeading")}</h2>
          <pre className="game-data">
            {JSON.stringify(wiki.gameData, null, 2)}
          </pre>
        </div>
      )}

      {/* Gallery */}
      {wiki.gallery && wiki.gallery.length > 0 && (
        <div className="wiki-gallery">
          <h2>{t("wiki.detail.galleryHeading")}</h2>
          <div className="gallery-grid">
            {wiki.gallery.map((image, index) => (
              <img key={index} src={image} alt={`${wiki.title} ${index + 1}`} />
            ))}
          </div>
        </div>
      )}

      {/* Video Guide */}
      {wiki.videoGuide && (
        <div className="video-section">
          <h2>{t("wiki.detail.videoHeading")}</h2>
          <iframe
            src={wiki.videoGuide}
            title={t("wiki.detail.videoHeading")}
            frameBorder="0"
            allowFullScreen
          />
        </div>
      )}

      {/* Related Wikis */}
      {wiki.relatedWikis && wiki.relatedWikis.length > 0 && (
        <div className="related-wikis">
          <h2>{t("wiki.detail.relatedHeading")}</h2>
          <div className="related-grid">
            {wiki.relatedWikis.map((related) => (
              <Link
                key={related._id}
                to={`/wiki/${related.slug}`}
                className="related-card"
              >
                {related.coverImage && (
                  <img src={related.coverImage} alt={related.title} />
                )}
                <div className="related-info">
                  <span className="related-category">{related.category}</span>
                  <h3>{related.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="wiki-actions">
        <button
          className={`like-btn ${liked ? "liked" : ""}`}
          onClick={handleLike}
        >
          <ThumbsUp size={20} />
          {liked ? t("wiki.detail.liked") : t("wiki.detail.like")}
        </button>
        <Link to="/wiki" className="back-btn">
          {t("wiki.detail.back")}
        </Link>
      </div>
    </div>
  );
};

export default WikiDetailPage;
