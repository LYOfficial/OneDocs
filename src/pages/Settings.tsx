import React, { useMemo, useState } from "react";
import { AnalysisSettingsPanel } from "@/components/AnalysisSettingsPanel";
import { ModelSelectionPanel } from "@/components/ModelSelectionPanel";
import { DataManagementPanel } from "@/components/DataManagementPanel";
import { DeveloperModePanel } from "@/components/DeveloperModePanel";
import { AppearanceSettingsPanel } from "@/components/AppearanceSettingsPanel";
import { LanguageSettingsPanel } from "@/components/LanguageSettingsPanel";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";
import { SETTINGS_ICONS } from "@/config/uiIcons";

type SectionId = "general" | "appearance" | "model";

export const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>("general");
  const { t } = useTranslation();
  const { devMode } = useAppStore();

  const settingSections = useMemo(() => {
    return [
      {
        id: "general",
        labelKey: "settings.sections.general.label",
        descKey: "settings.sections.general.desc",
        icon: SETTINGS_ICONS.general,
      },
      {
        id: "appearance",
        labelKey: "settings.sections.appearance.label",
        descKey: "settings.sections.appearance.desc",
        icon: SETTINGS_ICONS.appearance,
      },
      {
        id: "model",
        labelKey: "settings.sections.model.label",
        descKey: "settings.sections.model.desc",
        icon: SETTINGS_ICONS.model,
      },
    ] as const;
  }, []);

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
        {activeSection === "general" && (
          <div className="settings-stack">
            <LanguageSettingsPanel />
            <AnalysisSettingsPanel />
            <DataManagementPanel />
            {devMode && <DeveloperModePanel />}
          </div>
        )}
        {activeSection === "appearance" && <AppearanceSettingsPanel />}
        {activeSection === "model" && <ModelSelectionPanel />}
      </section>
    </div>
  );
};
