import React, { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/hooks/useAuth";
import api from "../../services/axios";
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
  LogOut,
  LogIn,
  UserPlus,
  BookOpen,
  Megaphone,
} from "lucide-react";
import "../../assets/styles/SidebarNav.css";

// Create Sidebar Context for sharing expanded state
const SidebarContext = createContext();

const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within SidebarProvider");
  }
  return context;
};

const SidebarNav = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(() => {
    try {
      return window.innerWidth > 768;
    } catch (e) {
      return true;
    }
  });
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Ensure sidebar is collapsed automatically on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setExpanded(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [profile, setProfile] = useState(null);

  // No-op: data fetching removed
  const fetchNavigationData = () => setLoading(false);

  useEffect(() => {
    fetchNavigationData();
    // User profile fetching is disabled for now as the route is not implemented
    // if (user) {
    //   fetchUserProfile();
    // }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      if (!user?._id) return;
      // The profile route is currently not implemented in the backend (404)
      // For now, we use the user object provided by useAuth()
      /*
      const res = await api.get(`/web/user/profile/${user._id}`);
      if (res.data.success) {
        setProfile(res.data.data);
      }
      */
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const browseLinks = [
    { icon: Home, label: t("navbar.home"), path: "/" },
    { icon: FileText, label: t("navbar.allPosts"), path: "/posts" },
    { icon: BookOpen, label: "Wiki", path: "/wiki" },
    { icon: Megaphone, label: "Announcements", path: "/announcements" },
  ];

  const myContentLinks = user
    ? [
        { icon: FileText, label: t("navbar.myPosts"), path: "/my-posts" },
        { icon: Bookmark, label: t("navbar.saved"), path: "/saved-posts" },
        {
          icon: Send,
          label: t("navbar.submitSupportTicket"),
          path: "/support/ticket",
        },
      ]
    : [];

  const userLinks = [
    { icon: Users, label: t("navbar.followers"), path: "/followers" },
    { icon: MessageSquare, label: t("navbar.following"), path: "/following" },
    { icon: Settings, label: t("navbar.settings"), path: "/account/settings" },
  ];

  return (
    <SidebarContext.Provider value={{ expanded }}>
      <aside className={`sidebar-nav ${expanded ? "expanded" : "collapsed"}`}>
        {/* Header with Logo and Toggle */}
        <div className="sidebar-header-top">
          {user ? (
            <div
              className="sidebar-user-header"
              onClick={() => navigate(`/profile/${user._id}`)}
              title={t("navbar.viewProfile")}
            >
              <img
                src={
                  user.avatar ||
                  profile?.avatar ||
                  `https://ui-avatars.com/api/?name=${user.username || user.fullname}&background=f48024&color=fff`
                }
                alt={user.username || user.fullname}
                className="sidebar-user-avatar-header"
              />
              {expanded && (
                <div className="sidebar-user-info-header">
                  <h4 className="sidebar-user-name-header">
                    {user.username || user.fullname}
                  </h4>
                </div>
              )}
            </div>
          ) : (
            <div className="sidebar-logo-spacer"></div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="sidebar-toggle-btn"
            title={expanded ? t("navbar.collapse") : t("navbar.expand")}
            aria-label={expanded ? t("navbar.collapse") : t("navbar.expand")}
          >
            {expanded ? <ChevronFirst size={20} /> : <ChevronLast size={20} />}
          </button>
        </div>

        {/* Main Navigation Content */}
        <nav className="sidebar-content">
          {/* Browse Section */}
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">
              <span>{t("navbar.browse")}</span>
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
                <span>{t("navbar.myContent")}</span>
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
            <button
              className="sidebar-logout-btn"
              onClick={logout}
              title={t("common.logout")}
            >
              <LogOut size={18} />
              {expanded && <span>{t("common.logout")}</span>}
            </button>
          </div>
        )}

        {/* Auth Buttons - Only when not logged in */}
        {!user && (
          <div className="sidebar-footer">
            <div className="sidebar-auth-buttons">
              <button
                className="sidebar-login-btn"
                onClick={() => navigate("/login")}
                title={t("auth.login")}
              >
                <LogIn size={18} />
                {expanded && <span>{t("auth.login")}</span>}
              </button>
              <button
                className="sidebar-signup-btn"
                onClick={() => navigate("/register")}
                title={t("auth.register")}
              >
                <UserPlus size={18} />
                {expanded && <span>{t("auth.register")}</span>}
              </button>
            </div>
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
        className={`sidebar-item ${active ? "active" : ""}`}
        title={label}
      >
        <Icon size={20} />
        <span>{label}</span>
        {!expanded && <div className="sidebar-tooltip">{label}</div>}
      </Link>
    </li>
  );
};

export default SidebarNav;
