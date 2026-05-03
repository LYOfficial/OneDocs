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

const MODEL_TAGS = {
  flagship: { label: "旗舰", variant: "flagship" as const },
  affordable: { label: "平价", variant: "affordable" as const },
  free: { label: "免费", variant: "free" as const },
};

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
      { value: "gpt-5", name: "GPT-5", tags: [MODEL_TAGS.flagship] },
      { value: "gpt-5-chat", name: "GPT-5 Chat", tags: [MODEL_TAGS.flagship] },
      { value: "o3-pro", name: "o3 Pro", tags: [MODEL_TAGS.flagship] },
      { value: "gpt-5-mini", name: "GPT-5 mini", tags: [MODEL_TAGS.affordable] },
      { value: "o4-mini", name: "o4 mini", tags: [MODEL_TAGS.affordable] },
      { value: "gpt-5-nano", name: "GPT-5 nano", tags: [MODEL_TAGS.affordable] },
    ],
    defaultModel: "gpt-5",
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
      { value: "claude-opus-4.7", name: "Claude Opus 4.7", tags: [MODEL_TAGS.flagship] },
      { value: "claude-opus-4.6", name: "Claude Opus 4.6", tags: [MODEL_TAGS.flagship] },
      { value: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", tags: [MODEL_TAGS.affordable] },
      { value: "claude-sonnet-4.5", name: "Claude Sonnet 4.5", tags: [MODEL_TAGS.affordable] },
      { value: "claude-haiku-4.5", name: "Claude Haiku 4.5", tags: [MODEL_TAGS.affordable] },
    ],
    defaultModel: "claude-opus-4.7",
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
      { value: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", tags: [MODEL_TAGS.flagship] },
      { value: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tags: [MODEL_TAGS.flagship] },
      { value: "gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash Lite Preview", tags: [MODEL_TAGS.flagship] },
      { value: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tags: [MODEL_TAGS.affordable] },
      { value: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", tags: [MODEL_TAGS.affordable] },
      { value: "gemini-2.0-flash", name: "Gemini 2.0 Flash", tags: [MODEL_TAGS.affordable] },
    ],
    defaultModel: "gemini-3.1-pro-preview",
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
      { value: "kimi-k2.6", name: "Kimi K2.6", tags: [MODEL_TAGS.flagship] },
      { value: "kimi-k2-0905", name: "Kimi K2 0905", tags: [MODEL_TAGS.flagship] },
      { value: "kimi-k2", name: "Kimi K2", tags: [MODEL_TAGS.affordable] },
      { value: "moonshot-v1-128k", name: "Moonshot V1 128K", tags: [MODEL_TAGS.affordable] },
    ],
    defaultModel: "kimi-k2.6",
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
      { value: "glm-5.1", name: "GLM-5.1", tags: [MODEL_TAGS.flagship] },
      { value: "glm-5", name: "GLM-5", tags: [MODEL_TAGS.flagship] },
      { value: "glm-5v-turbo", name: "GLM-5V Turbo", tags: [MODEL_TAGS.flagship] },
      { value: "glm-5-turbo", name: "GLM-5 Turbo", tags: [MODEL_TAGS.affordable] },
      { value: "glm-4.7", name: "GLM-4.7", tags: [MODEL_TAGS.affordable] },
      { value: "glm-4.7-flash", name: "GLM-4.7 Flash", tags: [MODEL_TAGS.affordable] },
    ],
    defaultModel: "glm-5.1",
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
      { value: "deepseek-v4-pro", name: "DeepSeek V4 Pro", tags: [MODEL_TAGS.flagship] },
      { value: "deepseek-r1-0528", name: "DeepSeek R1 0528", tags: [MODEL_TAGS.flagship] },
      { value: "deepseek-v3.2", name: "DeepSeek V3.2", tags: [MODEL_TAGS.flagship] },
      { value: "deepseek-v4-flash", name: "DeepSeek V4 Flash", tags: [MODEL_TAGS.affordable] },
      { value: "deepseek-chat-v3.1", name: "DeepSeek Chat V3.1", tags: [MODEL_TAGS.affordable] },
      { value: "deepseek-reasoner", name: "DeepSeek Reasoner", tags: [MODEL_TAGS.affordable] },
    ],
    defaultModel: "deepseek-v4-pro",
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
      { value: "qwen3-coder:30b-a3b", name: "Qwen3 Coder 30B A3B", tags: [MODEL_TAGS.flagship] },
      { value: "llama3.3:70b-instruct", name: "Llama 3.3 70B Instruct", tags: [MODEL_TAGS.flagship] },
      { value: "deepseek-r1:70b", name: "DeepSeek-R1 70B", tags: [MODEL_TAGS.flagship] },
      { value: "qwen3:14b", name: "Qwen3 14B", tags: [MODEL_TAGS.affordable] },
      { value: "gemma3:27b", name: "Gemma 3 27B", tags: [MODEL_TAGS.affordable] },
      { value: "mistral-small:24b", name: "Mistral Small 24B", tags: [MODEL_TAGS.affordable] },
      { value: "qwen2.5:7b-instruct", name: "Qwen2.5 7B", tags: [MODEL_TAGS.free] },
      { value: "llama3.2:3b-instruct", name: "Llama 3.2 3B", tags: [MODEL_TAGS.free] },
      { value: "phi3.5", name: "Phi-3.5", tags: [MODEL_TAGS.free] },
    ],
    defaultModel: "qwen3-coder:30b-a3b",
    keyLabel: "API Key (可选)",
    keyHint: "本地部署通常不需要 API Key",
    baseUrlHint: "Ollama 服务地址",
    icon: "https://unpkg.com/@lobehub/icons-static-png@latest/light/ollama.png",
  },
  lmstudio: {
    name: "LM Studio",
    baseUrl: "http://localhost:1234/v1",
    endpoint: "/chat/completions",
    models: [
      { value: "qwen3-coder-30b-a3b-instruct", name: "Qwen3 Coder 30B A3B", tags: [MODEL_TAGS.flagship] },
      { value: "llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct", tags: [MODEL_TAGS.flagship] },
      { value: "deepseek-r1-70b", name: "DeepSeek-R1 70B", tags: [MODEL_TAGS.flagship] },
      { value: "qwen3-14b", name: "Qwen3 14B", tags: [MODEL_TAGS.affordable] },
      { value: "gemma-3-27b", name: "Gemma 3 27B", tags: [MODEL_TAGS.affordable] },
      { value: "mistral-small-24b", name: "Mistral Small 24B", tags: [MODEL_TAGS.affordable] },
      { value: "local-model", name: "Local Model", tags: [MODEL_TAGS.free] },
    ],
    defaultModel: "qwen3-coder-30b-a3b-instruct",
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
      { value: "gpt-5", name: "GPT-5", tags: [MODEL_TAGS.flagship] },
      { value: "claude-opus-4.7", name: "Claude Opus 4.7", tags: [MODEL_TAGS.flagship] },
      { value: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tags: [MODEL_TAGS.flagship] },
      { value: "gpt-5-mini", name: "GPT-5 mini", tags: [MODEL_TAGS.affordable] },
      { value: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", tags: [MODEL_TAGS.affordable] },
      { value: "deepseek-v4-flash", name: "DeepSeek V4 Flash", tags: [MODEL_TAGS.affordable] },
    ],
    defaultModel: "gpt-5",
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
      { value: "gpt-5", name: "GPT-5", tags: [MODEL_TAGS.flagship] },
      { value: "claude-opus-4.7", name: "Claude Opus 4.7", tags: [MODEL_TAGS.flagship] },
      { value: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tags: [MODEL_TAGS.flagship] },
      { value: "gpt-5-mini", name: "GPT-5 mini", tags: [MODEL_TAGS.affordable] },
      { value: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", tags: [MODEL_TAGS.affordable] },
      { value: "deepseek-v4-flash", name: "DeepSeek V4 Flash", tags: [MODEL_TAGS.affordable] },
    ],
    defaultModel: "gpt-5",
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
    models: [
      { value: "gpt-5", name: "GPT-5", tags: [MODEL_TAGS.flagship] },
      { value: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", tags: [MODEL_TAGS.flagship] },
      { value: "deepseek-v4-pro", name: "DeepSeek V4 Pro", tags: [MODEL_TAGS.flagship] },
      { value: "gpt-5-mini", name: "GPT-5 mini", tags: [MODEL_TAGS.affordable] },
      { value: "gpt-5-nano", name: "GPT-5 nano", tags: [MODEL_TAGS.affordable] },
      { value: "qwen3-coder", name: "Qwen3 Coder", tags: [MODEL_TAGS.affordable] },
    ],
    defaultModel: "gpt-5",
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
      { value: "deepseek-ai/DeepSeek-V4-Pro", name: "DeepSeek V4 Pro", tags: [MODEL_TAGS.flagship] },
      { value: "Qwen/Qwen3-Coder-480B-A35B-Instruct", name: "Qwen3 Coder 480B", tags: [MODEL_TAGS.flagship] },
      { value: "zai-org/GLM-5.1", name: "GLM-5.1", tags: [MODEL_TAGS.flagship] },
      { value: "deepseek-ai/DeepSeek-V4-Flash", name: "DeepSeek V4 Flash", tags: [MODEL_TAGS.affordable] },
      { value: "Qwen/Qwen3-30B-A3B-Instruct-2507", name: "Qwen3 30B A3B", tags: [MODEL_TAGS.affordable] },
      { value: "MiniMaxAI/MiniMax-M2.7", name: "MiniMax M2.7", tags: [MODEL_TAGS.affordable] },
    ],
    defaultModel: "deepseek-ai/DeepSeek-V4-Pro",
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
      { value: "ernie-4.5-300b-a47b", name: "ERNIE 4.5 300B A47B", tags: [MODEL_TAGS.flagship] },
      {
        value: "ernie-4.5-vl-424b-a47b",
        name: "ERNIE 4.5 VL 424B A47B",
        tags: [MODEL_TAGS.flagship],
      },
      { value: "ernie-4.5-21b-a3b-thinking", name: "ERNIE 4.5 21B Thinking", tags: [MODEL_TAGS.flagship] },
      { value: "ernie-4.5-21b-a3b", name: "ERNIE 4.5 21B A3B", tags: [MODEL_TAGS.affordable] },
      { value: "ernie-speed-128k", name: "ERNIE Speed 128K", tags: [MODEL_TAGS.affordable] },
    ],
    defaultModel: "ernie-4.5-300b-a47b",
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
    models: [
      { value: "deepseek-v4-pro", name: "DeepSeek V4 Pro", tags: [MODEL_TAGS.flagship] },
      { value: "qwen3-235b-a22b-instruct-2507", name: "Qwen3 235B A22B", tags: [MODEL_TAGS.flagship] },
      { value: "claude-opus-4.7", name: "Claude Opus 4.7", tags: [MODEL_TAGS.flagship] },
      { value: "deepseek-v4-flash", name: "DeepSeek V4 Flash", tags: [MODEL_TAGS.affordable] },
      { value: "qwen3-30b-a3b-instruct-2507", name: "Qwen3 30B A3B", tags: [MODEL_TAGS.affordable] },
      { value: "gpt-5-mini", name: "GPT-5 mini", tags: [MODEL_TAGS.affordable] },
    ],
    defaultModel: "deepseek-v4-pro",
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
    models: [
      { value: "qwen/Qwen3-Coder-480B-A35B-Instruct", name: "Qwen3 Coder 480B", tags: [MODEL_TAGS.flagship] },
      { value: "deepseek-ai/DeepSeek-V4-Pro", name: "DeepSeek V4 Pro", tags: [MODEL_TAGS.flagship] },
      { value: "zai-org/GLM-5", name: "GLM-5", tags: [MODEL_TAGS.flagship] },
      { value: "qwen/Qwen3-30B-A3B-Instruct-2507", name: "Qwen3 30B A3B", tags: [MODEL_TAGS.affordable] },
      { value: "deepseek-ai/DeepSeek-V4-Flash", name: "DeepSeek V4 Flash", tags: [MODEL_TAGS.affordable] },
      { value: "qwen/Qwen3-14B", name: "Qwen3 14B", tags: [MODEL_TAGS.affordable] },
    ],
    defaultModel: "qwen/Qwen3-Coder-480B-A35B-Instruct",
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
    models: [
      { value: "gpt-5", name: "GPT-5", tags: [MODEL_TAGS.flagship] },
      { value: "claude-opus-4.7", name: "Claude Opus 4.7", tags: [MODEL_TAGS.flagship] },
      { value: "deepseek-v4-pro", name: "DeepSeek V4 Pro", tags: [MODEL_TAGS.flagship] },
      { value: "gpt-5-mini", name: "GPT-5 mini", tags: [MODEL_TAGS.affordable] },
      { value: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", tags: [MODEL_TAGS.affordable] },
      { value: "deepseek-v4-flash", name: "DeepSeek V4 Flash", tags: [MODEL_TAGS.affordable] },
    ],
    defaultModel: "gpt-5",
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
