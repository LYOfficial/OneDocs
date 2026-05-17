import React, { useRef, useState, useCallback } from "react";
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

  // Pointer-based drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

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

  // Pointer-based drag handlers for reliable reordering
  const handlePointerDown = useCallback((_fileId: string) => (e: React.PointerEvent) => {
    // Only respond to primary button (left click)
    if (e.button !== 0) return;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    isDragging.current = false;
    // Capture pointer to receive events outside the element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((fileId: string) => (e: React.PointerEvent) => {
    if (!dragStartPos.current) return;
    const dx = Math.abs(e.clientX - dragStartPos.current.x);
    const dy = Math.abs(e.clientY - dragStartPos.current.y);

    // Start dragging after moving 5px (distinguish from click)
    if (!isDragging.current && (dx > 5 || dy > 5)) {
      isDragging.current = true;
      setDraggingId(fileId);
    }

    if (isDragging.current) {
      // Find which chip the pointer is over
      const elements = document.querySelectorAll(".chat-file-chip");
      let newOverId: string | null = null;
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          newOverId = el.getAttribute("data-file-id");
        }
      });
      setDragOverId(newOverId);
    }
  }, []);

  const handlePointerUp = useCallback((fileId: string) => (e: React.PointerEvent) => {
    if (isDragging.current && dragOverId && dragOverId !== fileId) {
      // Perform reorder
      const draggedIndex = files.findIndex((f) => f.id === fileId);
      const targetIndex = files.findIndex((f) => f.id === dragOverId);
      if (draggedIndex >= 0 && targetIndex >= 0 && draggedIndex !== targetIndex) {
        const nextFiles = [...files];
        const [moved] = nextFiles.splice(draggedIndex, 1);
        nextFiles.splice(targetIndex, 0, moved);
        setFiles(nextFiles);
      }
    }

    // If not dragging, treat as click
    if (!isDragging.current) {
      handleFileClick(fileId);
    }

    // Reset state
    dragStartPos.current = null;
    isDragging.current = false;
    setDraggingId(null);
    setDragOverId(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture was already released
    }
  }, [files, dragOverId, setFiles]);

  const handlePointerCancel = useCallback(() => {
    dragStartPos.current = null;
    isDragging.current = false;
    setDraggingId(null);
    setDragOverId(null);
  }, []);

  // Drag-and-drop upload state
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  return (
    <div
      className={`chat-upload${isDragOver ? " drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="chat-upload-area"
        onClick={handleUploadAreaClick}
      >
        <div className="chat-upload-text">
          <p>{t("upload.select")}</p>
          <span>{t("upload.hint")}</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
      </div>

      {files.length > 0 && (
        <div className="chat-files">
          <div className="chat-files-header">
            <span>{t("upload.files.header", { count: files.length })}</span>
            <span className="files-hint">{t("upload.files.reorderHint")}</span>
          </div>
          <div className="chat-files-row">
            {files.map((fileInfo) => {
              const fileId = fileInfo.id || "";
              const isActive = currentFileId === fileId;
              const isFileDragging = draggingId === fileId;
              const isFileDragOver = dragOverId === fileId && draggingId !== fileId;
              return (
                <div
                  key={fileId}
                  data-file-id={fileId}
                  className={`chat-file-chip ${isActive ? "active" : ""} ${isFileDragging ? "dragging" : ""} ${isFileDragOver ? "drag-over" : ""}`}
                  onPointerDown={handlePointerDown(fileId)}
                  onPointerMove={handlePointerMove(fileId)}
                  onPointerUp={handlePointerUp(fileId)}
                  onPointerCancel={handlePointerCancel}
                  style={{ touchAction: "none" }}
                >
                  <div className="chat-file-name">{fileInfo.name}</div>
                  <div className="chat-file-size">
                    {(fileInfo.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <button
                    className="chat-file-remove"
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

      {onAnalyze && (
        <div className="chat-upload-actions">
          <button
            className="chat-send-button"
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze();
            }}
            disabled={!hasAnalysisResults && !canAnalyze}
          >
            <span className="button-text">
              {hasAnalysisResults
                ? t("upload.analyze.new")
                : t("upload.send")}
            </span>
            <i className="fas fa-paper-plane button-icon" aria-hidden="true"></i>
            {isAnalyzing && <div className="button-loader"></div>}
          </button>
        </div>
      )}
    </div>
  );
};
