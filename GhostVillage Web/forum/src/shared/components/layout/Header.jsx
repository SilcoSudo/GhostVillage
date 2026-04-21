import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Globe, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18nConfig from "../../../i18n";
import { FriendSidebarContext } from "../../../app/context/FriendSidebarContext";
import NotificationBell from "../NotificationBell";
import "../../assets/styles/Header.css";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasUnreadFriendMessage, setHasUnreadFriendMessage] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { showFriendSidebar, toggleFriendSidebar } =
    useContext(FriendSidebarContext);

  useEffect(() => {
    const handleNewMessage = () => {
      setHasUnreadFriendMessage(true);
    };

    window.addEventListener("chat:new-message", handleNewMessage);
    return () => {
      window.removeEventListener("chat:new-message", handleNewMessage);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleFriendsClick = () => {
    setHasUnreadFriendMessage(false);
    toggleFriendSidebar();
  };

  const toggleLanguage = () => {
    const currentLang = i18n.language || i18nConfig.language;
    const newLang = currentLang === "en" ? "vi" : "en";

    if (i18n.changeLanguage) {
      i18n.changeLanguage(newLang);
    } else {
      i18nConfig.changeLanguage(newLang);
    }
  };

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo/Brand */}
        <div className="header-brand">
          <Link to="/" className="brand-name-link">
            <h1 className="brand-name">GhostVillage</h1>
          </Link>
        </div>

        {/* Search Bar */}
        <form className="header-search" onSubmit={handleSearch}>
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder={t("navbar.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </form>

        {/* Language Toggle & Friends & Notification */}
        <div className="header-profile">
          <button
            className="language-toggle"
            onClick={toggleLanguage}
            title={t("navbar.changeLanguage")}
          >
            <Globe size={20} />
            <span>{i18n.language === "en" ? "EN" : "VI"}</span>
          </button>
          <NotificationBell />
          <button
            className={`friends-btn ${showFriendSidebar ? "active" : ""}`}
            onClick={handleFriendsClick}
            title={t("navbar.friendsList")}
          >
            <Users size={20} />
            {hasUnreadFriendMessage ? (
              <span className="friends-unread-dot" aria-hidden="true" />
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
