import React, { useState, useCallback, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { MarkdownRenderer } from "@/utils/markdownRenderer";
import { useToast } from "./Toast";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";
import "katex/dist/katex.min.css";

export const ResultDisplay: React.FC = () => {
  const {
    files,
    currentFileId,
    analysisResult,
    multiFileAnalysisResults,
    mergedResult,
    viewMode,
    setViewMode,
    setMergedResult,
    setCurrentFileId,
  } = useAppStore();
  const toast = useToast();
  const { t } = useTranslation();
  const [isCopying, setIsCopying] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  const displayResult = mergedResult || analysisResult;
  if (!displayResult && Object.keys(multiFileAnalysisResults).length === 0)
    return null;

  const handleCopyResult = async () => {
    if (!displayResult) return;
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(displayResult.content);
      toast.show(t("result.toast.copied"));
      setTimeout(() => {
        setIsCopying(false);
      }, 1500);
    } catch (error) {
      setIsCopying(false);
      toast.show(t("result.toast.copyFail"));
    }
  };

  const handleExport = async () => {
    if (!displayResult) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const currentFile = files.find((f) => f.id === currentFileId) || files[0];
    const fileNameBase = mergedResult
      ? t("result.title.merged")
      : currentFile
        ? currentFile.name.replace(/\.[^./\\]+$/, "")
        : "OneDocs";
    const defaultFileName = `${fileNameBase}_OneDocs_${t("result.exportFileSuffix")}_${dateStr}.md`;
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
        await writeTextFile(filePath, displayResult.content);
        toast.show(t("result.toast.saved", { path: filePath }));
      }
    } catch (error: any) {
      console.error("Tauri 导出失败，尝试使用浏览器下载:", error);

      try {
        const blob = new Blob([displayResult.content], {
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
        console.error("导出失败:", fallbackError);
        toast.show(t("result.toast.exportFail"));
      }
    }
  };

  const handleMerge = () => {
    if (files.length < 2) {
      toast.show(t("result.toast.mergeNeedTwo"));
      return;
    }

    const results = files
      .map((file) => {
        const fileId = file.id || "";
        const result = multiFileAnalysisResults[fileId];
        return result ? { file, result } : null;
      })
      .filter(
        (
          item,
        ): item is {
          file: (typeof files)[0];
          result: (typeof multiFileAnalysisResults)[string];
        } => item !== null,
      );

    if (results.length < 2) {
      toast.show(t("result.toast.mergeNeedTwoAnalyzed"));
      return;
    }

    setIsMerging(true);
    try {
      const mergedContent = results
        .map(({ file, result }) => {
          const downgradedContent = MarkdownRenderer.downgradeHeadings(
            result.content,
          );
          return `<!-- 文件: ${file.name} -->\n\n${downgradedContent}`;
        })
        .join("\n\n---\n\n");

      const merged: typeof mergedResult = {
        content: mergedContent,
        timestamp: Date.now(),
      };

      setMergedResult(merged);
      toast.show(t("result.toast.mergeSuccess", { count: results.length }));
    } catch (error: any) {
      console.error("合并失败:", error);
      const message = error.message || t("result.toast.unknownError");
      toast.show(t("result.toast.mergeFail", { message }));
    } finally {
      setIsMerging(false);
    }
  };

  // Memoize rendered HTML to avoid re-computing on every render (prevents UI freeze)
  const renderedContent = useMemo(() => {
    if (!displayResult) return "";
    if (viewMode === "render") {
      return MarkdownRenderer.render(displayResult.content);
    }
    return displayResult.content;
  }, [displayResult, viewMode]);

  // Intercept link clicks to open external URLs in the default browser
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a") as HTMLAnchorElement | null;
    if (!anchor) return;
    const href = anchor.getAttribute("href") || "";
    // Skip internal/anchor links
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
    e.preventDefault();
    e.stopPropagation();
    // Open external links in default browser
    openUrl(href).catch((err: any) => {
      console.error("打开链接失败:", err);
      // Fallback: try window.open
      window.open(href, "_blank");
    });
  }, []);

  const hasMultipleFiles = files.length > 1;
  const hasMultipleResults = Object.keys(multiFileAnalysisResults).length > 1;
  const canMerge = hasMultipleFiles && hasMultipleResults;

  return (
    <div className="result-section">
      <div className="result-header">
        <div className="result-title-section">
          <div className="result-header-row">
            <h3 className="result-title">
              {mergedResult
                ? t("result.title.merged")
                : t("result.title.single")}
            </h3>
            <div className="result-controls">
              {canMerge && !mergedResult && (
                <button
                  className={`merge-button ${isMerging ? "merging" : ""}`}
                  onClick={handleMerge}
                  disabled={isMerging}
                >
                  {isMerging
                    ? t("result.merge.loading")
                    : t("result.merge.button")}
                </button>
              )}
              {mergedResult && (
                <button
                  className="back-button-small"
                  onClick={() => setMergedResult(null)}
                >
                  {t("result.back")}
                </button>
              )}
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
              <button
                className={`copy-button ${isCopying ? "copying" : ""}`}
                onClick={handleCopyResult}
                disabled={isCopying || !displayResult}
              >
                {t("result.copy")}
              </button>
              <button
                className="copy-button"
                onClick={handleExport}
                disabled={!displayResult}
              >
                {t("result.export")}
              </button>
            </div>
          </div>
          {hasMultipleFiles && !mergedResult && (
            <div className="file-tabs">
              {files.map((file) => {
                const fileId = file.id || "";
                const hasResult = !!multiFileAnalysisResults[fileId];
                const isActive = currentFileId === fileId;
                return (
                  <button
                    key={fileId}
                    className={`file-tab ${isActive ? "active" : ""} ${hasResult ? "" : "no-result"}`}
                    onClick={() => {
                      if (hasResult) {
                        setCurrentFileId(fileId);
                      }
                    }}
                    title={
                      hasResult
                        ? file.name
                        : t("result.fileNotAnalyzed", { name: file.name })
                    }
                  >
                    <span className="file-tab-name">
                      {file.name.length > 15
                        ? `${file.name.substring(0, 15)}...`
                        : file.name}
                    </span>
                    {!hasResult && (
                      <span className="file-tab-progress">
                        <span className="file-tab-progress-bar" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="result-body">
        {displayResult ? (
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
            <p>{t("result.empty")}</p>
          </div>
        )}
      </div>
    </div>
  );
};
