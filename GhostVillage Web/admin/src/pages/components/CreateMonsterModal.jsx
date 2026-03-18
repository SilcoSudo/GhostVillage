import React, { useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import monsterService from "../../shared/services/monsterService";
import "../assets/styles/Modal.css";

/**
 * Create Monster Modal Component
 * Modal để tạo quái vật mới
 */
const CreateMonsterModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    hp: 100,
    atk: 10,
    def: 5,
    spawnRate: 50,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError("Tên quái vật không được để trống");
      return;
    }

    if (formData.hp < 1) {
      setError("HP phải lớn hơn 0");
      return;
    }

    if (formData.atk < 0) {
      setError("ATK không được âm");
      return;
    }

    if (formData.def < 0) {
      setError("DEF không được âm");
      return;
    }

    if (formData.spawnRate < 0 || formData.spawnRate > 100) {
      setError("Spawn Rate phải nằm trong khoảng 0-100");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await monsterService.createMonster(formData);

      if (response.success) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error creating monster:", err);
      setError(err.response?.data?.message || "Lỗi khi tạo quái vật");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2>Tạo quái vật mới</h2>
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

          {/* Name */}
          <div className="form-group">
            <label className="form-label">
              Tên quái vật <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="Nhập tên quái vật"
              required
            />
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            {/* HP */}
            <div className="form-group">
              <label className="form-label">
                HP (Health Points) <span className="required">*</span>
              </label>
              <input
                type="number"
                name="hp"
                value={formData.hp}
                onChange={handleChange}
                min="1"
                className="form-input"
                required
              />
            </div>

            {/* ATK */}
            <div className="form-group">
              <label className="form-label">
                ATK (Attack) <span className="required">*</span>
              </label>
              <input
                type="number"
                name="atk"
                value={formData.atk}
                onChange={handleChange}
                min="0"
                className="form-input"
                required
              />
            </div>

            {/* DEF */}
            <div className="form-group">
              <label className="form-label">
                DEF (Defense) <span className="required">*</span>
              </label>
              <input
                type="number"
                name="def"
                value={formData.def}
                onChange={handleChange}
                min="0"
                className="form-input"
                required
              />
            </div>

            {/* Spawn Rate */}
            <div className="form-group">
              <label className="form-label">
                Spawn Rate (0-100%) <span className="required">*</span>
              </label>
              <input
                type="number"
                name="spawnRate"
                value={formData.spawnRate}
                onChange={handleChange}
                min="0"
                max="100"
                className="form-input"
                required
              />
            </div>
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
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>Tạo quái vật</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMonsterModal;
