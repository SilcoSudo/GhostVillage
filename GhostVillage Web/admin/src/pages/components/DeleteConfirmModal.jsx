import React, { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import "../assets/styles/Modal.css";

/**
 * Delete Confirm Modal Component
 * Modal xác nhận xóa (reusable)
 */
const DeleteConfirmModal = ({ title, message, onConfirm, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } catch (error) {
      console.error("Error in delete confirm:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-form">
          <div className="delete-modal-icon">
            <AlertTriangle size={48} />
          </div>
          <p className="delete-modal-message">{message}</p>
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
            type="button"
            onClick={handleConfirm}
            className="modal-btn modal-btn-danger"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="spinner" size={18} />
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xác nhận xóa</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
