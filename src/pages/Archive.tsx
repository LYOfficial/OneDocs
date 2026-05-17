import React, { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { ArchiveResultDisplay } from "@/components/ArchiveResultDisplay";
import { FUNCTION_INFO } from "@/config/providers";
import { ARCHIVE_ICON } from "@/config/uiIcons";
import { useTranslation } from "react-i18next";

export const Archive: React.FC = () => {
  const { archives, activeArchiveId, setActiveArchiveId } = useAppStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (!activeArchiveId && archives.length > 0) {
      setActiveArchiveId(archives[0].id);
    }
  }, [activeArchiveId, archives, setActiveArchiveId]);

  const activeEntry = archives.find((entry) => entry.id === activeArchiveId);
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleString();

  return (
    <div className="tools-container">
      <aside className="tools-sidebar">
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
