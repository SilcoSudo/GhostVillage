import React, { useState } from 'react';
import { Dropdown, Form, Button } from 'react-bootstrap';
import { MoreVertical, Trash2, MessageCircle, Send, Edit2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../app/context/AuthContext';
import { useDeleteComment, useCreateComment, useComments, useUpdateComment } from '../hooks/useComments';
import './Comment.css';

const Comment = ({ comment, postId, level = 0, topLevelCommentId = null }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  
  const deleteCommentMutation = useDeleteComment(postId);
  const createCommentMutation = useCreateComment(postId);
  const updateCommentMutation = useUpdateComment(postId);
  
  // Get the top-level comment ID (for flat reply structure)
  const rootCommentId = topLevelCommentId || comment._id;
  
  // Get replies for this comment (only fetch for top-level comments)
  const { data: repliesData } = useComments(postId, { 
    parentId: level === 0 ? comment._id : null 
  });

  const locale = i18n.language === 'vi' ? vi : enUS;
  const replies = repliesData?.data || [];
  const replyCount = replies.length;

  const handleDelete = async () => {
    if (window.confirm(t('posts.confirmDeleteComment'))) {
      await deleteCommentMutation.mutateAsync(comment._id);
    }
  };

  const handleReply = () => {
    setShowReplyForm(!showReplyForm);
    setReplyText('');
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      await createCommentMutation.mutateAsync({
        content: replyText,
        parentId: rootCommentId
      });
      setReplyText('');
      setShowReplyForm(false);
      setShowReplies(true); // Auto show replies after posting
    } catch (error) {
      console.error('Failed to post reply:', error);
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
        commentData: { content: editText }
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const isAuthor = user?._id === comment.author._id;

  return (
    <div className="comment-item">
      <img
        src={comment.author.avatarUrl || '/default-avatar.png'}
        alt={comment.author.username}
        className="comment-avatar"
      />
      <div className="comment-content-wrapper">
        <div className="comment-bubble">
          <div className="comment-header">
            <span className="comment-author">
              <span className="comment-author-name">{comment.author.username}</span>
              {comment.replyTo && (
                <>
                  <span className="reply-arrow"> ▸ </span>
                  <span className="reply-to-name" onClick={() => window.location.href = `/profile/${comment.replyTo._id}`}>
                    {comment.replyTo.username}
                  </span>
                </>
              )}
            </span>
            {isAuthor && (
              <Dropdown align="end" className="comment-menu">
                <Dropdown.Toggle variant="link" bsPrefix="p-0">
                  <MoreVertical size={16} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setIsEditing(true)}>
                    <Edit2 size={14} />
                    {t('posts.edit')}
                  </Dropdown.Item>
                  <Dropdown.Item className="text-danger" onClick={handleDelete}>
                    <Trash2 size={14} />
                    {t('posts.delete')}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
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
            <p className="comment-text">{comment.content}</p>
          )}
        </div>
        
        {isEditing && (
          <div className="comment-edit-actions">
            <Button size="sm" variant="outline-secondary" onClick={() => { setIsEditing(false); setEditText(comment.content); }}>
              {t('common.cancel')}
            </Button>
            <Button 
              size="sm" 
              variant="primary" 
              onClick={handleSaveEdit}
              disabled={updateCommentMutation.isLoading || !editText.trim()}
            >
              {updateCommentMutation.isLoading ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        )}
        
        <div className="comment-actions">
          <button 
            className="comment-action-btn"
            onClick={handleReply}
          >
            {t('posts.actions.reply')}
          </button>

          {level === 0 && replyCount > 0 && (
            <button 
              className="comment-action-btn"
              onClick={() => setShowReplies(!showReplies)}
            >
              <MessageCircle size={12} />
              <span className="ms-1">
                {replyCount} {replyCount === 1 ? t('posts.reply') : t('posts.replies')}
              </span>
            </button>
          )}
          
          <span className="comment-time">
            {formatDistanceToNow(new Date(comment.createdAt), { 
              addSuffix: true,
              locale 
            })}
          </span>
        </div>

        {/* Reply Form */}
        {showReplyForm && user && (
          <Form onSubmit={handleSubmitReply} className="reply-form mt-2">
            <div className="reply-input-wrapper">
              <img 
                src={user.avatar || '/default-avatar.png'} 
                alt={user.username}
                className="reply-avatar"
              />
              <Form.Control
                type="text"
                placeholder={`${t('posts.replyTo')} ${comment.author.username}...`}
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
            {replies.map(reply => (
              <Comment 
                key={reply._id} 
                comment={reply} 
                postId={postId}
                level={1}
                topLevelCommentId={rootCommentId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;
