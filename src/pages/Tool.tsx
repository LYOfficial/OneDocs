import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAnalysis } from "@/hooks/useAnalysis";
import { FunctionSelector } from "@/components/FunctionSelector";
import { FileUpload } from "@/components/FileUpload";
import { ProgressBar } from "@/components/ProgressBar";
import { ResultDisplay } from "@/components/ResultDisplay";

interface ToolProps {
  onBack: () => void;
}

export const Tool: React.FC<ToolProps> = () => {
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

                <FileUpload 
                  onAnalyze={handleMainButtonClick}
                  canAnalyze={!!canAnalyze}
                  isAnalyzing={isAnalyzing}
                  hasAnalysisResults={hasAnalysisResults}
                />
              </>
            )}

            <ProgressBar />
            <ResultDisplay />
          </div>
        </div>
      </main>
    </div>
  );
};
