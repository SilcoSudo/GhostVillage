import React, { useState, useEffect, useRef } from "react";
import { Modal, Form, Button, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useCreatePost, useUpdatePost } from "../hooks/usePosts";
import { toast } from "react-hot-toast";
import { X } from "lucide-react";
import TiptapEditor from "./TiptapEditor";
import { uploadImage } from "../services/uploadService";
import "./CreatePostModal.css";

const CreatePostModal = ({ show, onHide, post = null, mode = "create" }) => {
  const { t } = useTranslation();
  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePost();
  const isEditMode = mode === "edit" && post;
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  // (No custom cleanup here; rely on React-Bootstrap modal lifecycle)
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    category: "General",
  });

  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const categories = [
    { key: "General", label: t("posts.categories.general") },
    { key: "Discussion", label: t("posts.categories.discussion") },
    { key: "Trading", label: t("posts.categories.trading") },
    { key: "Team Up", label: t("posts.categories.teamUp") },
    { key: "Bug Report", label: t("posts.categories.bugReport") },
  ];

  const [errors, setErrors] = useState({});

  // Load post data when editing
  useEffect(() => {
    if (isEditMode && post) {
      setFormData({
        title: post.title || "",
        body: post.body || "",
        category: post.category || "General",
      });
      setUploadedImages(
        (post.media || [])
          .filter((media) => media.type === "image" || media.type === "video")
          .map((media) => ({
            ...media,
            preview: media.url,
          })),
      );
    } else if (!show) {
      // Reset form when modal closes
      setFormData({ title: "", body: "", category: "General" });
      setErrors({});
      setUploadedImages([]);
    }
  }, [show, isEditMode, post]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBodyChange = (body) => {
    setFormData((prev) => ({ ...prev, body }));

    // Clear error when user starts typing
    if (errors.body) {
      setErrors((prev) => ({ ...prev, body: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.body.trim()) {
      newErrors.body = "Content is required";
    } else if (formData.body.trim().length < 10) {
      newErrors.body = "Content must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsUploading(true);

      // Upload all media files first
      const uploadedMedia = [];
      for (const media of uploadedImages) {
        if (media.file) {
          // Upload to Cloudinary
          try {
            const result = await uploadImage(media.file);
            uploadedMedia.push({
              url: result.url,
              type: media.type,
              publicId: result.publicId,
            });
          } catch (error) {
            toast.error(
              `Failed to upload ${media.file.name}: ${error.response?.data?.message || "Upload failed"}`,
            );
            setIsUploading(false);
            return; // Stop if any upload fails
          }
        } else if (
          media.url &&
          (media.type === "image" || media.type === "video")
        ) {
          // Existing media don't need uploading
          uploadedMedia.push({
            url: media.url,
            type: media.type,
            ...(media.publicId ? { publicId: media.publicId } : {}),
          });
        }
      }

      setIsUploading(false);

      // Create post with uploaded media
      const postData = {
        title: formData.title.substring(0, 200),
        body: formData.body,
        category: formData.category,
        media: uploadedMedia,
      };

      if (isEditMode) {
        await updatePostMutation.mutateAsync({ postId: post._id, postData });
        toast.success("Post updated successfully!");
      } else {
        await createPostMutation.mutateAsync(postData);
        toast.success("Post created successfully!");
      }

      // Reset form
      setFormData({ title: "", body: "", category: "General" });
      setErrors({});
      setUploadedImages([]);
      onHide();
    } catch (error) {
      setIsUploading(false);
      console.error("❌ Failed to save post:", error);
      toast.error(
        error.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} post`,
      );
    }
  };

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setCategoryDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setCategoryDropdownOpen(false);
      }
    };

    if (categoryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [categoryDropdownOpen]);

  const handleImageUploadClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/jpg",
        "image/bmp",
        "image/svg+xml",
      ];

      const validFiles = files.filter((file) => {
        if (!allowedTypes.includes(file.type)) {
          toast.error(
            `${file.name}: Invalid type. Allowed: ${allowedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")}`,
          );
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: Too large. Max 5MB.`);
          return false;
        }
        return true;
      });

      // Save files locally (don't upload yet)
      for (const file of validFiles) {
        const preview = URL.createObjectURL(file);
        setUploadedImages((prev) => [
          ...prev,
          { file, preview, type: "image" },
        ]);
        toast.success(`${file.name} added!`);
      }
    };

    input.click();
  };

  const handleVideoUploadClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.multiple = true;

    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      const allowedTypes = ["video/mp4", "video/webm", "video/ogg"];

      const validFiles = files.filter((file) => {
        if (!allowedTypes.includes(file.type)) {
          toast.error(`${file.name}: Invalid type. Allowed: MP4, WebM, OGG`);
          return false;
        }
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name}: Too large. Max 50MB.`);
          return false;
        }
        return true;
      });

      // Save files locally (don't upload yet)
      for (const file of validFiles) {
        const preview = URL.createObjectURL(file);
        setUploadedImages((prev) => [
          ...prev,
          { file, preview, type: "video" },
        ]);
        toast.success(`${file.name} added!`);
      }
    };

    input.click();
  };

  const handleClose = () => {
    // Clean up object URLs to free memory
    uploadedImages.forEach((media) => {
      if (media.preview && media.preview.startsWith("blob:")) {
        URL.revokeObjectURL(media.preview);
      }
    });

    // Reset form data
    setFormData({ title: "", body: "", category: "General" });
    setErrors({});
    setUploadedImages([]);

    // Call parent onHide
    onHide();
  };

  const handleRemoveMedia = (idx) => {
    // Clean up object URL to free memory
    const media = uploadedImages[idx];
    if (media && media.preview && media.preview.startsWith("blob:")) {
      URL.revokeObjectURL(media.preview);
    }

    // Remove from state
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      className="create-post-modal"
      backdrop={true}
      keyboard={true}
      animation={true}
    >
      {/* Fullscreen loading overlay */}
      {isUploading && (
        <div className="modal-loading-overlay">
          <Spinner animation="border" role="status" />
          <p>Uploading...</p>
        </div>
      )}

      <Modal.Header closeButton>
        <Modal.Title>
          {isEditMode ? t("post.edit.title") : t("post.create.title")}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Title and Category Row */}
          <div className="row mb-3">
            <div className="col-9">
              <Form.Group>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={t("post.create.titlePlaceholder")}
                  isInvalid={!!errors.title}
                  maxLength={200}
                  className="title-input"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.title}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="col-3">
              <Form.Group>
                <div className="category-dropdown" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    className={`category-dropdown-toggle ${categoryDropdownOpen ? "active" : ""}`}
                    onClick={() =>
                      setCategoryDropdownOpen(!categoryDropdownOpen)
                    }
                  >
                    <span className="category-dropdown-text">
                      {categories.find((cat) => cat.key === formData.category)
                        ?.label || t("post.create.category")}
                    </span>
                    <svg
                      className={`category-dropdown-arrow ${categoryDropdownOpen ? "rotate" : ""}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      width="16"
                      height="16"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m2 5 6 6 6-6"
                      />
                    </svg>
                  </button>

                  {categoryDropdownOpen && (
                    <div className="category-dropdown-menu">
                      {categories.map((category) => (
                        <div
                          key={category.key}
                          className={`category-dropdown-item ${formData.category === category.key ? "active" : ""}`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              category: category.key,
                            }));
                            setCategoryDropdownOpen(false);
                          }}
                        >
                          {category.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Form.Group>
            </div>
          </div>

          {/* Body with Tiptap Rich Text Editor */}
          <Form.Group className="mb-3">
            <TiptapEditor
              content={formData.body}
              onChange={handleBodyChange}
              placeholder={t("post.create.contentPlaceholder")}
              className={errors.body ? "is-invalid" : ""}
              onImageUpload={handleImageUploadClick}
              onVideoUpload={handleVideoUploadClick}
            />
            {errors.body && (
              <div className="invalid-feedback d-block">{errors.body}</div>
            )}
            <Form.Text className="char-counter">
              {formData.body.replace(/<[^>]*>/g, "").length}{" "}
              {t("post.create.contentCounter")}
            </Form.Text>
          </Form.Group>

          {/* Media Upload Section */}
          {(uploadedImages.length > 0 || isUploading) && (
            <div className="uploaded-media-preview">
              <div className="media-grid">
                {isUploading && (
                  <div className="media-preview-item upload-spinner-item">
                    <Spinner animation="border" role="status" />
                  </div>
                )}
                {uploadedImages.map((media, idx) => (
                  <div key={idx} className="media-preview-item">
                    {media.type === "image" && (
                      <img src={media.preview || media.url} alt="preview" />
                    )}
                    {media.type === "video" && (
                      <video src={media.preview || media.url} />
                    )}
                    <button
                      type="button"
                      className="remove-media-btn"
                      onClick={() => handleRemoveMedia(idx)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Form>
      </Modal.Body>

      <Modal.Footer className="justify-content-end">
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={
            createPostMutation.isLoading || updatePostMutation.isLoading
          }
          className="add-btn"
        >
          {createPostMutation.isLoading || updatePostMutation.isLoading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {isEditMode
                ? t("post.edit.savingButton")
                : t("post.create.creatingButton")}
            </>
          ) : isEditMode ? (
            t("post.edit.saveButton")
          ) : (
            t("post.create.addButton")
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreatePostModal;
