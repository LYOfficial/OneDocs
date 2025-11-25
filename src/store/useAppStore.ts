import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AIProvider,
  AllProviders,
  PromptType,
  FileInfo,
  AnalysisProgress,
  AnalysisResult,
  MultiFileAnalysisResult,
  ViewMode,
  ProviderSettings,
  CustomProviderSettings,
} from '@/types';
import { MODEL_PROVIDERS, createCustomProvider } from '@/config/providers';

interface AppState {
  // File state - 支持多文件
  files: FileInfo[];
  currentFileId: string | null; // 当前选中的文件ID
  setFiles: (files: FileInfo[]) => void;
  addFile: (file: FileInfo) => void;
  removeFile: (fileId: string) => void;
  reorderFiles: (fileIds: string[]) => void;
  setCurrentFileId: (fileId: string | null) => void;
  // 向后兼容
  currentFile: FileInfo | null;
  setCurrentFile: (file: FileInfo | null) => void;

  // Function selection
  selectedFunction: PromptType;
  setSelectedFunction: (func: PromptType) => void;

  // Analysis state - 支持多文件分析结果
  isAnalyzing: boolean;
  analysisProgress: AnalysisProgress | null;
  analysisResult: AnalysisResult | null; // 当前选中文件的结果（向后兼容）
  multiFileAnalysisResults: MultiFileAnalysisResult; // 所有文件的分析结果
  mergedResult: AnalysisResult | null; // 合并后的结果
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setAnalysisProgress: (progress: AnalysisProgress | null) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setMultiFileAnalysisResult: (fileId: string, result: AnalysisResult) => void;
  setMergedResult: (result: AnalysisResult | null) => void;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Settings
  currentProvider: AllProviders;
  providerSettings: Record<AIProvider, ProviderSettings>;
  customProviders: Record<string, CustomProviderSettings>;
  setCurrentProvider: (provider: AllProviders) => void;
  updateProviderSettings: (provider: AIProvider, settings: Partial<ProviderSettings>) => void;
  addCustomProvider: (name: string, baseUrl: string, model: string, apiKey: string) => string;
  updateCustomProvider: (id: string, settings: Partial<CustomProviderSettings>) => void;
  deleteCustomProvider: (id: string) => void;
  getCurrentSettings: () => ProviderSettings | CustomProviderSettings;

  // UI state
  isSidebarCollapsed: boolean;
  isSettingsOpen: boolean;
  showFormatNotice: boolean;
  toggleSidebar: () => void;
  setSettingsOpen: (open: boolean) => void;
  setShowFormatNotice: (show: boolean) => void;

  // Reset
  resetAnalysis: () => void;
  resetAll: () => void;
}

