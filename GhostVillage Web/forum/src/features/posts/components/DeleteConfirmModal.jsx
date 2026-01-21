import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ show, onHide, onConfirm, isDeleting, itemType = 'post' }) => {
  const { t } = useTranslation();

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      centered
      className="delete-confirm-modal"
    >
      <Modal.Body>
        <div className="delete-confirm-content">
          <div className="delete-icon">
            <AlertTriangle size={48} />
          </div>
          
          <h4 className="delete-title">
            {t(`posts.confirmDelete.${itemType}.title`)}
          </h4>
          
          <p className="delete-message">
            {t(`posts.confirmDelete.${itemType}.message`)}
          </p>

          <div className="delete-actions">
            <Button
              variant="secondary"
              onClick={onHide}
              disabled={isDeleting}
              className="cancel-btn"
            >
              {t('common.cancel')}
            </Button>
            
            <Button
              variant="danger"
              onClick={onConfirm}
              disabled={isDeleting}
              className="delete-btn"
            >
              {isDeleting ? t('posts.deleting') : t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default DeleteConfirmModal;
