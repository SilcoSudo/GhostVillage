import React, { useMemo, useState } from "react";
import { Modal, Spinner, Carousel, Button } from "react-bootstrap";
import { Lock, ShieldAlert, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import "./assets/styles/PostDetailModal.css";

const PostDetailModal = ({ isOpen, post, onClose, isLoading = false }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "vi" ? vi : enUS;
  const [avatarFailed, setAvatarFailed] = useState(false);

  const reportCount = Number(post?.reportCount || 0);

  const mediaImages = useMemo(
    () =>
      (post?.media || [])
        .filter((item) => item?.type === "image" && item?.url)
        .map((item) => item.url),
    [post?.media],
  );

  const mediaVideos = useMemo(
    () =>
      (post?.media || [])
        .filter((item) => item?.type === "video" && item?.url)
        .map((item) => item.url),
    [post?.media],
  );

  const hasHtmlBody = /<[^>]+>/.test(String(post?.content || ""));

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      show={Boolean(isOpen)}
      onHide={onClose}
      size="lg"
      centered
      className="post-detail-modal"
    >
      <Modal.Header closeButton>
        <div className="post-modal-header">
          <div className="post-author-info">
            {post?.authorAvatar && !avatarFailed ? (
              <img
                src={post.authorAvatar}
                alt={post?.author || "Author"}
                className="post-avatar"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="post-avatar-placeholder">
                <User size={22} strokeWidth={1.5} />
              </div>
            )}
            <div className="post-author-details">
              <div className="post-author-name">
                {post?.author || t("posts.anonymous") || "Unknown"}
              </div>
              <div className="post-meta">
                <span className="post-date">
                  {post?.createdAt
                    ? formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                        locale,
                      })
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="post-header-actions">
            {post?.isLocked && (
              <span className="mini-state-badge locked">
                <Lock size={12} /> Locked
              </span>
            )}
            {post?.isTemporarilyHidden && (
              <span className="mini-state-badge hidden">
                <ShieldAlert size={12} /> Hidden
              </span>
            )}
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="mt-3">{t("posts.loading") || "Loading post..."}</p>
          </div>
        ) : !post ? (
          <div className="text-center py-5 text-muted">
            {t("common.noData") || "No post data"}
          </div>
        ) : (
          <div className="post-content-wrapper simple-detail">
            <div className="post-content">
              <h3 className="post-title">
                {post.postTitle || "Untitled post"}
              </h3>

              <div className="post-simple-meta">
                <div className="post-simple-meta-item">
                  {t("posts.createdDate") || "Created"}:{" "}
                  {formatDateTime(post.createdAt)}
                </div>
                <div className="post-simple-meta-item">
                  {t("posts.updatedDate") || "Updated"}:{" "}
                  {formatDateTime(post.updatedAt)}
                </div>
                <div className="post-simple-meta-item">
                  {t("posts.reportCount") || "Reports"}: {reportCount}
                </div>
                <div className="post-simple-meta-item">
                  {t("posts.category") || "Category"}:{" "}
                  {post.category || "General"}
                </div>
                <div className="post-simple-meta-item reason">
                  {t("posts.reason") || "Reason"}:{" "}
                  {post.reason || "Reported content"}
                </div>
              </div>

              {hasHtmlBody ? (
                <div
                  className="post-body"
                  dangerouslySetInnerHTML={{ __html: post.content || "" }}
                />
              ) : (
                <div className="post-body">{post.content || "No content"}</div>
              )}
            </div>

            {mediaImages.length > 0 && (
              <div className="post-image-carousel">
                <Carousel
                  indicators={mediaImages.length > 1}
                  controls={mediaImages.length > 1}
                  interval={null}
                >
                  {mediaImages.map((src, index) => (
                    <Carousel.Item key={`${src}-${index}`}>
                      <img
                        className="carousel-image"
                        src={src}
                        alt={`Slide ${index + 1}`}
                      />
                    </Carousel.Item>
                  ))}
                </Carousel>
              </div>
            )}

            {mediaVideos.length > 0 && (
              <div className="post-videos">
                {mediaVideos.map((src, index) => (
                  <div key={`${src}-${index}`} className="video-wrapper">
                    <video
                      controls
                      className="video-player"
                      src={src}
                      preload="metadata"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          {t("common.close") || "Close"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PostDetailModal;
