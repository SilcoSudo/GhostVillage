import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, AlertCircle } from 'lucide-react';
import './assets/styles/TicketDetailModal.css';

const TicketResponseModal = ({ isOpen, ticket, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (responseMessage.trim()) {
      setIsSubmitting(true);
      setTimeout(() => {
        onSubmit(responseMessage);
        setResponseMessage('');
        setIsSubmitting(false);
      }, 500);
    }
  };

  const handleClose = () => {
    setResponseMessage('');
    setIsSubmitting(false);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey && responseMessage.trim()) {
      handleSubmit();
    }
  };

  if (!isOpen || !ticket) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content ticket-response-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Send size={20} className="header-icon" />
            <h2>{t('tickets.replyTicket') || 'Reply to Ticket'}</h2>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Ticket Info */}
          <div className="response-ticket-info">
            <div className="info-item">
              <span className="info-label">{t('tickets.ticketId') || 'Ticket ID'}</span>
              <span className="info-value">{ticket.ticketNumber}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('tickets.title') || 'Title'}</span>
              <span className="info-value ticket-title-info">{ticket.title}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t('tickets.user') || 'User'}</span>
              <span className="info-value">{ticket.username}</span>
            </div>
          </div>

          {/* Current Responses Preview */}
          {ticket.responses.length > 0 && (
            <div className="response-preview">
              <h3 className="preview-title">
                {t('tickets.previousResponses') || 'Previous Responses'} ({ticket.responses.length})
              </h3>
              <div className="preview-messages">
                {ticket.responses.slice(-2).map((response, index) => (
                  <div key={index} className="preview-message">
                    <span className="preview-author">{response.responder}</span>
                    <p className="preview-text">{response.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response Form */}
          <div className="response-form">
            <label className="form-label">
              {t('tickets.yourResponse') || 'Your Response'}
            </label>
            <textarea
              className="response-textarea"
              placeholder={t('tickets.typYourResponse') || 'Type your response message here... (Ctrl+Enter to submit)'}
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows="6"
            />
            <div className="char-count">
              {responseMessage.length} / 2000 {t('common.characters') || 'characters'}
            </div>

            {/* Hint */}
            <div className="response-hint">
              <AlertCircle size={14} />
              <span>{t('tickets.responseHint') || 'Press Ctrl+Enter or click Send to submit'}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn btn-cancel" onClick={handleClose}>
            {t('common.cancel') || 'Cancel'}
          </button>
          <button 
            className="modal-btn btn-confirm response-confirm" 
            onClick={handleSubmit}
            disabled={!responseMessage.trim() || isSubmitting}
          >
            <Send size={16} />
            {isSubmitting ? t('common.sending') || 'Sending...' : t('tickets.sendResponse') || 'Send Response'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketResponseModal;
