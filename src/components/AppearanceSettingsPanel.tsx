import React, { useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/Toast";

const FONT_OPTIONS = [
  { labelKey: "settings.appearance.font.serif", value: "'Noto Serif SC', serif" },
  { labelKey: "settings.appearance.font.sans", value: "'Noto Sans SC', sans-serif" },
  {
    labelKey: "settings.appearance.font.system",
    value: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
];

const FONT_SCALES = [0.9, 1, 1.1, 1.2];

export const AppearanceSettingsPanel: React.FC = () => {
  const {
    theme,
    setTheme,
    uiFontFamily,
    setUiFontFamily,
    uiFontScale,
    setUiFontScale,
    uiBackgroundColor,
    setUiBackgroundColor,
    uiBackgroundImage,
    setUiBackgroundImage,
  } = useAppStore();
  const { t } = useTranslation();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickBackground = () => {
    fileInputRef.current?.click();
  };

  const handleBackgroundFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.show(t("settings.appearance.background.imageInvalid"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUiBackgroundImage(reader.result);
        toast.show(t("settings.appearance.background.imageApplied"));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearBackground = () => {
    setUiBackgroundImage("");
  };

  return (
    <div className="tool-panel">
      <div className="data-card">
        <div className="setting-row">
          <div className="setting-text">
            <div className="setting-title">
              {t("settings.appearance.theme.title")}
            </div>
            <div className="setting-desc">
              {t("settings.appearance.theme.desc")}
            </div>
          </div>
          <div className="segmented-control">
            <button
              className={`segmented-btn ${theme === "light" ? "active" : ""}`}
              onClick={() => setTheme("light")}
            >
              {t("settings.appearance.theme.light")}
            </button>
            <button
              className={`segmented-btn ${theme === "dark" ? "active" : ""}`}
              onClick={() => setTheme("dark")}
            >
              {t("settings.appearance.theme.dark")}
            </button>
            <button
              className={`segmented-btn ${theme === "system" ? "active" : ""}`}
              onClick={() => setTheme("system")}
            >
              {t("settings.appearance.theme.system")}
            </button>
          </div>
        </div>
      </div>

      <div className="data-card">
        <div className="setting-row">
          <div className="setting-text">
            <div className="setting-title">
              {t("settings.appearance.font.title")}
            </div>
            <div className="setting-desc">
              {t("settings.appearance.font.desc")}
            </div>
          </div>
          <div className="settings-inline">
            <select
              className="select-control"
              value={uiFontFamily}
              onChange={(event) => setUiFontFamily(event.target.value)}
            >
              {FONT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
            <select
              className="select-control"
              value={uiFontScale}
              onChange={(event) =>
                setUiFontScale(Number(event.target.value) || 1)
              }
            >
              {FONT_SCALES.map((scale) => (
                <option key={scale} value={scale}>
                  {t("settings.appearance.font.scale", { scale })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="data-card">
        <div className="setting-row" style={{ alignItems: "flex-start" }}>
          <div className="setting-text">
            <div className="setting-title">
              {t("settings.appearance.background.title")}
            </div>
            <div className="setting-desc">
              {t("settings.appearance.background.desc")}
            </div>
          </div>
          <div className="settings-inline">
            <input
              className="color-input"
              type="color"
              value={
                uiBackgroundColor || (theme === "dark" ? "#111827" : "#f7f7f9")
              }
              onChange={(event) => setUiBackgroundColor(event.target.value)}
              aria-label={t("settings.appearance.background.color")}
            />
            <button className="btn btn-secondary" onClick={handlePickBackground}>
              {t("settings.appearance.background.upload")}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleClearBackground}
              disabled={!uiBackgroundImage}
            >
              {t("settings.appearance.background.clear")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleBackgroundFile}
            />
          </div>
        </div>
        {uiBackgroundImage && (
          <div className="background-preview">
            <div
              className="background-preview-image"
              style={{ backgroundImage: `url("${uiBackgroundImage}")` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
