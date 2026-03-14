import React, { useState, useEffect } from "react";
import { X, Loader2, Package, Zap } from "lucide-react";
import consumableService from "../../shared/services/consumableService";
import "../assets/styles/Modal.css";

/**
 * Edit Consumable Item Modal Component
 * Modal để chỉnh sửa consumable item với effects
 */
const EditConsumableModal = ({ consumable, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    itemId: "",
    name: "",
    description: "",
    type: "Utility",
    rarity: "Common",
    iconAsset: "",
    effects: {
      restoreHP: 0,
      restoreStamina: 0,
      restoreBattery: 0,
      speedBoost: 0,
      defenseBoost: 0,
      duration: 0,
      customEffect: "",
    },
    stackSize: 10,
    cooldown: 0,
    price: 0,
    sellPrice: 0,
    isAvailableInStore: true,
    canDrop: true,
    isActive: true,
    requiredLevel: 1,
    weight: 1,
    dropRate: 10,
    tags: [],
  });

  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load existing data
  useEffect(() => {
    if (consumable) {
      setFormData({
        itemId: consumable.itemId || "",
        name: consumable.name || "",
        description: consumable.description || "",
        type: consumable.type || "Utility",
        rarity: consumable.rarity || "Common",
        iconAsset: consumable.iconAsset || "",
        effects: {
          restoreHP: consumable.effects?.restoreHP || 0,
          restoreStamina: consumable.effects?.restoreStamina || 0,
          restoreBattery: consumable.effects?.restoreBattery || 0,
          speedBoost: consumable.effects?.speedBoost || 0,
          defenseBoost: consumable.effects?.defenseBoost || 0,
          duration: consumable.effects?.duration || 0,
          customEffect: consumable.effects?.customEffect || "",
        },
        stackSize: consumable.stackSize || 10,
        cooldown: consumable.cooldown || 0,
        price: consumable.price || 0,
        sellPrice: consumable.sellPrice || 0,
        isAvailableInStore: consumable.isAvailableInStore ?? true,
        canDrop: consumable.canDrop ?? true,
        isActive: consumable.isActive ?? true,
        requiredLevel: consumable.requiredLevel || 1,
        weight: consumable.weight || 1,
        dropRate: consumable.dropRate || 10,
        tags: consumable.tags || [],
      });
    }
  }, [consumable]);

  /**
   * Handle basic input change
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  /**
   * Handle effects change
   */
  const handleEffectChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      effects: {
        ...prev.effects,
        [name]: type === "number" ? parseFloat(value) || 0 : value,
      },
    }));
  };

  /**
   * Add tag
   */
  const addTag = () => {
    if (!tagInput.trim() || formData.tags.includes(tagInput.trim())) return;
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()],
    }));
    setTagInput("");
  };

  /**
   * Remove tag
   */
  const removeTag = (index) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setError("Tên item không được để trống");
      return;
    }

    if (!formData.iconAsset.trim()) {
      setError("Icon asset không được để trống");
      return;
    }

    if (formData.stackSize < 1 || formData.stackSize > 999) {
      setError("Stack size phải từ 1-999");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await consumableService.updateConsumable(
        consumable._id,
        formData
      );

      if (response.success) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error updating consumable:", err);
      setError(err.response?.data?.message || "Lỗi khi cập nhật consumable item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: "56rem" }}>
        {/* Header */}
        <div className="modal-header">
          <h2>Chỉnh sửa Consumable Item</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Error Message */}
          {error && <div className="modal-error">{error}</div>}

          {/* Basic Info Section */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3
              style={{
                color: "#B5A642",
                fontSize: "1rem",
                marginBottom: "1rem",
                fontFamily: "Courier New, monospace",
                textTransform: "uppercase",
                letterSpacing: "1px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Package size={18} />
              Thông tin cơ bản
            </h3>

            <div className="stats-grid">
              {/* Item ID (Read-only) */}
              <div className="form-group">
                <label className="form-label">Item ID</label>
                <input
                  type="text"
                  value={formData.itemId}
                  className="form-input"
                  disabled
                  style={{ backgroundColor: "#1a1a1a", color: "#777" }}
                />
              </div>

              {/* Type */}
              <div className="form-group">
                <label className="form-label">
                  Type <span className="required">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="Health">Health</option>
                  <option value="Stamina">Stamina</option>
                  <option value="Battery">Battery</option>
                  <option value="Buff">Buff</option>
                  <option value="Utility">Utility</option>
                  <option value="Special">Special</option>
                </select>
              </div>

              {/* Rarity */}
              <div className="form-group">
                <label className="form-label">
                  Rarity <span className="required">*</span>
                </label>
                <select
                  name="rarity"
                  value={formData.rarity}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="Common">Common</option>
                  <option value="Rare">Rare</option>
                  <option value="Epic">Epic</option>
                  <option value="Legendary">Legendary</option>
                  <option value="Mythic">Mythic</option>
                </select>
              </div>

              {/* Required Level */}
              <div className="form-group">
                <label className="form-label">
                  Level Required <span className="required">*</span>
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
              </div>
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label">
                Tên Item <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Nhập tên item"
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                rows="3"
                placeholder="Nhập mô tả item"
              />
            </div>

            {/* Icon Asset */}
            <div className="form-group">
              <label className="form-label">
                Icon Asset <span className="required">*</span>
              </label>
              <input
                type="text"
                name="iconAsset"
                value={formData.iconAsset}
                onChange={handleChange}
                className="form-input"
                placeholder="Đường dẫn hoặc URL icon"
                required
              />
            </div>
          </div>

          {/* Effects Section */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3
              style={{
                color: "#B5A642",
                fontSize: "1rem",
                marginBottom: "1rem",
                fontFamily: "Courier New, monospace",
                textTransform: "uppercase",
                letterSpacing: "1px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Zap size={18} />
              Effects
            </h3>

            <div className="stats-grid">
              <div className="form-group">
                <label className="form-label">Restore HP</label>
                <input
                  type="number"
                  name="restoreHP"
                  value={formData.effects.restoreHP}
                  onChange={handleEffectChange}
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Restore Stamina</label>
                <input
                  type="number"
                  name="restoreStamina"
                  value={formData.effects.restoreStamina}
                  onChange={handleEffectChange}
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Restore Battery</label>
                <input
                  type="number"
                  name="restoreBattery"
                  value={formData.effects.restoreBattery}
                  onChange={handleEffectChange}
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Speed Boost (%)</label>
                <input
                  type="number"
                  name="speedBoost"
                  value={formData.effects.speedBoost}
                  onChange={handleEffectChange}
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Defense Boost (%)</label>
                <input
                  type="number"
                  name="defenseBoost"
                  value={formData.effects.defenseBoost}
                  onChange={handleEffectChange}
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Duration (seconds)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.effects.duration}
                  onChange={handleEffectChange}
                  min="0"
                  className="form-input"
                />
              </div>
            </div>

            {/* Custom Effect */}
            <div className="form-group">
              <label className="form-label">Custom Effect</label>
              <input
                type="text"
                name="customEffect"
                value={formData.effects.customEffect}
                onChange={handleEffectChange}
                className="form-input"
                placeholder="Mô tả hiệu ứng đặc biệt (nếu có)"
              />
            </div>
          </div>

          {/* Item Properties Section */}
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
              Thuộc tính Item
            </h3>

            <div className="stats-grid">
              <div className="form-group">
                <label className="form-label">
                  Stack Size <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="stackSize"
                  value={formData.stackSize}
                  onChange={handleChange}
                  min="1"
                  max="999"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cooldown (seconds)</label>
                <input
                  type="number"
                  name="cooldown"
                  value={formData.cooldown}
                  onChange={handleChange}
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (Coin)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sell Price (Coin)</label>
                <input
                  type="number"
                  name="sellPrice"
                  value={formData.sellPrice}
                  onChange={handleChange}
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Weight</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Drop Rate (%)</label>
                <input
                  type="number"
                  name="dropRate"
                  value={formData.dropRate}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="form-input"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="stats-grid" style={{ marginTop: "1rem" }}>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isAvailableInStore"
                    checked={formData.isAvailableInStore}
                    onChange={handleChange}
                  />
                  <span>Available in Store</span>
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="canDrop"
                    checked={formData.canDrop}
                    onChange={handleChange}
                  />
                  <span>Can Drop</span>
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tags Section */}
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
              Tags
            </h3>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="form-input"
                placeholder="Nhập tag và nhấn Enter"
              />
              <button
                type="button"
                onClick={addTag}
                className="modal-btn modal-btn-primary"
              >
                Add Tag
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      background: "#2a2a2a",
                      color: "#B5A642",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#f44336",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="modal-btn modal-btn-secondary"
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
                  <Loader2 className="animate-spin" size={16} />
                  Đang cập nhật...
                </>
              ) : (
                "Cập nhật"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditConsumableModal;
