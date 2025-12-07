import React, { useState } from "react";
import { AnalysisSettingsPanel } from "@/components/AnalysisSettingsPanel";
import { ModelSelectionPanel } from "@/components/ModelSelectionPanel";
import { DataManagementPanel } from "@/components/DataManagementPanel";

const SETTING_SECTIONS = [
  { id: "analysis", label: "析文设置", icon: "fas fa-sliders-h", desc: "控制析文偏好" },
  { id: "model", label: "模型选择", icon: "fas fa-brain", desc: "管理模型供应商" },
  { id: "data", label: "数据管理", icon: "fas fa-database", desc: "配置数据目录" },
] as const;

type SectionId = (typeof SETTING_SECTIONS)[number]["id"];

export const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>("model");

  return (
    <div className="tools-container">
      <aside className="tools-sidebar">
        <div className="tools-sidebar-header">
          <h2>设置</h2>
          <p>集中管理模型与数据策略</p>
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
                <span>{section.label}</span>
                <small>{section.desc}</small>
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
