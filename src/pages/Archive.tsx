import React, { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { ArchiveResultDisplay } from "@/components/ArchiveResultDisplay";
import { FUNCTION_INFO } from "@/config/providers";
import { ARCHIVE_ICON } from "@/config/uiIcons";
import { useTranslation } from "react-i18next";

interface ArchiveProps {
  isMobile?: boolean;
  mobileSubTab?: string;
  onMobileSubTabChange?: (subTab: string) => void;
}

export const Archive: React.FC<ArchiveProps> = ({ isMobile = false, mobileSubTab, onMobileSubTabChange }) => {
  const { archives, activeArchiveId, setActiveArchiveId } = useAppStore();
  const { t } = useTranslation();

  // On mobile, when user selects an archive item, switch to detail view
  const handleArchiveSelect = (id: string) => {
    setActiveArchiveId(id);
    if (isMobile && onMobileSubTabChange) {
      onMobileSubTabChange('detail');
    }
  };

  useEffect(() => {
    if (!activeArchiveId && archives.length > 0) {
      setActiveArchiveId(archives[0].id);
    }
  }, [activeArchiveId, archives, setActiveArchiveId]);

  const activeEntry = archives.find((entry) => entry.id === activeArchiveId);
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleString();

  const sidebarContent = (
    <>
      <div className="tools-sidebar-header">
        <h2>{t("archive.title")}</h2>
        <p>{t("archive.subtitle")}</p>
      </div>

      {archives.length === 0 ? (
        <div className="archive-empty">
          <p>{t("archive.list.empty")}</p>
        </div>
      ) : (
        <nav className="tools-nav">
          {archives.map((entry) => {
            const functionInfo = FUNCTION_INFO[entry.functionType];
            const functionLabel = functionInfo
              ? t(functionInfo.nameKey)
              : entry.functionType;
            const fileCountLabel = t("archive.list.files", {
              count: entry.files.length,
            });
            return (
              <button
                key={entry.id}
                className={`tools-nav-item ${entry.id === activeArchiveId ? "active" : ""}`}
                onClick={() => setActiveArchiveId(entry.id)}
              >
                <div className="tools-nav-icon">
                  <img src={ARCHIVE_ICON} alt="" />
                </div>
                <div className="tools-nav-meta">
                  <span>{entry.title}</span>
                  <small>{formatTime(entry.createdAt)} · {functionLabel} · {fileCountLabel}</small>
                </div>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );

  if (isMobile) {
    const showList = mobileSubTab === 'list';
    return (
      <div className="tools-container mobile">
        {showList ? (
          <section className="tools-content">
            <div className="tools-sidebar-header">
              <h2>{t("archive.title")}</h2>
              <p>{t("archive.subtitle")}</p>
            </div>
            {archives.length === 0 ? (
              <div className="archive-empty">
                <p>{t("archive.list.empty")}</p>
              </div>
            ) : (
              <nav className="tools-nav">
                {archives.map((entry) => {
                  const functionInfo = FUNCTION_INFO[entry.functionType];
                  const functionLabel = functionInfo
                    ? t(functionInfo.nameKey)
                    : entry.functionType;
                  const fileCountLabel = t("archive.list.files", {
                    count: entry.files.length,
                  });
                  return (
                    <button
                      key={entry.id}
                      className={`tools-nav-item ${entry.id === activeArchiveId ? "active" : ""}`}
                      onClick={() => handleArchiveSelect(entry.id)}
                    >
                      <div className="tools-nav-icon">
                        <img src={ARCHIVE_ICON} alt="" />
                      </div>
                      <div className="tools-nav-meta">
                        <span>{entry.title}</span>
                        <small>{formatTime(entry.createdAt)} · {functionLabel} · {fileCountLabel}</small>
                      </div>
                    </button>
                  );
                })}
              </nav>
            )}
          </section>
        ) : (
          <section className="tools-content">
            {activeEntry ? (
              <ArchiveResultDisplay entry={activeEntry} />
            ) : (
              <div className="result-empty-card">
                <h3>{t("archive.result.emptyTitle")}</h3>
                <p>{t("archive.result.emptyBody")}</p>
              </div>
            )}
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="tools-container">
      <aside className="tools-sidebar">
        {sidebarContent}
      </aside>

      <section className="tools-content">
        {activeEntry ? (
          <ArchiveResultDisplay entry={activeEntry} />
        ) : (
          <div className="result-empty-card">
            <h3>{t("archive.result.emptyTitle")}</h3>
            <p>{t("archive.result.emptyBody")}</p>
          </div>
        )}
      </section>
    </div>
  );
};
