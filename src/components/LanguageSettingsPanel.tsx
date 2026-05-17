import React from "react";
import { useTranslation } from "react-i18next";

export const LanguageSettingsPanel: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="tool-panel">
      <div className="data-card">
        <div className="setting-row">
          <div className="setting-text">
            <div className="setting-title">
              {t("settings.general.language.title")}
            </div>
            <div className="setting-desc">
              {t("settings.general.language.desc")}
            </div>
          </div>
          <select
            className="select-control"
            value={i18n.language}
            onChange={(event) => i18n.changeLanguage(event.target.value)}
          >
            <option value="zh-CN">{t("settings.general.language.zh")}</option>
            <option value="en">{t("settings.general.language.en")}</option>
          </select>
        </div>
      </div>
    </div>
  );
};
