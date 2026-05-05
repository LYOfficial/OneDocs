import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAnalysis } from "@/hooks/useAnalysis";
import { FunctionSelector } from "@/components/FunctionSelector";
import { FileUpload } from "@/components/FileUpload";
import { NotebookPanel } from "@/components/NotebookPanel";
import { ProgressBar } from "@/components/ProgressBar";
import { useTranslation } from "react-i18next";

type AnalysisMode = 'direct' | 'notebook';

export const Analysis: React.FC = () => {
  const { t } = useTranslation();
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('direct');
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

            {/* Mode Toggle */}
            <div className="analysis-mode-toggle">
              <button
                className={`mode-btn ${analysisMode === 'direct' ? 'active' : ''}`}
                onClick={() => setAnalysisMode('direct')}
              >
                📄 {t('analysis.mode.direct') || '直接析文'}
              </button>
              <button
                className={`mode-btn ${analysisMode === 'notebook' ? 'active' : ''}`}
                onClick={() => setAnalysisMode('notebook')}
              >
                📚 {t('analysis.mode.notebook') || '知识库'}
              </button>
            </div>

            {analysisMode === 'direct' ? (
              <FileUpload
                onAnalyze={handleMainButtonClick}
                canAnalyze={!!canAnalyze}
                isAnalyzing={isAnalyzing}
                hasAnalysisResults={hasAnalysisResults}
              />
            ) : (
              <NotebookPanel />
            )}

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
