import React, { useState, useEffect } from "react";
import { X, Loader2, Save } from "lucide-react";
import mapService from "../../shared/services/mapService";
import "../assets/styles/Modal.css";

/**
 * Edit Map Modal Component
 * Modal để chỉnh sửa metadata của map
 */
const EditMapModal = ({ map, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    displayName: "",
    requiredLevel: 1,
    shortDescription: "",
    thumbnailUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load dữ liệu map vào form
  useEffect(() => {
    if (map && map.identityConfig) {
      setFormData({
        displayName: map.identityConfig.displayName || "",
        requiredLevel: map.identityConfig.requiredLevel || 1,
        shortDescription: map.identityConfig.shortDescription || "",
        thumbnailUrl: map.identityConfig.thumbnailUrl || "",
      });
    }
  }, [map]);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 1 : value,
    }));
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.displayName.trim()) {
      setError("Tên bản đồ không được để trống");
      return;
    }

    if (formData.requiredLevel < 1) {
      setError("Cấp độ yêu cầu phải lớn hơn 0");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await mapService.updateMapMetadata(map._id, formData);

      if (response.success) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error updating map:", err);
      setError(err.response?.data?.message || "Lỗi khi cập nhật bản đồ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Chỉnh sửa bản đồ</h2>
            <p className="map-id">
              {map?.identityConfig?.mapId}
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Error Message */}
          {error && (
            <div className="modal-error">{error}</div>
          )}

          {/* Display Name */}
          <div className="form-group">
            <label className="form-label">
              Tên hiển thị <span className="required">*</span>
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="form-input"
              placeholder="Nhập tên hiển thị của bản đồ"
              required
            />
          </div>

          {/* Required Level */}
          <div className="form-group">
            <label className="form-label">
              Cấp độ yêu cầu <span className="required">*</span>
            </label>
            <input
              type="number"
              name="requiredLevel"
              value={formData.requiredLevel}
              onChange={handleChange}
              min="1"
              className="form-input"
              required
            />
            <p className="form-helper">
              Cấp độ tối thiểu để người chơi có thể vào bản đồ này
            </p>
          </div>

          {/* Short Description */}
          <div className="form-group">
            <label className="form-label">Mô tả ngắn</label>
            <textarea
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              rows="3"
              className="form-textarea"
              placeholder="Nhập mô tả ngắn về bản đồ"
            />
          </div>

          {/* Thumbnail URL */}
          <div className="form-group">
            <label className="form-label">Thumbnail URL</label>
            <input
              type="text"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleChange}
              className="form-input"
              placeholder="/images/maps/map-thumbnail.jpg"
            />
            {formData.thumbnailUrl && (
              <div className="image-preview">
                <img
                  src={formData.thumbnailUrl}
                  alt="Preview"
                  style={{ width: '100%', height: 'auto' }}
                  onError={(e) => {
                    e.target.src = "/images/default-map.png";
                  }}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="modal-btn modal-btn-cancel"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="spinner" size={18} />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMapModal;
