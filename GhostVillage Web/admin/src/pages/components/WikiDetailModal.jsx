import React from 'react';
import { X, BookOpen } from 'lucide-react';
import '../assets/styles/WikiModal.css';

const WikiDetailModal = ({ isOpen, item, itemType, onClose }) => {
  if (!isOpen || !item) return null;

  const getIcon = () => {
    switch(itemType) {
      case 'monster': return '👹';
      case 'item': return '🎒';
      case 'map': return '🗺️';
      default: return '📖';
    }
  };

  const getTypeLabel = () => {
    switch(itemType) {
      case 'monster': return 'Monster';
      case 'item': return 'Item';
      case 'map': return 'Map';
      default: return 'Wiki';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content wiki-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <BookOpen size={20} className="header-icon" />
            <h2>Wiki Entry</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {/* Type Badge */}
          <div className="wiki-type-badge">{getIcon()} {getTypeLabel()}</div>

          {/* Name */}
          <h3 className="wiki-detail-title">{item.name}</h3>

          {/* Description */}
          <div className="detail-section">
            <label className="section-label">Description</label>
            <div className="wiki-detail-description">
              {item.description}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WikiDetailModal;
