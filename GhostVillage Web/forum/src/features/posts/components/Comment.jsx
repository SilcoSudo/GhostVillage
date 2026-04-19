import React, { useEffect, useState } from "react";
import { Dropdown, Form, Button } from "react-bootstrap";
import {
  MoreVertical,
  Trash2,
  MessageCircle,
  Send,
  Edit2,
  User,
  Flag,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/context/AuthContext";
import {
  useDeleteComment,
  useCreateComment,
  useComments,
  useUpdateComment,
  useReportComment,
} from "../hooks/useComments";
import ReportPostModal from "./ReportPostModal";
import { getAvatarUrl, cacheAvatar } from "../../../shared/utils/avatarCache";
import "./Comment.css";

const Comment = ({
  comment,
  postId,
  level = 0,
  topLevelCommentId = null,
  onNavigateProfile,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [showReportModal, setShowReportModal] = useState(false);
  const isDeletedComment = comment.content === "This comment has been deleted.";

  const deleteCommentMutation = useDeleteComment(postId);
  const createCommentMutation = useCreateComment(postId);
  const updateCommentMutation = useUpdateComment(postId);
  const reportCommentMutation = useReportComment(postId);

  // Get the top-level comment ID (for flat reply structure)
  const rootCommentId = topLevelCommentId || comment._id;

  // Get replies for this comment (only fetch for top-level comments)
  const { data: repliesData } = useComments(postId, {
    parentId: level === 0 ? comment._id : null,
  });

  const locale = i18n.language === "vi" ? vi : enUS;
  const replies = repliesData?.data || [];
  const replyCount = replies.length;
  const isCommentEdited = Boolean(
    !isDeletedComment && (comment?.isEdited || comment?.editedAt),
  );

  const handleOpenProfile = (profileId) => {
    if (!profileId) return;

    if (onNavigateProfile) {
      onNavigateProfile(profileId);
      return;
    }

    navigate(`/profile/${profileId}`);
  };

  const handleDelete = async () => {
    if (window.confirm(t("posts.confirmDeleteComment"))) {
      await deleteCommentMutation.mutateAsync(comment._id);
    }
  };

  useEffect(() => {
    if (isDeletedComment) {
      setIsEditing(false);
      setEditText(comment.content);
    }
  }, [isDeletedComment, comment.content]);

  const handleReply = () => {
    setShowReplyForm(!showReplyForm);
    setReplyText("");
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      await createCommentMutation.mutateAsync({
        content: replyText,
        parentId: rootCommentId,
      });
      setReplyText("");
      setShowReplyForm(false);
      setShowReplies(true); // Auto show replies after posting
    } catch (error) {
      console.error("Failed to post reply:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText === comment.content) {
      setIsEditing(false);
      return;
    }

    try {
      await updateCommentMutation.mutateAsync({
        commentId: comment._id,
        commentData: { content: editText },
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const isAuthor = user?._id === comment.author._id;

  const handleSubmitReport = async ({ reason, customReason }) => {
    await reportCommentMutation.mutateAsync({
      commentId: comment._id,
      reportData: {
        reason,
        customReason,
      },
    });
    setShowReportModal(false);
  };

  return (
    <div className="comment-item">
      {comment.author.avatarUrl ? (
        <img
          src={getAvatarUrl(comment.author._id, comment.author.avatarUrl)}
          alt={comment.author.username}
          className="comment-avatar"
          onLoad={() =>
            cacheAvatar(comment.author._id, comment.author.avatarUrl)
          }
          crossOrigin="anonymous"
        />
      ) : (
        <div className="comment-avatar-fallback">
          <User size={16} strokeWidth={1.5} />
        </div>
      )}
      <div className="comment-content-wrapper">
        <div
          className={`comment-bubble ${isDeletedComment ? "comment-bubble-deleted" : ""}`}
        >
          <div className="comment-header">
            <span className="comment-author">
              <button
                type="button"
                className="comment-author-name"
                onClick={() => handleOpenProfile(comment.author._id)}
              >
                {comment.author.username}
              </button>
              {comment.replyTo && (
                <>
                  <span className="reply-arrow"> ▸ </span>
                  <button
                    type="button"
                    className="reply-to-name"
                    onClick={() => handleOpenProfile(comment.replyTo._id)}
                  >
                    {comment.replyTo.username}
                  </button>
                </>
              )}
            </span>
            <Dropdown align="end" className="comment-menu">
              <Dropdown.Toggle variant="link" bsPrefix="p-0">
                <MoreVertical size={16} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {!isDeletedComment && isAuthor ? (
                  <>
                    <Dropdown.Item onClick={() => setIsEditing(true)}>
                      <Edit2 size={14} />
                      {t("posts.edit")}
                    </Dropdown.Item>
                    <Dropdown.Item
                      className="text-danger"
                      onClick={handleDelete}
                    >
                      <Trash2 size={14} />
                      {t("posts.delete")}
                    </Dropdown.Item>
                  </>
                ) : (
                  <Dropdown.Item onClick={() => setShowReportModal(true)}>
                    <Flag size={14} />
                    {t("posts.report")}
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
          </div>
          {isEditing ? (
            <Form.Control
              as="textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="comment-edit-input"
              rows={2}
              autoFocus
            />
          ) : (
            <p
              className={`comment-text ${isDeletedComment ? "comment-text-deleted" : ""}`}
            >
              {comment.content}
            </p>
          )}
        </div>

        {isEditing && (
          <div className="comment-edit-actions">
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => {
                setIsEditing(false);
                setEditText(comment.content);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleSaveEdit}
              disabled={updateCommentMutation.isLoading || !editText.trim()}
            >
              {updateCommentMutation.isLoading
                ? t("common.saving")
                : t("common.save")}
            </Button>
          </div>
        )}

        <div className="comment-actions">
          <button className="comment-action-btn" onClick={handleReply}>
            {t("posts.actions.reply")}
          </button>

          {level === 0 && replyCount > 0 && (
            <button
              className="comment-action-btn"
              onClick={() => setShowReplies(!showReplies)}
            >
              <MessageCircle size={12} />
              <span className="ms-1">
                {replyCount}{" "}
                {replyCount === 1 ? t("posts.reply") : t("posts.replies")}
              </span>
            </button>
          )}

          <span className="comment-time">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
              locale,
            })}
          </span>

          {isCommentEdited && (
            <span className="comment-edited-indicator">
              {t("common.edited")}
            </span>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && user && (
          <Form onSubmit={handleSubmitReply} className="reply-form mt-2">
            <div className="reply-input-wrapper">
              {user.avatar ? (
                <img
                  src={getAvatarUrl(user._id, user.avatar)}
                  alt={user.username}
                  className="reply-avatar"
                  onLoad={() => cacheAvatar(user._id, user.avatar)}
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="reply-avatar-fallback">
                  <User size={14} strokeWidth={1.5} />
                </div>
              )}
              <Form.Control
                type="text"
                placeholder={`${t("posts.replyTo")} ${comment.author.username}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="reply-input"
                autoFocus
              />
              <Button
                type="submit"
                variant="link"
                className="reply-send-btn"
                disabled={!replyText.trim() || createCommentMutation.isLoading}
              >
                <Send size={16} />
              </Button>
            </div>
          </Form>
        )}

        {/* Nested Replies */}
        {showReplies && replies.length > 0 && level === 0 && (
          <div className="comment-replies">
            {replies.map((reply) => (
              <Comment
                key={reply._id}
                comment={reply}
                postId={postId}
                level={1}
                topLevelCommentId={rootCommentId}
                onNavigateProfile={onNavigateProfile}
              />
            ))}
          </div>
        )}
      </div>

      {showReportModal && (
        <ReportPostModal
          show={showReportModal}
          onHide={() => setShowReportModal(false)}
          onSubmit={handleSubmitReport}
          isSubmitting={Boolean(
            reportCommentMutation.isPending || reportCommentMutation.isLoading,
          )}
        />
      )}
    </div>
  );
};

export default Comment;
