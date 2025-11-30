import { ModelProviders, CustomProviderConfig } from '@/types';

// 创建自定义模型配置的辅助函数
export const createCustomProvider = (
  name: string,
  baseUrl: string,
  model: string
): CustomProviderConfig => ({
  id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name,
  baseUrl,
  model,
  isCustom: true,
});

export const MODEL_PROVIDERS: ModelProviders = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    endpoint: '/chat/completions',
    models: [
      { value: 'gpt-4o', name: 'GPT-4o' },
      { value: 'gpt-4o-mini', name: 'GPT-4o-mini' },
      { value: 'gpt-4', name: 'GPT-4' },
      { value: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
    defaultModel: 'gpt-4o',
    keyLabel: 'OpenAI API Key',
    keyHint: '需要填入有效的OpenAI API密钥方可使用',
    baseUrlHint: 'API服务器地址，默认为OpenAI官方地址',
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    endpoint: '/chat/completions',
    models: [
      { value: 'deepseek-chat', name: 'DeepSeek-Chat (推荐)' },
      { value: 'deepseek-reasoner', name: 'DeepSeek-Reasoner (推理模型)' },
    ],
    defaultModel: 'deepseek-chat',
    keyLabel: 'DeepSeek API Key',
    keyHint: '需要填入有效的DeepSeek API密钥方可使用，请确保账户余额充足',
    baseUrlHint: 'DeepSeek API服务器地址',
  },
  glm: {
    name: '智谱GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    endpoint: '/chat/completions',
    models: [
      { value: 'glm-4-flashx', name: 'GLM-4-FlashX (推荐)' },
      { value: 'glm-4-plus', name: 'GLM-4-Plus' },
      { value: 'glm-4-0520', name: 'GLM-4-0520' },
      { value: 'glm-4-long', name: 'GLM-4-Long' },
      { value: 'glm-4-flash', name: 'GLM-4-Flash' },
      { value: 'glm-4v-plus', name: 'GLM-4V-Plus (多模态)' },
    ],
    defaultModel: 'glm-4-flashx',
    keyLabel: '智谱 API Key',
    keyHint: '需要填入有效的智谱API密钥方可使用',
    baseUrlHint: '智谱GLM API服务器地址',
  },
  siliconflow: {
    name: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    endpoint: '/chat/completions',
    models: [
      { value: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek-V3' },
      { value: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek-R1' },
      { value: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5-72B' },
      { value: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B' },
      { value: 'Qwen/QwQ-32B', name: 'QwQ-32B' },
      { value: 'THUDM/glm-4-9b-chat', name: 'GLM-4-9B' },
    ],
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    keyLabel: 'SiliconFlow API Key',
    keyHint: '需要填入有效的硅基流动API密钥方可使用',
    baseUrlHint: '硅基流动 API服务器地址',
  },
};

export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
] as const;

export const FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB

export const FUNCTION_INFO = {
  news: {
    icon: '📰',
    name: '要闻概览',
    description: '新闻要点梳理',
  },
  data: {
    icon: '📊',
    name: '罗森析数',
    description: '数据内容分析',
  },
  science: {
    icon: '🔬',
    name: '理工速知',
    description: '理工课件整理',
  },
  liberal: {
    icon: '📚',
    name: '文采丰呈',
    description: '文科课件整理',
  },
} as const;
