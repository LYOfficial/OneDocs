import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from 'react-i18next';
import type { Notebook } from '@/types';

export const NotebookList: React.FC = () => {
  const { t } = useTranslation();
  const {
    notebooks,
    currentNotebookId,
    createNotebook,
    deleteNotebook,
    updateNotebook,
    setCurrentNotebookId,
    removeFileFromNotebook,
  } = useAppStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const currentNotebook = notebooks.find((nb) => nb.id === currentNotebookId);

  const handleCreateNotebook = () => {
    if (!newNotebookName.trim()) return;
    const nb = createNotebook(newNotebookName.trim());
    setCurrentNotebookId(nb.id);
    setNewNotebookName('');
    setIsCreating(false);
  };

  const handleSelectNotebook = (id: string) => {
    setCurrentNotebookId(id);
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

  return (
    <div className="notebook-list">
      {/* 温故 - Past Notebooks */}
      {notebooks.length > 0 && (
        <div className="notebook-section">
          <h3 className="notebook-section-title">
            <span className="notebook-icon">📖</span>
            {t('notebook.reviewPast') || 'Review Past'}
          </h3>
          <div className="notebook-items">
            {notebooks.map((notebook) => (
              <div
                key={notebook.id}
                className={`notebook-item ${currentNotebookId === notebook.id ? 'active' : ''}`}
                onClick={() => handleSelectNotebook(notebook.id)}
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
                        {notebook.files.length} {t('notebook.files') || 'files'}
                      </span>
                    </>
                  )}
                </div>
                <div className="notebook-actions">
                  <button
                    onClick={(e) => handleStartEdit(e, notebook)}
                    className="notebook-btn-edit"
                    title={t('notebook.edit') || 'Edit name'}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => handleDeleteNotebook(e, notebook.id)}
                    className="notebook-btn-delete"
                    title={t('notebook.delete') || 'Delete'}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 知新 - Create New Notebook */}
      <div className="notebook-section">
        <h3 className="notebook-section-title">
          <span className="notebook-icon">🆕</span>
          {t('notebook.createNew') || 'Create New'}
        </h3>
        {isCreating ? (
          <div className="notebook-create-form">
            <input
              type="text"
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNotebook();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              placeholder={t('notebook.namePlaceholder') || 'Enter notebook name'}
              autoFocus
              className="notebook-name-input"
            />
            <button onClick={handleCreateNotebook} className="notebook-btn-create-confirm">
              {t('notebook.confirm') || 'Confirm'}
            </button>
            <button onClick={() => setIsCreating(false)} className="notebook-btn-create-cancel">
              {t('notebook.cancel') || 'Cancel'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="notebook-btn-new"
          >
            <span className="plus-icon">+</span>
            {t('notebook.newNotebook') || 'New Notebook'}
          </button>
        )}
      </div>

      {/* Current Notebook Info */}
      {currentNotebook && (
        <div className="notebook-current">
          <div className="notebook-current-header">
            <span className="notebook-current-name">{currentNotebook.name}</span>
            <span className="notebook-file-count">
              {currentNotebook.files.length} {t('notebook.files') || 'files'}
            </span>
          </div>
          {currentNotebook.files.length > 0 ? (
            <div className="notebook-files-list">
              {currentNotebook.files.map((file) => (
                <div key={file.id} className="notebook-file-item">
                  <span className="notebook-file-name">{file.name}</span>
                  <span className="notebook-file-meta">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={() => removeFileFromNotebook(currentNotebook.id, file.id)}
                    className="notebook-file-remove"
                    title={t('notebook.removeFile') || 'Remove file'}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="notebook-empty-hint">
              {t('notebook.emptyHint') || 'No files yet. Upload documents to this notebook.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};