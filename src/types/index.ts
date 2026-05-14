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
  | 'xinghe'
  | 'ppio'
  | 'modelscope'
  | 'newapi'
  | 'openrouter'
  | 'oneapi';

export type CustomProviderKey = `custom_${string}`;
export type AllProviders = AIProvider | CustomProviderKey;

export type ModelTagVariant =
  | 'thinking'
  | 'vision'
  | 'fast'
  | 'better'
  | 'flagship'
  | 'affordable'
  | 'free';

export interface ModelTag {
  label: string;
  variant?: ModelTagVariant;
}

export interface ModelOption {
  value: string;
  name: string;
  tag?: string;
  tags?: ModelTag[];
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
  iconColor?: string;
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
  coreSystemPrompt: string;
  chunkTasks: string[];
  sectionHeaders: string[];
  prompt: string;
}

export type PromptConfigs = Record<PromptType, PromptConfig>;

export type SupportedFileType = 'application/pdf';

export interface FileInfo {
  file: File;
  name: string;
  type: SupportedFileType;
  size: number;
  id?: string;
}

export interface DocumentImageAsset {
  pageNumber: number;
  fileName: string;
  localPath: string;
  dataUrl?: string;
}

/** Mapping of page number to the images found on that page */
export interface PageImageMap {
  pageNumber: number;
  /** Snippet of text content on this page (for context matching) */
  textSnippet: string;
  /** Image file names found on this page */
  imageFileNames: string[];
  /** Unique insertion tags for each image on this page (e.g. [[IMG_P3_001]]) */
  imageTags: string[];
}

export interface DocumentAnalysisBundle {
  text: string;
  pageTexts: string[];
  images: DocumentImageAsset[];
  /** Mapping of page numbers to their images and text snippets */
  pageImageMap: PageImageMap[];
  pageCount: number;
  /** Short hash-based directory name for this document's assets */
  hashDir: string;
}

export interface ChunkPlan {
  id: string;
  title: string;
  pageStart: number;
  pageEnd: number;
  summaryFocus?: string;
  imagePages?: number[];
}

export interface AnalysisWorkflowPlan {
  fileName: string;
  fileType: SupportedFileType;
  overview: string;
  chunks: ChunkPlan[];
  imagePlacementHints: Array<{
    pageNumber: number;
    reason: string;
    preferredSection?: string;
  }>;
  finishingNotes: string[];
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

export type DeveloperLogLevel = 'info' | 'warn' | 'error';

export interface DeveloperLogEntry {
  id: string;
  timestamp: number;
  level: DeveloperLogLevel;
  scope: string;
  message: string;
  payload?: unknown;
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

// ========== RAG Types ==========

export interface TextChunk {
  id: string;
  content: string;
  /** Start character index in source text */
  startIndex: number;
  /** End character index in source text */
  endIndex: number;
  /** Which file page this chunk came from */
  sourcePage: number;
  /** Embedding vector (stored as raw number array) */
  embedding?: number[];
}
