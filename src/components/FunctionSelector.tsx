import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { FUNCTION_INFO } from "@/config/providers";
import { FUNCTION_ICONS } from "@/config/uiIcons";
import { useToast } from "./Toast";
import { useTranslation } from "react-i18next";
import type { PromptType } from "@/types";

export const FunctionSelector: React.FC = () => {
  const { selectedFunction, setSelectedFunction } = useAppStore();
  const toast = useToast();
  const { t } = useTranslation();

  const handleFunctionSelect = (func: PromptType) => {
    setSelectedFunction(func);
    const info = FUNCTION_INFO[func];
    const name = t(info.nameKey);
    toast.show(t("functionSelector.toastSelected", { name }));
  };

  return (
    <aside className="tools-sidebar">
      <div className="tools-sidebar-header">
        <h2>{t("functionSelector.title")}</h2>
      </div>
      <nav className="tools-nav">
        {(Object.keys(FUNCTION_INFO) as PromptType[]).map((key) => {
          const info = FUNCTION_INFO[key];
          const name = t(info.nameKey);
          const description = t(info.descriptionKey);
          const icon = FUNCTION_ICONS[key];
          return (
            <button
              key={key}
              className={`tools-nav-item ${selectedFunction === key ? "active" : ""}`}
              onClick={() => handleFunctionSelect(key)}
            >
              <div className="tools-nav-icon">
                <img src={icon} alt="" />
              </div>
              <div className="tools-nav-meta">
                <span>{name}</span>
                <small>{description}</small>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
