import { useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Accordion,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/hooks/useAuth";
import { uploadImage } from "../../posts/services/uploadService";
import {
  useCreateSupportTicket,
  useMySupportTickets,
} from "../hooks/useSupportTicket";
import "./SupportTicketPage.css";

const MAX_ATTACHMENTS = 5;
const MAX_IMAGE_SIZE_MB = 5;
const ACTIVE_TICKET_STATUSES = ["OPEN", "IN_PROGRESS"];
const ARCHIVED_TICKET_STATUSES = ["RESOLVED", "CLOSED"];

const defaultForm = {
  subject: "",
  message: "",
};

const SupportTicketPage = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const createTicketMutation = useCreateSupportTicket();
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
  } = useMySupportTickets({ page: 1, limit: 20 });

  const [formData, setFormData] = useState(defaultForm);
  const fileInputRef = useRef(null);
  const [attachedImages, setAttachedImages] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [submittedTicketId, setSubmittedTicketId] = useState("");

  const subjectLength = formData.subject.trim().length;
  const messageLength = formData.message.trim().length;
  const tickets = historyData?.data?.tickets || [];
  const activeTickets = tickets.filter((ticket) =>
    ACTIVE_TICKET_STATUSES.includes(ticket?.status),
  );
  const archivedTickets = tickets.filter((ticket) =>
    ARCHIVED_TICKET_STATUSES.includes(ticket?.status),
  );

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString();
  };

  const getStatusVariant = (status) => {
    if (status === "OPEN") return "warning";
    if (status === "IN_PROGRESS") return "info";
    if (status === "RESOLVED") return "success";
    if (status === "CLOSED") return "secondary";
    return "light";
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setValidationError("");
  };

  const handleAttachImages = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remainingSlots = MAX_ATTACHMENTS - attachedImages.length;
    if (remainingSlots <= 0) {
      setValidationError(
        t("support.attachmentsLimit", { max: MAX_ATTACHMENTS }),
      );
      event.target.value = "";
      return;
    }

    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isWithinSize = file.size <= MAX_IMAGE_SIZE_MB * 1024 * 1024;

      if (!isImage) {
        setValidationError(t("support.attachmentsImageOnly"));
        return false;
      }

      if (!isWithinSize) {
        setValidationError(
          t("support.attachmentsMaxSize", { maxSize: MAX_IMAGE_SIZE_MB }),
        );
        return false;
      }

      return true;
    });

    const filesToAdd = validFiles.slice(0, remainingSlots);
    const mapped = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    if (mapped.length < validFiles.length || files.length > remainingSlots) {
      setValidationError(
        t("support.attachmentsLimit", { max: MAX_ATTACHMENTS }),
      );
    }

    if (mapped.length > 0) {
      setAttachedImages((prev) => [...prev, ...mapped]);
    }

    event.target.value = "";
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAttachedImage = (indexToRemove) => {
    setAttachedImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(indexToRemove, 1);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError("");
    setSubmittedTicketId("");

    if (subjectLength < 5 || subjectLength > 150) {
      setValidationError(t("support.subjectValidation"));
      return;
    }

    if (messageLength < 15 || messageLength > 3000) {
      setValidationError(t("support.messageValidation"));
      return;
    }

    if (attachedImages.length > MAX_ATTACHMENTS) {
      setValidationError(
        t("support.attachmentsLimit", { max: MAX_ATTACHMENTS }),
      );
      return;
    }

    let uploadedAttachments = [];
    if (attachedImages.length > 0) {
      try {
        setIsUploadingImages(true);
        uploadedAttachments = await Promise.all(
          attachedImages.map(async (item) => {
            const uploadResult = await uploadImage(item.file);
            return {
              url: uploadResult?.url,
              publicId: uploadResult?.publicId || null,
            };
          }),
        );
      } catch (error) {
        setValidationError(
          error?.response?.data?.message ||
            t("support.attachmentsUploadFailed"),
        );
        setIsUploadingImages(false);
        return;
      }
      setIsUploadingImages(false);
    }

    let response;
    try {
      response = await createTicketMutation.mutateAsync({
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        attachments: uploadedAttachments,
      });
    } catch (error) {
      setValidationError(
        error?.response?.data?.message || t("support.submitFailed"),
      );
      return;
    }

    attachedImages.forEach((item) => {
      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
      }
    });

    setFormData(defaultForm);
    setAttachedImages([]);
    setSubmittedTicketId(response?.data?._id || "");
  };

  const renderTicketItem = (ticket) => (
    <div key={ticket._id} className="support-ticket-history-item">
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div>
          <h6 className="mb-1">{ticket.subject}</h6>
          <div className="text-muted small">
            {t("support.ticketId")} #{ticket._id}
          </div>
        </div>

        <Badge bg={getStatusVariant(ticket.status)}>
          {t(`support.status.${ticket.status}`)}
        </Badge>
      </div>

      <p className="mb-2 mt-2 support-ticket-message">{ticket.message}</p>

      {Array.isArray(ticket.attachments) && ticket.attachments.length > 0 && (
        <div className="support-ticket-history-attachments">
          {ticket.attachments.map((image, index) => (
            <a
              key={`${ticket._id}-img-${index}`}
              href={image.url}
              target="_blank"
              rel="noreferrer"
              className="support-ticket-history-attachment-link"
            >
              <img
                src={image.url}
                alt={`ticket-attachment-${index + 1}`}
                className="support-ticket-history-attachment"
              />
            </a>
          ))}
        </div>
      )}

      <div className="text-muted small">
        {t("support.createdAt")} {formatDate(ticket.createdAt)}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="support-page-wrapper">
        <Container className="support-ticket-page">
          <div className="d-flex justify-content-center align-items-center py-4">
            <Spinner animation="border" role="status" />
          </div>
        </Container>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="support-page-wrapper">
      <Container className="support-ticket-page">
        <Row className="g-4 support-main-row">
          <Col lg={7} className="support-form-column">
            <Card className="mb-4 support-card">
              <Card.Body>
                <h2 className="mb-2 support-page-title">
                  {t("support.title")}
                </h2>
                <p className="support-subtitle mb-4">{t("support.subtitle")}</p>

                {submittedTicketId && (
                  <Alert variant="success" className="mb-4">
                    {t("support.submitSuccess")} #{submittedTicketId}
                  </Alert>
                )}

                {validationError && (
                  <Alert variant="warning" className="mb-4">
                    {validationError}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit} className="support-form">
                  <Form.Group className="mb-3">
                    <Form.Label>{t("support.subjectLabel")}</Form.Label>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder={t("support.subjectPlaceholder")}
                      minLength={5}
                      maxLength={150}
                      required
                    />
                    <Form.Text className="text-muted">{`${subjectLength}/150`}</Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{t("support.messageLabel")}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t("support.messagePlaceholder")}
                      minLength={15}
                      maxLength={3000}
                      required
                    />
                    <Form.Text className="text-muted">{`${messageLength}/3000`}</Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>{t("support.attachmentsLabel")}</Form.Label>
                    <div className="support-file-input-wrap">
                      <input
                        ref={fileInputRef}
                        className="support-file-input-native"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAttachImages}
                      />
                      <div className="support-file-picker-row">
                        <button
                          type="button"
                          className="support-file-input-trigger"
                          onClick={handleOpenFilePicker}
                        >
                          {t("support.chooseFiles") || "Choose Files"}
                        </button>
                        <span className="support-file-input-name">
                          {attachedImages.length > 0
                            ? `${attachedImages.length} ${
                                t("support.filesSelected") || "files selected"
                              }`
                            : t("support.noFileChosen") || "No file chosen"}
                        </span>
                      </div>
                    </div>
                    <Form.Text className="text-muted">
                      {t("support.attachmentsHint", { max: MAX_ATTACHMENTS })}
                    </Form.Text>

                    {attachedImages.length > 0 && (
                      <div className="support-attachments-preview mt-3">
                        {attachedImages.map((item, index) => (
                          <div
                            key={`${item.file.name}-${index}`}
                            className="support-attachment-item"
                          >
                            <img
                              src={item.preview}
                              alt={item.file.name}
                              className="support-attachment-thumb"
                            />
                            <button
                              type="button"
                              className="support-attachment-remove"
                              onClick={() => handleRemoveAttachedImage(index)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Form.Group>

                  <div className="support-submit-row">
                    <Button
                      className="support-submit-btn"
                      type="submit"
                      variant="primary"
                      disabled={
                        createTicketMutation.isLoading || isUploadingImages
                      }
                    >
                      {createTicketMutation.isLoading || isUploadingImages
                        ? t("support.submittingButton")
                        : t("support.submitButton")}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={5} className="support-history-column">
            <Card className="support-card support-history-card">
              <Card.Body>
                <h4 className="mb-3 support-section-title">
                  {t("support.historyTitle")}
                </h4>

                {isHistoryLoading && (
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <Spinner animation="border" size="sm" />
                    <span>{t("support.historyLoading")}</span>
                  </div>
                )}

                {isHistoryError && (
                  <Alert variant="danger" className="mb-0">
                    {t("support.historyError")}
                  </Alert>
                )}

                {!isHistoryLoading &&
                  !isHistoryError &&
                  tickets.length === 0 && (
                    <p className="text-muted mb-0">
                      {t("support.historyEmpty")}
                    </p>
                  )}

                {!isHistoryLoading && !isHistoryError && tickets.length > 0 && (
                  <div className="support-history-content">
                    <div className="support-history-group mb-3">
                      <h6 className="support-history-group-title mb-2">
                        {t("support.activeTicketsTitle")}
                      </h6>

                      {activeTickets.length === 0 ? (
                        <p className="text-muted mb-0">
                          {t("support.activeTicketsEmpty")}
                        </p>
                      ) : (
                        <div className="support-ticket-history-list">
                          {activeTickets.map(renderTicketItem)}
                        </div>
                      )}
                    </div>

                    <Accordion className="support-history-accordion">
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>
                          {t("support.archivedTicketsTitle")} (
                          {archivedTickets.length})
                        </Accordion.Header>
                        <Accordion.Body>
                          {archivedTickets.length === 0 ? (
                            <p className="text-muted mb-0">
                              {t("support.archivedTicketsEmpty")}
                            </p>
                          ) : (
                            <div className="support-ticket-history-list">
                              {archivedTickets.map(renderTicketItem)}
                            </div>
                          )}
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SupportTicketPage;
