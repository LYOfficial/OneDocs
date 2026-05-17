import React, { useEffect, useState } from "react";
import { Analysis } from "@/pages/Analysis";
import { About } from "@/pages/About";
import { Archive } from "@/pages/Archive";
import { Discover } from "@/pages/Discover";
import { Settings } from "@/pages/Settings";
import { Toast } from "@/components/Toast";
import { TitleBar } from "@/components/TitleBar";
import { useAppStore } from "@/store/useAppStore";

type Page = "analysis" | "archive" | "about" | "discover" | "settings";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>("analysis");
  const {
    theme,
    uiFontFamily,
    uiFontScale,
    uiBackgroundColor,
    uiBackgroundImage,
  } = useAppStore();

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = () => {
      const effectiveTheme =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;

      if (effectiveTheme === "dark") {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") applyTheme();
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty(
      "--app-font-family",
      uiFontFamily || "'Noto Serif SC', serif",
    );
    root.style.setProperty("--app-font-scale", String(uiFontScale || 1));
    root.style.setProperty(
      "--app-shell-background",
      uiBackgroundColor || "var(--background-color)",
    );
    root.style.setProperty(
      "--app-shell-image",
      uiBackgroundImage ? `url("${uiBackgroundImage}")` : "none",
    );
  }, [uiFontFamily, uiFontScale, uiBackgroundColor, uiBackgroundImage]);

  return (
    <div className="app-container">
      <TitleBar activeTab={currentPage} onTabChange={setCurrentPage} />
      <div className="page-content">
        {currentPage === "about" && <About />}
        {currentPage === "analysis" && <Analysis />}
        {currentPage === "archive" && <Archive />}
        {currentPage === "discover" && <Discover />}
        {currentPage === "settings" && <Settings />}
      </div>
      <Toast />
    </div>
  );
};

export default App;
