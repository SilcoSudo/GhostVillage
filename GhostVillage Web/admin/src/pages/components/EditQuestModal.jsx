import React, { useState, useEffect } from "react";
import { X, Loader2, Save, Trash2, Target, Award, Plus } from "lucide-react";
import questService from "../../shared/services/questService";
import "../assets/styles/Modal.css";

/**
 * Edit Quest Modal Component
 * Modal để chỉnh sửa quest với objectives và rewards
 */
const EditQuestModal = ({ quest, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    questId: "",
    title: "",
    description: "",
    questLine: "Side Quest",
    difficulty: "Medium",
    levelRequired: 1,
    objectives: [],
    rewards: {
      exp: 0,
      coin: 0,
      items: [],
      titles: [],
    },
    npcGiver: "",
    location: "",
    isRepeatable: false,
    timeLimit: 0,
    cooldown: 0,
  });

  const [rewardInput, setRewardInput] = useState({
    itemId: "",
    itemQuantity: 1,
    title: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load quest data
  useEffect(() => {
    if (quest) {
      setFormData({
        questId: quest.questId || "",
        title: quest.title || "",
        description: quest.description || "",
        questLine: quest.questLine || "Side Quest",
        difficulty: quest.difficulty || "Medium",
        levelRequired: quest.levelRequired || 1,
        objectives: quest.objectives || [
          {
            type: "Kill",
            description: "",
            target: "",
            required: 1,
          },
        ],
        rewards: {
          exp: quest.rewards?.exp || 0,
          coin: quest.rewards?.coin || 0,
          items: quest.rewards?.items || [],
          titles: quest.rewards?.titles || [],
        },
        npcGiver: quest.npcGiver || "",
        location: quest.location || "",
        isRepeatable: quest.isRepeatable || false,
        timeLimit: quest.timeLimit || 0,
        cooldown: quest.cooldown || 0,
      });
    }
  }, [quest]);

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
   * Handle rewards change
   */
  const handleRewardChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      rewards: {
        ...prev.rewards,
        [name]: type === "number" ? parseFloat(value) || 0 : value,
      },
    }));
  };

  /**
   * Add objective
   */
  const addObjective = () => {
    setFormData((prev) => ({
      ...prev,
      objectives: [
        ...prev.objectives,
        {
          type: "Kill",
          description: "",
          target: "",
          required: 1,
        },
      ],
    }));
  };

  /**
   * Remove objective
   */
  const removeObjective = (index) => {
    setFormData((prev) => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index),
    }));
  };

  /**
   * Update objective
   */
  const updateObjective = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      objectives: prev.objectives.map((obj, i) =>
        i === index
          ? { ...obj, [field]: field === "required" ? parseInt(value) || 1 : value }
          : obj
      ),
    }));
  };

  /**
   * Add reward item
   */
  const addRewardItem = () => {
    if (!rewardInput.itemId.trim()) return;
    setFormData((prev) => ({
      ...prev,
      rewards: {
        ...prev.rewards,
        items: [
          ...prev.rewards.items,
          {
            itemId: rewardInput.itemId,
            quantity: rewardInput.itemQuantity,
          },
        ],
      },
    }));
    setRewardInput({ ...rewardInput, itemId: "", itemQuantity: 1 });
  };

  /**
   * Remove reward item
   */
  const removeRewardItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      rewards: {
        ...prev.rewards,
        items: prev.rewards.items.filter((_, i) => i !== index),
      },
    }));
  };

  /**
   * Add reward title
   */
  const addRewardTitle = () => {
    if (!rewardInput.title.trim()) return;
    setFormData((prev) => ({
      ...prev,
      rewards: {
        ...prev.rewards,
        titles: [...prev.rewards.titles, rewardInput.title],
      },
    }));
    setRewardInput({ ...rewardInput, title: "" });
  };

  /**
   * Remove reward title
   */
  const removeRewardTitle = (index) => {
    setFormData((prev) => ({
      ...prev,
      rewards: {
        ...prev.rewards,
        titles: prev.rewards.titles.filter((_, i) => i !== index),
      },
    }));
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.questId.trim()) {
      setError("Quest ID không được để trống");
      return;
    }

    if (!formData.title.trim()) {
      setError("Tiêu đề không được để trống");
      return;
    }

    if (formData.objectives.length === 0) {
      setError("Quest phải có ít nhất 1 objective");
      return;
    }

    // Validate objectives
    for (let i = 0; i < formData.objectives.length; i++) {
      const obj = formData.objectives[i];
      if (!obj.description.trim()) {
        setError(`Objective ${i + 1}: Description không được để trống`);
        return;
      }
      if (obj.required < 1) {
        setError(`Objective ${i + 1}: Required phải lớn hơn 0`);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const response = await questService.updateQuest(quest._id, formData);

      if (response.success) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error updating quest:", err);
      setError(err.response?.data?.message || "Lỗi khi cập nhật quest");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: "56rem" }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Chỉnh sửa Quest</h2>
            <div className="map-id">{quest?.questId}</div>
          </div>
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
              }}
            >
              Thông tin cơ bản
            </h3>

            <div className="stats-grid">
              {/* Quest ID */}
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
                  placeholder="QUEST_MAIN_001"
                  required
                />
              </div>

              {/* Quest Line */}
              <div className="form-group">
                <label className="form-label">
                  Quest Line <span className="required">*</span>
                </label>
                <select
                  name="questLine"
                  value={formData.questLine}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="Main Story">Main Story</option>
                  <option value="Side Quest">Side Quest</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Event">Event</option>
                  <option value="Tutorial">Tutorial</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className="form-group">
                <label className="form-label">
                  Difficulty <span className="required">*</span>
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Expert">Expert</option>
                  <option value="Nightmare">Nightmare</option>
                </select>
              </div>

              {/* Level Required */}
              <div className="form-group">
                <label className="form-label">
                  Level Required <span className="required">*</span>
                </label>
                <input
                  type="number"
                  name="levelRequired"
                  value={formData.levelRequired}
                  onChange={handleChange}
                  min="1"
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">
                Tiêu đề <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder="Nhập tiêu đề quest"
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
                placeholder="Nhập mô tả quest"
              />
            </div>
          </div>

          {/* Objectives Section */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  color: "#B5A642",
                  fontSize: "1rem",
                  fontFamily: "Courier New, monospace",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Target size={18} />
                Objectives
              </h3>
              <button
                type="button"
                onClick={addObjective}
                className="modal-btn modal-btn-primary"
                style={{ fontSize: "0.75rem", padding: "0.5rem 0.75rem" }}
              >
                <Plus size={14} />
                <span>Thêm Objective</span>
              </button>
            </div>

            {formData.objectives.map((obj, index) => (
              <div
                key={index}
                style={{
                  padding: "1rem",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  marginBottom: "0.75rem",
                  background: "rgba(18, 18, 18, 0.5)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      color: "#B5A642",
                      fontSize: "0.875rem",
                      fontFamily: "Courier New, monospace",
                    }}
                  >
                    Objective #{index + 1}
                  </span>
                  {formData.objectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeObjective(index)}
                      className="modal-btn modal-btn-cancel"
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                <div className="stats-grid">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select
                      value={obj.type}
                      onChange={(e) =>
                        updateObjective(index, "type", e.target.value)
                      }
                      className="form-select"
                    >
                      <option value="Kill">Kill</option>
                      <option value="Collect">Collect</option>
                      <option value="Talk">Talk</option>
                      <option value="Explore">Explore</option>
                      <option value="Craft">Craft</option>
                      <option value="Deliver">Deliver</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target</label>
                    <input
                      type="text"
                      value={obj.target}
                      onChange={(e) =>
                        updateObjective(index, "target", e.target.value)
                      }
                      className="form-input"
                      placeholder="Monster ID / Item ID"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Required</label>
                    <input
                      type="number"
                      value={obj.required}
                      onChange={(e) =>
                        updateObjective(index, "required", e.target.value)
                      }
                      min="1"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    value={obj.description}
                    onChange={(e) =>
                      updateObjective(index, "description", e.target.value)
                    }
                    className="form-input"
                    placeholder="Kill 5 Zombies in Dark Forest"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Rewards Section */}
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
              <Award size={18} />
              Rewards
            </h3>

            <div className="stats-grid">
              <div className="form-group">
                <label className="form-label">EXP</label>
                <input
                  type="number"
                  name="exp"
                  value={formData.rewards.exp}
                  onChange={handleRewardChange}
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Coin</label>
                <input
                  type="number"
                  name="coin"
                  value={formData.rewards.coin}
                  onChange={handleRewardChange}
                  min="0"
                  className="form-input"
                />
              </div>
            </div>

            {/* Reward Items */}
            <div className="form-group">
              <label className="form-label">Items</label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input
                  type="text"
                  value={rewardInput.itemId}
                  onChange={(e) =>
                    setRewardInput({ ...rewardInput, itemId: e.target.value })
                  }
                  placeholder="Item ID"
                  className="form-input"
                  style={{ flex: 2 }}
                />
                <input
                  type="number"
                  value={rewardInput.itemQuantity}
                  onChange={(e) =>
                    setRewardInput({
                      ...rewardInput,
                      itemQuantity: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                  placeholder="Qty"
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={addRewardItem}
                  className="modal-btn modal-btn-primary"
                  style={{ padding: "0.5rem 1rem" }}
                >
                  <Plus size={16} />
                </button>
              </div>
              {formData.rewards.items.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {formData.rewards.items.map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "0.25rem 0.75rem",
                        background: "rgba(181, 166, 66, 0.2)",
                        border: "1px solid #B5A642",
                        borderRadius: "4px",
                        fontSize: "0.875rem",
                        color: "#B5A642",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {item.itemId} x{item.quantity}
                      <button
                        type="button"
                        onClick={() => removeRewardItem(idx)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#990000",
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

            {/* Reward Titles */}
            <div className="form-group">
              <label className="form-label">Titles</label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input
                  type="text"
                  value={rewardInput.title}
                  onChange={(e) =>
                    setRewardInput({ ...rewardInput, title: e.target.value })
                  }
                  placeholder="Title Name"
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={addRewardTitle}
                  className="modal-btn modal-btn-primary"
                  style={{ padding: "0.5rem 1rem" }}
                >
                  <Plus size={16} />
                </button>
              </div>
              {formData.rewards.titles.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {formData.rewards.titles.map((title, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "0.25rem 0.75rem",
                        background: "rgba(153, 0, 0, 0.2)",
                        border: "1px solid #990000",
                        borderRadius: "4px",
                        fontSize: "0.875rem",
                        color: "#CC0000",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {title}
                      <button
                        type="button"
                        onClick={() => removeRewardTitle(idx)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#990000",
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
          </div>

          {/* Quest Settings */}
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
              Cài đặt Quest
            </h3>

            <div className="stats-grid">
              <div className="form-group">
                <label className="form-label">NPC Giver</label>
                <input
                  type="text"
                  name="npcGiver"
                  value={formData.npcGiver}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Elder Marcus"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Village Square"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time Limit (seconds)</label>
                <input
                  type="number"
                  name="timeLimit"
                  value={formData.timeLimit}
                  onChange={handleChange}
                  min="0"
                  className="form-input"
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
            </div>

            <div className="form-group">
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
                  name="isRepeatable"
                  checked={formData.isRepeatable}
                  onChange={handleChange}
                  style={{ cursor: "pointer" }}
                />
                Quest có thể lặp lại
              </label>
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

export default EditQuestModal;
