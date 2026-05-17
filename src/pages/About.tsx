import React, { useState } from "react";
import { FUNCTION_INFO } from "@/config/providers";
import { FUNCTION_ICONS } from "@/config/uiIcons";
import InfoIcon from "@/assets/icons/info-circle.svg";
import TagIcon from "@/assets/icons/tag.svg";
import NewspaperIcon from "@/assets/icons/newspaper.svg";
import { useTranslation } from "react-i18next";
import type { PromptType } from "@/types";
import packageJson from "../../package.json";

type AboutSection = "version" | "intro" | "features";

export const About: React.FC = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<AboutSection>("version");
  const version = packageJson.version || "unknown";

  const sections = [
    {
      id: "version" as AboutSection,
      labelKey: "about.sections.version",
      descKey: "about.sections.versionDesc",
      icon: TagIcon,
    },
    {
      id: "intro" as AboutSection,
      labelKey: "about.sections.intro",
      descKey: "about.sections.introDesc",
      icon: InfoIcon,
    },
    {
      id: "features" as AboutSection,
      labelKey: "about.sections.features",
      descKey: "about.sections.featuresDesc",
      icon: NewspaperIcon,
    },
  ];

  return (
    <div className="tools-container">
      <aside className="tools-sidebar">
        <div className="tools-sidebar-header">
          <h2>{t("about.title")}</h2>
          <p>{t("app.brand.chinese")}</p>
        </div>
        <nav className="tools-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`tools-nav-item ${activeSection === section.id ? "active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              <div className="tools-nav-icon">
                <img src={section.icon} alt="" />
              </div>
              <div className="tools-nav-meta">
                <span>{t(section.labelKey)}</span>
                <small>{t(section.descKey)}</small>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      <section className="tools-content">
        {activeSection === "version" && (
          <div className="settings-stack">
            <div className="tool-panel">
              <div className="data-card">
                <div className="data-card-header">
                  <div>
                    <h3>{t("about.version.title")}</h3>
                    <p>{t("about.version.desc")}</p>
                  </div>
                </div>
                <div className="setting-row" style={{ alignItems: "flex-start" }}>
                  <div className="setting-text">
                    <div className="setting-title">{t("about.version.current")}</div>
                    <div className="setting-desc">
                      <button type="button" className="btn btn-secondary" style={{ padding: "6px 12px" }}>
                        v{version}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="setting-row" style={{ alignItems: "flex-start" }}>
                  <div className="setting-text">
                    <div className="setting-title">{t("about.version.website")}</div>
                    <div className="setting-desc">
                      <a href="https://onedocs.ijune.cn/" target="_blank" rel="noreferrer">
                        https://onedocs.ijune.cn/
                      </a>
                    </div>
                  </div>
                </div>
                <div className="setting-row" style={{ alignItems: "flex-start" }}>
                  <div className="setting-text">
                    <div className="setting-title">{t("about.version.repo")}</div>
                    <div className="setting-desc">
                      <a href="https://github.com/LYOfficial/OneDocs" target="_blank" rel="noreferrer">
                        https://github.com/LYOfficial/OneDocs
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "intro" && (
          <div className="settings-stack">
            <div className="tool-panel">
              <div className="data-card">
                <div className="data-card-header">
                  <div>
                    <h3>{t("about.intro.title")}</h3>
                    <p>{t("about.intro.desc")}</p>
                  </div>
                </div>
                <div className="about-intro-content">
                  <p>{t("about.intro.paragraph1")}</p>
                  <p>{t("about.intro.paragraph2")}</p>
                  <p>{t("about.intro.paragraph3")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "features" && (
          <div className="settings-stack">
            <div className="tool-panel">
              <div className="data-card">
                <div className="data-card-header">
                  <div>
                    <h3>{t("about.features.title")}</h3>
                    <p>{t("about.features.desc")}</p>
                  </div>
                </div>
                <div className="about-features-grid">
                  {(Object.keys(FUNCTION_INFO) as PromptType[]).map((key) => {
                    const info = FUNCTION_INFO[key];
                    const name = t(info.nameKey);
                    const description = t(info.descriptionKey);
                    const icon = FUNCTION_ICONS[key];
                    return (
                      <div key={key} className="feature-card">
                        <div className="feature-icon">
                          <img src={icon} alt="" />
                        </div>
                        <div className="feature-name">{name}</div>
                        <div className="feature-desc">{description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