const getDefaultSettings = (provider: AIProvider): ProviderSettings => {
  const config = MODEL_PROVIDERS[provider];
  return {
    apiKey: '',
    baseUrl: config.baseUrl,
    model: config.defaultModel,
  };
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // File state - 多文件支持
      files: [],
      currentFileId: null,
      setFiles: (files) => set({ files }),
      addFile: (file) => {
        const fileId = file.id || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fileWithId = { ...file, id: fileId };
        set((state) => ({
          files: [...state.files, fileWithId],
          currentFileId: fileId,
          currentFile: fileWithId, // 向后兼容
        }));
      },
      removeFile: (fileId) => {
        set((state) => {
          const newFiles = state.files.filter((f) => f.id !== fileId);
          const newCurrentFileId = 
            state.currentFileId === fileId 
              ? (newFiles.length > 0 ? newFiles[0].id || null : null)
              : state.currentFileId;
          const newCurrentFile = newFiles.find((f) => f.id === newCurrentFileId) || null;
          // 清理对应的分析结果
          const { [fileId]: removed, ...restResults } = state.multiFileAnalysisResults;
          return {
            files: newFiles,
            currentFileId: newCurrentFileId,
            currentFile: newCurrentFile, // 向后兼容
            analysisResult: newCurrentFile ? restResults[newCurrentFileId || ''] || null : null,
            multiFileAnalysisResults: restResults,
          };
        });
      },
      reorderFiles: (fileIds) => {
        set((state) => {
          const fileMap = new Map(state.files.map((f) => [f.id || '', f]));
          const newFiles = fileIds.map((id) => fileMap.get(id)).filter(Boolean) as FileInfo[];
          return { files: newFiles };
        });
      },
      setCurrentFileId: (fileId) => {
        set((state) => {
          const file = state.files.find((f) => f.id === fileId) || null;
          const result = fileId ? state.multiFileAnalysisResults[fileId] || null : null;
          return {
            currentFileId: fileId,
            currentFile: file, // 向后兼容
            analysisResult: result, // 向后兼容
          };
        });
      },
      // 向后兼容
      currentFile: null,
      setCurrentFile: (file) => {
        if (file) {
          const fileId = file.id || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const fileWithId = { ...file, id: fileId };
          set((state) => {
            const exists = state.files.find((f) => f.id === fileId);
            return {
              files: exists ? state.files : [...state.files, fileWithId],
              currentFileId: fileId,
              currentFile: fileWithId,
            };
          });
        } else {
          set({ currentFile: null, currentFileId: null });
        }
      },

      // Function selection
      selectedFunction: 'science',
      setSelectedFunction: (func) => set({ selectedFunction: func }),

      // Analysis state
      isAnalyzing: false,
      analysisProgress: null,
      analysisResult: null,
      multiFileAnalysisResults: {},
      mergedResult: null,
      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
      setAnalysisResult: (result) => set({ analysisResult: result }),
      setMultiFileAnalysisResult: (fileId, result) => {
        set((state) => {
          const newResults = {
            ...state.multiFileAnalysisResults,
            [fileId]: result,
          };
          // 如果当前文件ID匹配，也更新analysisResult（向后兼容）
          const newAnalysisResult = state.currentFileId === fileId ? result : state.analysisResult;
          return {
            multiFileAnalysisResults: newResults,
            analysisResult: newAnalysisResult,
          };
        });
      },
      setMergedResult: (result) => set({ mergedResult: result }),

      // View mode
      viewMode: 'render',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Settings
      currentProvider: 'openai',
      providerSettings: {
        openai: getDefaultSettings('openai'),
        deepseek: getDefaultSettings('deepseek'),
        glm: getDefaultSettings('glm'),
      },
      customProviders: {},
      setCurrentProvider: (provider) => set({ currentProvider: provider }),
      updateProviderSettings: (provider, settings) =>
        set((state) => ({
          providerSettings: {
            ...state.providerSettings,
            [provider]: {
              ...state.providerSettings[provider],
              ...settings,
            },
          },
        })),
      addCustomProvider: (name, baseUrl, model, apiKey) => {
        const config = createCustomProvider(name, baseUrl, model);
        const settings: CustomProviderSettings = {
          name,
          baseUrl,
          model,
          apiKey,
        };
        set((state) => ({
          customProviders: {
            ...state.customProviders,
            [config.id]: settings,
          },
        }));
        return config.id;
      },
      updateCustomProvider: (id, settings) =>
        set((state) => ({
          customProviders: {
            ...state.customProviders,
            [id]: {
              ...state.customProviders[id],
              ...settings,
            },
          },
        })),
      deleteCustomProvider: (id) =>
        set((state) => {
          const { [id]: deleted, ...rest } = state.customProviders;
          const newCurrentProvider = state.currentProvider === id ? 'openai' : state.currentProvider;
          return {
            customProviders: rest,
            currentProvider: newCurrentProvider,
          };
        }),
      getCurrentSettings: () => {
        const state = get();
        // 如果是自定义提供商
        if (typeof state.currentProvider === 'string' && state.currentProvider.startsWith('custom_')) {
          return state.customProviders[state.currentProvider];
        }
        // 如果是内置提供商
        return state.providerSettings[state.currentProvider as AIProvider];
      },

      // UI state
      isSidebarCollapsed: false,
      isSettingsOpen: false,
      showFormatNotice: true,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setShowFormatNotice: (show) => set({ showFormatNotice: show }),

      // Reset
      resetAnalysis: () =>
        set({
          analysisProgress: null,
          analysisResult: null,
          multiFileAnalysisResults: {},
          mergedResult: null,
          isAnalyzing: false,
        }),
      resetAll: () =>
        set({
          files: [],
          currentFileId: null,
          currentFile: null,
          analysisProgress: null,
          analysisResult: null,
          multiFileAnalysisResults: {},
          mergedResult: null,
          isAnalyzing: false,
        }),
    }),
    {
      name: 'onedocs-storage',
      partialize: (state) => ({
        selectedFunction: state.selectedFunction,
        currentProvider: state.currentProvider,
        providerSettings: state.providerSettings,
        customProviders: state.customProviders,
        isSidebarCollapsed: state.isSidebarCollapsed,
        showFormatNotice: state.showFormatNotice,
      }),
    }
  )
);
