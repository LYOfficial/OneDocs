import React, { useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { DocumentProcessor } from "@/utils/documentProcessor";
import { FILE_SIZE_LIMIT } from "@/config/providers";
import { useToast } from "./Toast";
import { useTranslation } from "react-i18next";
import type { FileInfo, SupportedFileType } from "@/types";

interface FileUploadProps {
  onAnalyze?: () => void;
  canAnalyze?: boolean;
  isAnalyzing?: boolean;
  hasAnalysisResults?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onAnalyze,
  canAnalyze = false,
  isAnalyzing = false,
  hasAnalysisResults = false,
}) => {
  const {
    files,
    addFile,
    removeFile,
    setFiles,
    setCurrentFileId,
    currentFileId,
  } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { t } = useTranslation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFiles = (fileList: File[]) => {
    const validFiles: FileInfo[] = [];

    fileList.forEach((file) => {
      if (!DocumentProcessor.isValidFileType(file.type)) {
        toast.show(
          t("upload.toast.unsupported", { name: file.name, type: file.type }),
        );
        return;
      }

      if (file.size > FILE_SIZE_LIMIT) {
        toast.show(t("upload.toast.tooLarge", { name: file.name }));
        return;
      }

      const fileInfo: FileInfo = {
        file,
        name: file.name,
        type: file.type as SupportedFileType,
        size: file.size,
      };

      validFiles.push(fileInfo);
    });

    if (validFiles.length > 0) {
      validFiles.forEach((fileInfo) => addFile(fileInfo));
      toast.show(t("upload.toast.added", { count: validFiles.length }));
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    removeFile(fileId);
  };

  const handleFileClick = (fileId: string) => {
    setCurrentFileId(fileId);
  };

  const handleMoveUp = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index === 0) return;

    const newFiles = [...files];
    [newFiles[index - 1], newFiles[index]] = [
      newFiles[index],
      newFiles[index - 1],
    ];
    setFiles(newFiles);
  };

  const handleMoveDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index === files.length - 1) return;

    const newFiles = [...files];
    [newFiles[index], newFiles[index + 1]] = [
      newFiles[index + 1],
      newFiles[index],
    ];
    setFiles(newFiles);
  };

  return (
    <>
      <div className="upload-section">
        <div style={{ display: "flex", gap: "16px", alignItems: "stretch" }}>
          <div
            className="upload-area"
            id="uploadArea"
            onClick={handleUploadAreaClick}
            style={{ flex: 1 }}
          >
            <div className="upload-content">
              <div className="upload-icon">📁</div>
              <p className="upload-text">{t("upload.select")}</p>
              <p className="upload-hint">{t("upload.hint")}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                multiple
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {onAnalyze && (
            <button
              className="analyze-button-mini"
              onClick={(e) => {
                e.stopPropagation();
                onAnalyze();
              }}
              disabled={!hasAnalysisResults && !canAnalyze}
            >
              <span className="button-text">
                {hasAnalysisResults
                  ? t("upload.analyze.new")
                  : t("upload.analyze.start")}
              </span>
              <i className="fas fa-play button-icon" aria-hidden="true"></i>
              {isAnalyzing && <div className="button-loader"></div>}
            </button>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="files-list">
          <div className="files-list-header">
            <span>{t("upload.files.header", { count: files.length })}</span>
            <span className="files-hint">{t("upload.files.reorderHint")}</span>
          </div>
          <div className="files-items">
            {files.map((fileInfo, index) => {
              const fileId = fileInfo.id || "";
              const isActive = currentFileId === fileId;
              const isFirst = index === 0;
              const isLast = index === files.length - 1;

              return (
                <div
                  key={fileId}
                  className={`file-item ${isActive ? "active" : ""}`}
                  onClick={() => handleFileClick(fileId)}
                >
                  <div className="file-item-controls">
                    <button
                      className="file-item-arrow file-item-arrow-up"
                      onClick={(e) => handleMoveUp(e, index)}
                      disabled={isFirst}
                      title={t("upload.moveUp")}
                    >
                      ↑
                    </button>
                    <button
                      className="file-item-arrow file-item-arrow-down"
                      onClick={(e) => handleMoveDown(e, index)}
                      disabled={isLast}
                      title={t("upload.moveDown")}
                    >
                      ↓
                    </button>
                  </div>
                  <div className="file-item-info">
                    <span className="file-item-name">{fileInfo.name}</span>
                    <span className="file-item-size">
                      {(fileInfo.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    className="file-item-remove"
                    onClick={(e) => handleRemoveFile(e, fileId)}
                    title={t("upload.remove")}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
