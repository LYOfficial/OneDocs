export type AIProvider = 
  | 'onedocs'
  | 'openai' 
  | 'anthropic'
  | 'gemini'
  | 'moonshot'
  | 'glm'
  | 'deepseek'
  | 'ollama'
  | 'lmstudio'
  | 'comp_share'
  | '302_ai'
  | 'pony'
  | 'siliconflow'
  | 'ppio'
  | 'modelscope'
  | 'oneapi';

export type CustomProviderKey = `custom_${string}`;
export type AllProviders = AIProvider | CustomProviderKey;

export interface ModelOption {
  value: string;
  name: string;
  tag?: string;
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
  icon?: string;
  badgeText?: string;
  badgeVariant?: 'info' | 'success' | 'warning';
  requiresApiKey?: boolean;
  requiresBaseUrl?: boolean;
  showApiKeyField?: boolean;
  showBaseUrlField?: boolean;
  credentialsReadOnly?: boolean;
  allowModelCustomization?: boolean;
  defaultApiKey?: string;
  description?: string;
}

export interface CustomProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  isCustom: true;
}

export type ModelProviders = Record<AIProvider, ProviderConfig>;

export type PromptType = 'science' | 'liberal' | 'data' | 'news';

export interface PromptConfig {
  name: string;
  description: string;
  prompt: string;
}

export type PromptConfigs = Record<PromptType, PromptConfig>;

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
  id?: string;
}

export interface AnalysisProgress {
  percentage: number;
  message: string;
}

export interface AnalysisResult {
  content: string;
  timestamp: number;
  fileId?: string;
}

export interface MultiFileAnalysisResult {
  [fileId: string]: AnalysisResult;
}

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

export type ViewMode = 'render' | 'markdown';

export interface ToastMessage {
  message: string;
  duration?: number;
}

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
