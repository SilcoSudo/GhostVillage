import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Save, Upload, Image as ImageIcon } from "lucide-react";
import wikiService from "../../shared/services/wikiService";
import uploadService from "../../shared/services/uploadService";
import "../assets/styles/Modal.css";

/**
 * Edit Wiki Modal Component
 * Modal để chỉnh sửa Wiki với Rich Text Editor & Image Upload
 */
const EditWikiModal = ({ wiki, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category: "Other",
    tags: [],
    status: "draft",
    isFeatured: false,
    isPublic: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Categories
  const categories = [
    "Monster Database",
    "Map Guide",
    "Item Database",
    "Game Guide",
    "Tutorial",
    "Lore",
    "FAQ",
    "Patch Notes",
    "Other",
  ];

  // Load wiki data
  useEffect(() => {
    if (wiki) {
      setFormData({
        title: wiki.title || "",
        slug: wiki.slug || "",
        content: wiki.content || "",
        excerpt: wiki.excerpt || "",
        category: wiki.category || "Other",
        tags: wiki.tags || [],
        status: wiki.status || "draft",
        isFeatured: wiki.isFeatured || false,
        isPublic: wiki.isPublic !== undefined ? wiki.isPublic : true,
      });
    }
  }, [wiki]);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /**
   * Auto-generate slug from title
   */
  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    }));
  };

  /**
   * Handle tag input
   */
  const handleTagInput = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !formData.tags.includes(tag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tag],
        }));
      }
      setTagInput("");
    }
  };

  /**
   * Remove tag
   */
  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  /**
   * Handle image upload
   */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError(t("wikiModal.errors.imageType"));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError(t("wikiModal.errors.imageSize"));
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);

      const response = await uploadService.uploadImage(file, 'wiki');
      const imageUrl = response.data?.avatar || response.avatar || "";

      // Insert image markdown at cursor position
      const textarea = document.querySelector('textarea[name="content"]');
      const cursorPos = textarea.selectionStart;
      const textBefore = formData.content.substring(0, cursorPos);
      const textAfter = formData.content.substring(cursorPos);
      const imageMarkdown = `\n![Image](${imageUrl})\n`;

      setFormData((prev) => ({
        ...prev,
        content: textBefore + imageMarkdown + textAfter,
      }));
    } catch (err) {
      console.error("Error uploading image:", err);
      setError(t("wikiModal.errors.uploadFailed"));
    } finally {
      setUploadingImage(false);
    }
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      setError(t("wikiModal.errors.titleRequired"));
      return;
    }

    if (!formData.slug.trim()) {
      setError(t("wikiModal.errors.slugRequired"));
      return;
    }

    if (!formData.content.trim()) {
      setError(t("wikiModal.errors.contentRequired"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await wikiService.updateWiki(wiki._id, formData);

      if (response.success) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error updating wiki:", err);
      setError(err.response?.data?.message || t("wikiModal.errors.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: "800px" }}>
        {/* Header */}
        <div className="modal-header">
          <h2>{t("wikiModal.editTitle")}</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Error Message */}
          {error && <div className="modal-error">{error}</div>}

          {/* Title */}
          <div className="form-group">
            <label className="form-label">
              {t("wiki.titleColumn")} <span className="required">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleTitleChange}
              className="form-input"
              placeholder={t("wikiModal.titlePlaceholder")}
              required
            />
          </div>

          {/* Slug */}
          <div className="form-group">
            <label className="form-label">
              Slug <span className="required">*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="form-input"
              placeholder="auto-generated-slug"
              required
            />
            <p className="form-helper">{t("wikiModal.slugHelper")}</p>
          </div>

          {/* Category & Status */}
          <div className="stats-grid">
            <div className="form-group">
              <label className="form-label">
                {t("wiki.categoryColumn")} <span className="required">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {t("common.status")} <span className="required">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Excerpt */}
          <div className="form-group">
            <label className="form-label">{t("wikiModal.excerpt")}</label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows="2"
              className="form-textarea"
              placeholder={t("wikiModal.excerptPlaceholder")}
              maxLength="500"
            />
            <p className="form-helper">{t("wikiModal.charCount", { count: formData.excerpt.length, max: 500 })}</p>
          </div>

          {/* Content with Image Upload */}
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                {t("common.description")} <span className="required">*</span>
              </label>
              <label className="image-upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                  disabled={uploadingImage}
                />
                {uploadingImage ? (
                  <Loader2 className="spinner" size={16} />
                ) : (
                  <ImageIcon size={16} />
                )}
                <span>{uploadingImage ? t("wikiModal.uploading") : t("wikiModal.uploadImage")}</span>
              </label>
            </div>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="12"
              className="form-textarea"
              placeholder={t("wikiModal.contentPlaceholder")}
              required
            />
            <p className="form-helper">
              {t("wikiModal.markdownHelp")}
            </p>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">{t("wikiModal.tags")}</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
              className="form-input"
              placeholder={t("wikiModal.tagsPlaceholder")}
            />
            {formData.tags.length > 0 && (
              <div className="tags-container">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="tag-badge">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="form-checkbox"
              />
              <span>{t("wikiModal.featured")}</span>
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                className="form-checkbox"
              />
              <span>{t("wikiModal.public")}</span>
            </label>
          </div>

          {/* Actions */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="modal-btn modal-btn-cancel"
              disabled={loading}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="spinner" size={18} />
                  <span>{t("wikiModal.saving")}</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>{t("common.save")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWikiModal;
