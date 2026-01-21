import React, { useState, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';
import '../assets/styles/WikiModal.css';

const WikiEditorModal = ({ isOpen, item, itemType, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && item) {
      setFormData({
        name: item.name || '',
        description: item.description || ''
      });
      setErrors({});
    }
  }, [isOpen, item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...item,
        ...formData
      });
      onClose();
    }
  };

  const getTypeLabel = () => {
    switch(itemType) {
      case 'monster': return 'Monster';
      case 'item': return 'Item';
      case 'map': return 'Map';
      default: return 'Wiki Entry';
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content wiki-editor-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <Edit2 size={20} className="header-icon" />
            <h2>Edit {getTypeLabel()}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Name */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                {getTypeLabel()} Name <span className="required">*</span>
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={`Enter ${getTypeLabel().toLowerCase()} name...`}
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                maxLength={100}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
              <span className="char-count">{formData.name.length}/100</span>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={`Enter detailed description of this ${getTypeLabel().toLowerCase()}...`}
                className={`form-textarea ${errors.description ? 'input-error' : ''}`}
                rows={8}
                maxLength={2000}
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
              <span className="char-count">{formData.description.length}/2000</span>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WikiEditorModal;
