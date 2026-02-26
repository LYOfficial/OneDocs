import React from "react";
import { FunctionSelector } from "@/components/FunctionSelector";
import { ResultDisplay } from "@/components/ResultDisplay";
import { useAppStore } from "@/store/useAppStore";
import { useTranslation } from "react-i18next";

export const AnalysisResult: React.FC = () => {
  const { analysisResult, multiFileAnalysisResults } = useAppStore();
  const { t } = useTranslation();
  const hasAnalysisResults =
    analysisResult !== null || Object.keys(multiFileAnalysisResults).length > 0;

  return (
    <div className="tool-container">
      <main className="tool-main">
        <FunctionSelector />
        <div className="main-content">
          <div className="chat-container">
            {hasAnalysisResults ? (
              <ResultDisplay />
            ) : (
              <div className="result-empty-card">
                <h3>{t("analysisResult.empty.title")}</h3>
                <p>{t("analysisResult.empty.body")}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
