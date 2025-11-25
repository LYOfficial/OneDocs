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

  // 支持多文件分析：如果有多个文件，检查是否有文件；如果只有一个文件，检查currentFile（向后兼容）
  const hasFiles = files.length > 0 || currentFile !== null;
  const canAnalyze = hasFiles && settings.apiKey && !isAnalyzing;
  
  // 判断是否有分析结果
  const hasAnalysisResults = analysisResult !== null || Object.keys(multiFileAnalysisResults).length > 0;
  
  // 处理按钮点击
  const handleMainButtonClick = () => {
    if (hasAnalysisResults) {
      // 如果有分析结果，点击"新建析文"重置所有内容
      resetAll();
    } else {
      // 如果没有分析结果，点击"开始析文"进行分析
      analyzeDocument();
    }
  };

  return (
    <div className="tool-container">
      <header className="tool-header">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 className="tool-title">OneDocs</h1>
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
