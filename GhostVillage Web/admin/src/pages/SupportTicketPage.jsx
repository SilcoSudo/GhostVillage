import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, MessageSquare, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import TicketDetailModal from '../shared/components/modals/TicketDetailModal';
import TicketResponseModal from '../shared/components/modals/TicketResponseModal';
import './assets/styles/SupportTicket.css';

const SupportTicketPage = () => {
  const { t } = useTranslation();
  
  // Mock data - Replace with API call later
  const [supportTickets, setSupportTickets] = useState([
    {
      id: 1,
      ticketNumber: 'TICKET-001',
      title: 'Cannot login to account',
      userEmail: 'user1@example.com',
      username: 'john_doe',
      category: 'Account Issue',
      priority: 'high',
      status: 'open',
      createdAt: '2024-01-20',
      lastUpdatedAt: '2024-01-20',
      description: 'I have been trying to login to my account but I keep getting an error message saying "Invalid credentials". I am sure my password is correct.',
      responses: [
        {
          id: 1,
          responder: 'Admin',
          message: 'We have received your ticket. Our team will look into this issue shortly.',
          timestamp: '2024-01-20 10:30'
        }
      ]
    },
    {
      id: 2,
      ticketNumber: 'TICKET-002',
      title: 'Game crashes on startup',
      userEmail: 'user2@example.com',
      username: 'jane_smith',
      category: 'Technical Issue',
      priority: 'critical',
      status: 'in_progress',
      createdAt: '2024-01-19',
      lastUpdatedAt: '2024-01-21',
      description: 'Every time I try to launch the game, it crashes immediately after the splash screen. Error code: 0x80004005.',
      responses: [
        {
          id: 1,
          responder: 'Support Team',
          message: 'Please try the following steps:\n1. Clear game cache\n2. Reinstall graphics drivers\n3. Try launching in compatibility mode',
          timestamp: '2024-01-20 14:00'
        },
        {
          id: 2,
          responder: 'jane_smith',
          message: 'Still not working. I tried all the steps.',
          timestamp: '2024-01-20 16:45'
        }
      ]
    },
    {
      id: 3,
      ticketNumber: 'TICKET-003',
      title: 'Refund request for in-game purchase',
      userEmail: 'user3@example.com',
      username: 'bob_wilson',
      category: 'Billing',
      priority: 'medium',
      status: 'resolved',
      createdAt: '2024-01-18',
      lastUpdatedAt: '2024-01-20',
      description: 'I purchased a premium item by mistake and would like a refund. Transaction ID: TX-123456',
      responses: [
        {
          id: 1,
          responder: 'Billing Support',
          message: 'Your refund has been processed. You should see it in your account within 3-5 business days.',
          timestamp: '2024-01-20 11:20'
        }
      ]
    },
    {
      id: 4,
      ticketNumber: 'TICKET-004',
      title: 'Missing items from inventory',
      userEmail: 'user4@example.com',
      username: 'alice_johnson',
      category: 'Account Issue',
      priority: 'high',
      status: 'open',
      createdAt: '2024-01-21',
      lastUpdatedAt: '2024-01-21',
      description: 'I had several items in my inventory but they disappeared after the last update. Can you help me recover them?',
      responses: []
    },
    {
      id: 5,
      ticketNumber: 'TICKET-005',
      title: 'Feature request: Dark mode',
      userEmail: 'user5@example.com',
      username: 'charlie_brown',
      category: 'Feature Request',
      priority: 'low',
      status: 'open',
      createdAt: '2024-01-15',
      lastUpdatedAt: '2024-01-15',
      description: 'It would be great if the game had a dark mode option to reduce eye strain during long play sessions.',
      responses: []
    }
  ]);

  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);

  // Filter tickets
  const filteredTickets = supportTickets.filter(ticket => {
    const matchSearch = 
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    
    return matchSearch && matchStatus && matchPriority;
  });

  // Sort tickets
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (typeof aValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const openDetailModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };

  const openResponseModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsResponseModalOpen(true);
  };

  const handleAddResponse = (responseMessage) => {
    if (selectedTicket) {
      setSupportTickets(prev => prev.map(t => {
        if (t.id === selectedTicket.id) {
          return {
            ...t,
            responses: [
              ...t.responses,
              {
                id: t.responses.length + 1,
                responder: 'Admin',
                message: responseMessage,
                timestamp: new Date().toLocaleString()
              }
            ],
            lastUpdatedAt: new Date().toISOString().split('T')[0]
          };
        }
        return t;
      }));
      setIsResponseModalOpen(false);
      setSelectedTicket(null);
    }
  };

  const handleDeleteTicket = (ticketId) => {
    setSupportTickets(prev => prev.filter(t => t.id !== ticketId));
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'open':
        return <AlertCircle size={16} />;
      case 'in_progress':
        return <Clock size={16} />;
      case 'resolved':
        return <CheckCircle size={16} />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'open':
        return 'status-open';
      case 'in_progress':
        return 'status-in-progress';
      case 'resolved':
        return 'status-resolved';
      default:
        return '';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch(priority) {
      case 'critical':
        return 'priority-critical';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  return (
    <div className="support-ticket-container">
      <div className="support-ticket-header">
        <h1>{t('tickets.supportTickets') || 'Support Tickets'}</h1>
        <p className="subtitle">{t('tickets.supportTicketsSubtitle') || 'Manage user support requests'}</p>
      </div>

      <div className="search-and-filter">
        <input
          type="text"
          placeholder={t('common.search') || 'Search by ticket ID, title, or user...'}
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <div className="filter-row">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">{t('tickets.allStatus') || 'All Status'}</option>
            <option value="open">{t('tickets.open') || 'Open'}</option>
            <option value="in_progress">{t('tickets.inProgress') || 'In Progress'}</option>
            <option value="resolved">{t('tickets.resolved') || 'Resolved'}</option>
          </select>

          <select
            className="filter-select"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">{t('tickets.allPriority') || 'All Priority'}</option>
            <option value="critical">{t('tickets.critical') || 'Critical'}</option>
            <option value="high">{t('tickets.high') || 'High'}</option>
            <option value="medium">{t('tickets.medium') || 'Medium'}</option>
            <option value="low">{t('tickets.low') || 'Low'}</option>
          </select>
        </div>
      </div>

      <div className="support-tickets-table-wrapper">
        <table className="support-tickets-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('ticketNumber')} className="sortable">
                {t('tickets.ticketId') || 'Ticket ID'}
              </th>
              <th onClick={() => handleSort('title')} className="sortable">
                {t('tickets.title') || 'Title'}
              </th>
              <th onClick={() => handleSort('username')} className="sortable">
                {t('tickets.user') || 'User'}
              </th>
              <th onClick={() => handleSort('category')} className="sortable">
                {t('tickets.category') || 'Category'}
              </th>
              <th>{t('tickets.priority') || 'Priority'}</th>
              <th>{t('tickets.status') || 'Status'}</th>
              <th onClick={() => handleSort('createdAt')} className="sortable">
                {t('tickets.created') || 'Created'}
              </th>
              <th>{t('common.actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {sortedTickets.map(ticket => (
              <tr key={ticket.id}>
                <td className="ticket-id-cell">
                  <span className="ticket-number">{ticket.ticketNumber}</span>
                </td>
                <td className="ticket-title-cell">
                  <span className="ticket-title">{ticket.title}</span>
                </td>
                <td className="ticket-user-cell">
                  <span>{ticket.username}</span>
                </td>
                <td className="ticket-category-cell">
                  <span className="category-badge">{ticket.category}</span>
                </td>
                <td className="ticket-priority-cell">
                  <span className={`priority-badge ${getPriorityBadgeClass(ticket.priority)}`}>
                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                  </span>
                </td>
                <td className="ticket-status-cell">
                  <span className={`status-badge ${getStatusBadgeClass(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    {ticket.status.replace('_', ' ').charAt(0).toUpperCase() + ticket.status.replace('_', ' ').slice(1)}
                  </span>
                </td>
                <td className="ticket-date-cell">
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </td>
                <td className="ticket-actions-cell">
                  <button
                    className="action-btn detail-btn"
                    onClick={() => openDetailModal(ticket)}
                    title={t('common.view') || 'View Details'}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="action-btn reply-btn"
                    onClick={() => openResponseModal(ticket)}
                    title={t('tickets.reply') || 'Reply'}
                  >
                    <MessageSquare size={16} />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteTicket(ticket.id)}
                    title={t('common.delete') || 'Delete'}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedTickets.length === 0 && (
          <div className="empty-state">
            <p>{t('common.noData') || 'No support tickets found'}</p>
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        isOpen={isDetailModalOpen}
        ticket={selectedTicket}
        onClose={() => setIsDetailModalOpen(false)}
      />

      {/* Ticket Response Modal */}
      <TicketResponseModal
        isOpen={isResponseModalOpen}
        ticket={selectedTicket}
        onClose={() => setIsResponseModalOpen(false)}
        onSubmit={handleAddResponse}
      />
    </div>
  );
};

export default SupportTicketPage;
