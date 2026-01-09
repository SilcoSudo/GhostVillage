import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/hooks/useAuth';
import api from '../../services/axios';
import {
  Home,
  TrendingUp,
  MessageSquare,
  Bookmark,
  Settings,
  Users,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  Edit,
  Send,
  ChevronFirst,
  ChevronLast,
  MoreVertical,
  LogOut
} from 'lucide-react';
import "../../assets/styles/SidebarNav.css";

// Create Sidebar Context for sharing expanded state
const SidebarContext = createContext();

const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider');
  }
  return context;
};

const SidebarNav = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(() => {
    try {
      return window.innerWidth > 768;
    } catch (e) {
      return true;
    }
  });

  // Ensure sidebar is collapsed automatically on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setExpanded(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [profile, setProfile] = useState(null);

  // No-op: data fetching removed
  const fetchNavigationData = () => setLoading(false);

  useEffect(() => {
    fetchNavigationData();
    if (user) {
      fetchUserProfile();
    }
  }, [user]);


  const fetchUserProfile = async () => {
    try {
      if (!user?._id) return;
      const res = await api.get(`/profile/${user._id}`);
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const browseLinks = [
    { icon: Home, label: t('navbar.home'), path: '/' },
    { icon: FileText, label: t('navbar.allPosts'), path: '/posts' },
    
  ];

  const myContentLinks = user ? [
    { icon: FileText, label: t('navbar.myPosts'), path: '/my-posts' },
    { icon: Bookmark, label: t('navbar.saved'), path: '/saved-posts' },
    { icon: Send, label: t('navbar.createPost'), path: '/posts/create' },
  ] : [];

  const userLinks = [
    { icon: Users, label: 'Followers', path: '/followers' },
    { icon: MessageSquare, label: 'Following', path: '/following' },
    { icon: Settings, label: t('navbar.settings'), path: '/account/settings' },
  ];

  return (
    <SidebarContext.Provider value={{ expanded }}>
      <aside className={`sidebar-nav ${expanded ? 'expanded' : 'collapsed'}`}>
        {/* Header with Logo and Toggle */}
        <div className="sidebar-header-top">
          <div className="sidebar-logo-spacer"></div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="sidebar-toggle-btn"
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {expanded ? <ChevronFirst size={20} /> : <ChevronLast size={20} />}
          </button>
        </div>

        {/* Main Navigation Content */}
        <nav className="sidebar-content">
          {/* Browse Section */}
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">
              <span>{t('navbar.browse')}</span>
            </h3>
            <ul className="sidebar-items">
              {browseLinks.map((link) => (
                <SidebarItem
                  key={link.path}
                  icon={link.icon}
                  label={link.label}
                  path={link.path}
                  active={isActive(link.path)}
                />
              ))}
            </ul>
          </div>

          {/* My Content Section */}
          {user && (
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">
                <span>{t('navbar.myContent')}</span>
              </h3>
              <ul className="sidebar-items">
                {myContentLinks.map((link) => (
                  <SidebarItem
                    key={link.path}
                    icon={link.icon}
                    label={link.label}
                    path={link.path}
                    active={isActive(link.path)}
                  />
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* User Profile Footer - Only when logged in */}
        {user && (
          <div className="sidebar-footer">
            <div className="sidebar-user-profile">
              <img
                src={profile?.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=f48024&color=fff`}
                alt={user.username}
                className="sidebar-user-avatar"
              />
              <div className="sidebar-user-info">
                <h4 className="sidebar-user-name">{user.username}</h4>
                <p className="sidebar-user-email">{user.email}</p>
              </div>
              {expanded && (
                <button
                  className="sidebar-user-menu"
                  title="User menu"
                  onClick={() => {
                    // Toggle user menu - can be expanded later
                  }}
                >
                  <MoreVertical size={18} />
                </button>
              )}
            </div>
            <button
              className="sidebar-logout-btn"
              onClick={logout}
              title={t('common.logout')}
            >
              <LogOut size={18} />
              {expanded && <span>{t('common.logout')}</span>}
            </button>
          </div>
        )}
      </aside>
    </SidebarContext.Provider>
  );
};

// SidebarItem Component with Tooltip
const SidebarItem = ({ icon: Icon, label, path, active }) => {
  const { expanded } = useSidebarContext();

  return (
    <li className="sidebar-item-wrapper">
      <Link
        to={path}
        className={`sidebar-item ${active ? 'active' : ''}`}
        title={label}
      >
        <Icon size={20} />
        <span>{label}</span>
        {!expanded && (
          <div className="sidebar-tooltip">
            {label}
          </div>
        )}
      </Link>
    </li>
  );
};


export default SidebarNav;
