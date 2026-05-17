import React from "react";
import { FUNCTION_INFO } from "@/config/providers";
import { useTranslation } from "react-i18next";
import type { PromptType } from "@/types";

interface LandingProps {
  onStart: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  const { t } = useTranslation();

  return (
    <div className="main-container">
      <header className="header">
        <div className="logo-section">
          <h1 className="logo-text">OneDocs</h1>
          <h2 className="logo-chinese">一文亦闻</h2>
        </div>
      </header>

      <main className="hero-section">
        <div className="hero-content">
          <div className="title-section">
            <h3 className="main-title">{t("landing.title")}</h3>
            <p className="subtitle">{t("landing.subtitle")}</p>
          </div>

          <div className="description">
            <p>{t("landing.description")}</p>
          </div>

          <div className="features-preview">
            {(Object.keys(FUNCTION_INFO) as PromptType[]).map((key) => {
              const info = FUNCTION_INFO[key];
              const name = t(info.nameKey);
              const description = t(info.descriptionKey);
              return (
                <div key={key} className="feature-card">
                  <div className="feature-icon">{info.icon}</div>
                  <div className="feature-name">{name}</div>
                  <div className="feature-desc">{description}</div>
                </div>
              );
            })}
          </div>

          <button className="start-button" onClick={onStart}>
            <span className="button-text">{t("landing.start")}</span>
            <span className="button-arrow">
              <i className="fas fa-arrow-right"></i>
            </span>
          </button>
        </div>
      </main>

      <footer className="footer">
        <p>{t("landing.footer")}</p>
      </footer>
    </div>
  );
};
