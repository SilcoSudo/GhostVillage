import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import moonEventService from "../../shared/services/moonEventService";
import "../assets/styles/Modal.css";

const EditMoonEventModal = ({ event, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    eventId: "",
    eventName: "",
    description: "",
    isActive: true,
    weight: 10,
    environmentModifiers: {
      globalLightIntensity: 1,
      fogDensity: 1,
    },
    monsterBuffMultipliers: {
      speedMultiplier: 1,
      detectionRangeMultiplier: 1,
      chaseRangeMultiplier: 1,
      cooldownMultiplier: 1,
    },
    rewardMultipliers: {
      expMultiplier: 1,
      coinMultiplier: 1,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (event) {
      setFormData({
        eventId: event.eventId || "",
        eventName: event.eventName || "",
        description: event.description || "",
        isActive: event.isActive ?? true,
        weight: event.weight ?? 10,
        environmentModifiers: {
          globalLightIntensity: event.environmentModifiers?.globalLightIntensity ?? 1,
          fogDensity: event.environmentModifiers?.fogDensity ?? 1,
        },
        monsterBuffMultipliers: {
          speedMultiplier: event.monsterBuffMultipliers?.speedMultiplier ?? 1,
          detectionRangeMultiplier: event.monsterBuffMultipliers?.detectionRangeMultiplier ?? 1,
          chaseRangeMultiplier: event.monsterBuffMultipliers?.chaseRangeMultiplier ?? 1,
          cooldownMultiplier: event.monsterBuffMultipliers?.cooldownMultiplier ?? 1,
        },
        rewardMultipliers: {
          expMultiplier: event.rewardMultipliers?.expMultiplier ?? 1,
          coinMultiplier: event.rewardMultipliers?.coinMultiplier ?? 1,
        },
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleNestedChange = (group, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: Number(value),
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        eventName: formData.eventName.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive,
        weight: Number(formData.weight),
        environmentModifiers: formData.environmentModifiers,
        monsterBuffMultipliers: formData.monsterBuffMultipliers,
        rewardMultipliers: formData.rewardMultipliers,
      };

      await moonEventService.updateMoonEvent(event._id, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t("moonEvent.errors.update"));
      console.error("Error updating moon event:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content moon-event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t("moonEvent.editTitle")}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="eventId">{t("moonEvent.columns.eventId")}</label>
              <input type="text" id="eventId" name="eventId" value={formData.eventId} disabled className="form-input" />
            </div>

            <div className="form-group">
              <label htmlFor="eventName">{t("moonEvent.columns.name")} *</label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight">{t("moonEvent.columns.weight")} *</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                min="1"
                required
                className="form-input"
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="form-checkbox"
                />
                <span>{t("common.active")}</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">{t("common.description")}</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="form-textarea"
            />
          </div>

          <h3>{t("moonEvent.environmentModifiers")}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>{t("moonEvent.globalLightIntensity")}</label>
              <input
                type="number"
                value={formData.environmentModifiers.globalLightIntensity}
                onChange={(e) =>
                  handleNestedChange("environmentModifiers", "globalLightIntensity", e.target.value)
                }
                step="0.1"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>{t("moonEvent.fogDensity")}</label>
              <input
                type="number"
                value={formData.environmentModifiers.fogDensity}
                onChange={(e) => handleNestedChange("environmentModifiers", "fogDensity", e.target.value)}
                step="0.1"
                className="form-input"
              />
            </div>
          </div>

          <h3>{t("moonEvent.monsterBuffMultipliers")}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>{t("moonEvent.speed")}</label>
              <input
                type="number"
                value={formData.monsterBuffMultipliers.speedMultiplier}
                onChange={(e) =>
                  handleNestedChange("monsterBuffMultipliers", "speedMultiplier", e.target.value)
                }
                step="0.1"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>{t("moonEvent.detectionRange")}</label>
              <input
                type="number"
                value={formData.monsterBuffMultipliers.detectionRangeMultiplier}
                onChange={(e) =>
                  handleNestedChange("monsterBuffMultipliers", "detectionRangeMultiplier", e.target.value)
                }
                step="0.1"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>{t("moonEvent.chaseRange")}</label>
              <input
                type="number"
                value={formData.monsterBuffMultipliers.chaseRangeMultiplier}
                onChange={(e) =>
                  handleNestedChange("monsterBuffMultipliers", "chaseRangeMultiplier", e.target.value)
                }
                step="0.1"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>{t("moonEvent.cooldown")}</label>
              <input
                type="number"
                value={formData.monsterBuffMultipliers.cooldownMultiplier}
                onChange={(e) =>
                  handleNestedChange("monsterBuffMultipliers", "cooldownMultiplier", e.target.value)
                }
                step="0.1"
                className="form-input"
              />
            </div>
          </div>

          <h3>{t("moonEvent.rewardMultipliers")}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>EXP</label>
              <input
                type="number"
                value={formData.rewardMultipliers.expMultiplier}
                onChange={(e) => handleNestedChange("rewardMultipliers", "expMultiplier", e.target.value)}
                step="0.1"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>{t("moonEvent.coin")}</label>
              <input
                type="number"
                value={formData.rewardMultipliers.coinMultiplier}
                onChange={(e) => handleNestedChange("rewardMultipliers", "coinMultiplier", e.target.value)}
                step="0.1"
                className="form-input"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button" disabled={loading}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? t("moonEvent.updating") : t("moonEvent.update")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMoonEventModal;
