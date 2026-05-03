import { ModelProviders, CustomProviderConfig } from "@/types";
import OneDocsIcon from "../../app-icon.png";

const sanitizeEnvValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

let ONEDOCS_BASE_URL = sanitizeEnvValue(import.meta.env.VITE_ONEDOCS_API_URL);
if (ONEDOCS_BASE_URL && !ONEDOCS_BASE_URL.endsWith("/v1")) {
  ONEDOCS_BASE_URL = `${ONEDOCS_BASE_URL.replace(/\/$/, "")}/v1`;
}

const ONEDOCS_API_KEY = sanitizeEnvValue(import.meta.env.VITE_ONEDOCS_API_KEY);
const HAS_MANAGED_ONEDOCS_CREDENTIALS = Boolean(
  ONEDOCS_BASE_URL && ONEDOCS_API_KEY,
);

export const createCustomProvider = (
  name: string,
  baseUrl: string,
  model: string,
): CustomProviderConfig => ({
  id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name,
  baseUrl,
  model,
  isCustom: true,
});

export const MODEL_PROVIDERS: ModelProviders = {
  onedocs: {
    name: "OneDocs",
    baseUrl: ONEDOCS_BASE_URL,
    endpoint: "/chat/completions",
    models: [
      { 
        value: "openai/gpt-oss-120b:free", 
        name: "gpt-oss-120b",
      },
      { 
        value: "qwen/qwen3-next-80b-a3b-instruct:free", 
        name: "qwen3-next-80b-a3b-instruct",
      },
      { 
        value: "z-ai/glm-4.5-air:free", 
        name: "glm-4.5-air",
      },
      { 
        value: "google/gemma-4-26b-a4b-it:free", 
        name: "gemma-4-26b-a4b-it",
      },
      { 
        value: "minimax/minimax-m2.5:free", 
        name: "minimax-m2.5",
      },
      { 
        value: "meta-llama/llama-3.3-70b-instruct:free", 
        name: "llama-3.3-70b-instruct",
      },
    ],
    defaultModel: "openai/gpt-oss-120b:free",
    keyLabel: "OneDocs API Key",
    keyHint: HAS_MANAGED_ONEDOCS_CREDENTIALS
      ? "OneDocs 内置凭证，无需额外填写"
      : "请输入 OneDocs API Key",
    baseUrlHint: HAS_MANAGED_ONEDOCS_CREDENTIALS
      ? "OneDocs 内置服务地址"
      : "请输入 OneDocs 服务地址",
    icon: OneDocsIcon,
    badgeText: "免费模型",
    badgeVariant: "success",
    requiresApiKey: !HAS_MANAGED_ONEDOCS_CREDENTIALS,
    requiresBaseUrl: !HAS_MANAGED_ONEDOCS_CREDENTIALS,
    showApiKeyField: !HAS_MANAGED_ONEDOCS_CREDENTIALS,
    showBaseUrlField: !HAS_MANAGED_ONEDOCS_CREDENTIALS,
    credentialsReadOnly: HAS_MANAGED_ONEDOCS_CREDENTIALS,
    allowModelCustomization: false,
    defaultApiKey: HAS_MANAGED_ONEDOCS_CREDENTIALS
      ? ONEDOCS_API_KEY
      : undefined,
    description:
      "OneDocs为用户提供免费模型，开箱即用，额度原因有概率无法使用，若无法使用请替换其他模型，感谢配合！",
  },
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    endpoint: "/chat/completions",
    models: [
      { value: "gpt-4o", name: "GPT-4o" },
      { value: "gpt-4o-mini", name: "GPT-4o-mini" },
      { value: "gpt-4", name: "GPT-4" },
      { value: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    ],
    defaultModel: "gpt-4o",
    keyLabel: "OpenAI API Key",
    keyHint: "需要填入有效的OpenAI API密钥方可使用",
    baseUrlHint: "API服务器地址，默认为OpenAI官方地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/openai.png",
  },
  anthropic: {
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    endpoint: "/messages",
    models: [
      { value: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (New)" },
      { value: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
      { value: "claude-3-opus-20240229", name: "Claude 3 Opus" },
      { value: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet" },
    ],
    defaultModel: "claude-3-5-sonnet-20241022",
    keyLabel: "Anthropic API Key",
    keyHint: "请输入 Anthropic API Key",
    baseUrlHint: "API服务器地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/anthropic.png",
  },
  gemini: {
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    endpoint: "/chat/completions",
    models: [
      { value: "gemini-3-pro", name: "Gemini 3 Pro" },
      { value: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
      { value: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { value: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
      { value: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    ],
    defaultModel: "gemini-3-pro",
    keyLabel: "Google API Key",
    keyHint: "请输入 Google AI Studio API Key",
    baseUrlHint: "API服务器地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/gemini.png",
    iconColor:
      "https://unpkg.com/@lobehub/icons-static-png@latest/light/gemini-color.png",
  },
  moonshot: {
    name: "Moonshot AI",
    baseUrl: "https://api.moonshot.cn/v1",
    endpoint: "/chat/completions",
    models: [
      { value: "moonshot-v1-8k", name: "Moonshot V1 8K" },
      { value: "moonshot-v1-32k", name: "Moonshot V1 32K" },
      { value: "moonshot-v1-128k", name: "Moonshot V1 128K" },
    ],
    defaultModel: "moonshot-v1-8k",
    keyLabel: "Moonshot API Key",
    keyHint: "请输入 Kimi 开放平台 API Key",
    baseUrlHint: "API服务器地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/moonshot.png",
  },
  glm: {
    name: "智谱GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    endpoint: "/chat/completions",
    models: [
      { value: "glm-4-flash", name: "GLM-4-Flash (推荐)" },
      { value: "glm-4-flashx", name: "GLM-4-FlashX" },
      { value: "glm-4-plus", name: "GLM-4-Plus" },
      { value: "glm-4-0520", name: "GLM-4-0520" },
      { value: "glm-4-long", name: "GLM-4-Long" },
      { value: "glm-4v-plus", name: "GLM-4V-Plus (多模态)" },
    ],
    defaultModel: "glm-4-flash",
    keyLabel: "智谱 API Key",
    keyHint: "需要填入有效的智谱API密钥方可使用",
    baseUrlHint: "智谱GLM API服务器地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/zhipu.png",
    iconColor:
      "https://unpkg.com/@lobehub/icons-static-png@latest/light/zhipu-color.png",
  },
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    endpoint: "/chat/completions",
    models: [
      { value: "deepseek-chat", name: "DeepSeek-V3 (Chat)" },
      { value: "deepseek-reasoner", name: "DeepSeek-R1 (Reasoner)" },
    ],
    defaultModel: "deepseek-chat",
    keyLabel: "DeepSeek API Key",
    keyHint: "需要填入有效的DeepSeek API密钥方可使用，请确保账户余额充足",
    baseUrlHint: "DeepSeek API服务器地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/deepseek.png",
    iconColor:
      "https://unpkg.com/@lobehub/icons-static-png@latest/light/deepseek-color.png",
  },
  ollama: {
    name: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    endpoint: "/chat/completions",
    models: [
      { value: "llama3.2", name: "Llama 3.2" },
      { value: "qwen2.5", name: "Qwen 2.5" },
      { value: "gemma2", name: "Gemma 2" },
      { value: "mistral", name: "Mistral" },
    ],
    defaultModel: "llama3.2",
    keyLabel: "API Key (可选)",
    keyHint: "本地部署通常不需要 API Key",
    baseUrlHint: "Ollama 服务地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/ollama.png",
  },
  lmstudio: {
    name: "LM Studio",
    baseUrl: "http://localhost:1234/v1",
    endpoint: "/chat/completions",
    models: [{ value: "local-model", name: "Local Model" }],
    defaultModel: "local-model",
    keyLabel: "API Key (可选)",
    keyHint: "本地部署通常不需要 API Key",
    baseUrlHint: "LM Studio 服务地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/lmstudio.png",
  },
  comp_share: {
    name: "优云智算",
    baseUrl: "https://api.compshare.cn/v1",
    endpoint: "/chat/completions",
    models: [
      { value: "gpt-4o", name: "GPT-4o" },
      { value: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet" },
    ],
    defaultModel: "gpt-4o",
    keyLabel: "API Key",
    keyHint: "请输入优云智算 API Key",
    baseUrlHint: "API服务器地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/openai.png",
  },
  "302_ai": {
    name: "302.AI",
    baseUrl: "https://api.302.ai/v1",
    endpoint: "/chat/completions",
    models: [
      { value: "gpt-4o", name: "GPT-4o" },
      { value: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet" },
    ],
    defaultModel: "gpt-4o",
    keyLabel: "API Key",
    keyHint: "请输入 302.AI API Key",
    baseUrlHint: "API服务器地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/ai302.png",
    iconColor:
      "https://unpkg.com/@lobehub/icons-static-png@latest/light/ai302-color.png",
  },
  pony: {
    name: "小马算力",
    baseUrl: "https://api.tokenpony.cn/v1",
    endpoint: "/chat/completions",
    models: [{ value: "gpt-4o", name: "GPT-4o" }],
    defaultModel: "gpt-4o",
    keyLabel: "API Key",
    keyHint: "请输入小马算力 API Key",
    baseUrlHint: "API服务器地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/openai.png",
  },
  siliconflow: {
    name: "硅基流动",
    baseUrl: "https://api.siliconflow.cn/v1",
    endpoint: "/chat/completions",
    models: [
      { value: "deepseek-ai/DeepSeek-V3", name: "DeepSeek-V3" },
      { value: "deepseek-ai/DeepSeek-R1", name: "DeepSeek-R1" },
      { value: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen2.5-72B" },
      { value: "Qwen/Qwen2.5-7B-Instruct", name: "Qwen2.5-7B" },
      { value: "Qwen/QwQ-32B", name: "QwQ-32B" },
      { value: "THUDM/glm-4-9b-chat", name: "GLM-4-9B" },
    ],
    defaultModel: "deepseek-ai/DeepSeek-V3",
    keyLabel: "SiliconFlow API Key",
    keyHint: "需要填入有效的硅基流动API密钥方可使用",
    baseUrlHint: "硅基流动 API服务器地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/siliconcloud.png",
    iconColor:
      "https://unpkg.com/@lobehub/icons-static-png@latest/light/siliconcloud-color.png",
  },
  xinghe: {
    name: "星河大模型",
    baseUrl: "https://aistudio.baidu.com/llm/lmapi/v3",
    endpoint: "/chat/completions",
    models: [
      { value: "ernie-4.5-21b-a3b-thinking", name: "ERNIE 4.5 21B Thinking" },
      {
        value: "ernie-4.5-vl-28b-a3b-thinking",
        name: "ERNIE 4.5 VL 28B Thinking",
      },
      {
        value: "ernie-5.0-thinking-preview",
        name: "ERNIE 5.0 Thinking Preview",
      },
      { value: "ernie-4.5-0.3b", name: "ERNIE 4.5 0.3B" },
    ],
    defaultModel: "ernie-4.5-21b-a3b-thinking",
    keyLabel: "AI Studio 访问令牌",
    keyHint: "请填写 AI Studio 访问令牌",
    baseUrlHint: "AI Studio 大模型 API 服务域名",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/wenxin.png",
    iconColor:
      "https://unpkg.com/@lobehub/icons-static-png@latest/light/wenxin-color.png",
    description: "AI Studio 星河大模型服务，需配置访问令牌与 Base URL。",
  },
  ppio: {
    name: "PPIO 派欧云",
    baseUrl: "https://api.ppinfra.com/v3/openai",
    endpoint: "/chat/completions",
    models: [{ value: "qwen2.5-72b-instruct", name: "Qwen2.5-72B" }],
    defaultModel: "qwen2.5-72b-instruct",
    keyLabel: "API Key",
    keyHint: "请输入 PPIO API Key",
    baseUrlHint: "API服务器地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/ppio.png",
    iconColor:
      "https://unpkg.com/@lobehub/icons-static-png@latest/light/ppio-color.png",
  },
  modelscope: {
    name: "ModelScope",
    baseUrl: "https://api-inference.modelscope.cn/v1",
    endpoint: "/chat/completions",
    models: [{ value: "qwen/Qwen-7B-Chat", name: "Qwen-7B" }],
    defaultModel: "qwen/Qwen-7B-Chat",
    keyLabel: "API Key",
    keyHint: "请输入 ModelScope API Key",
    baseUrlHint: "API服务器地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/modelscope.png",
    iconColor:
      "https://unpkg.com/@lobehub/icons-static-png@latest/light/modelscope-color.png",
  },
  oneapi: {
    name: "OneAPI",
    baseUrl: "https://api.oneapi.xyz/v1",
    endpoint: "/chat/completions",
    models: [{ value: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" }],
    defaultModel: "gpt-3.5-turbo",
    keyLabel: "API Key",
    keyHint: "请输入 OneAPI Key",
    baseUrlHint: "API服务器地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/openai.png",
  },
};

export const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
] as const;

export const FILE_SIZE_LIMIT = 50 * 1024 * 1024;

export const FUNCTION_INFO = {
  news: {
    icon: "📰",
    nameKey: "function.news.name",
    descriptionKey: "function.news.description",
  },
  data: {
    icon: "📊",
    nameKey: "function.data.name",
    descriptionKey: "function.data.description",
  },
  science: {
    icon: "🔬",
    nameKey: "function.science.name",
    descriptionKey: "function.science.description",
  },
  liberal: {
    icon: "📚",
    nameKey: "function.liberal.name",
    descriptionKey: "function.liberal.description",
  },
} as const;
