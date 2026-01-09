import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Settings } from 'lucide-react';
import { AuthContext } from '../../../app/context/AuthContext';
import '../../assets/styles/Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo/Brand */}
        <div className="header-brand">
          <h1 className="brand-name">GhostVillage</h1>
        </div>

        {/* Search Bar */}
        <form className="header-search" onSubmit={handleSearch}>
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết, người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </form>

        {/* Profile Section */}
        <div className="header-profile">
          <div 
            className="profile-trigger"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar">
              <User size={20} />
            </div>
            <span className="profile-name">{user?.username || 'User'}</span>
          </div>

          {showProfileMenu && (
            <div className="profile-menu">
              <div className="profile-menu-header">
                <div className="profile-info">
                  <div className="profile-avatar-large">
                    <User size={24} />
                  </div>
                  <div className="profile-details">
                    <p className="profile-username">{user?.username}</p>
                    <p className="profile-email">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="profile-menu-divider"></div>

              <button 
                className="profile-menu-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/account/settings');
                }}
              >
                <Settings size={18} />
                <span>Cài đặt</span>
              </button>

              <div className="profile-menu-divider"></div>

              <button 
                className="profile-menu-item logout"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
