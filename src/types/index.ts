// AI Provider Types
export type AIProvider = 'openai' | 'deepseek' | 'glm';
export type CustomProviderKey = `custom_${string}`;
export type AllProviders = AIProvider | CustomProviderKey;

export interface ModelOption {
  value: string;
  name: string;
}

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  endpoint: string;
  models: ModelOption[];
  defaultModel: string;
  keyLabel: string;
  keyHint: string;
  baseUrlHint: string;
}

export interface CustomProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  isCustom: true;
}

export type ModelProviders = Record<AIProvider, ProviderConfig>;

// Prompt Configuration Types
export type PromptType = 'science' | 'liberal' | 'data' | 'news';

export interface PromptConfig {
  name: string;
  description: string;
  prompt: string;
}

export type PromptConfigs = Record<PromptType, PromptConfig>;

// File Types
export type SupportedFileType =
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.ms-powerpoint'
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  | 'text/plain';

export interface FileInfo {
  file: File;
  name: string;
  type: SupportedFileType;
  size: number;
  id?: string; // 用于多文件管理
}

// Analysis Types
export interface AnalysisProgress {
  percentage: number;
  message: string;
}

export interface AnalysisResult {
  content: string;
  timestamp: number;
  fileId?: string; // 关联到文件ID
}

// 多文件分析结果
export interface MultiFileAnalysisResult {
  [fileId: string]: AnalysisResult;
}

// Settings Types
export interface ProviderSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface CustomProviderSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  name: string;
}

export type AllSettings = Record<AIProvider, ProviderSettings>;
export type CustomSettings = Record<string, CustomProviderSettings>;

export interface AppSettings {
  currentProvider: AIProvider | CustomProviderKey;
  providers: AllSettings;
  customProviders: CustomSettings;
}

// View Types
export type ViewMode = 'render' | 'markdown';

// Toast Types
export interface ToastMessage {
  message: string;
  duration?: number;
}

// API Request/Response Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface APIRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface APIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface APIError {
  error: {
    message: string;
    type?: string;
    code?: string;
  };
}
