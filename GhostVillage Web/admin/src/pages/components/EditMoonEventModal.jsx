import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import moonEventService from "../../shared/services/moonEventService";
import "../assets/styles/Modal.css";

const EditMoonEventModal = ({ event, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    eventId: "",
    eventName: "",
    description: "",
    uiIcon: "",
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

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Không thể đọc file ảnh"));
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    if (event) {
      setFormData({
        eventId: event.eventId || "",
        eventName: event.eventName || "",
        description: event.description || "",
        uiIcon: event.uiIcon || "",
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

  const handleIconFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setFormData((prev) => ({
        ...prev,
        uiIcon: dataUrl,
      }));
      setError(null);
    } catch (err) {
      setError(err.message || "Không thể đọc file ảnh");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        eventName: formData.eventName.trim(),
        description: formData.description.trim(),
        uiIcon: formData.uiIcon || "",
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
      setError(err.response?.data?.message || "Failed to update moon event");
      console.error("Error updating moon event:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content moon-event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Moon Event</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="eventId">Event ID</label>
              <input type="text" id="eventId" name="eventId" value={formData.eventId} disabled className="form-input" />
            </div>

            <div className="form-group">
              <label htmlFor="eventName">Event Name *</label>
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
              <label htmlFor="uiIcon">UI Icon</label>
              <input
                type="file"
                id="uiIcon"
                name="uiIcon"
                accept="image/*"
                onChange={handleIconFileChange}
                className="form-input"
              />
              {formData.uiIcon ? (
                <div className="image-preview">
                  <img src={formData.uiIcon} alt="Moon event icon preview" />
                </div>
              ) : null}
            </div>

            <div className="form-group">
              <label htmlFor="weight">Weight *</label>
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
                <span>Active</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="form-textarea"
            />
          </div>

          <h3>Environment Modifiers</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Global Light Intensity</label>
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
              <label>Fog Density</label>
              <input
                type="number"
                value={formData.environmentModifiers.fogDensity}
                onChange={(e) => handleNestedChange("environmentModifiers", "fogDensity", e.target.value)}
                step="0.1"
                className="form-input"
              />
            </div>
          </div>

          <h3>Monster Buff Multipliers</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Speed</label>
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
              <label>Detection Range</label>
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
              <label>Chase Range</label>
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
              <label>Cooldown</label>
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

          <h3>Reward Multipliers</h3>
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
              <label>Coin</label>
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
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Updating..." : "Update Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMoonEventModal;
