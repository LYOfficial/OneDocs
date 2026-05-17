import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MarkdownRenderer } from "@/utils/markdownRenderer";
import { useToast } from "@/components/Toast";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useTranslation } from "react-i18next";
import type { ArchiveEntry, ViewMode } from "@/types";
import "katex/dist/katex.min.css";

interface ArchiveResultDisplayProps {
  entry: ArchiveEntry;
}

export const ArchiveResultDisplay: React.FC<ArchiveResultDisplayProps> = ({
  entry,
}) => {
  const toast = useToast();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("render");
  const [currentFileId, setCurrentFileId] = useState(
    entry.files[0]?.id || "",
  );

  useEffect(() => {
    setCurrentFileId(entry.files[0]?.id || "");
  }, [entry]);

  const currentFile = entry.files.find((file) => file.id === currentFileId);

  const renderedContent = useMemo(() => {
    if (!currentFile) return "";
    if (viewMode === "render") {
      return MarkdownRenderer.render(currentFile.content);
    }
    return currentFile.content;
  }, [currentFile, viewMode]);

  const handleCopyResult = async () => {
    if (!currentFile) return;
    try {
      await navigator.clipboard.writeText(currentFile.content);
      toast.show(t("result.toast.copied"));
    } catch (error) {
      toast.show(t("result.toast.copyFail"));
    }
  };

  const handleExport = async () => {
    if (!currentFile) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const baseName = currentFile.name.replace(/\.[^./\\]+$/, "") || "OneDocs";
    const defaultFileName = `${baseName}_OneDocs_${t("result.exportFileSuffix")}_${dateStr}.md`;

    try {
      const filePath = await save({
        defaultPath: defaultFileName,
        filters: [
          {
            name: "Markdown",
            extensions: ["md"],
          },
        ],
      });

      if (filePath) {
        await writeTextFile(filePath, currentFile.content);
        toast.show(t("result.toast.saved", { path: filePath }));
      }
    } catch (error: any) {
      console.error("Tauri export failed, falling back to browser download:", error);

      try {
        const blob = new Blob([currentFile.content], {
          type: "text/markdown;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = defaultFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.show(t("result.toast.exported"));
      } catch (fallbackError) {
        console.error("Export failed:", fallbackError);
        toast.show(t("result.toast.exportFail"));
      }
    }
  };

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a") as HTMLAnchorElement | null;
    if (!anchor) return;
    const href = anchor.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
    e.preventDefault();
    e.stopPropagation();
    openUrl(href).catch((err: any) => {
      console.error("Failed to open link:", err);
      window.open(href, "_blank");
    });
  }, []);

  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleString();

  return (
    <div className="result-section archive-result-section">
      <div className="result-header">
        <div className="result-title-section">
          <div className="result-header-row">
            <div className="archive-result-meta">
              <h3 className="result-title">{entry.title}</h3>
              <span>{formatTime(entry.createdAt)}</span>
            </div>
            <div className="result-controls">
              <div className="view-toggle">
                <button
                  className={`toggle-btn ${viewMode === "render" ? "active" : ""}`}
                  onClick={() => setViewMode("render")}
                >
                  {t("result.view.render")}
                </button>
                <button
                  className={`toggle-btn ${viewMode === "markdown" ? "active" : ""}`}
                  onClick={() => setViewMode("markdown")}
                >
                  {t("result.view.markdown")}
                </button>
              </div>
              <button className="copy-button" onClick={handleCopyResult}>
                {t("result.copy")}
              </button>
              <button className="copy-button" onClick={handleExport}>
                {t("result.export")}
              </button>
            </div>
          </div>
          {entry.files.length > 1 && (
            <div className="file-tabs">
              {entry.files.map((file) => {
                const isActive = currentFileId === file.id;
                return (
                  <button
                    key={file.id}
                    className={`file-tab ${isActive ? "active" : ""}`}
                    onClick={() => setCurrentFileId(file.id)}
                    title={file.name}
                  >
                    {file.name.length > 15
                      ? `${file.name.substring(0, 15)}...`
                      : file.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="result-body">
        {currentFile ? (
          viewMode === "render" ? (
            <div
              className="result-content"
              onClick={handleContentClick}
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          ) : (
            <pre className="result-markdown">{renderedContent}</pre>
          )
        ) : (
          <div className="result-empty">
            <p>{t("archive.result.empty")}</p>
          </div>
        )}
      </div>
    </div>
  );
};
