import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { Link2, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import "./ShareModal.css";

const ShareModal = ({ show, onHide, post }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Share link with postId query param
  const postUrl = `${window.location.origin}/posts?postId=${post?._id}`;
  const postTitle = post?.title || "";
  const postDescription =
    post?.body?.replace(/<[^>]*>/g, "").substring(0, 100) || "";

  const handleCopyLink = async () => {
    try {
      // Create shareable text with post info
      const shareText = t("posts.shareText", {
        title: postTitle,
        url: postUrl,
      });
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success(t("posts.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t("posts.copyLinkFailed"));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="share-modal">
      <Modal.Header closeButton>
        <Modal.Title>{t("posts.sharePost")}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Post Info */}
        <div className="share-post-info mb-3">
          <h6 className="post-title-preview">{postTitle}</h6>
          {postDescription && (
            <p className="post-desc-preview">{postDescription}...</p>
          )}
        </div>

        {/* Copy Link */}
        <div className="share-option copy-link-section">
          <Button
            variant="primary"
            onClick={handleCopyLink}
            className="copy-btn w-100"
          >
            {copied ? (
              <>
                <Check size={18} />
                <span className="ms-2">{t("posts.copied")}</span>
              </>
            ) : (
              <>
                <Link2 size={18} />
                <span className="ms-2">{t("posts.copyLink")}</span>
              </>
            )}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ShareModal;
