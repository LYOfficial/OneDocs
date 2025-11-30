import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAnalysis } from "@/hooks/useAnalysis";
import { FunctionSelector } from "@/components/FunctionSelector";
import { FileUpload } from "@/components/FileUpload";
import { ProgressBar } from "@/components/ProgressBar";
import { ResultDisplay } from "@/components/ResultDisplay";
import { SettingsModal } from "@/components/SettingsModal";

interface ToolProps {
  onBack: () => void;
}

export const Tool: React.FC<ToolProps> = ({ onBack }) => {
  const {
    files,
    currentFile,
    isAnalyzing,
    analysisResult,
    multiFileAnalysisResults,
    setSettingsOpen,
    getCurrentSettings,
    showFormatNotice,
    setShowFormatNotice,
    resetAll,
  } = useAppStore();

  const { analyzeDocument } = useAnalysis();
  const settings = getCurrentSettings();

  const hasFiles = files.length > 0 || currentFile !== null;
  const canAnalyze = hasFiles && settings.apiKey && !isAnalyzing;
  
  const hasAnalysisResults = analysisResult !== null || Object.keys(multiFileAnalysisResults).length > 0;
  
  const handleMainButtonClick = () => {
    if (hasAnalysisResults) {
      resetAll();
    } else {
      analyzeDocument();
    }
  };

  return (
    <div className="tool-container">
      <header className="tool-header">
        <div className="header-left">
          <button className="tool-title-button" onClick={onBack}>
            OneDocs
          </button>
        </div>
        <div className="header-right">
          <button
            className="analyze-button-mini"
            onClick={handleMainButtonClick}
            disabled={!hasAnalysisResults && !canAnalyze}
            style={{ opacity: (!hasAnalysisResults && !canAnalyze) ? 0.6 : 1 }}
          >
            <span className="button-text">
              {hasAnalysisResults ? "新建析文" : "开始析文"}
            </span>
            {isAnalyzing && <div className="button-loader"></div>}
          </button>
          <button
            className="settings-button"
            onClick={() => setSettingsOpen(true)}
          >
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </header>

      <main className="tool-main">
        <FunctionSelector />

        <div className="main-content">
          <div className="chat-container">
            {!hasAnalysisResults && (
              <>
                {showFormatNotice && (
                  <div className="format-notice">
                    <p>
                      <strong>📋 格式说明：</strong>支持 <code>.pdf</code>、
                      <code>.docx</code>、<code>.doc</code>、<code>.pptx</code>、
                      <code>.ppt</code>、<code>.txt</code> 格式文件
                    </p>
                    <button
                      className="notice-close"
                      onClick={() => setShowFormatNotice(false)}
                    >
                      ×
                    </button>
                  </div>
                )}

                <FileUpload />
              </>
            )}

            <ProgressBar />
            <ResultDisplay />
          </div>
        </div>
      </main>

      <SettingsModal />
    </div>
  );
};
