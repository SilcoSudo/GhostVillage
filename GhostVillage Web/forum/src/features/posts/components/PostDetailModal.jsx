import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Modal,
  Button,
  Dropdown,
  Form,
  Spinner,
  Carousel,
} from "react-bootstrap";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  User,
  Send,
  Edit2,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/context/AuthContext";
import CreatePostModal from "./CreatePostModal";
import ShareModal from "./ShareModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ReportPostModal from "./ReportPostModal";
import Comment from "./Comment";
import { useComments, useCreateComment } from "../hooks/useComments";
import {
  useDeletePost,
  useToggleLike,
  useToggleBookmark,
  usePost,
  useReportPost,
} from "../hooks/usePosts";
import { linkifyHtmlContent } from "../../../shared/utils/linkify";
import { removeImagesAndVideosFromHtml } from "../../../shared/utils/mediaExtractor";
import { getAvatarUrl, cacheAvatar } from "../../../shared/utils/avatarCache";
import "./PostDetailModal.css";

const PostDetailModal = ({
  show,
  onHide,
  postId,
  scrollToComments = false,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [failedAvatars, setFailedAvatars] = useState({});
  const commentsSectionRef = useRef(null);

  const locale = i18n.language === "vi" ? vi : enUS;

  const handleAvatarError = (authorId) => {
    setFailedAvatars((prev) => ({ ...prev, [authorId]: true }));
  };

  // Fetch post data
  const { data: postData, isLoading: postLoading } = usePost(postId);
  const post = postData?.data;

  // Extract media images and videos
  const mediaImages = useMemo(() => {
    return (post?.media || [])
      .filter((m) => m.type === "image")
      .map((m) => m.url);
  }, [post?.media]);

  const mediaVideos = useMemo(() => {
    return (post?.media || [])
      .filter((m) => m.type === "video")
      .map((m) => m.url);
  }, [post?.media]);

  // Check if current user has liked/bookmarked based on array
  const userLiked =
    user && Array.isArray(post?.likes)
      ? post.likes.some((id) => String(id) === String(user._id))
      : false;
  const userBookmarked =
    user && Array.isArray(post?.bookmarks)
      ? post.bookmarks.some((id) => String(id) === String(user._id))
      : false;

  // Local state for optimistic updates
  const [liked, setLiked] = useState(userLiked);
  const [bookmarked, setBookmarked] = useState(userBookmarked);
  const [likeCount, setLikeCount] = useState(
    Array.isArray(post?.likes) ? post.likes.length : 0,
  );

  // Update local state when post data changes
  useEffect(() => {
    if (post && user) {
      const isLiked = Array.isArray(post.likes)
        ? post.likes.some((id) => String(id) === String(user._id))
        : false;
      const isBookmarked = Array.isArray(post.bookmarks)
        ? post.bookmarks.some((id) => String(id) === String(user._id))
        : false;

      setLiked(isLiked);
      setBookmarked(isBookmarked);
      setLikeCount(Array.isArray(post.likes) ? post.likes.length : 0);
    }
  }, [post?._id, post?.likes, post?.bookmarks, user]);

  // Scroll to comments section when scrollToComments is true
  useEffect(() => {
    if (scrollToComments && commentsSectionRef.current && show) {
      setTimeout(() => {
        commentsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 10);
    }
  }, [scrollToComments, show]);

  // Comment hooks
  const { data: commentsData, isLoading: commentsLoading } =
    useComments(postId);
  const createCommentMutation = useCreateComment(postId);
  const deletePostMutation = useDeletePost();
  const toggleLikeMutation = useToggleLike();
  const toggleBookmarkMutation = useToggleBookmark();
  const reportPostMutation = useReportPost();
  const authorDisplayName =
    post?.author?.username || post?.author?.fullname || t("posts.anonymous");
  const isPostEdited = Boolean(post?.isEdited || post?.editedAt);

  const handleOpenProfile = (profileId) => {
    if (!profileId) return;

    const nextSearchParams = new URLSearchParams(location.search);
    nextSearchParams.set("postId", postId);
    nextSearchParams.set("scrollToComments", "1");

    navigate(
      {
        pathname: location.pathname,
        search: `?${nextSearchParams.toString()}`,
      },
      { replace: true },
    );

    window.setTimeout(() => {
      navigate(`/profile/${profileId}`);
    }, 0);
  };

  const handleDelete = async () => {
    try {
      await deletePostMutation.mutateAsync(postId);
      setShowDeleteModal(false);
      onHide(); // Close detail modal after delete
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  // Ensure child modals are closed when this detail modal is closed
  const handleClose = () => {
    setShowEditModal(false);
    setShowShareModal(false);
    setShowDeleteModal(false);
    setShowReportModal(false);
    onHide();
  };

  // When parent `show` changes to false, ensure child modals are reset
  useEffect(() => {
    if (!show) {
      setShowEditModal(false);
      setShowShareModal(false);
      setShowDeleteModal(false);
      setShowReportModal(false);
    }
  }, [show]);

  const handleLike = async () => {
    try {
      setLiked(!liked);
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
      await toggleLikeMutation.mutateAsync(postId);
    } catch (error) {
      // Revert on error
      setLiked(liked);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
    }
  };

  const handleBookmark = async () => {
    try {
      setBookmarked(!bookmarked);
      await toggleBookmarkMutation.mutateAsync(postId);
    } catch (error) {
      // Revert on error
      setBookmarked(!bookmarked);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleReportSubmit = async ({ reason, customReason }) => {
    await reportPostMutation.mutateAsync({
      postId,
      reason,
      customReason,
    });
    setShowReportModal(false);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await createCommentMutation.mutateAsync({ content: commentText });
      setCommentText("");
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  if (postLoading) {
    return (
      <Modal
        show={show}
        onHide={onHide}
        size="xl"
        centered
        className="post-detail-modal"
      >
        <Modal.Body className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-3">{t("posts.loading")}</p>
        </Modal.Body>
      </Modal>
    );
  }

  if (!post) return null;

  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        size="xl"
        centered
        className="post-detail-modal"
      >
        <Modal.Header closeButton>
          {/* Author Info */}
          <div className="post-modal-header">
            <div className="post-author-info">
              {post?.author?.avatar && !failedAvatars[post.author._id] ? (
                <img
                  src={getAvatarUrl(post.author._id, post.author.avatar)}
                  alt={authorDisplayName}
                  className="post-avatar"
                  onError={() => handleAvatarError(post.author._id)}
                  onLoad={() =>
                    cacheAvatar(post.author._id, post.author.avatar)
                  }
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="post-avatar-placeholder">
                  <User size={22} strokeWidth={1.5} />
                </div>
              )}
              <div className="post-author-details">
                {post?.author?._id ? (
                  <button
                    type="button"
                    className="post-author-name"
                    onClick={() => handleOpenProfile(post.author._id)}
                  >
                    {authorDisplayName}
                  </button>
                ) : (
                  <div className="post-author-name">{authorDisplayName}</div>
                )}
                <div className="post-meta">
                  <span className="post-date">
                    {formatDistanceToNow(new Date(post?.createdAt), {
                      addSuffix: true,
                      locale,
                    })}
                  </span>
                  {post?.temperature && (
                    <>
                      <span className="post-meta-divider">•</span>
                      <span className="post-temperature">
                        ☀️ {post.temperature}°C
                      </span>
                    </>
                  )}
                  {isPostEdited && (
                    <span className="post-edited-indicator">
                      {t("common.edited")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body>
          {/* Content Layout - Same as PostCard */}
          <div className="post-content-wrapper">
            <div className="post-content">
              {/* Title with Menu */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <h3 className="post-title">{post?.title}</h3>
                <Dropdown align="end">
                  <Dropdown.Toggle
                    variant="link"
                    className="post-menu-btn"
                    bsPrefix="none"
                  >
                    <MoreVertical size={20} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {user && user._id === post?.author?._id ? (
                      <>
                        <Dropdown.Item onClick={() => setShowEditModal(true)}>
                          <Edit2 size={16} />
                          {t("posts.edit")}
                        </Dropdown.Item>
                        <Dropdown.Item
                          className="text-danger"
                          onClick={() => setShowDeleteModal(true)}
                        >
                          <Trash2 size={16} />
                          {t("posts.delete")}
                        </Dropdown.Item>
                      </>
                    ) : (
                      <>
                        <Dropdown.Item onClick={() => setShowReportModal(true)}>
                          {t("posts.report")}
                        </Dropdown.Item>
                      </>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Body Content - Full text */}
              {post?.body && (
                <div
                  className="post-body"
                  dangerouslySetInnerHTML={{
                    __html: linkifyHtmlContent(post.body),
                  }}
                />
              )}
            </div>

            {/* Image Carousel */}
            {mediaImages && mediaImages.length > 0 && (
              <div className="post-image-carousel">
                <Carousel
                  indicators={mediaImages.length > 1}
                  controls={mediaImages.length > 1}
                  interval={null}
                >
                  {mediaImages.map((src, index) => (
                    <Carousel.Item
                      key={index}
                      style={{ backgroundImage: `url(${src})` }}
                    >
                      <img
                        className="carousel-image"
                        src={src}
                        alt={t("posts.mediaSlideAlt", { index: index + 1 })}
                      />
                      {mediaImages.length > 1 && (
                        <div className="image-counter">
                          {index + 1}/{mediaImages.length}
                        </div>
                      )}
                    </Carousel.Item>
                  ))}
                </Carousel>
              </div>
            )}

            {/* Video Embeds */}
            {mediaVideos && mediaVideos.length > 0 && (
              <div className="post-videos">
                {mediaVideos.map((src, index) => (
                  <div key={index} className="video-wrapper">
                    <iframe
                      src={src}
                      title={t("posts.mediaVideoTitle", {
                        index: index + 1,
                      })}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="post-footer">
            <Button
              variant="link"
              className={`post-action-btn ${liked ? "active liked" : ""}`}
              onClick={handleLike}
            >
              <Heart
                size={18}
                fill={liked ? "var(--primary-color)" : "none"}
                stroke="currentColor"
              />
              <span> {likeCount}</span>
            </Button>

            <Button variant="link" className="post-action-btn">
              <MessageCircle size={18} />
              <span> {post?.commentCount || 0}</span>
            </Button>

            <Button
              variant="link"
              className="post-action-btn"
              onClick={handleShare}
            >
              <Share2 size={18} />
            </Button>

            <Button
              variant="link"
              className={`post-action-btn ${bookmarked ? "active bookmarked" : ""}`}
              onClick={handleBookmark}
            >
              <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
            </Button>
          </div>

          {/* Comments Section */}
          <div className="comments-section" ref={commentsSectionRef}>
            <div className="comments-header">
              <h5>{t("posts.comments")}</h5>
            </div>

            {/* Comment Input */}
            {user && (
              <Form onSubmit={handleCommentSubmit} className="comment-form">
                <div className="comment-input-wrapper">
                  {user?.avatar ? (
                    <img
                      src={getAvatarUrl(user._id, user.avatar)}
                      alt={user.username}
                      className="comment-avatar"
                      onLoad={() => cacheAvatar(user._id, user.avatar)}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="comment-avatar-placeholder">
                      <User size={16} />
                    </div>
                  )}
                  <Form.Control
                    type="text"
                    placeholder={t("posts.writeComment")}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="comment-input"
                  />
                  <Button
                    type="submit"
                    variant="link"
                    className="comment-send-btn"
                    disabled={!commentText.trim()}
                  >
                    <Send size={20} />
                  </Button>
                </div>
              </Form>
            )}

            {/* Comments List */}
            <div className="comments-list">
              {commentsLoading ? (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : commentsData?.data?.length > 0 ? (
                commentsData.data.map((comment) => (
                  <Comment
                    key={comment._id}
                    comment={comment}
                    postId={post._id}
                    onNavigateProfile={handleOpenProfile}
                  />
                ))
              ) : (
                <div className="no-comments">
                  <MessageCircle size={48} className="text-muted" />
                  <p>{t("posts.noComments")}</p>
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Edit Modal */}
      {showEditModal && (
        <CreatePostModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          post={post}
          mode="edit"
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          show={showShareModal}
          onHide={() => setShowShareModal(false)}
          post={post}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isDeleting={deletePostMutation.isLoading}
          itemType="post"
        />
      )}

      {showReportModal && (
        <ReportPostModal
          show={showReportModal}
          onHide={() => setShowReportModal(false)}
          onSubmit={handleReportSubmit}
          isSubmitting={Boolean(
            reportPostMutation.isPending || reportPostMutation.isLoading,
          )}
        />
      )}
    </>
  );
};

export default PostDetailModal;
