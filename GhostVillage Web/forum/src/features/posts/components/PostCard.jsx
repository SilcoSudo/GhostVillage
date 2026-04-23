import React, { useState, useMemo, useEffect } from "react";
import { Card, Button, Dropdown, Carousel } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Eye,
  MoreVertical,
  User,
  Edit2,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/context/AuthContext";
import CreatePostModal from "./CreatePostModal";
import PostDetailModal from "./PostDetailModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import {
  useDeletePost,
  useToggleLike,
  useToggleBookmark,
  useReportPost,
} from "../hooks/usePosts";
import { linkifyHtmlContent } from "../../../shared/utils/linkify";
import { removeImagesAndVideosFromHtml } from "../../../shared/utils/mediaExtractor";
import { getAvatarUrl, cacheAvatar } from "../../../shared/utils/avatarCache";
import ShareModal from "./ShareModal";
import ReportPostModal from "./ReportPostModal";
import "./PostCard.css";

const PostCard = ({
  post,
  onPostUpdate,
  isSavedPostsPage,
  onOpenDetail,
  showViewDetailAction = false,
}) => {
  const { t, i18n } = useTranslation();
  const { user, refetchUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Check if current user has liked/bookmarked based on array
  const userLiked =
    user && Array.isArray(post?.likes)
      ? post.likes.some((id) => String(id) === String(user._id))
      : false;
  // If on SavedPostsPage, always show as bookmarked
  const userBookmarked = isSavedPostsPage
    ? true
    : user?.bookmarks && Array.isArray(user.bookmarks)
      ? user.bookmarks.some((id) => String(id) === String(post._id))
      : false;

  const [liked, setLiked] = useState(userLiked);
  const [bookmarked, setBookmarked] = useState(userBookmarked);
  const [likeCount, setLikeCount] = useState(
    Array.isArray(post?.likes) ? post.likes.length : 0,
  );

  // Đồng bộ state với dữ liệu từ server khi post thay đổi
  useEffect(() => {
    if (post && user) {
      const isLiked = Array.isArray(post.likes)
        ? post.likes.some((id) => String(id) === String(user._id))
        : false;
      // If on SavedPostsPage, always show as bookmarked
      const isBookmarked = isSavedPostsPage
        ? true
        : Array.isArray(user.bookmarks)
          ? user.bookmarks.some((id) => String(id) === String(post._id))
          : false;

      setLiked(isLiked);
      setBookmarked(isBookmarked);
      setLikeCount(Array.isArray(post.likes) ? post.likes.length : 0);
    }
  }, [post?._id, post?.likes, user?.bookmarks, user, isSavedPostsPage]);

  // Listen for refetch-user event after bookmark
  useEffect(() => {
    const handleRefetchUser = () => {
      if (refetchUser) refetchUser();
    };
    window.addEventListener("refetch-user", handleRefetchUser);
    return () => window.removeEventListener("refetch-user", handleRefetchUser);
  }, [refetchUser]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [failedAvatars, setFailedAvatars] = useState({});
  const [scrollToComments, setScrollToComments] = useState(false);

  const locale = i18n.language === "vi" ? vi : enUS;
  const deletePostMutation = useDeletePost();
  const toggleLikeMutation = useToggleLike();
  const toggleBookmarkMutation = useToggleBookmark();
  const reportPostMutation = useReportPost();
  const authorDisplayName =
    post?.author?.username || post?.author?.fullname || t("posts.anonymous");
  const isPostEdited = Boolean(post?.isEdited || post?.editedAt);
  const useLocalDetailModal = typeof onOpenDetail !== "function";

  useEffect(() => {
    if (!useLocalDetailModal) return;

    const requestedPostId = searchParams.get("postId");
    const shouldShowDetail =
      requestedPostId && String(requestedPostId) === String(post._id);

    if (shouldShowDetail) {
      setShowDetailModal(true);
      setScrollToComments(searchParams.get("scrollToComments") === "1");
      return;
    }

    if (showDetailModal) {
      setShowDetailModal(false);
      setScrollToComments(false);
    }
  }, [post._id, searchParams, showDetailModal, useLocalDetailModal]);

  const handleAvatarError = (authorId) => {
    setFailedAvatars((prev) => ({ ...prev, [authorId]: true }));
  };

  // Use media array from post (required for new posts)
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

  const bodyWithoutMedia = useMemo(
    () => removeImagesAndVideosFromHtml(post?.body),
    [post?.body],
  );

  const handleDelete = async () => {
    try {
      await deletePostMutation.mutateAsync(post._id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handleLike = async () => {
    try {
      setLiked(!liked);
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
      await toggleLikeMutation.mutateAsync(post._id);
    } catch (error) {
      // Revert on error
      setLiked(liked);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
    }
  };

  const handleBookmark = async () => {
    try {
      const wasBookmarked = bookmarked;
      setBookmarked(!bookmarked);
      await toggleBookmarkMutation.mutateAsync(post._id);

      // If unbookmarked and callback exists, notify parent (for SavedPostsPage)
      if (wasBookmarked && onPostUpdate) {
        onPostUpdate(post);
      }
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
      postId: post._id,
      reason,
      customReason,
    });
    setShowReportModal(false);
  };

  const openDetailModal = (shouldScrollComments = false) => {
    if (typeof onOpenDetail === "function") {
      onOpenDetail(post._id, shouldScrollComments);
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("postId", post._id);

    if (shouldScrollComments) {
      nextSearchParams.set("scrollToComments", "1");
    } else {
      nextSearchParams.delete("scrollToComments");
    }

    setSearchParams(nextSearchParams);
    setScrollToComments(shouldScrollComments);
    setShowDetailModal(true);
  };

  return (
    <Card className="post-card">
      <Card.Body>
        {/* Header */}
        <div className="post-header">
          <div className="post-author-info">
            <Link
              to={`/profile/${post?.author?._id}`}
              className="post-avatar-link"
            >
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
                  <User size={18} strokeWidth={1.5} />
                </div>
              )}
            </Link>
            <div className="post-author-details">
              <Link
                to={`/profile/${post?.author?._id}`}
                className="post-author-name"
              >
                {authorDisplayName}
              </Link>
              <div className="post-meta">
                <span className="post-date">
                  {formatDistanceToNow(new Date(post?.createdAt), {
                    addSuffix: true,
                    locale,
                  })}
                </span>
                {isPostEdited && (
                  <span className="post-edited-indicator">
                    {t("common.edited")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Dropdown align="end" onClick={(e) => e.stopPropagation()}>
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
                  <Dropdown.Item>{t("posts.hide")}</Dropdown.Item>
                </>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Content */}
        <div className="post-content-wrapper">
          <div className="post-content">
            <div
              className="post-content-link"
              onClick={() => {
                openDetailModal(false);
              }}
              style={{ cursor: "pointer" }}
            >
              <h3 className="post-title">{post?.title}</h3>
            </div>
            <div
              className="post-content-link"
              onClick={() => {
                openDetailModal(false);
              }}
              style={{ cursor: "pointer" }}
            >
              {bodyWithoutMedia &&
                bodyWithoutMedia
                  .trim()
                  .replace(/<[^>]*>/g, "")
                  .trim() &&
                (() => {
                  // Parse HTML and get up to 3 blocks (p, div, li, br, etc.)
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(
                    linkifyHtmlContent(bodyWithoutMedia),
                    "text/html",
                  );
                  const blockTags = ["P", "DIV", "LI", "UL", "OL", "BR"];
                  let blocks = [];
                  for (let child of doc.body.childNodes) {
                    // Lọc node trống hoặc chỉ chứa khoảng trắng
                    const content = child.outerHTML || child.textContent;
                    if (
                      (blockTags.includes(child.nodeName) ||
                        child.nodeType === 3) &&
                      content &&
                      content.trim()
                    ) {
                      blocks.push(content);
                      if (blocks.length === 3) break;
                    }
                  }
                  if (blocks.length < 3) {
                    for (let child of doc.body.childNodes) {
                      const content = child.textContent;
                      if (
                        !blockTags.includes(child.nodeName) &&
                        child.nodeType === 3 &&
                        content &&
                        content.trim()
                      ) {
                        blocks.push(content);
                        if (blocks.length === 3) break;
                      }
                    }
                  }
                  // Đếm số block thực sự có nội dung
                  const realBlocks = Array.from(doc.body.childNodes).filter(
                    (child) => {
                      const content = child.outerHTML || child.textContent;
                      return (
                        (blockTags.includes(child.nodeName) ||
                          child.nodeType === 3) &&
                        content &&
                        content.trim()
                      );
                    },
                  );
                  const hasMore = realBlocks.length > blocks.length;
                  return (
                    <>
                      <div className="post-body post-body-preview">
                        {blocks.map((block, idx) => (
                          <div
                            key={idx}
                            dangerouslySetInnerHTML={{ __html: block }}
                          />
                        ))}
                      </div>
                      {hasMore && (
                        <div
                          className="post-preview-ellipsis"
                          style={{
                            marginTop: 0,
                            display: "block",
                            width: "100%",
                          }}
                        >
                          ...
                        </div>
                      )}
                    </>
                  );
                })()}
            </div>
          </div>{" "}
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
                      alt={`Slide ${index + 1}`}
                      onClick={() => openDetailModal(false)}
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
                  <video
                    src={src}
                    title={`Video ${index + 1}`}
                    controls
                    preload="metadata"
                    playsInline
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="post-footer">
          {showViewDetailAction && (
            <Button
              variant="link"
              className="post-action-btn"
              onClick={() => openDetailModal(false)}
              title={t("common.view")}
            >
              <Eye size={18} />
            </Button>
          )}

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

          <Button
            variant="link"
            className="post-action-btn"
            onClick={() => {
              openDetailModal(true);
            }}
          >
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
      </Card.Body>

      {/* Edit Modal */}
      {showEditModal && (
        <CreatePostModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          post={post}
          mode="edit"
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && useLocalDetailModal && (
        <PostDetailModal
          show={showDetailModal}
          onHide={() => {
            setShowDetailModal(false);
            setScrollToComments(false);

            const nextSearchParams = new URLSearchParams(searchParams);
            nextSearchParams.delete("postId");
            nextSearchParams.delete("scrollToComments");
            setSearchParams(nextSearchParams);
          }}
          postId={post._id}
          scrollToComments={scrollToComments}
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

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          show={showShareModal}
          onHide={() => setShowShareModal(false)}
          post={post}
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
    </Card>
  );
};

export default PostCard;
