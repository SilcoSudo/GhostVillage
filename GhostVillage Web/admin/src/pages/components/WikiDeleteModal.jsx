import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import '../assets/styles/WikiModal.css';

const WikiDeleteModal = ({ isOpen, item, itemType, onClose, onConfirm }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onConfirm();
    setIsLoading(false);
    onClose();
  };

  const getTypeLabel = () => {
    switch(itemType) {
      case 'monster': return 'Monster';
      case 'item': return 'Item';
      case 'map': return 'Map';
      default: return 'Wiki Entry';
    }
  };

  const getIcon = () => {
    switch(itemType) {
      case 'monster': return '👹';
      case 'item': return '🎒';
      case 'map': return '🗺️';
      default: return '📖';
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content wiki-delete-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header delete-header">
          <div className="header-content">
            <AlertTriangle size={20} className="header-icon alert-icon" />
            <h2>Delete {getTypeLabel()}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body delete-body">
          <div className="delete-warning">
            <AlertTriangle size={48} className="warning-icon" />
            <p className="warning-text">
              Are you sure you want to delete this wiki entry? This action cannot be undone.
            </p>
          </div>

          {/* Item Info */}
          <div className="wiki-info">
            <div className="info-row">
              <span className="info-label">Type:</span>
              <span className="info-value">{getIcon()} {getTypeLabel()}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{item.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Description:</span>
              <span className="info-value description-preview">{item.description.substring(0, 100)}...</span>
            </div>
          </div>

          <div className="delete-info">
            <Trash2 size={16} />
            <p>The wiki entry "{item.name}" will be permanently deleted.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer delete-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn-danger"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : `Delete ${getTypeLabel()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WikiDeleteModal;
