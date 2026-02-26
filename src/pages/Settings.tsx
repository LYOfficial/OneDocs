import React, { useState } from "react";
import { AnalysisSettingsPanel } from "@/components/AnalysisSettingsPanel";
import { ModelSelectionPanel } from "@/components/ModelSelectionPanel";
import { DataManagementPanel } from "@/components/DataManagementPanel";
import { useTranslation } from "react-i18next";

const SETTING_SECTIONS = [
  {
    id: "analysis",
    labelKey: "settings.sections.analysis.label",
    descKey: "settings.sections.analysis.desc",
    icon: "fas fa-sliders-h",
  },
  {
    id: "model",
    labelKey: "settings.sections.model.label",
    descKey: "settings.sections.model.desc",
    icon: "fas fa-brain",
  },
  {
    id: "data",
    labelKey: "settings.sections.data.label",
    descKey: "settings.sections.data.desc",
    icon: "fas fa-database",
  },
] as const;

type SectionId = (typeof SETTING_SECTIONS)[number]["id"];

export const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>("model");
  const { t } = useTranslation();

  return (
    <div className="tools-container">
      <aside className="tools-sidebar">
        <div className="tools-sidebar-header">
          <h2>{t("settings.title")}</h2>
          <p>{t("settings.subtitle")}</p>
        </div>
        <nav className="tools-nav">
          {SETTING_SECTIONS.map((section) => (
            <button
              key={section.id}
              className={`tools-nav-item ${activeSection === section.id ? "active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              <div className="tools-nav-icon">
                <i className={section.icon} aria-hidden="true"></i>
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
        {activeSection === "analysis" && <AnalysisSettingsPanel />}
        {activeSection === "model" && <ModelSelectionPanel />}
        {activeSection === "data" && <DataManagementPanel />}
      </section>
    </div>
  );
};
