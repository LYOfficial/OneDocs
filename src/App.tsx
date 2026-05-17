import React, { useEffect, useState } from "react";
import { Landing } from "@/pages/Landing";
import { Analysis } from "@/pages/Analysis";
import { AnalysisResult } from "@/pages/AnalysisResult";
import { Settings } from "@/pages/Settings";
import { Toast } from "@/components/Toast";
import { TitleBar } from "@/components/TitleBar";
import { useAppStore } from "@/store/useAppStore";

type Page = "landing" | "analysis" | "analysisResult" | "settings";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const { analysisResult, multiFileAnalysisResults } = useAppStore();
  const hasAnalysisResults =
    analysisResult !== null || Object.keys(multiFileAnalysisResults).length > 0;

  useEffect(() => {
    if (!hasAnalysisResults && currentPage === "analysisResult") {
      setCurrentPage("analysis");
    }
  }, [hasAnalysisResults, currentPage, setCurrentPage]);

  return (
    <div className="app-container">
      <TitleBar activeTab={currentPage} onTabChange={setCurrentPage} />
      <div className="page-content">
        {currentPage === "landing" && (
          <Landing onStart={() => setCurrentPage("analysis")} />
        )}
        {currentPage === "analysis" && <Analysis />}
        {currentPage === "analysisResult" && <AnalysisResult />}
        {currentPage === "settings" && <Settings />}
      </div>
      <Toast />
    </div>
  );
};

export default App;
