import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/hooks/useAuth';
import api from '../../../shared/services/axios';
import { 
  User, Mail, Calendar, Edit2, MapPin, Link as LinkIcon, 
  MessageSquare, Trophy, Clock, Settings as SettingsIcon, 
  Eye, EyeOff, Lock, UserCheck, Shield, BookOpen, Bookmark, History, Users
} from 'lucide-react';
import './ProfilePage.css';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('activity');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const isOwnProfile = currentUser && (id ? currentUser._id === id : true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const targetId = id || currentUser?._id;
        if (!targetId) {
          setLoading(false);
          return;
        }

        const response = await api.get(`/web/user/profile/${targetId}`);
        if (response.data.success) {
          setProfileUser(response.data.data);
          setNewName(response.data.data.fullname);
        } else {
          setError(response.data.message || 'Subject not found');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || 'Connection to database failed');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, currentUser]);

  const handleUpdateName = async () => {
    try {
      const response = await api.put('/web/user/profile/update-name', { fullname: newName });
      if (response.data.success) {
        setProfileUser({ ...profileUser, fullname: newName });
        setIsEditingName(false);
        refreshUser();
      }
    } catch (err) {
      alert('Failed to update name');
    }
  };

  const toggleEmailVisibility = async () => {
    try {
      const response = await api.put('/web/user/profile/toggle-email-visibility');
      if (response.data.success) {
        setProfileUser({ ...profileUser, emailVisibility: !profileUser.emailVisibility });
      }
    } catch (err) {
      alert('Failed to update visibility');
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="horror-spinner"></div>
        <p>RETRACING FOOTAGE...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="profile-error">
        <h2>404 - SUBJECT NOT FOUND</h2>
        <p>{error || 'The requested profile does not exist in the village records.'}</p>
        <button onClick={() => navigate('/')} className="btn-horror">RETURN TO SAFETY</button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-cover"></div>
        <div className="profile-header-content">
          <div className="profile-avatar-wrapper">
            <img 
              src={profileUser.avatar || `https://ui-avatars.com/api/?name=${profileUser.fullname}&background=990000&color=B5A642`} 
              alt={profileUser.fullname} 
              className="profile-avatar"
            />
            {isOwnProfile && (
              <button className="edit-avatar-btn">
                <Edit2 size={16} />
              </button>
            )}
          </div>
          
          <div className="profile-main-info">
            {isEditingName ? (
              <div className="edit-name-group">
                <input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  className="horror-input-small"
                />
                <button onClick={handleUpdateName} className="btn-horror-save">SAVE</button>
                <button onClick={() => setIsEditingName(false)} className="btn-horror-cancel">X</button>
              </div>
            ) : (
              <div className="name-display-group">
                <h1 className="profile-name">
                  {profileUser.fullname || 'Anonymous Subject'}
                  {isOwnProfile && <Edit2 size={16} className="edit-inline-icon" onClick={() => setIsEditingName(true)} />}
                </h1>
              </div>
            )}
            <p className="profile-username">@{profileUser.fullname?.toLowerCase().replace(/\s/g, '')}</p>
            <div className="profile-badges">
              {profileUser.role === 'admin' && <span className="badge admin-badge">WARDEN</span>}
              <span className="badge rank-badge">EXPLORER</span>
            </div>
          </div>

          <div className="profile-actions">
            {!isOwnProfile && (
              <button className="btn-horror">
                <MessageSquare size={18} />
                SEND MESSAGE
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="profile-body-grid">
        {/* Sidebar Info */}
        <div className="profile-sidebar">
          <div className="profile-card info-card">
            <h3>LOG DATA</h3>
            <ul className="info-list">
              <li>
                <Mail size={16} />
                <span>
                  {profileUser.emailVisibility || isOwnProfile ? profileUser.email : '••••••••@••••.com'}
                </span>
                {isOwnProfile && (
                  <button className="icon-btn-inline" onClick={toggleEmailVisibility} title="Toggle Visibility">
                    {profileUser.emailVisibility ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                )}
              </li>
              <li>
                <Calendar size={16} />
                <span>Joined {new Date(profileUser.createdAt || Date.now()).toLocaleDateString()}</span>
              </li>
              <li className="clickable-row" onClick={() => setActiveTab('friends')}>
                <Users size={16} />
                <span>Friends: {profileUser.friends?.length || 0}</span>
                <span className="view-link">VIEW</span>
              </li>
              {profileUser.bio && (
                <li className="bio-item">
                  <p>{profileUser.bio}</p>
                </li>
              )}
            </ul>
          </div>

          <div className="profile-card stats-card">
            <h3>VITAL SIGNS</h3>
            <div className="stats-mini-grid">
              <div className="stat-mini-item">
                <span className="stat-value">0</span>
                <span className="stat-label">POSTS</span>
              </div>
              <div className="stat-mini-item">
                <span className="stat-value">0</span>
                <span className="stat-label">ACHIEVEMENTS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="profile-main-content">
          <div className="profile-tabs">
            <button 
              className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <History size={16} />
              ACTIVITY
            </button>
            <button 
              className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <BookOpen size={16} />
              POSTS
            </button>
            {isOwnProfile && (
              <button 
                className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
                onClick={() => setActiveTab('saved')}
              >
                <Bookmark size={16} />
                SAVED
              </button>
            )}
            <button 
              className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              <Users size={16} />
              FRIENDS
            </button>
            {isOwnProfile && (
              <button 
                className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <SettingsIcon size={16} />
                SETTINGS
              </button>
            )}
          </div>

          <div className="profile-feed-container">
            {activeTab === 'activity' && (
              <div className="activity-history">
                <h4 className="feed-title">GAME MATCH HISTORY</h4>
                <div className="empty-feed">
                  <History size={48} />
                  <p>NO MATCH DATA FOUND</p>
                  <span>The subject has not participated in any recorded matches.</span>
                </div>
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="posts-list">
                <h4 className="feed-title">PUBLISHED POSTS</h4>
                <div className="empty-feed">
                  <BookOpen size={48} />
                  <p>NO POSTS RECORDED</p>
                  <span>This folder is currently empty.</span>
                </div>
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="saved-posts">
                <h4 className="feed-title">ARCHIVED / SAVED</h4>
                <div className="empty-feed">
                  <Bookmark size={48} />
                  <p>NO SAVED CONTENT</p>
                  <span>Only the warden can see this archive.</span>
                </div>
              </div>
            )}

            {activeTab === 'friends' && (
              <div className="friends-list">
                <h4 className="feed-title">ACCOMPLICES / FRIENDS</h4>
                <div className="empty-feed">
                  <Users size={48} />
                  <p>NO ACCOMPLICES FOUND</p>
                  <span>This subject wanders the village alone.</span>
                </div>
              </div>
            )}

            {activeTab === 'settings' && isOwnProfile && (
              <div className="profile-settings-section">
                <h4 className="feed-title">ACCOUNT PREFERENCES</h4>
                <div className="settings-grid">
                  <div className="settings-group">
                    <label><Lock size={16} /> SECURITY</label>
                    <button className="btn-horror-outline" onClick={() => navigate('/account/change-password')}>
                      CHANGE PASSWORD
                    </button>
                    <button className="btn-horror-outline" onClick={() => navigate('/forgot-password')}>
                      FORGOT PASSWORD?
                    </button>
                  </div>
                  
                  <div className="settings-group">
                    <label><Shield size={16} /> PRIVACY</label>
                    <div className="setting-toggle">
                      <span>Show email to others</span>
                      <button className={`toggle-btn ${profileUser.emailVisibility ? 'on' : 'off'}`} onClick={toggleEmailVisibility}>
                        {profileUser.emailVisibility ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                  </div>

                  <div className="settings-group">
                    <label><UserCheck size={16} /> PROFILE DETAILS</label>
                    <button className="btn-horror-outline" onClick={() => setIsEditingName(true)}>
                      UPDATE DISPLAY NAME
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
