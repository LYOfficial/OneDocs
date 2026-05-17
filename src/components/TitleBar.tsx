import React, { useCallback, useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";
import appIcon from "../../app-icon.png";
import { NAV_ICONS } from "@/config/uiIcons";

type TabKey = "analysis" | "archive" | "about" | "discover" | "settings";

interface TitleBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const isTauriRuntime = isTauri();
  const appWindowRef = useRef(isTauriRuntime ? getCurrentWindow() : null);
  const { t } = useTranslation();

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;

      const target = event.target as HTMLElement;
      if (target.closest('[data-tauri-drag-region="false"]')) return;

      if (!appWindowRef.current) return;

      appWindowRef.current.startDragging().catch((error) => {
        if (import.meta.env.DEV) {
          console.warn("Window drag failed", error);
        }
      });
    },
    [],
  );

  return (
    <div
      className="titlebar"
      data-tauri-drag-region
      onPointerDown={handlePointerDown}
    >
      <div className="titlebar-left">
        <div className="titlebar-brand">
          <img className="titlebar-logo" src={appIcon} alt="OneDocs" />
          <span className="titlebar-name">OneDocs</span>
        </div>
        <div className="titlebar-nav">
          <button
            className={`tab-button ${activeTab === "analysis" ? "active" : ""}`}
            onClick={() => onTabChange("analysis")}
            data-tauri-drag-region="false"
          >
            <img className="tab-icon" src={NAV_ICONS.analysis} alt="" />
            <span className="tab-label">{t("app.titleBar.tabs.analysis")}</span>
          </button>
          <button
            className={`tab-button ${activeTab === "archive" ? "active" : ""}`}
            onClick={() => onTabChange("archive")}
            data-tauri-drag-region="false"
          >
            <img className="tab-icon" src={NAV_ICONS.archive} alt="" />
            <span className="tab-label">{t("app.titleBar.tabs.archive")}</span>
          </button>
          <button
            className={`tab-button ${activeTab === "about" ? "active" : ""}`}
            onClick={() => onTabChange("about")}
            data-tauri-drag-region="false"
          >
            <img className="tab-icon" src={NAV_ICONS.about} alt="" />
            <span className="tab-label">{t("app.titleBar.tabs.about")}</span>
          </button>
          <button
            className={`tab-button ${activeTab === "discover" ? "active" : ""}`}
            onClick={() => onTabChange("discover")}
            data-tauri-drag-region="false"
          >
            <img className="tab-icon" src={NAV_ICONS.discover} alt="" />
            <span className="tab-label">{t("app.titleBar.tabs.discover")}</span>
          </button>
          <button
            className={`tab-button ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => onTabChange("settings")}
            data-tauri-drag-region="false"
          >
            <img className="tab-icon" src={NAV_ICONS.settings} alt="" />
            <span className="tab-label">{t("app.titleBar.tabs.settings")}</span>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, height: "100%" }} data-tauri-drag-region></div>

      <div className="titlebar-right">
        {isTauriRuntime && (
          <div className="window-controls">
            <button
              className="window-btn minimize"
              onClick={() => appWindowRef.current?.minimize()}
              data-tauri-drag-region="false"
            >
              <i className="fas fa-minus"></i>
            </button>
            <button
              className="window-btn maximize"
              onClick={() => appWindowRef.current?.toggleMaximize()}
              data-tauri-drag-region="false"
            >
              <i className="far fa-square"></i>
            </button>
            <button
              className="window-btn close"
              onClick={() => appWindowRef.current?.close()}
              data-tauri-drag-region="false"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
