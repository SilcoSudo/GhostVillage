import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import "./ReportPostModal.css";

const ReportPostModal = ({ show, onHide, onSubmit, isSubmitting = false }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const minReasonLength = 15;

  const reasonOptions = [
    { value: "SPAM", label: t("posts.reasonSpam") || "Spam or repetitive ads" },
    { value: "SCAM", label: t("posts.reasonScam") || "Scam or phishing" },
    {
      value: "ABUSE",
      label: t("posts.reasonAbuse") || "Harassment, hate speech, or threats",
    },
    {
      value: "ADULT",
      label: t("posts.reasonAdult") || "Adult or explicit content",
    },
    {
      value: "MISINFO",
      label: t("posts.reasonMisinfo") || "Harmful misinformation",
    },
    {
      value: "OFF_TOPIC",
      label: t("posts.reasonOffTopic") || "Off-topic or irrelevant content",
    },
    { value: "OTHER", label: t("posts.reasonOther") || "Other" },
  ];

  useEffect(() => {
    if (!show) {
      setReason("");
      setCustomReason("");
    }
  }, [show]);

  const isOtherReason = reason === "OTHER";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;

    const trimmedCustomReason = customReason.trim();
    if (isOtherReason && trimmedCustomReason.length < minReasonLength) return;

    await onSubmit({
      reason,
      customReason: isOtherReason ? trimmedCustomReason : "",
    });
  };

  return (
    <>
      {isSubmitting && (
        <div className="report-fullscreen-loading">
          <div className="report-fullscreen-loading-content">
            <Spinner animation="border" role="status" />
            <p>{t("posts.reportProcessing") || "Đang xử lý báo cáo..."}</p>
          </div>
        </div>
      )}

      <Modal show={show} onHide={onHide} centered className="report-post-modal">
        <Modal.Header closeButton>
          <Modal.Title>{t("posts.report")}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>{t("posts.reportReason") || "Reason"}</Form.Label>
              <Form.Control
                as="select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">
                  {t("posts.selectReason") || "Select a reason"}
                </option>
                {reasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>

            {isOtherReason && (
              <Form.Group className="mt-3">
                <Form.Label>
                  {t("posts.reportReasonDetail") || "Please describe details"}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={
                    t("posts.reportReasonPlaceholder") ||
                    "Describe clearly why you are reporting this post"
                  }
                  minLength={minReasonLength}
                  maxLength={500}
                  required={isOtherReason}
                />
                <Form.Text className="text-muted">
                  {`${customReason.trim().length}/500`}
                </Form.Text>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              className="report-cancel-btn"
              onClick={onHide}
              disabled={isSubmitting}
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              className="report-submit-btn"
              type="submit"
              disabled={
                isSubmitting ||
                !reason ||
                (isOtherReason && customReason.trim().length < minReasonLength)
              }
            >
              {isSubmitting
                ? t("common.loading") || "Submitting..."
                : t("posts.report")}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default ReportPostModal;
