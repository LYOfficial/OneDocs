import React, { useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { DocumentProcessor } from "@/utils/documentProcessor";
import { FILE_SIZE_LIMIT } from "@/config/providers";
import { useToast } from "./Toast";
import type { FileInfo, SupportedFileType } from "@/types";

export const FileUpload: React.FC = () => {
  const { files, addFile, removeFile, setFiles, setCurrentFileId, currentFileId } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
    // 重置input，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFiles = (fileList: File[]) => {
    const validFiles: FileInfo[] = [];
    
    fileList.forEach((file) => {
      // 检查文件类型
      if (!DocumentProcessor.isValidFileType(file.type)) {
        toast.show(
          `文件 ${file.name} 格式不支持 (${file.type})，已跳过`,
        );
        return;
      }

      // 检查文件大小
      if (file.size > FILE_SIZE_LIMIT) {
        toast.show(`文件 ${file.name} 过大（超过50MB），已跳过`);
        return;
      }

      // 保存文件信息
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
      toast.show(`成功添加 ${validFiles.length} 个文件`);
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

  // 移动文件位置
  const handleMoveUp = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index === 0) return; // 已经在最上面
    
    const newFiles = [...files];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    setFiles(newFiles);
  };

  const handleMoveDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (index === files.length - 1) return; // 已经在最下面
    
    const newFiles = [...files];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setFiles(newFiles);
  };

  return (
    <>
      <div className="upload-section">
        <div
          className="upload-area"
          id="uploadArea"
          onClick={handleUploadAreaClick}
        >
          <div className="upload-content">
            <div className="upload-icon">📁</div>
            <p className="upload-text">点击选择文档（支持多选）</p>
            <p className="upload-hint">支持 PDF、Word、PowerPoint、TXT 格式，单个文件不超过50MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              multiple
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="files-list">
          <div className="files-list-header">
            <span>已上传文件 ({files.length})</span>
            <span className="files-hint">点击箭头调整顺序</span>
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
                      title="上移"
                    >
                      ↑
                    </button>
                    <button
                      className="file-item-arrow file-item-arrow-down"
                      onClick={(e) => handleMoveDown(e, index)}
                      disabled={isLast}
                      title="下移"
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
                    title="删除"
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
