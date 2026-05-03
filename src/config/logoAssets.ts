import openaiLogo from '@lobehub/icons-static-png/light/openai.png';
import anthropicLogo from '@lobehub/icons-static-png/light/anthropic.png';
import geminiLogo from '@lobehub/icons-static-png/light/gemini.png';
import openrouterLogo from '@lobehub/icons-static-png/light/openrouter.png';
import moonshotLogo from '@lobehub/icons-static-png/light/moonshot.png';
import zhipuLogo from '@lobehub/icons-static-png/light/zhipu.png';
import deepseekLogo from '@lobehub/icons-static-png/light/deepseek.png';
import ollamaLogo from '@lobehub/icons-static-png/light/ollama.png';
import lmStudioLogo from '@lobehub/icons-static-png/light/lmstudio.png';
import ai302Logo from '@lobehub/icons-static-png/light/ai302.png';
import siliconCloudLogo from '@lobehub/icons-static-png/light/siliconcloud.png';
import wenxinLogo from '@lobehub/icons-static-png/light/wenxin.png';
import ppioLogo from '@lobehub/icons-static-png/light/ppio.png';
import modelScopeLogo from '@lobehub/icons-static-png/light/modelscope.png';
import qwenLogo from '@lobehub/icons-static-png/light/qwen.png';
import metaLogo from '@lobehub/icons-static-png/light/meta.png';
import minimaxLogo from '@lobehub/icons-static-png/light/minimax.png';
import alibabaLogo from '@lobehub/icons-static-png/light/alibaba.png';

export const PROVIDER_LOGOS = {
  openai: openaiLogo,
  anthropic: anthropicLogo,
  gemini: geminiLogo,
  openrouter: openrouterLogo,
  moonshot: moonshotLogo,
  glm: zhipuLogo,
  deepseek: deepseekLogo,
  ollama: ollamaLogo,
  lmstudio: lmStudioLogo,
  comp_share: openaiLogo,
  '302_ai': ai302Logo,
  pony: openaiLogo,
  siliconflow: siliconCloudLogo,
  xinghe: wenxinLogo,
  ppio: ppioLogo,
  modelscope: modelScopeLogo,
  oneapi: openaiLogo,
} as const;

export const MODEL_SOURCE_LOGOS = {
  openai: openaiLogo,
  qwen: qwenLogo,
  'z-ai': zhipuLogo,
  google: geminiLogo,
  minimax: minimaxLogo,
  'meta-llama': metaLogo,
  openrouter: openrouterLogo,
  moonshotai: moonshotLogo,
  anthropic: anthropicLogo,
  deepseek: deepseekLogo,
  alibaba: alibabaLogo,
} as const;
