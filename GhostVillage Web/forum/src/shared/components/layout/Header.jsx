import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18nConfig from '../../../i18n';
import '../../assets/styles/Header.css';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleLanguage = () => {
    const currentLang = i18n.language || i18nConfig.language;
    const newLang = currentLang === 'en' ? 'vi' : 'en';
    
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
              placeholder="Tìm kiếm bài viết, người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </form>

        {/* Language Toggle */}
        <div className="header-profile">
          <button 
            className="language-toggle"
            onClick={toggleLanguage}
            title="Chuyển đổi ngôn ngữ"
          >
            <Globe size={20} />
            <span>{i18n.language === 'en' ? 'EN' : 'VI'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
