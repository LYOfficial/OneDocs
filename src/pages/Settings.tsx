import React, { useMemo, useState } from "react";
import { AnalysisSettingsPanel } from "@/components/AnalysisSettingsPanel";
import { ModelSelectionPanel } from "@/components/ModelSelectionPanel";
import { DataManagementPanel } from "@/components/DataManagementPanel";
import { AboutPanel } from "@/components/AboutPanel";
import { DeveloperModePanel } from "@/components/DeveloperModePanel";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";

type SectionId = "analysis" | "model" | "data" | "about" | "developer";

export const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>("model");
  const { t } = useTranslation();
  const { devMode } = useAppStore();

  const settingSections = useMemo(() => {
    const baseSections = [
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
      {
        id: "about",
        labelKey: "settings.sections.about.label",
        descKey: "settings.sections.about.desc",
        icon: "fas fa-info-circle",
      },
    ] as const;

    if (devMode) {
      return [
        ...baseSections,
        {
          id: "developer",
          labelKey: "settings.sections.developer.label",
          descKey: "settings.sections.developer.desc",
          icon: "fas fa-code",
        },
      ] as const;
    }

    return baseSections;
  }, [devMode]);

  return (
    <div className="tools-container">
      <aside className="tools-sidebar">
        <div className="tools-sidebar-header">
          <h2>{t("settings.title")}</h2>
          <p>{t("settings.subtitle")}</p>
        </div>
        <nav className="tools-nav">
          {settingSections.map((section) => (
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
        {activeSection === "about" && <AboutPanel />}
        {activeSection === "developer" && devMode && <DeveloperModePanel />}
      </section>
    </div>
  );
};
