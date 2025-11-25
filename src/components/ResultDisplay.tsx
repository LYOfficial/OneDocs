import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { MarkdownRenderer } from "@/utils/markdownRenderer";
import { useToast } from "./Toast";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
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
  const [isCopying, setIsCopying] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  // 确定要显示的结果
  const displayResult = mergedResult || analysisResult;
  if (!displayResult && Object.keys(multiFileAnalysisResults).length === 0) return null;

  const handleCopyResult = async () => {
    if (!displayResult) return;
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(displayResult.content);
      toast.show("已复制Markdown源码到剪贴板");
      setTimeout(() => {
        setIsCopying(false);
      }, 1500);
    } catch (error) {
      setIsCopying(false);
      toast.show("复制失败，请手动选择复制");
    }
  };

  const handleExport = async () => {
    if (!displayResult) return;
    try {
      // 尝试使用 Tauri 对话框
      const filePath = await save({
        defaultPath: `OneDocs_分析结果_${new Date().getTime()}.md`,
        filters: [
          {
            name: "Markdown",
            extensions: ["md"],
          },
        ],
      });

      if (filePath) {
        // 写入文件
        await writeTextFile(filePath, displayResult.content);
        toast.show(`文件已保存到: ${filePath}`);
      }
    } catch (error: any) {
      console.error("Tauri 导出失败，尝试使用浏览器下载:", error);

      // 备用方案：使用浏览器的下载方式
      try {
        const blob = new Blob([displayResult.content], {
          type: "text/markdown;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `OneDocs_分析结果_${new Date().getTime()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.show("文件已导出到下载文件夹");
      } catch (fallbackError) {
        console.error("导出失败:", fallbackError);
        toast.show("导出失败，请尝试复制内容后手动保存");
      }
    }
  };

  const handleMerge = () => {
    if (files.length < 2) {
      toast.show("至少需要2个文件才能合并");
      return;
    }

    const results = files
      .map((file) => {
        const fileId = file.id || "";
        const result = multiFileAnalysisResults[fileId];
        return result ? { file, result } : null;
      })
      .filter((item): item is { file: typeof files[0]; result: typeof multiFileAnalysisResults[string] } => item !== null);

    if (results.length < 2) {
      toast.show("至少需要2个已分析的文件才能合并");
      return;
    }

    setIsMerging(true);
    try {
      // 合并所有结果，每个文件的标题降级
      const mergedContent = results
        .map(({ file, result }) => {
          const downgradedContent = MarkdownRenderer.downgradeHeadings(result.content);
          // 添加文件名的注释（可选）
          return `<!-- 文件: ${file.name} -->\n\n${downgradedContent}`;
        })
        .join("\n\n---\n\n"); // 用分隔线分隔不同文件

      const merged: typeof mergedResult = {
        content: mergedContent,
        timestamp: Date.now(),
      };

      setMergedResult(merged);
      toast.show(`成功合并 ${results.length} 个文件！`);
    } catch (error: any) {
      console.error("合并失败:", error);
      toast.show("合并失败: " + (error.message || "未知错误"));
    } finally {
      setIsMerging(false);
    }
  };

  const renderedContent = displayResult
    ? viewMode === "render"
      ? MarkdownRenderer.render(displayResult.content)
      : displayResult.content
    : "";

  const hasMultipleFiles = files.length > 1;
  const hasMultipleResults = Object.keys(multiFileAnalysisResults).length > 1;
  const canMerge = hasMultipleFiles && hasMultipleResults;

  return (
    <div className="result-section">
      <div className="result-header">
        <div className="result-title-section">
          <div className="result-header-row">
            <h3 className="result-title">
              {mergedResult ? "合并结果" : "析文成果"}
            </h3>
            <div className="result-controls">
              {canMerge && !mergedResult && (
                <button
                  className={`merge-button ${isMerging ? "merging" : ""}`}
                  onClick={handleMerge}
                  disabled={isMerging}
                >
                  {isMerging ? "合并中..." : "一键合并"}
                </button>
              )}
              {mergedResult && (
                <button
                  className="back-button-small"
                  onClick={() => setMergedResult(null)}
                >
                  返回预览
                </button>
              )}
              <div className="view-toggle">
                <button
                  className={`toggle-btn ${viewMode === "render" ? "active" : ""}`}
                  onClick={() => setViewMode("render")}
                >
                  渲染
                </button>
                <button
                  className={`toggle-btn ${viewMode === "markdown" ? "active" : ""}`}
                  onClick={() => setViewMode("markdown")}
                >
                  源码
                </button>
              </div>
              <button 
                className={`copy-button ${isCopying ? 'copying' : ''}`} 
                onClick={handleCopyResult}
                disabled={isCopying || !displayResult}
              >
                复制
              </button>
              <button 
                className="copy-button" 
                onClick={handleExport}
                disabled={!displayResult}
              >
                导出
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
                    title={hasResult ? file.name : `${file.name} (未分析)`}
                  >
                    {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
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
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          ) : (
            <pre className="result-markdown">{renderedContent}</pre>
          )
        ) : (
          <div className="result-empty">
            <p>请先分析文档以查看结果</p>
          </div>
        )}
      </div>
    </div>
  );
};
