import React, { useState, useEffect } from "react";
import { X, Loader2, Save } from "lucide-react";
import consumableService from "../../shared/services/consumableService";
import "../assets/styles/Modal.css";

const EditConsumableModal = ({ consumable, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    itemName: "",
    itemType: "CONSUMABLE",
    prefabName: "",
    isActive: true,
  });
  const [statsJson, setStatsJson] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (consumable) {
      setFormData({
        itemName: consumable.itemName || "",
        itemType: consumable.itemType || "CONSUMABLE",
        prefabName: consumable.prefabName || "",
        isActive: consumable.isActive ?? true,
      });
      setStatsJson(JSON.stringify(consumable.stats || {}, null, 2));
    }
  }, [consumable]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.itemName.trim()) {
      setError("Tên item không được để trống");
      return;
    }

    if (!formData.prefabName.trim()) {
      setError("Prefab Name không được để trống");
      return;
    }

    let parsedStats = {};
    if (statsJson.trim()) {
      try {
        parsedStats = JSON.parse(statsJson);
      } catch {
        setError("Stats phải là JSON hợp lệ");
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        stats: parsedStats,
      };

      const response = await consumableService.updateConsumable(
        consumable._id,
        payload
      );

      if (response.success) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error updating item:", err);
      setError(err.response?.data?.message || "Lỗi khi cập nhật item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: "760px" }}>
        <div className="modal-header">
          <h2>Chỉnh sửa Item</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          <h3 className="modal-section-title">1) Thông tin cơ bản</h3>

          <div className="form-group">
            <label className="form-label">Item ID (không thể chỉnh sửa)</label>
            <input
              type="text"
              value={consumable?.itemId || ""}
              className="form-input"
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Tên Item <span className="required">*</span>
            </label>
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              className="form-input"
              placeholder="Flashlight"
              required
            />
          </div>

          <div className="stats-grid">
            <div className="form-group">
              <label className="form-label">
                Item Type <span className="required">*</span>
              </label>
              <select
                name="itemType"
                value={formData.itemType}
                onChange={handleChange}
                className="form-select"
              >
                <option value="CONSUMABLE">CONSUMABLE</option>
                <option value="EQUIPMENT">EQUIPMENT</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Trạng thái hoạt động</label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span>Kích hoạt item</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Prefab Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="prefabName"
              value={formData.prefabName}
              onChange={handleChange}
              className="form-input"
              placeholder="FlashlightItem"
              required
            />
          </div>

          <h3 className="modal-section-title">2) Stats JSON</h3>

          <div className="form-group">
            <label className="form-label">Stats object</label>
            <textarea
              value={statsJson}
              onChange={(e) => setStatsJson(e.target.value)}
              className="form-textarea"
              rows={8}
              placeholder='{}'
              style={{ fontFamily: "monospace" }}
            />
          </div>

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

export default EditConsumableModal;
