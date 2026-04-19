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
    monsterId: "",
    monsterName: "",
    monsterType: "MINION",
    prefabName: "",
    movementConfig: {
      moveSpeed: 3.5,
      stoppingDistance: 0.5,
      patrolRadius: 25,
    },
    combatConfig: {
      chaseRange: 25,
      attackRange: 1.5,
      attackCooldown: 1,
    },
    detectionConfig: {
      detectionRange: 15,
      detectionAngle: 120,
    },
  });
  const [specialSkillJson, setSpecialSkillJson] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const normalizedValue = type === "number" ? parseFloat(value) || 0 : value;

    if (name.includes(".")) {
      const [group, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [group]: {
          ...prev[group],
          [field]: normalizedValue,
        },
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: normalizedValue,
    }));
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.monsterId.trim()) {
      setError("Monster ID không được để trống");
      return;
    }

    if (!formData.monsterName.trim()) {
      setError("Tên quái vật không được để trống");
      return;
    }

    if (!formData.prefabName.trim()) {
      setError("Prefab Name không được để trống");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let parsedSpecialSkillConfig = {};
      if (specialSkillJson.trim()) {
        try {
          parsedSpecialSkillConfig = JSON.parse(specialSkillJson);
        } catch {
          setError("Special Skill Config phải là JSON hợp lệ");
          setLoading(false);
          return;
        }
      }

      const payload = {
        ...formData,
        specialSkillConfig: parsedSpecialSkillConfig,
      };

      const response = await monsterService.createMonster(payload);

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
      <div className="modal-container" style={{ maxWidth: "760px" }}>
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

          <h3 className="modal-section-title">1) Thông tin cơ bản</h3>

          <div className="form-group">
            <label className="form-label">
              Monster ID <span className="required">*</span>
            </label>
            <input
              type="text"
              name="monsterId"
              value={formData.monsterId}
              onChange={handleChange}
              className="form-input"
              placeholder="BOSS_ONG_KE"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Tên quái <span className="required">*</span>
            </label>
            <input
              type="text"
              name="monsterName"
              value={formData.monsterName}
              onChange={handleChange}
              className="form-input"
              placeholder="Ông Kẹ"
              required
            />
          </div>

          <div className="stats-grid">
            <div className="form-group">
              <label className="form-label">Monster Type</label>
              <select
                name="monsterType"
                value={formData.monsterType}
                onChange={handleChange}
                className="form-select"
              >
                <option value="MINION">MINION</option>
                <option value="BOSS">BOSS</option>
              </select>
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
                placeholder="Prefab_Boss_OngKe"
                required
              />
            </div>
          </div>

          <h3 className="modal-section-title">2) Movement Config</h3>
          <div className="form-group">
            <div className="stats-grid">
              <div className="form-group">
                <label className="form-label">Move Speed</label>
                <input
                  type="number"
                  name="movementConfig.moveSpeed"
                  value={formData.movementConfig.moveSpeed}
                  onChange={handleChange}
                  step="0.1"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stopping Distance</label>
                <input
                  type="number"
                  name="movementConfig.stoppingDistance"
                  value={formData.movementConfig.stoppingDistance}
                  onChange={handleChange}
                  step="0.1"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Patrol Radius</label>
                <input
                  type="number"
                  name="movementConfig.patrolRadius"
                  value={formData.movementConfig.patrolRadius}
                  onChange={handleChange}
                  step="0.1"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <h3 className="modal-section-title">3) Combat Config</h3>
          <div className="stats-grid">
            <div className="form-group">
              <label className="form-label">Chase Range</label>
              <input
                type="number"
                name="combatConfig.chaseRange"
                value={formData.combatConfig.chaseRange}
                onChange={handleChange}
                step="0.1"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Attack Range</label>
              <input
                type="number"
                name="combatConfig.attackRange"
                value={formData.combatConfig.attackRange}
                onChange={handleChange}
                step="0.1"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Attack Cooldown</label>
              <input
                type="number"
                name="combatConfig.attackCooldown"
                value={formData.combatConfig.attackCooldown}
                onChange={handleChange}
                step="0.1"
                className="form-input"
              />
            </div>
          </div>

          <h3 className="modal-section-title">4) Detection Config</h3>
          <div className="stats-grid">
            <div className="form-group">
              <label className="form-label">Detection Range</label>
              <input
                type="number"
                name="detectionConfig.detectionRange"
                value={formData.detectionConfig.detectionRange}
                onChange={handleChange}
                step="0.1"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Detection Angle</label>
              <input
                type="number"
                name="detectionConfig.detectionAngle"
                value={formData.detectionConfig.detectionAngle}
                onChange={handleChange}
                step="0.1"
                className="form-input"
              />
            </div>
          </div>

          <h3 className="modal-section-title">5) Special Skill Config</h3>
          <div className="form-group">
            <label className="form-label">Special Skill JSON</label>
            <textarea
              value={specialSkillJson}
              onChange={(e) => setSpecialSkillJson(e.target.value)}
              className="form-textarea"
              rows={6}
              placeholder='{}'
              style={{ fontFamily: "monospace" }}
            />
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
