import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Volume2, VolumeX, Ban, ChevronUp, ChevronDown, X } from 'lucide-react';
import './assets/styles/UserManagement.css';

const MUTE_DURATIONS = [
  { value: 24, label: '24h', icon: '⏱️' },
  { value: 72, label: '3 days', icon: '📅' },
  { value: 168, label: '7 days', icon: '📅' },
  { value: 360, label: '15 days', icon: '📅' },
  { value: 504, label: '21 days', icon: '📅' },
  { value: 720, label: '30 days', icon: '📅' },
];

const UserManagementPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'joinDate', direction: 'desc' });
  const [muteModalOpen, setMuteModalOpen] = useState(false);
  const [selectedUserForMute, setSelectedUserForMute] = useState(null);
  const [muteReason, setMuteReason] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(72); // 3 days default

  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=990000&color=fff',
      status: 'active',
      isMuted: false,
      muteReason: null,
      muteDuration: null,
      muteExpiresAt: null,
      joinDate: '2024-01-15',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=990000&color=fff',
      status: 'active',
      isMuted: true,
      muteReason: 'Spam and harassment in forum',
      muteDuration: 72,
      muteExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      joinDate: '2024-01-20',
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      avatar: 'https://ui-avatars.com/api/?name=Bob+Johnson&background=990000&color=fff',
      status: 'active',
      isMuted: false,
      muteReason: null,
      muteDuration: null,
      muteExpiresAt: null,
      joinDate: '2024-02-01',
    },
    {
      id: 4,
      name: 'Alice Brown',
      email: 'alice@example.com',
      avatar: 'https://ui-avatars.com/api/?name=Alice+Brown&background=990000&color=fff',
      status: 'banned',
      isMuted: false,
      muteReason: null,
      muteDuration: null,
      muteExpiresAt: null,
      joinDate: '2024-02-05',
    },
    {
      id: 5,
      name: 'Charlie Wilson',
      email: 'charlie@example.com',
      avatar: 'https://ui-avatars.com/api/?name=Charlie+Wilson&background=990000&color=fff',
      status: 'active',
      isMuted: true,
      muteReason: 'Offensive language',
      muteDuration: 168,
      muteExpiresAt: new Date(Date.now() + 168 * 60 * 60 * 1000).toISOString(),
      joinDate: '2024-02-10',
    },
  ]);

  const openMuteModal = (userId) => {
    setSelectedUserForMute(userId);
    setMuteReason('');
    setSelectedDuration(72);
    setMuteModalOpen(true);
  };

  const closeMuteModal = () => {
    setMuteModalOpen(false);
    setSelectedUserForMute(null);
    setMuteReason('');
    setSelectedDuration(72);
  };

  const handleConfirmMute = () => {
    const expiresAt = new Date(Date.now() + selectedDuration * 60 * 60 * 1000).toISOString();
    setUsers(users.map(user =>
      user.id === selectedUserForMute 
        ? { 
            ...user, 
            isMuted: true, 
            muteReason: muteReason || 'No reason specified',
            muteDuration: selectedDuration,
            muteExpiresAt: expiresAt
          } 
        : user
    ));
    closeMuteModal();
  };

  const handleUnmuteUser = (userId) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, isMuted: false, muteReason: null, muteDuration: null, muteExpiresAt: null } : user
    ));
  };

  const handleBanUser = (userId) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, status: 'banned' } : user
    ));
  };

  const handleUnbanUser = (userId) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, status: 'active' } : user
    ));
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (typeof aVal === 'string') {
          return sortConfig.direction === 'asc' 
            ? aVal.localeCompare(bVal) 
            : bVal.localeCompare(aVal);
        }
        return sortConfig.direction === 'asc' 
          ? aVal - bVal 
          : bVal - aVal;
      });
    }
    return sorted;
  }, [filteredUsers, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getRemainingMuteTime = (expiresAt) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expireDate = new Date(expiresAt);
    const diffMs = expireDate - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    
    if (diffDays > 0) {
      return `${diffDays}d ${remainingHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m`;
    }
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronUp size={14} className="sort-icon-inactive" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="sort-icon-active" /> 
      : <ChevronDown size={14} className="sort-icon-active" />;
  };

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h1>{t('navbar.users') || 'Users Management'}</h1>
        <p>{t('users.totalUsers', { count: users.length }) || `Total: ${users.length} users`}</p>
      </div>

      {/* Search Bar */}
      <div className="user-search-section">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={t('users.searchPlaceholder') || 'Search users...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-wrapper">
        {sortedUsers.length > 0 ? (
          <table className="users-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable">
                  <span>{t('users.name') || 'Name'}</span>
                  <SortIcon column="name" />
                </th>
                <th onClick={() => handleSort('email')} className="sortable">
                  <span>{t('users.email') || 'Email'}</span>
                  <SortIcon column="email" />
                </th>
                <th>{t('users.muteStatus') || 'Mute'}</th>
                <th onClick={() => handleSort('joinDate')} className="sortable">
                  <span>{t('users.joinDate') || 'Join Date'}</span>
                  <SortIcon column="joinDate" />
                </th>
                <th>{t('users.actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id} className={`user-row status-${user.status}`}>
                  <td className="user-name-cell">{user.name}</td>
                  <td className="user-email-cell">{user.email}</td>
                  <td>
                    {user.isMuted ? (
                      <div className="mute-info">
                        <span className="muted-indicator">
                          <VolumeX size={14} /> {t('users.muted')}
                        </span>
                        <div className="mute-remaining-time">
                          {getRemainingMuteTime(user.muteExpiresAt)}
                        </div>
                        {user.muteReason && (
                          <div className="mute-reason-tooltip" title={user.muteReason}>
                            {user.muteReason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="unmuted">-</span>
                    )}
                  </td>
                  <td className="join-date-cell">{user.joinDate}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      {!user.isMuted ? (
                        <button
                          className="action-btn action-mute-sm"
                          onClick={() => openMuteModal(user.id)}
                          title={t('users.mute')}
                        >
                          <Volume2 size={16} />
                        </button>
                      ) : (
                        <button
                          className="action-btn action-unmute-sm"
                          onClick={() => handleUnmuteUser(user.id)}
                          title={t('users.unmute')}
                        >
                          <VolumeX size={16} />
                        </button>
                      )}

                      {/* Ban button - temporarily disabled
                      {user.status !== 'banned' ? (
                        <button
                          className="action-btn action-ban-sm"
                          onClick={() => handleBanUser(user.id)}
                          title={t('users.ban')}
                        >
                          <Ban size={16} />
                        </button>
                      ) : (
                        <button
                          className="action-btn action-unban-sm"
                          onClick={() => handleUnbanUser(user.id)}
                          title={t('users.unban')}
                        >
                          <Ban size={16} />
                        </button>
                      )}
                      */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>{t('users.noUsersFound') || 'No users found'}</p>
          </div>
        )}
      </div>

      {/* Mute Modal */}
      {muteModalOpen && (
        <div className="modal-overlay" onClick={closeMuteModal}>
          <div className="mute-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Mute User</h2>
              <button className="modal-close-btn" onClick={closeMuteModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              {/* Mute Reason Input */}
              <div className="form-group">
                <label htmlFor="mute-reason">Reason for muting:</label>
                <textarea
                  id="mute-reason"
                  className="mute-reason-input"
                  placeholder="Enter the reason for muting this user..."
                  value={muteReason}
                  onChange={(e) => setMuteReason(e.target.value)}
                  rows="3"
                />
              </div>

              {/* Duration Selection */}
              <div className="form-group">
                <label>Mute Duration:</label>
                <div className="duration-options">
                  {MUTE_DURATIONS.map((duration) => (
                    <button
                      key={duration.value}
                      className={`duration-btn ${selectedDuration === duration.value ? 'active' : ''}`}
                      onClick={() => setSelectedDuration(duration.value)}
                    >
                      <span className="duration-icon">{duration.icon}</span>
                      <span className="duration-label">{duration.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeMuteModal}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleConfirmMute}>
                Confirm Mute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
