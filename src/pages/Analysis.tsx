import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAnalysis } from "@/hooks/useAnalysis";
import { FunctionSelector } from "@/components/FunctionSelector";
import { FileUpload } from "@/components/FileUpload";
import { ProgressBar } from "@/components/ProgressBar";
import { useTranslation } from "react-i18next";

export const Analysis: React.FC = () => {
  const { t } = useTranslation();
  const {
    files,
    currentFile,
    isAnalyzing,
    analysisResult,
    multiFileAnalysisResults,
    getCurrentSettings,
    showFormatNotice,
    setShowFormatNotice,
    resetAll,
  } = useAppStore();

  const { analyzeDocument } = useAnalysis();
  const settings = getCurrentSettings();

  const hasFiles = files.length > 0 || currentFile !== null;
  const canAnalyze = hasFiles && settings.apiKey && !isAnalyzing;

  const hasAnalysisResults =
    analysisResult !== null || Object.keys(multiFileAnalysisResults).length > 0;

  const handleMainButtonClick = () => {
    if (hasAnalysisResults) {
      resetAll();
    } else {
      analyzeDocument();
    }
  };

  return (
    <div className="tool-container">
      <main className="tool-main">
        <FunctionSelector />

        <div className="main-content">
          <div className="chat-container">
            {showFormatNotice && (
              <div className="format-notice">
                <p>
                  <strong>{t("analysis.formatNotice.title")}</strong>{" "}
                  {t("analysis.formatNotice.body")}
                </p>
                <button
                  className="notice-close"
                  onClick={() => setShowFormatNotice(false)}
                >
                  ×
                </button>
              </div>
            )}

            <FileUpload
              onAnalyze={handleMainButtonClick}
              canAnalyze={!!canAnalyze}
              isAnalyzing={isAnalyzing}
              hasAnalysisResults={hasAnalysisResults}
            />

            <ProgressBar />

            {hasAnalysisResults && (
              <div className="result-hint-card">
                <h3>{t("analysis.resultHint.title")}</h3>
                <p>{t("analysis.resultHint.body")}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
