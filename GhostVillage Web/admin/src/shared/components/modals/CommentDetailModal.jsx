import React from "react";
import { useTranslation } from "react-i18next";
import { X, MessageCircle } from "lucide-react";
import "./assets/styles/CommentDetailModal.css";

const CommentDetailModal = ({ isOpen, comment, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen || !comment) return null;

  return (
    <div className="modal-overlay comment-detail-overlay" onClick={onClose}>
      <div
        className="modal-content comment-detail-shell comment-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="header-title">
            <MessageCircle size={20} className="header-icon" />
            <h2>{t("comments.commentDetail") || "Comment Details"}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body comment-detail-body">
          <div className="comment-content-box comment-only-box">
            {comment.content || comment.commentText}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentDetailModal;
