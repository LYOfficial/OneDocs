import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAnalysis } from "@/hooks/useAnalysis";
import { FunctionSelector } from "@/components/FunctionSelector";
import { FileUpload } from "@/components/FileUpload";
import { ProgressBar } from "@/components/ProgressBar";
import { ResultDisplay } from "@/components/ResultDisplay";
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

  // When analysis results exist, show results in right panel with sidebar still visible
  if (hasAnalysisResults) {
    return (
      <div className="tools-container">
        <FunctionSelector />
        <section className="tools-content" style={{ position: "relative" }}>
          <ResultDisplay />
          <button
            className="analysis-fab-new"
            onClick={resetAll}
            title={t("upload.analyze.new")}
          >
            <span className="analysis-fab-icon">+</span>
            <span className="analysis-fab-text">{t("upload.analyze.new")}</span>
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="tools-container">
      <FunctionSelector />

      <section className="tools-content">
        <div className="analysis-layout">
          <div className="analysis-results">
            <div className="result-empty-card">
              <h3>{t("analysisResult.empty.title")}</h3>
              <p>{t("analysisResult.empty.body")}</p>
            </div>
          </div>

          <div className="analysis-chat">
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
          </div>
        </div>
      </section>
    </div>
  );
};
