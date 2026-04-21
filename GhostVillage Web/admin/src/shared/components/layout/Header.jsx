import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, User, Settings, Lock, LogOut, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../app/hooks/useAuth';
import ChangePasswordModal from '../modals/ChangePasswordModal';
import '../../assets/styles/Header.css';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLanguageChange = (e) => {
    const nextLanguage = e.target.value;
    i18n.changeLanguage(nextLanguage);
  };

  const handleChangePassword = () => {
    setShowProfileMenu(false);
    setShowChangePasswordModal(true);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
  };

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo/Brand */}
        <div className="header-brand">
          <h1 className="brand-name">GhostVillage Admin</h1>
        </div>

        {/* Right Side Actions */}
        <div className="header-profile">
          {/* Language Toggle */}
          <button 
            className="language-toggle"
            title={t('language.switchLanguage')}
          >
            <Globe size={20} />
            <select
              className="language-select"
              value={(i18n.language || 'vi').startsWith('en') ? 'en' : 'vi'}
              onChange={handleLanguageChange}
              aria-label={t('language.switchLanguage')}
            >
              <option value="en">EN</option>
              <option value="vi">VN</option>
            </select>
          </button>

          {/* Profile Menu */}
          {user && (
            <div className="profile-menu-wrapper" ref={menuRef}>
              <button
                className="profile-button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.username || user.fullname}&background=990000&color=fff`}
                  alt={user.username || user.fullname}
                  className="profile-avatar"
                />
                <span className="profile-name">{user.username || user.fullname}</span>
                <ChevronDown size={16} className={`chevron ${showProfileMenu ? 'open' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-user-info">
                      <strong>{user.username || user.fullname}</strong>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={handleChangePassword}>
                    <Lock size={18} />
                    <span>{t('common.changePassword')}</span>
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={() => {
            console.log('Password changed successfully');
          }}
        />
      )}
    </header>
  );
};

export default Header;
