import React from "react";
import langmaLogo from "../shared/assets/images/logo.png";
import "../shared/assets/styles/HomePage.css";
import { useTranslation } from "react-i18next";
import { Gamepad2, Ghost, Users, MessageCircle } from "lucide-react";

const HomePage = () => {
  const { t } = useTranslation();

  const handlePlayGame = () => {
    window.location.href = "https://drive.google.com/uc?export=download&id=1pUMhwFnvaTMqTEOVOVDS8Hdna_Gq9sY2";
  };

  const majorFeatures = [
    {
      icon: Users,
      titleKey: "homePage.majorFeatures.coop.title",
      descriptionKey: "homePage.majorFeatures.coop.description",
    },
    {
      icon: MessageCircle,
      titleKey: "homePage.majorFeatures.lobby.title",
      descriptionKey: "homePage.majorFeatures.lobby.description",
    },
    {
      icon: Gamepad2,
      titleKey: "homePage.majorFeatures.objective.title",
      descriptionKey: "homePage.majorFeatures.objective.description",
    },
    {
      icon: Ghost,
      titleKey: "homePage.majorFeatures.mapMonster.title",
      descriptionKey: "homePage.majorFeatures.mapMonster.description",
    },
  ];

  return (
    <div className="home-page">
      {/* Hero Section - Large Banner */}
      <section className="hero-banner">
        <div className="hero-overlay"></div>
        <div className="hero-content-wrapper">
          <div className="hero-text-content">
            <img src={langmaLogo} alt="Ghost Village" className="hero-logo" />
            <p className="hero-tagline">
              {t("homePage.hero.line1")}
              <br />
              {t("homePage.hero.line2")}
            </p>
            <button className="hero-cta-button" onClick={handlePlayGame}>
              {t("homePage.hero.cta")}
            </button>
          </div>
        </div>
      </section>

      <section className="home-section overview-section major-features-section">
        <div className="section-container">
          <div className="home-section-header">
            <span className="section-eyebrow">
              {t("homePage.majorFeatures.eyebrow")}
            </span>
          </div>

          <div className="feature-grid">
            {majorFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="feature-card" key={feature.titleKey}>
                  <div className="feature-icon">
                    <Icon size={22} />
                  </div>

                  <h3 className="feature-title">{t(feature.titleKey)}</h3>
                  <p className="feature-description">
                    {t(feature.descriptionKey)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
