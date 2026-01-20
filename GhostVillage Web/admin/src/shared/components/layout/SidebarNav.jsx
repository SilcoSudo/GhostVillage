import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../app/hooks/useAuth';
import {
  Home,
  Users,
  FileText,
  AlertCircle,
  MessageSquare,
  Ticket,
  Megaphone,
  BookOpen,
  Activity,
  Package,
  Bug,
  ChevronFirst,
  ChevronLast,
  LogOut,
  LogIn,
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
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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

  const isActive = (path) => location.pathname === path;

  const adminLinks = [
    { icon: Users, label: t('dashboard.userList'), path: '/users', color: 'green' },
    { icon: Ticket, label: t('dashboard.supportTickets'), path: '/support-tickets', color: 'purple' },
    { icon: Megaphone, label: t('dashboard.announcements'), path: '/announcements', color: 'yellow' },
    { icon: BookOpen, label: t('dashboard.wiki'), path: '/wiki', color: 'cyan' },
  ];

  const gameLinks = [ 
    { icon: Activity, label: t('dashboard.activityLog'), path: '/activity-log', color: 'gray' },
    { icon: Package, label: t('dashboard.gameVersion'), path: '/game-versions', color: 'indigo' },
  ]

  const reportLinks = [
    { icon: AlertCircle, label: t('dashboard.reportedPosts'), path: '/reports/posts', color: 'orange' },
    { icon: MessageSquare, label: t('dashboard.reportedComments'), path: '/reports/comments', color: 'red' },
    { icon: Bug, label: t('dashboard.reportBug'), path: '/report-bug', color: 'red' },
  ];

  return (
    <SidebarContext.Provider value={{ expanded }}>
      <aside className={`sidebar-nav ${expanded ? 'expanded' : 'collapsed'}`}>
        {/* Header with Logo and Toggle */}
        <div className="sidebar-header-top">
          {user ? (
            <div 
              className="sidebar-user-header"
              onClick={() => navigate(`/profile/${user._id}`)}
              title={t('navbar.viewProfile')}
            >
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.username || user.fullname}&background=990000&color=fff`}
                alt={user.username || user.fullname}
                className="sidebar-user-avatar-header"
              />
              {expanded && (
                <div className="sidebar-user-info-header">
                  <h4 className="sidebar-user-name-header">{user.username || user.fullname}</h4>
                </div>
              )}
            </div>
          ) : (
            <div className="sidebar-logo-spacer"></div>
          )}
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="sidebar-toggle-btn"
            title={expanded ? t('navbar.collapse') : t('navbar.expand')}
            aria-label={expanded ? t('navbar.collapse') : t('navbar.expand')}
          >
            {expanded ? <ChevronFirst size={20} /> : <ChevronLast size={20} />}
          </button>
        </div>

        {/* Main Navigation Content */}
        <nav className="sidebar-content">
          {/* Admin Navigation Section */}
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">
              <span>{t('navbar.administration')}</span>
            </h3>
            <ul className="sidebar-items">
              {adminLinks.map((link) => (
                <SidebarItem
                  key={link.path}
                  icon={link.icon}
                  label={link.label}
                  path={link.path}
                  color={link.color}
                  active={isActive(link.path)}
                />
              ))}
            </ul>

            {/* Reports Section */}
            <h3 className="sidebar-section-title">
              <span>{t('navbar.reports')}</span>
            </h3>
            <ul className="sidebar-items">
              {reportLinks.map((link) => (
                <SidebarItem
                  key={link.path}
                  icon={link.icon}
                  label={link.label}
                  path={link.path}
                  color={link.color}
                  active={isActive(link.path)}
                />
              ))}
            </ul>

            {/* Game Section */}
            <h3 className="sidebar-section-title">
              <span>{t('navbar.game')}</span>
            </h3>
            <ul className="sidebar-items">
              {gameLinks.map((link) => (
                <SidebarItem
                  key={link.path}
                  icon={link.icon}
                  label={link.label}
                  path={link.path}
                  color={link.color}
                  active={isActive(link.path)}
                />
              ))}
            </ul>
          </div>
        </nav>

        {/* User Profile Footer - Only when logged in */}
        {user && (
          <div className="sidebar-footer">
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

        {/* Auth Buttons - Only when not logged in */}
        {!user && (
          <div className="sidebar-footer">
            <div className="sidebar-auth-buttons">
              <button
                className="sidebar-login-btn"
                onClick={() => navigate('/login')}
                title={t('auth.login')}
              >
                <LogIn size={18} />
                {expanded && <span>{t('auth.login')}</span>}
              </button>
            </div>
          </div>
        )}
      </aside>
    </SidebarContext.Provider>
  );
};

// SidebarItem Component with Tooltip
const SidebarItem = ({ icon: Icon, label, path, color, active }) => {
  const { expanded } = useSidebarContext();

  return (
    <li className="sidebar-item-wrapper">
      <Link
        to={path}
        className={`sidebar-item sidebar-item-${color} ${active ? 'active' : ''}`}
        title={label}
      >
        <Icon size={20} className="sidebar-item-icon" />
        <span className="sidebar-item-label">{label}</span>
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

