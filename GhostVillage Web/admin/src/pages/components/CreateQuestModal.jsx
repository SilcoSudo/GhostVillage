import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Plus } from "lucide-react";
import questService from "../../shared/services/questService";
import "../assets/styles/Modal.css";

const ACTION_TYPES = [
  "PLAY_MATCH",
  "WIN_MATCH",
  "KILL_SMALL_MONSTER",
  "RESCUE_TEAMMATE",
  "SCREAM",
  "GET_KNOCKED",
  "USE_SIREN",
];

/**
 * Create Quest Modal Component
 * Modal tạo quest theo schema runtime của game
 */
const CreateQuestModal = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    questId: "",
    questName: "",
    description: "",
    questType: "DAILY",
    actionType: "PLAY_MATCH",
    targetCount: 1,
    reward: {
      coin: 0,
      exp: 0,
      titleId: "",
    },
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseInt(value, 10) || 0
          : value,
    }));
  };

  const handleRewardChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      reward: {
        ...prev.reward,
        [name]: type === "number" ? parseInt(value, 10) || 0 : value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.questId.trim()) {
      setError(t("questModal.errors.questIdRequired"));
      return;
    }

    if (!formData.questName.trim()) {
      setError(t("questModal.errors.questNameRequired"));
      return;
    }

    if (!formData.actionType.trim()) {
      setError(t("questModal.errors.actionTypeRequired"));
      return;
    }

    if (formData.targetCount < 1) {
      setError(t("questModal.errors.targetCount"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        questId: formData.questId.trim().toUpperCase(),
        questName: formData.questName.trim(),
        description: formData.description.trim(),
        actionType: formData.actionType.trim().toUpperCase(),
        reward: {
          coin: Math.max(0, formData.reward.coin || 0),
          exp: Math.max(0, formData.reward.exp || 0),
          titleId: formData.reward.titleId?.trim() || null,
        },
      };

      const response = await questService.createQuest(payload);

      if (response.success) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error creating quest:", err);
      setError(err.response?.data?.message || t("questModal.errors.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: "44rem" }}>
        <div className="modal-header">
          <h2>{t("questModal.createTitle")}</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          <div className="stats-grid">
            <div className="form-group">
              <label className="form-label">
                Quest ID <span className="required">*</span>
              </label>
              <input
                type="text"
                name="questId"
                value={formData.questId}
                onChange={handleChange}
                className="form-input"
                placeholder="QUEST_DAILY_PLAY_2"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {t("quest.columns.type")} <span className="required">*</span>
              </label>
              <select
                name="questType"
                value={formData.questType}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="DAILY">DAILY</option>
                <option value="ACHIEVEMENT">ACHIEVEMENT</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {t("quest.columns.action")} <span className="required">*</span>
              </label>
              <select
                name="actionType"
                value={formData.actionType}
                onChange={handleChange}
                className="form-select"
                required
              >
                {ACTION_TYPES.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {t("quest.columns.target")} <span className="required">*</span>
              </label>
              <input
                type="number"
                name="targetCount"
                value={formData.targetCount}
                onChange={handleChange}
                min="1"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("quest.columns.name")} <span className="required">*</span>
            </label>
            <input
              type="text"
              name="questName"
              value={formData.questName}
              onChange={handleChange}
              className="form-input"
              placeholder="Hardworking Survivor"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("common.description")}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              rows="3"
              placeholder="Complete 2 matches."
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h3
              style={{
                color: "#B5A642",
                fontSize: "1rem",
                marginBottom: "1rem",
                fontFamily: "Courier New, monospace",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {t("questModal.reward")}
            </h3>

            <div className="stats-grid">
              <div className="form-group">
                <label className="form-label">Coin</label>
                <input
                  type="number"
                  name="coin"
                  value={formData.reward.coin}
                  onChange={handleRewardChange}
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">EXP</label>
                <input
                  type="number"
                  name="exp"
                  value={formData.reward.exp}
                  onChange={handleRewardChange}
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Title ID</label>
                <input
                  type="text"
                  name="titleId"
                  value={formData.reward.titleId}
                  onChange={handleRewardChange}
                  className="form-input"
                  placeholder="RESCUE_100"
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                color: "#B5A642",
                fontSize: "0.875rem",
              }}
            >
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                style={{ cursor: "pointer" }}
              />
              {t("questModal.activateAfterCreate")}
            </label>
          </div>

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
                  <span>{t("questModal.creating")}</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>{t("questModal.createButton")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuestModal;
