import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
    const currentLang = i18n.language || 'en';
    const newLang = currentLang === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo/Brand */}
        <div className="header-brand">
          <h1 className="brand-name">GhostVillage Admin</h1>
        </div>

        {/* Language Toggle */}
        <div className="header-profile">
          <button 
            className="language-toggle"
            onClick={toggleLanguage}
            title="Toggle language"
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
