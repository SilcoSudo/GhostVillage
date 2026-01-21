import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import '../assets/styles/AnnouncementModal.css';

const AnnouncementCreationModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: 'Admin',
    priority: 'medium',
    status: 'active',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (!formData.expiresAt) newErrors.expiresAt = 'Expiration date is required';
    
    const expiresDate = new Date(formData.expiresAt);
    const today = new Date();
    if (expiresDate <= today) {
      newErrors.expiresAt = 'Expiration date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const newAnnouncement = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0
      };
      onSubmit(newAnnouncement);
      onClose();
    }
  };

  if (!isOpen) return null;

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content announcement-creation-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <Plus size={20} className="header-icon" />
            <h2>Create New Announcement</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Announcement Title <span className="required">*</span>
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter announcement title..."
                className={`form-input ${errors.title ? 'input-error' : ''}`}
                maxLength={100}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
              <span className="char-count">{formData.title.length}/100</span>
            </div>

            {/* Content */}
            <div className="form-group">
              <label htmlFor="content" className="form-label">
                Content <span className="required">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Enter announcement content..."
                className={`form-textarea ${errors.content ? 'input-error' : ''}`}
                rows={6}
                maxLength={1000}
              />
              {errors.content && <span className="error-message">{errors.content}</span>}
              <span className="char-count">{formData.content.length}/1000</span>
            </div>

            {/* Author */}
            <div className="form-group">
              <label htmlFor="author" className="form-label">Author</label>
              <input
                id="author"
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                disabled
                className="form-input input-disabled"
              />
            </div>

            {/* Priority */}
            <div className="form-group">
              <label htmlFor="priority" className="form-label">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Status */}
            <div className="form-group">
              <label htmlFor="status" className="form-label">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Expiration Date */}
            <div className="form-group">
              <label htmlFor="expiresAt" className="form-label">
                Expiration Date <span className="required">*</span>
              </label>
              <input
                id="expiresAt"
                type="date"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleChange}
                min={minDate}
                className={`form-input ${errors.expiresAt ? 'input-error' : ''}`}
              />
              {errors.expiresAt && <span className="error-message">{errors.expiresAt}</span>}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementCreationModal;
