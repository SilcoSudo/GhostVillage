import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Moon, Zap } from 'lucide-react';
import moonEventService from '../shared/services/moonEventService';
import CreateMoonEventModal from './components/CreateMoonEventModal';
import EditMoonEventModal from './components/EditMoonEventModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import './assets/styles/MoonEventManagement.css';

const MoonEventManagementPage = () => {
  const [moonEvents, setMoonEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch moon events
  const fetchMoonEvents = async () => {
    try {
      setLoading(true);
      const data = await moonEventService.getAllMoonEvents({
        category: categoryFilter,
        status: statusFilter,
        search: searchQuery,
      });
      setMoonEvents(data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch moon events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoonEvents();
  }, [categoryFilter, statusFilter, searchQuery]);

  // Handle toggle active
  const handleToggleActive = async (eventId) => {
    try {
      await moonEventService.toggleMoonEventActive(eventId);
      fetchMoonEvents();
    } catch (err) {
      console.error('Failed to toggle event active status:', err);
      alert('Failed to toggle event status');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedEvent) return;
    
    try {
      await moonEventService.deleteMoonEvent(selectedEvent._id);
      setShowDeleteModal(false);
      setSelectedEvent(null);
      fetchMoonEvents();
    } catch (err) {
      console.error('Failed to delete moon event:', err);
      alert('Failed to delete moon event');
    }
  };

  // Handle edit
  const handleEdit = (event) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  // Handle delete click
  const handleDeleteClick = (event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  // Get category badge class
  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'MOON_PHASE':
        return 'category-badge-moon';
      case 'WEATHER':
        return 'category-badge-weather';
      case 'SPECIAL':
        return 'category-badge-special';
      default:
        return 'category-badge-other';
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'MOON_PHASE':
        return '🌙';
      case 'WEATHER':
        return '⛈️';
      case 'SPECIAL':
        return '✨';
      default:
        return '📌';
    }
  };

  return (
    <div className="moon-event-management">
      <div className="page-header">
        <div className="header-left">
          <Moon className="header-icon" size={32} />
          <h1>MOON EVENT MANAGEMENT</h1>
        </div>
        <button
          className="create-button"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={20} />
          Create Event
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="MOON_PHASE">Moon Phase</option>
            <option value="WEATHER">Weather</option>
            <option value="SPECIAL">Special</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="search-group">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by Event ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading">Loading moon events...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : moonEvents.length === 0 ? (
        <div className="empty-state">
          <Moon size={64} />
          <p>No moon events found</p>
          <button
            className="create-button"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={20} />
            Create First Event
          </button>
        </div>
      ) : (
        <div className="moon-event-table-container">
          <table className="moon-event-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Display Name</th>
                <th>Category</th>
                <th>Effect</th>
                <th>Multipliers</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {moonEvents.map((event) => (
                <tr key={event._id}>
                  <td className="event-id-cell">
                    <span className="event-icon">{event.uiIcon || '🌙'}</span>
                    <code>{event.eventId}</code>
                  </td>
                  <td className="event-name-cell">
                    <strong>{event.displayName}</strong>
                  </td>
                  <td>
                    <span className={`category-badge ${getCategoryBadgeClass(event.category)}`}>
                      {getCategoryIcon(event.category)} {event.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="effect-cell">
                    <span className="effect-text">{event.effectDescription || '-'}</span>
                  </td>
                  <td className="multipliers-cell">
                    <div className="multipliers">
                      <span className="multiplier-coin" title="Coin Multiplier">
                        💰 x{event.coinMultiplier}
                      </span>
                      <span className="multiplier-exp" title="EXP Multiplier">
                        ⭐ x{event.expMultiplier}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button
                      className={`toggle-btn ${event.isActive ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleActive(event._id)}
                      title={event.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      <Zap size={16} />
                      {event.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(event)}
                        title="Edit Event"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteClick(event)}
                        title="Delete Event"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateMoonEventModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchMoonEvents}
        />
      )}

      {showEditModal && selectedEvent && (
        <EditMoonEventModal
          event={selectedEvent}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
          onSuccess={fetchMoonEvents}
        />
      )}

      {showDeleteModal && selectedEvent && (
        <DeleteConfirmModal
          title="Delete Moon Event"
          message={`Are you sure you want to delete "${selectedEvent.displayName}" (${selectedEvent.eventId})? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};

export default MoonEventManagementPage;
