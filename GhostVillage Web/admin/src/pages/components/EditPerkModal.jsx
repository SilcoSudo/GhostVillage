import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Save } from "lucide-react";
import perkService from "../../shared/services/perkService";
import "../assets/styles/Modal.css";

const EditPerkModal = ({ perk, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    perkName: "",
    description: "",
    rarity: "COMMON",
    price: 0,
    prefabId: "",
    modifiersText: "{}",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!perk) return;

    setFormData({
      perkName: perk.perkName || "",
      description: perk.description || "",
      rarity: perk.rarity || "COMMON",
      price: perk.price || 0,
      prefabId: perk.prefabId || "",
      modifiersText: JSON.stringify(perk.modifiers || {}, null, 2),
    });
  }, [perk]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.perkName.trim()) {
      setError(t("perkModal.errors.nameRequired"));
      return;
    }

    if (!formData.prefabId.trim()) {
      setError(t("perkModal.errors.prefabRequired"));
      return;
    }

    let modifiers = {};
    try {
      modifiers = formData.modifiersText.trim()
        ? JSON.parse(formData.modifiersText)
        : {};
    } catch (parseError) {
      setError(t("perkModal.errors.modifiersJson"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        perkName: formData.perkName.trim(),
        description: formData.description.trim(),
        rarity: formData.rarity,
        price: formData.price,
        prefabId: formData.prefabId.trim(),
        modifiers,
      };

      const response = await perkService.updatePerk(perk._id, payload);
      if (response.success) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error updating perk:", err);
      setError(err.response?.data?.message || t("perkModal.errors.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: "760px" }}>
        <div className="modal-header">
          <h2>{t("perkModal.editTitle")}</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">{t("perkModal.perkIdReadonly")}</label>
            <input
              type="text"
              value={perk?.perkId || ""}
              className="form-input"
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("perk.columns.name")} <span className="required">*</span>
            </label>
            <input
              type="text"
              name="perkName"
              value={formData.perkName}
              onChange={handleChange}
              className="form-input"
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
              rows={3}
            />
          </div>

          <div className="stats-grid">
            <div className="form-group">
              <label className="form-label">Rarity</label>
              <select
                name="rarity"
                value={formData.rarity}
                onChange={handleChange}
                className="form-select"
              >
                <option value="COMMON">COMMON</option>
                <option value="RARE">RARE</option>
                <option value="EPIC">EPIC</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Prefab ID <span className="required">*</span>
            </label>
            <input
              type="text"
              name="prefabId"
              value={formData.prefabId}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Modifiers (JSON)</label>
            <textarea
              name="modifiersText"
              value={formData.modifiersText}
              onChange={handleChange}
              className="form-textarea"
              rows={10}
              placeholder='{"maxStaminaMult": 1.15}'
            />
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
                  <Loader2 className="spinner" size={16} />
                  <span>{t("perkModal.saving")}</span>
                </>
              ) : (
                <>
                  <Save size={16} />
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

export default EditPerkModal;
