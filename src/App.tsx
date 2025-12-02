import React, { useEffect, useState } from "react";
import { Landing } from "@/pages/Landing";
import { Tool } from "@/pages/Tool";
import { AnalysisResult } from "@/pages/AnalysisResult";
import { Tools } from "@/pages/Tools";
import { Toast } from "@/components/Toast";
import { TitleBar } from "@/components/TitleBar";
import { useAppStore } from "@/store/useAppStore";

type Page = "landing" | "tool" | "analysisResult" | "tools";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const { analysisResult, multiFileAnalysisResults } = useAppStore();
  const hasAnalysisResults =
    analysisResult !== null || Object.keys(multiFileAnalysisResults).length > 0;

  useEffect(() => {
    if (!hasAnalysisResults && currentPage === "analysisResult") {
      setCurrentPage("tool");
    }
  }, [hasAnalysisResults, currentPage, setCurrentPage]);

  return (
    <div className="app-container">
      <TitleBar activeTab={currentPage} onTabChange={setCurrentPage} />
      <div className="page-content">
        {currentPage === "landing" && (
          <Landing onStart={() => setCurrentPage("tool")} />
        )}
        {currentPage === "tool" && <Tool />}
        {currentPage === "analysisResult" && <AnalysisResult />}
        {currentPage === "tools" && <Tools />}
      </div>
      <Toast />
    </div>
  );
};

export default App;
