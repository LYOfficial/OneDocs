import React from "react";
import { FunctionSelector } from "@/components/FunctionSelector";
import { ResultDisplay } from "@/components/ResultDisplay";
import { useAppStore } from "@/store/useAppStore";

export const AnalysisResult: React.FC = () => {
  const { analysisResult, multiFileAnalysisResults } = useAppStore();
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
                <h3>暂无分析结果</h3>
                <p>请先在“分析”页面上传文档并完成析文，结果会在此处展示。</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
