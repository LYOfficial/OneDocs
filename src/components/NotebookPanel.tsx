import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from 'react-i18next';
import { chunkText } from '@/services/rag/textChunking';
import { generateFallbackEmbedding } from '@/services/rag/embeddingService';
import type { Notebook, NotebookFile } from '@/types';

interface NotebookPanelProps {
  onAnalyze?: (selectedFileIds: string[]) => void;
}

type ViewState = 'list' | 'notebook';

export const NotebookPanel: React.FC<NotebookPanelProps> = ({ onAnalyze }) => {
  const { t } = useTranslation();
  const {
    notebooks,
    currentNotebookId,
    createNotebook,
    deleteNotebook,
    updateNotebook,
    setCurrentNotebookId,
    addFileToNotebook,
    removeFileFromNotebook,
    setNotebookChunks,
  } = useAppStore();

  const [viewState, setViewState] = useState<ViewState>('list');
  const [isCreating, setIsCreating] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  const currentNotebook = notebooks.find((nb) => nb.id === currentNotebookId);

  const handleCreateNotebook = () => {
    if (!newNotebookName.trim()) return;
    const nb = createNotebook(newNotebookName.trim());
    setCurrentNotebookId(nb.id);
    setNewNotebookName('');
    setIsCreating(false);
    setViewState('notebook');
  };

  const handleSelectNotebook = (notebook: Notebook) => {
    setCurrentNotebookId(notebook.id);
    setSelectedFileIds(new Set());
    setViewState('notebook');
  };

  const handleBackToList = () => {
    setCurrentNotebookId(null);
    setSelectedFileIds(new Set());
    setViewState('list');
  };

  const handleDeleteNotebook = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(t('notebook.confirmDelete') || 'Delete this notebook?')) {
      deleteNotebook(id);
    }
  };

  const handleStartEdit = (e: React.MouseEvent, notebook: Notebook) => {
    e.stopPropagation();
    setEditingNotebookId(notebook.id);
    setEditingName(notebook.name);
  };

  const handleSaveEdit = () => {
    if (editingNotebookId && editingName.trim()) {
      updateNotebook(editingNotebookId, { name: editingName.trim() });
    }
    setEditingNotebookId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingNotebookId(null);
    setEditingName('');
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFileIds);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFileIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (!currentNotebook) return;
    if (selectedFileIds.size === currentNotebook.files.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(currentNotebook.files.map(f => f.id)));
    }
  };

  const handleAnalyze = () => {
    if (selectedFileIds.size === 0) {
      alert(t('notebook.selectAtLeastOne') || '请先选择要分析的文件');
      return;
    }
    if (onAnalyze) {
      onAnalyze(Array.from(selectedFileIds));
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!currentNotebookId) {
      const nb = createNotebook(`笔记本 ${Date.now()}`);
      setCurrentNotebookId(nb.id);
    }

    setIsProcessingFile(true);
    setProcessingMessage(t('notebook.chunking') || '正在分块...');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let textContent = '';
        let pageTexts: string[] = [];
        let pageCount = 1;

        if (file.type === 'application/pdf') {
          try {
            setProcessingMessage(`正在提取 ${file.name} 内容...`);
            // Use DocumentProcessor for PDF text extraction
            const { DocumentProcessor } = await import('@/utils/documentProcessor');
            const bundle = await DocumentProcessor.extractAnalysisBundle(file);
            textContent = bundle.text;
            pageTexts = bundle.pageTexts;
            pageCount = bundle.pageCount;
          } catch (e) {
            console.warn('PDF extraction failed:', e);
            throw e;
          }
        } else {
          throw new Error(`不支持的文件格式: ${file.type}，仅支持 PDF 文件`);
        }

        const notebookFile: NotebookFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type as any,
          size: file.size,
          textContent,
          pageTexts,
          pageCount,
          uploadedAt: Date.now()
        };

        addFileToNotebook(currentNotebookId!, notebookFile);

        setProcessingMessage(t('notebook.chunking') || '正在分块...');
        const chunks = chunkText(textContent, pageTexts, {
          targetChunkSize: 500,
          overlapChars: 50,
          minChunkSize: 100,
        });

        setProcessingMessage(t('notebook.embedding') || '正在生成向量...');
        const { generateEmbedding } = await import('@/services/rag/embeddingService');
        const chunksWithEmbeddings = await Promise.all(
          chunks.map(async (chunk) => {
            try {
              const embedding = await generateEmbedding(chunk.content);
              return {
                ...chunk,
                embedding,
                notebookId: currentNotebookId!,
                fileId: notebookFile.id,
              };
            } catch (e) {
              console.warn('Embedding generation failed for chunk:', chunk.id, e);
              return {
                ...chunk,
                embedding: generateFallbackEmbedding(chunk.content),
                notebookId: currentNotebookId!,
                fileId: notebookFile.id,
              };
            }
          })
        );

        setNotebookChunks(notebookFile.id, chunksWithEmbeddings);

      } catch (error) {
        console.error('Failed to process file:', file.name, error);
      }
    }

    setIsProcessingFile(false);
    setProcessingMessage('');
  };

  return (
    <div className="notebook-panel">
      {isProcessingFile && (
        <div className="notebook-processing">
          <div className="processing-spinner">⏳</div>
          <div className="processing-message">{processingMessage}</div>
        </div>
      )}

      {viewState === 'list' && (
        <div className="notebook-list-view">
          <div className="notebook-list-header">
            <h3>📚 {t('notebook.title') || '知识库'}</h3>
            <button onClick={() => setIsCreating(true)} className="notebook-btn-new">
              <span className="plus-icon">+</span>
              {t('notebook.newNotebook') || '新建笔记本'}
            </button>
          </div>

          {isCreating && (
            <div className="notebook-create-form">
              <input
                type="text"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateNotebook();
                  if (e.key === 'Escape') setIsCreating(false);
                }}
                placeholder={t('notebook.namePlaceholder') || '输入笔记本名称'}
                autoFocus
                className="notebook-name-input"
              />
              <button onClick={handleCreateNotebook} className="notebook-btn-create-confirm">
                {t('notebook.confirm') || '确认'}
              </button>
              <button onClick={() => setIsCreating(false)} className="notebook-btn-create-cancel">
                {t('notebook.cancel') || '取消'}
              </button>
            </div>
          )}

          {notebooks.length === 0 ? (
            <div className="notebook-empty">
              <p>暂无笔记本</p>
              <p className="notebook-empty-hint">点击上方「新建笔记本」按钮创建一个新的笔记本</p>
            </div>
          ) : (
            <div className="notebook-items">
              {notebooks.map((notebook) => (
                <div
                  key={notebook.id}
                  className="notebook-item"
                  onClick={() => handleSelectNotebook(notebook)}
                >
                  <div className="notebook-info">
                    {editingNotebookId === notebook.id ? (
                      <div className="notebook-edit-form">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="notebook-name-input"
                        />
                        <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }} className="notebook-btn-save">✓</button>
                        <button onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }} className="notebook-btn-cancel">✕</button>
                      </div>
                    ) : (
                      <>
                        <span className="notebook-name">{notebook.name}</span>
                        <span className="notebook-meta">
                          {notebook.files.length} {t('notebook.files') || '个文件'}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="notebook-actions">
                    <button
                      onClick={(e) => handleStartEdit(e, notebook)}
                      className="notebook-btn-edit"
                      title={t('notebook.edit') || '重命名'}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => handleDeleteNotebook(e, notebook.id)}
                      className="notebook-btn-delete"
                      title={t('notebook.delete') || '删除'}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewState === 'notebook' && currentNotebook && (
        <div className="notebook-detail-view">
          <div className="notebook-detail-header">
            <button onClick={handleBackToList} className="notebook-back-btn">
              ← 返回列表
            </button>
            <span className="notebook-detail-name">{currentNotebook.name}</span>
          </div>

          <div className="notebook-file-selection">
            <div className="notebook-file-list-header">
              <label className="notebook-select-all">
                <input
                  type="checkbox"
                  checked={selectedFileIds.size === currentNotebook.files.length && currentNotebook.files.length > 0}
                  onChange={toggleSelectAll}
                  disabled={currentNotebook.files.length === 0}
                />
                全选
              </label>
              <span className="notebook-selected-count">
                已选择 {selectedFileIds.size} 个文件
              </span>
            </div>

            {currentNotebook.files.length === 0 ? (
              <div className="notebook-empty">
                <p>暂无文件</p>
                <p className="notebook-empty-hint">上传文档到这个笔记本</p>
              </div>
            ) : (
              <div className="notebook-file-items">
                {currentNotebook.files.map((file) => (
                  <div key={file.id} className="notebook-file-item">
                    <label className="notebook-file-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedFileIds.has(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                      />
                      <span className="notebook-file-name">{file.name}</span>
                      <span className="notebook-file-meta">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </label>
                    <button
                      onClick={() => removeFileFromNotebook(currentNotebook.id, file.id)}
                      className="notebook-file-remove"
                      title={t('notebook.removeFile') || '移除'}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="notebook-upload-area">
            <input
              type="file"
              id="notebook-file-input"
              multiple
              accept=".pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files);
                }
              }}
              style={{ display: 'none' }}
            />
            <label htmlFor="notebook-file-input" className="notebook-upload-label">
              <span className="notebook-upload-icon">📄</span>
              <span className="notebook-upload-text">
                {t('upload.select') || '点击选择文档（支持多选）'}
              </span>
              <span className="notebook-upload-hint">
                {t('upload.hint') || '仅支持 PDF 格式'}
              </span>
            </label>
          </div>

          {currentNotebook.files.length > 0 && (
            <button
              onClick={handleAnalyze}
              className="notebook-analyze-btn"
              disabled={selectedFileIds.size === 0}
            >
              🔍 {t('notebook.analyzeSelected') || '析文所选文件'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};