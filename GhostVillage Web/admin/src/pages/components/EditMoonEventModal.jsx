import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import moonEventService from '../../shared/services/moonEventService';
import '../assets/styles/Modal.css';

const EditMoonEventModal = ({ event, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    eventId: '',
    displayName: '',
    description: '',
    category: 'MOON_PHASE',
    uiIcon: '',
    effectDescription: '',
    coinMultiplier: 1,
    expMultiplier: 1,
    isActive: true,
    scheduleType: 'ALWAYS',
    activeFrom: '',
    activeTo: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (event) {
      setFormData({
        eventId: event.eventId || '',
        displayName: event.displayName || '',
        description: event.description || '',
        category: event.category || 'MOON_PHASE',
        uiIcon: event.uiIcon || '',
        effectDescription: event.effectDescription || '',
        coinMultiplier: event.coinMultiplier || 1,
        expMultiplier: event.expMultiplier || 1,
        isActive: event.isActive ?? true,
        scheduleType: event.scheduleType || 'ALWAYS',
        activeFrom: event.activeFrom ? new Date(event.activeFrom).toISOString().slice(0, 16) : '',
        activeTo: event.activeTo ? new Date(event.activeTo).toISOString().slice(0, 16) : '',
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert multipliers to numbers
      const dataToSubmit = {
        ...formData,
        coinMultiplier: parseFloat(formData.coinMultiplier),
        expMultiplier: parseFloat(formData.expMultiplier),
        activeFrom: formData.activeFrom || null,
        activeTo: formData.activeTo || null,
      };

      await moonEventService.updateMoonEvent(event._id, dataToSubmit);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update moon event');
      console.error('Error updating moon event:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content moon-event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Edit Moon Event</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-grid">
            {/* Event ID */}
            <div className="form-group">
              <label htmlFor="eventId">Event ID *</label>
              <input
                type="text"
                id="eventId"
                name="eventId"
                value={formData.eventId}
                onChange={handleChange}
                placeholder="e.g., EVENT_MOON_FULL"
                required
                className="form-input"
              />
              <small>Uppercase, underscore separated (e.g., EVENT_MOON_FULL)</small>
            </div>

            {/* Display Name */}
            <div className="form-group">
              <label htmlFor="displayName">Display Name *</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="e.g., Trăng Tròn"
                required
                className="form-input"
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
              >
                <option value="MOON_PHASE">Moon Phase</option>
                <option value="WEATHER">Weather</option>
                <option value="SPECIAL">Special</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* UI Icon */}
            <div className="form-group">
              <label htmlFor="uiIcon">UI Icon</label>
              <input
                type="text"
                id="uiIcon"
                name="uiIcon"
                value={formData.uiIcon}
                onChange={handleChange}
                placeholder="e.g., moon_full or 🌕"
                className="form-input"
              />
            </div>

            {/* Coin Multiplier */}
            <div className="form-group">
              <label htmlFor="coinMultiplier">Coin Multiplier *</label>
              <input
                type="number"
                id="coinMultiplier"
                name="coinMultiplier"
                value={formData.coinMultiplier}
                onChange={handleChange}
                min="0"
                step="0.1"
                required
                className="form-input"
              />
            </div>

            {/* EXP Multiplier */}
            <div className="form-group">
              <label htmlFor="expMultiplier">EXP Multiplier *</label>
              <input
                type="number"
                id="expMultiplier"
                name="expMultiplier"
                value={formData.expMultiplier}
                onChange={handleChange}
                min="0"
                step="0.1"
                required
                className="form-input"
              />
            </div>

            {/* Schedule Type */}
            <div className="form-group">
              <label htmlFor="scheduleType">Schedule Type *</label>
              <select
                id="scheduleType"
                name="scheduleType"
                value={formData.scheduleType}
                onChange={handleChange}
                className="form-select"
              >
                <option value="ALWAYS">Always Available</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="MANUAL">Manual Control</option>
              </select>
            </div>

            {/* Active Status */}
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

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of the moon event..."
              rows="3"
              className="form-textarea"
            />
          </div>

          {/* Effect Description */}
          <div className="form-group">
            <label htmlFor="effectDescription">Effect Description</label>
            <input
              type="text"
              id="effectDescription"
              name="effectDescription"
              value={formData.effectDescription}
              onChange={handleChange}
              placeholder="e.g., Sáng, quái nhìn xa hơn"
              className="form-input"
            />
            <small>Short description of gameplay effects</small>
          </div>

          {/* Scheduled Date Range (if schedule type is SCHEDULED) */}
          {formData.scheduleType === 'SCHEDULED' && (
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="activeFrom">Active From</label>
                <input
                  type="datetime-local"
                  id="activeFrom"
                  name="activeFrom"
                  value={formData.activeFrom}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="activeTo">Active To</label>
                <input
                  type="datetime-local"
                  id="activeTo"
                  name="activeTo"
                  value={formData.activeTo}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMoonEventModal;
