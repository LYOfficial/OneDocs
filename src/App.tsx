import React, { useEffect, useState } from "react";
import { Analysis } from "@/pages/Analysis";
import { About } from "@/pages/About";
import { Archive } from "@/pages/Archive";
import { Discover } from "@/pages/Discover";
import { Settings } from "@/pages/Settings";
import { Toast } from "@/components/Toast";
import { TitleBar } from "@/components/TitleBar";
import { MobileNav } from "@/components/MobileNav";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useAppStore } from "@/store/useAppStore";

type Page = "analysis" | "archive" | "about" | "discover" | "settings";

const MOBILE_BREAKPOINT = 768;

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>("analysis");
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < MOBILE_BREAKPOINT,
  );
  const [mobileSubTab, setMobileSubTab] = useState<string>("news");
  const {
    theme,
    uiFontFamily,
    uiFontScale,
    uiBackgroundColor,
    uiBackgroundImage,
    selectedFunction,
    setSelectedFunction,
    aboutActiveSection,
    setAboutActiveSection,
    settingsActiveSection,
    setSettingsActiveSection,
  } = useAppStore();

  // When page changes, reset sub-tab to a sensible default
  useEffect(() => {
    if (isMobile) {
      switch (currentPage) {
        case "analysis":
          setMobileSubTab(selectedFunction || "news");
          break;
        case "about":
          setMobileSubTab((aboutActiveSection as string) || "version");
          break;
        case "settings":
          setMobileSubTab((settingsActiveSection as string) || "general");
          break;
        case "archive":
          setMobileSubTab("list");
          break;
        case "discover":
          setMobileSubTab("list");
          break;
      }
    }
  }, [currentPage, isMobile]);

  const handleMobileSubTabChange = (subTab: string) => {
    setMobileSubTab(subTab);
    // Sync with store where applicable
    switch (currentPage) {
      case "analysis":
        setSelectedFunction(subTab as any);
        break;
      case "about":
        setAboutActiveSection(subTab as any);
        break;
      case "settings":
        setSettingsActiveSection(subTab as any);
        break;
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <div className={`app-container ${isMobile ? "mobile" : "desktop"}`}>
      {isMobile ? (
        <MobileNav
          activeTab={currentPage}
          onTabChange={setCurrentPage}
          activeSubTab={mobileSubTab}
          onSubTabChange={handleMobileSubTabChange}
        />
      ) : (
        <TitleBar activeTab={currentPage} onTabChange={setCurrentPage} />
      )}
      <div className="page-content">
        {currentPage === "about" && <About isMobile={isMobile} mobileSubTab={isMobile ? mobileSubTab : undefined} />}
        {currentPage === "analysis" && <Analysis isMobile={isMobile} />}
        {currentPage === "archive" && <Archive isMobile={isMobile} mobileSubTab={isMobile ? mobileSubTab : undefined} onMobileSubTabChange={isMobile ? handleMobileSubTabChange : undefined} />}
        {currentPage === "discover" && <Discover isMobile={isMobile} mobileSubTab={isMobile ? mobileSubTab : undefined} onMobileSubTabChange={isMobile ? handleMobileSubTabChange : undefined} />}
        {currentPage === "settings" && <Settings isMobile={isMobile} />}
      </div>
      <Toast />
      <OnboardingTour
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page as Page)}
      />
    </div>
  );
};

export default App;
