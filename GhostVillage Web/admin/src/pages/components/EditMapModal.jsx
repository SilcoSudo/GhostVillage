import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Save } from "lucide-react";
import mapService from "../../shared/services/mapService";
import "../assets/styles/Modal.css";

const pretty = (value, fallback = {}) => JSON.stringify(value || fallback, null, 2);

const parseJson = (label, value) => {
  try {
    return JSON.parse(value);
  } catch (_error) {
    throw new Error(`${label} không đúng định dạng JSON`);
  }
};

const parseJsonArray = (label, value) => {
  const parsed = parseJson(label, value || "[]");
  if (!Array.isArray(parsed)) {
    throw new Error(`${label} phải là JSON Array`);
  }
  return parsed;
};

const parseJsonObject = (label, value) => {
  const parsed = parseJson(label, value || "{}");
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(`${label} phải là JSON Object`);
  }
  return parsed;
};

/**
 * Edit Map Modal
 * Chỉnh map theo đúng 5 phần schema JSON runtime
 */
const EditMapModal = ({ map, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    // 1) identityConfig
    mapId: "",
    sceneName: "",
    displayName: "",
    thumbnailUrl: "",
    shortDescription: "",

    // 2) consumableConfig (2 JSON)
    consumableMandatoryJson: "[]",
    consumableRandomJson: "{}",

    // 3) equipmentConfig (2 JSON)
    equipmentMandatoryJson: "[]",
    equipmentRandomJson: "{}",

    // 4) monsterSystemConfig
    bossMonsterId: "",
    minionMonsterIdsJson: "[]",

    // 5) rewardConfig
    baseExp: 0,
    baseCoin: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!map) return;

    setFormData({
      mapId: map.identityConfig?.mapId || "",
      sceneName: map.identityConfig?.sceneName || "",
      displayName: map.identityConfig?.displayName || "",
      thumbnailUrl: map.identityConfig?.thumbnailUrl || "",
      shortDescription: map.identityConfig?.shortDescription || "",

      consumableMandatoryJson: pretty(map.consumableConfig?.mandatoryItems, []),
      consumableRandomJson: pretty(map.consumableConfig?.randomPoolConfig, {
        minCount: 0,
        maxCount: 0,
        pool: [],
      }),

      equipmentMandatoryJson: pretty(map.equipmentConfig?.mandatoryEquipment, []),
      equipmentRandomJson: pretty(map.equipmentConfig?.randomPoolConfig, {
        minCount: 0,
        maxCount: 0,
        pool: [],
      }),

      bossMonsterId: map.monsterSystemConfig?.bossConfig?.monsterId || "",
      minionMonsterIdsJson: pretty(
        map.monsterSystemConfig?.minionConfig?.allowedMonsterIds,
        [],
      ),

      baseExp: map.rewardConfig?.baseExp || 0,
      baseCoin: map.rewardConfig?.baseCoin || 0,
    });
  }, [map]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? Number(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.displayName.trim()) {
      setError(t("mapModal.errors.displayNameRequired"));
      return;
    }

    if (!formData.sceneName.trim()) {
      setError(t("mapModal.errors.sceneNameRequired"));
      return;
    }

    if (formData.baseExp < 0 || formData.baseCoin < 0) {
      setError(t("mapModal.errors.rewardNonNegative"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const consumableMandatoryItems = parseJsonArray(
        "consumableConfig.mandatoryItems",
        formData.consumableMandatoryJson,
      );
      const consumableRandomPoolConfig = parseJsonObject(
        "consumableConfig.randomPoolConfig",
        formData.consumableRandomJson,
      );
      const equipmentMandatoryEquipment = parseJsonArray(
        "equipmentConfig.mandatoryEquipment",
        formData.equipmentMandatoryJson,
      );
      const equipmentRandomPoolConfig = parseJsonObject(
        "equipmentConfig.randomPoolConfig",
        formData.equipmentRandomJson,
      );
      const minionMonsterIds = parseJsonArray(
        "monsterSystemConfig.minionConfig.allowedMonsterIds",
        formData.minionMonsterIdsJson,
      );

      const payload = {
        identityConfig: {
          sceneName: formData.sceneName.trim(),
          displayName: formData.displayName.trim(),
          thumbnailUrl: formData.thumbnailUrl.trim(),
          shortDescription: formData.shortDescription.trim(),
          isActive: map.identityConfig?.isActive ?? true,
        },
        consumableConfig: {
          mandatoryItems: consumableMandatoryItems,
          randomPoolConfig: consumableRandomPoolConfig,
        },
        equipmentConfig: {
          mandatoryEquipment: equipmentMandatoryEquipment,
          randomPoolConfig: equipmentRandomPoolConfig,
        },
        monsterSystemConfig: {
          bossConfig: {
            monsterId: formData.bossMonsterId.trim(),
          },
          minionConfig: {
            allowedMonsterIds: minionMonsterIds,
          },
        },
        rewardConfig: {
          baseExp: Number(formData.baseExp),
          baseCoin: Number(formData.baseCoin),
        },
      };

      const response = await mapService.updateMapMetadata(map._id, payload);
      if (response.success) onSuccess();
    } catch (err) {
      console.error("Error updating map:", err);
      setError(err.response?.data?.message || err.message || t("mapModal.errors.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: "64rem" }}>
        <div className="modal-header">
          <div>
            <h2>{t("mapModal.title")}</h2>
            <div className="map-id">{formData.mapId}</div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          <h3 style={{ color: "#B5A642", marginBottom: "10px", fontSize: "0.95rem" }}>
            {t("mapModal.sections.identity")}
          </h3>
          <div className="stats-grid">
            <div className="form-group">
              <label className="form-label">mapId</label>
              <input type="text" value={formData.mapId} className="form-input" disabled />
            </div>
            <div className="form-group">
              <label className="form-label">sceneName</label>
              <input
                type="text"
                name="sceneName"
                value={formData.sceneName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="stats-grid">
            <div className="form-group">
              <label className="form-label">displayName</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">thumbnailUrl</label>
              <input
                type="text"
                name="thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={handleChange}
                className="form-input"
                placeholder="sprite_map_ongke"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">shortDescription</label>
            <textarea
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              rows="3"
              className="form-textarea"
            />
          </div>

          <h3 style={{ color: "#B5A642", marginBottom: "10px", fontSize: "0.95rem" }}>
            {t("mapModal.sections.consumable")}
          </h3>
          <div className="form-group">
            <label className="form-label">mandatoryItems (JSON Array)</label>
            <textarea
              name="consumableMandatoryJson"
              value={formData.consumableMandatoryJson}
              onChange={handleChange}
              rows="5"
              className="form-textarea"
            />
          </div>
          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label className="form-label">randomPoolConfig (JSON Object)</label>
            <textarea
              name="consumableRandomJson"
              value={formData.consumableRandomJson}
              onChange={handleChange}
              rows="7"
              className="form-textarea"
            />
          </div>

          <h3 style={{ color: "#B5A642", marginBottom: "10px", fontSize: "0.95rem" }}>
            {t("mapModal.sections.equipment")}
          </h3>
          <div className="form-group">
            <label className="form-label">mandatoryEquipment (JSON Array)</label>
            <textarea
              name="equipmentMandatoryJson"
              value={formData.equipmentMandatoryJson}
              onChange={handleChange}
              rows="5"
              className="form-textarea"
            />
          </div>
          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label className="form-label">randomPoolConfig (JSON Object)</label>
            <textarea
              name="equipmentRandomJson"
              value={formData.equipmentRandomJson}
              onChange={handleChange}
              rows="7"
              className="form-textarea"
            />
          </div>

          <h3 style={{ color: "#B5A642", marginBottom: "10px", fontSize: "0.95rem" }}>
            {t("mapModal.sections.monsterSystem")}
          </h3>
          <div className="form-group">
            <label className="form-label">bossConfig.monsterId</label>
            <input
              type="text"
              name="bossMonsterId"
              value={formData.bossMonsterId}
              onChange={handleChange}
              className="form-input"
              placeholder="BOSS_ONG_KE"
            />
          </div>
          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label className="form-label">minionConfig.allowedMonsterIds (JSON Array)</label>
            <textarea
              name="minionMonsterIdsJson"
              value={formData.minionMonsterIdsJson}
              onChange={handleChange}
              rows="4"
              className="form-textarea"
            />
          </div>

          <h3 style={{ color: "#B5A642", marginBottom: "10px", fontSize: "0.95rem" }}>
            {t("mapModal.sections.reward")}
          </h3>
          <div className="stats-grid" style={{ marginBottom: "20px" }}>
            <div className="form-group">
              <label className="form-label">baseExp</label>
              <input
                type="number"
                name="baseExp"
                value={formData.baseExp}
                onChange={handleChange}
                min="0"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">baseCoin</label>
              <input
                type="number"
                name="baseCoin"
                value={formData.baseCoin}
                onChange={handleChange}
                min="0"
                className="form-input"
              />
            </div>
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
                  <span>{t("mapModal.saving")}</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>{t("mapModal.saveJson")}</span>
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
