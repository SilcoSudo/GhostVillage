import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, Clock, CheckCircle, MessageCircle } from 'lucide-react';
import './assets/styles/TicketDetailModal.css';

const TicketDetailModal = ({ isOpen, ticket, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen || !ticket) return null;

  const getStatusIcon = (status) => {
    switch(status) {
      case 'open':
        return <AlertCircle size={18} />;
      case 'in_progress':
        return <Clock size={18} />;
      case 'resolved':
        return <CheckCircle size={18} />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical':
        return '#FF4757';
      case 'high':
        return '#FF6348';
      case 'medium':
        return '#FFC107';
      case 'low':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ticket-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <MessageCircle size={20} className="header-icon" />
            <h2>{t('tickets.ticketDetail') || 'Ticket Details'}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Ticket Number and Status */}
          <div className="ticket-header-info">
            <div className="ticket-number-section">
              <span className="ticket-number">{ticket.ticketNumber}</span>
              <span className="ticket-title-main">{ticket.title}</span>
            </div>
            <div className="ticket-status-section">
              <span className={`status-badge status-${ticket.status}`}>
                {getStatusIcon(ticket.status)}
                {ticket.status.replace('_', ' ').charAt(0).toUpperCase() + ticket.status.replace('_', ' ').slice(1)}
              </span>
            </div>
          </div>

          {/* User and Category Info */}
          <div className="detail-row">
            <div className="detail-section">
              <h3 className="detail-label">{t('tickets.user') || 'User'}</h3>
              <div className="detail-value-box">
                <p className="value-text">{ticket.username}</p>
                <p className="value-subtext">{ticket.userEmail}</p>
              </div>
            </div>
            <div className="detail-section">
              <h3 className="detail-label">{t('tickets.category') || 'Category'}</h3>
              <p className="detail-value">{ticket.category}</p>
            </div>
          </div>

          {/* Priority and Dates */}
          <div className="detail-row">
            <div className="detail-section">
              <h3 className="detail-label">{t('tickets.priority') || 'Priority'}</h3>
              <span className="priority-display" style={{ borderLeftColor: getPriorityColor(ticket.priority) }}>
                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
              </span>
            </div>
            <div className="detail-section">
              <h3 className="detail-label">{t('tickets.created') || 'Created'}</h3>
              <p className="detail-value">
                {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="detail-section">
              <h3 className="detail-label">{t('tickets.lastUpdated') || 'Last Updated'}</h3>
              <p className="detail-value">
                {new Date(ticket.lastUpdatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="detail-section">
            <h3 className="detail-label">{t('tickets.description') || 'Description'}</h3>
            <div className="ticket-description-box">
              {ticket.description}
            </div>
          </div>

          {/* Responses/Conversation */}
          <div className="detail-section">
            <h3 className="detail-label">
              {t('tickets.responses') || 'Responses'} 
              <span className="response-count">({ticket.responses.length})</span>
            </h3>
            <div className="responses-container">
              {ticket.responses.length > 0 ? (
                <div className="responses-list">
                  {ticket.responses.map((response, index) => (
                    <div key={index} className="response-item">
                      <div className="response-header">
                        <span className="response-author">{response.responder}</span>
                        <span className="response-time">{response.timestamp}</span>
                      </div>
                      <div className="response-message">
                        {response.message}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-responses">
                  <p>{t('tickets.noResponses') || 'No responses yet'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn btn-cancel" onClick={onClose}>
            {t('common.close') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
