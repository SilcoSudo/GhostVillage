import React, { useState, useEffect } from "react";
import { X, Loader2, Shirt, Upload, Image as ImageIcon } from "lucide-react";
import costumeService from "../../shared/services/costumeService";
import "../assets/styles/Modal.css";

/**
 * Edit Costume Modal Component
 * Modal để chỉnh sửa costume
 */
const EditCostumeModal = ({ costume, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rarity: "Common",
    category: "Full Body",
    visualAsset: "",
    thumbnailAsset: "",
    price: 0,
    specialPrice: 0,
    isAvailableInStore: true,
    requiredLevel: 1,
    tags: "",
    // Stats
    defense: 0,
    speed: 0,
    luck: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visualPreview, setVisualPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  // Load costume data vào form
  useEffect(() => {
    if (costume) {
      setFormData({
        name: costume.name || "",
        description: costume.description || "",
        rarity: costume.rarity || "Common",
        category: costume.category || "Full Body",
        visualAsset: costume.visualAsset || "",
        thumbnailAsset: costume.thumbnailAsset || "",
        price: costume.price || 0,
        specialPrice: costume.specialPrice || 0,
        isAvailableInStore: costume.isAvailableInStore ?? true,
        requiredLevel: costume.requiredLevel || 1,
        tags: costume.tags ? costume.tags.join(", ") : "",
        defense: costume.stats?.defense || 0,
        speed: costume.stats?.speed || 0,
        luck: costume.stats?.luck || 0,
      });
      // Set existing images as preview
      if (costume.visualAsset) {
        setVisualPreview(costume.visualAsset);
      }
      if (costume.thumbnailAsset) {
        setThumbnailPreview(costume.thumbnailAsset);
      }
    }
  }, [costume]);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  /**
   * Handle image file upload
   */
  const handleImageUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh (JPG, PNG, GIF, etc.)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      
      // Update form data
      setFormData((prev) => ({
        ...prev,
        [fieldName]: base64String,
      }));

      // Update preview
      if (fieldName === "visualAsset") {
        setVisualPreview(base64String);
      } else if (fieldName === "thumbnailAsset") {
        setThumbnailPreview(base64String);
      }
    };

    reader.onerror = () => {
      setError("Lỗi khi đọc file ảnh");
    };

    reader.readAsDataURL(file);
  };

  /**
   * Clear image
   */
  const clearImage = (fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: "",
    }));

    if (fieldName === "visualAsset") {
      setVisualPreview(null);
    } else if (fieldName === "thumbnailAsset") {
      setThumbnailPreview(null);
    }
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.description) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (!formData.visualAsset) {
      setError("Vui lòng upload ảnh visual asset");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare data
      const costumeData = {
        name: formData.name,
        description: formData.description,
        rarity: formData.rarity,
        category: formData.category,
        visualAsset: formData.visualAsset,
        thumbnailAsset: formData.thumbnailAsset || undefined,
        price: formData.price,
        specialPrice: formData.specialPrice || undefined,
        isAvailableInStore: formData.isAvailableInStore,
        requiredLevel: formData.requiredLevel,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim())
          : [],
        stats: {
          defense: formData.defense,
          speed: formData.speed,
          luck: formData.luck,
        },
      };

      const response = await costumeService.updateCostume(
        costume._id,
        costumeData
      );

      if (response.success) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error updating costume:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.join(", ") ||
          "Lỗi khi cập nhật costume"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: "700px" }}>
        <div className="modal-header">
          <h2>
            <Shirt size={24} />
            Chỉnh sửa Costume
          </h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Error Message */}
            {error && <div className="modal-error-message">{error}</div>}

            {/* Costume ID (readonly) */}
            <div className="modal-section">
              <div className="form-group">
                <label className="form-label">Costume ID (không thể chỉnh sửa)</label>
                <input
                  type="text"
                  value={costume.costumeId}
                  className="form-input"
                  readOnly
                  disabled
                  style={{ opacity: 0.6, cursor: "not-allowed" }}
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="modal-section">
              <h3 className="modal-section-title">Thông tin cơ bản</h3>

              <div className="form-group">
                <label className="form-label">
                  Tên <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ghost Kimono"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Mô tả <span className="required">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Nhập mô tả chi tiết về costume..."
                  className="form-textarea"
                  rows={3}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rarity</label>
                  <select
                    name="rarity"
                    value={formData.rarity}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="Common">Common</option>
                    <option value="Rare">Rare</option>
                    <option value="Epic">Epic</option>
                    <option value="Legendary">Legendary</option>
                    <option value="Mythic">Mythic</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="Full Body">Full Body</option>
                    <option value="Head">Head</option>
                    <option value="Body">Body</option>
                    <option value="Accessory">Accessory</option>
                    <option value="Weapon">Weapon</option>
                    <option value="Pet">Pet</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Visual Assets */}
            <div className="modal-section">
              <h3 className="modal-section-title">Visual Assets</h3>

              <div className="form-group">
                <label className="form-label">
                  Visual Asset (Ảnh) <span className="required">*</span>
                </label>
                
                {!visualPreview ? (
                  <div className="image-upload-container">
                    <label className="image-upload-placeholder">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "visualAsset")}
                        style={{ display: "none" }}
                      />
                      <Upload size={32} />
                      <span>Click để upload ảnh Visual Asset</span>
                      <small>JPG, PNG, GIF - Max 5MB</small>
                    </label>
                  </div>
                ) : (
                  <div className="image-preview-wrapper">
                    <img src={visualPreview} alt="Visual Asset Preview" />
                    <button
                      type="button"
                      onClick={() => clearImage("visualAsset")}
                      className="image-remove-btn"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Thumbnail Asset (Ảnh)</label>
                
                {!thumbnailPreview ? (
                  <div className="image-upload-container">
                    <label className="image-upload-placeholder">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "thumbnailAsset")}
                        style={{ display: "none" }}
                      />
                      <ImageIcon size={32} />
                      <span>Click để upload ảnh Thumbnail</span>
                      <small>JPG, PNG, GIF - Max 5MB</small>
                    </label>
                  </div>
                ) : (
                  <div className="image-preview-wrapper">
                    <img src={thumbnailPreview} alt="Thumbnail Preview" />
                    <button
                      type="button"
                      onClick={() => clearImage("thumbnailAsset")}
                      className="image-remove-btn"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing & Shop */}
            <div className="modal-section">
              <h3 className="modal-section-title">Giá & Shop</h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Giá (Coin)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Giá Sale (Optional)</label>
                  <input
                    type="number"
                    name="specialPrice"
                    value={formData.specialPrice}
                    onChange={handleChange}
                    min="0"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Level yêu cầu</label>
                  <input
                    type="number"
                    name="requiredLevel"
                    value={formData.requiredLevel}
                    onChange={handleChange}
                    min="1"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      name="isAvailableInStore"
                      checked={formData.isAvailableInStore}
                      onChange={handleChange}
                      className="form-checkbox"
                    />
                    Hiển thị trong shop
                  </label>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="modal-section">
              <h3 className="modal-section-title">Stats (Bonus)</h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Defense</label>
                  <input
                    type="number"
                    name="defense"
                    value={formData.defense}
                    onChange={handleChange}
                    min="0"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Speed</label>
                  <input
                    type="number"
                    name="speed"
                    value={formData.speed}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Luck</label>
                  <input
                    type="number"
                    name="luck"
                    value={formData.luck}
                    onChange={handleChange}
                    min="0"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="modal-section">
              <h3 className="modal-section-title">Tags</h3>

              <div className="form-group">
                <label className="form-label">
                  Tags (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="halloween, premium, limited"
                  className="form-input"
                />
                <small className="form-hint">
                  VD: halloween, christmas, premium
                </small>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCostumeModal;
