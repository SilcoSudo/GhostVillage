import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Save } from "lucide-react";
import monsterService from "../../shared/services/monsterService";
import "../assets/styles/Modal.css";

/**
 * Edit Monster Modal Component
 * Modal để chỉnh sửa thông tin quái vật
 */
const EditMonsterModal = ({ monster, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
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

  // Load dữ liệu monster vào form
  useEffect(() => {
    if (monster) {
      setFormData({
        monsterName: monster.monsterName || "",
        monsterType: monster.monsterType || "MINION",
        prefabName: monster.prefabName || "",
        movementConfig: {
          moveSpeed: monster.movementConfig?.moveSpeed ?? 3.5,
          stoppingDistance: monster.movementConfig?.stoppingDistance ?? 0.5,
          patrolRadius: monster.movementConfig?.patrolRadius ?? 25,
        },
        combatConfig: {
          chaseRange: monster.combatConfig?.chaseRange ?? 25,
          attackRange: monster.combatConfig?.attackRange ?? 1.5,
          attackCooldown: monster.combatConfig?.attackCooldown ?? 1,
        },
        detectionConfig: {
          detectionRange: monster.detectionConfig?.detectionRange ?? 15,
          detectionAngle: monster.detectionConfig?.detectionAngle ?? 120,
        },
      });
      setSpecialSkillJson(
        JSON.stringify(monster.specialSkillConfig || {}, null, 2)
      );
    }
  }, [monster]);

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
    if (!formData.monsterName.trim()) {
      setError(t("monsterModal.errors.monsterNameRequired"));
      return;
    }

    if (!formData.prefabName.trim()) {
      setError(t("monsterModal.errors.prefabRequired"));
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
          setError(t("monsterModal.errors.specialSkillJson"));
          setLoading(false);
          return;
        }
      }

      const payload = {
        ...formData,
        specialSkillConfig: parsedSpecialSkillConfig,
      };

      const response = await monsterService.updateMonster(monster._id, payload);

      if (response.success) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error updating monster:", err);
      setError(err.response?.data?.message || t("monsterModal.errors.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: "760px" }}>
        {/* Header */}
        <div className="modal-header">
          <h2>{t("monsterModal.editTitle")}</h2>
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

          <h3 className="modal-section-title">{t("monsterModal.sections.basic")}</h3>

          <div className="form-group">
            <label className="form-label">{t("monsterModal.monsterIdReadonly")}</label>
            <input
              type="text"
              value={monster?.monsterId || ""}
              className="form-input"
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("monsterModal.monsterName")} <span className="required">*</span>
            </label>
            <input
              type="text"
              name="monsterName"
              value={formData.monsterName}
              onChange={handleChange}
              className="form-input"
              placeholder={t("monsterModal.monsterNameInput")}
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
                required
              />
            </div>
          </div>

          <h3 className="modal-section-title">{t("monsterModal.sections.movement")}</h3>
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

          <h3 className="modal-section-title">{t("monsterModal.sections.combat")}</h3>
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

          <h3 className="modal-section-title">{t("monsterModal.sections.detection")}</h3>
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

          <h3 className="modal-section-title">{t("monsterModal.sections.specialSkill")}</h3>
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
                  <span>{t("monsterModal.saving")}</span>
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

export default EditMonsterModal;
