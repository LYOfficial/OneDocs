import React, { useState } from "react";
import { Landing } from "@/pages/Landing";
import { Tool } from "@/pages/Tool";
import { Toast } from "@/components/Toast";
import { TitleBar } from "@/components/TitleBar";
import { SettingsModal } from "@/components/SettingsModal";

type Page = "landing" | "tool";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>("landing");

  return (
    <div className="app-container">
      <TitleBar activeTab={currentPage} onTabChange={setCurrentPage} />
      <div className="page-content">
        {currentPage === "landing" ? (
          <Landing onStart={() => setCurrentPage("tool")} />
        ) : (
          <Tool onBack={() => setCurrentPage("landing")} />
        )}
      </div>
      <Toast />
      <SettingsModal />
    </div>
  );
};

export default App;
