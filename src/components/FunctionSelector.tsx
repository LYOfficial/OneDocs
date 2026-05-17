import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { FUNCTION_INFO } from "@/config/providers";
import { useToast } from "./Toast";
import { useTranslation } from "react-i18next";
import type { PromptType } from "@/types";

export const FunctionSelector: React.FC = () => {
  const {
    selectedFunction,
    setSelectedFunction,
    isSidebarCollapsed,
    toggleSidebar,
  } = useAppStore();
  const toast = useToast();
  const { t } = useTranslation();

  const handleFunctionSelect = (func: PromptType) => {
    setSelectedFunction(func);
    const info = FUNCTION_INFO[func];
    const name = t(info.nameKey);
    toast.show(t("functionSelector.toastSelected", { name }));
  };

  return (
    <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header" onClick={toggleSidebar}>
        <span className="sidebar-title">{t("functionSelector.title")}</span>
        <span className="collapse-icon">
          <i
            className={`fas fa-chevron-${isSidebarCollapsed ? "right" : "left"}`}
          ></i>
        </span>
      </div>
      <div className="sidebar-content">
        <div className="function-buttons">
          {(Object.keys(FUNCTION_INFO) as PromptType[]).map((key) => {
            const info = FUNCTION_INFO[key];
            const name = t(info.nameKey);
            const description = t(info.descriptionKey);
            return (
              <button
                key={key}
                className={`function-btn ${selectedFunction === key ? "active" : ""}`}
                onClick={() => handleFunctionSelect(key)}
              >
                <div className="function-icon">{info.icon}</div>
                <div className="function-content">
                  <div className="function-name">{name}</div>
                  <div className="function-desc">{description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
