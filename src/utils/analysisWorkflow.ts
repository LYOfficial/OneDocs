import type {
  AnalysisWorkflowPlan,
  ChunkPlan,
  DocumentAnalysisBundle,
  DocumentImageAsset,
  SupportedFileType,
} from "@/types";

const PAGE_IMAGE_TOKEN_PREFIX = "[[PAGE_IMAGE_";
const DEFAULT_PAGE_CHUNK_SIZE = 4;
const DEFAULT_CHAR_CHUNK_SIZE = 7000;

export const WORKFLOW_PLANNER_MODEL = "openai/gpt-oss-120b:free";
export const WORKFLOW_COMPOSER_MODEL = "minimax/minimax-m2.5:free";

export const stripMarkdownFence = (text: string): string => {
  let current = text.trim();
  const fenceRegex = /^```[a-zA-Z0-9_-]*\s+([\s\S]*?)\s*```\s*$/;

  while (true) {
    const match = current.match(fenceRegex);
    if (!match) break;
    current = match[1].trim();
  }

  return current;
};

export const stripLeadingMarkers = (text: string): string => {
  const trimmed = text.trimStart();
  return trimmed.replace(/^【?格式修正内容】?/i, "").trimStart();
};

export const parseWorkflowPlan = (
  content: string,
  fallbackPlan: AnalysisWorkflowPlan,
): AnalysisWorkflowPlan => {
  const cleaned = stripMarkdownFence(content).trim();

  if (!cleaned) {
    return fallbackPlan;
  }

  try {
    const parsed = JSON.parse(cleaned) as Partial<AnalysisWorkflowPlan>;
    return {
      ...fallbackPlan,
      ...parsed,
      chunks:
        Array.isArray(parsed.chunks) && parsed.chunks.length > 0
          ? parsed.chunks.map((chunk, index) => ({
              id: chunk.id || `chunk_${index + 1}`,
              title: chunk.title || `第 ${index + 1} 段`,
              pageStart: Number(chunk.pageStart) || fallbackPlan.chunks[index]?.pageStart || 1,
              pageEnd: Number(chunk.pageEnd) || fallbackPlan.chunks[index]?.pageEnd || 1,
              summaryFocus: chunk.summaryFocus || fallbackPlan.chunks[index]?.summaryFocus,
              imagePages: Array.isArray(chunk.imagePages)
                ? chunk.imagePages.map((page) => Number(page)).filter(Boolean)
                : fallbackPlan.chunks[index]?.imagePages,
            }))
          : fallbackPlan.chunks,
      imagePlacementHints: Array.isArray(parsed.imagePlacementHints)
        ? parsed.imagePlacementHints
            .map((hint) => ({
              pageNumber: Number(hint.pageNumber) || 0,
              reason: hint.reason || "",
              preferredSection: hint.preferredSection,
            }))
            .filter((hint) => hint.pageNumber > 0)
        : fallbackPlan.imagePlacementHints,
      finishingNotes:
        Array.isArray(parsed.finishingNotes) && parsed.finishingNotes.length > 0
          ? parsed.finishingNotes.map((item) => String(item))
          : fallbackPlan.finishingNotes,
    };
  } catch (error) {
    console.warn("解析工作流计划失败，回退到本地计划", error);
    return fallbackPlan;
  }
};

export const buildLocalWorkflowPlan = (
  bundle: DocumentAnalysisBundle,
  fileName: string,
  fileType: SupportedFileType,
): AnalysisWorkflowPlan => {
  const chunks = buildChunkPlan(bundle);
  const imagePlacementHints = bundle.images.map((image) => ({
    pageNumber: image.pageNumber,
    reason: `第 ${image.pageNumber} 页存在页面图像素材，适合在对应文字说明附近插入。`,
    preferredSection: inferPreferredSection(bundle.pageTexts[image.pageNumber - 1] || ""),
  }));

  return {
    fileName,
    fileType,
    overview: bundle.pageCount > 0
      ? `文档共 ${bundle.pageCount} 页，已按页切分为 ${chunks.length} 个分析段。`
      : "文档已按字符长度切分为分析段。",
    chunks,
    imagePlacementHints,
    finishingNotes: [
      "最终结果必须保留原文中的关键定义、公式、例题与结论。",
      "如果存在图片素材，应优先插入到对应页面内容附近。",
      "不要遗漏章节标题、图表说明和例题推导过程。",
    ],
  };
};

export const buildChunkPlan = (
  bundle: DocumentAnalysisBundle,
): ChunkPlan[] => {
  if (bundle.pageTexts.length === 0) {
    return buildTextFallbackChunkPlan(bundle.text);
  }

  const chunks: ChunkPlan[] = [];
  let startPage = 1;
  let currentLength = 0;

  for (let pageIndex = 0; pageIndex < bundle.pageTexts.length; pageIndex++) {
    const pageText = bundle.pageTexts[pageIndex] || "";
    currentLength += pageText.length;

    const isChunkBoundary =
      (pageIndex + 1 - startPage + 1) >= DEFAULT_PAGE_CHUNK_SIZE ||
      currentLength >= DEFAULT_CHAR_CHUNK_SIZE ||
      pageIndex === bundle.pageTexts.length - 1;

    if (!isChunkBoundary) {
      continue;
    }

    const pageStart = startPage;
    const pageEnd = pageIndex + 1;
    const chunkText = bundle.pageTexts.slice(pageStart - 1, pageEnd).join("\n\n");
    const chunkImages = bundle.images
      .filter((image) => image.pageNumber >= pageStart && image.pageNumber <= pageEnd)
      .map((image) => image.pageNumber);

    chunks.push({
      id: `chunk_${chunks.length + 1}`,
      title: `第 ${chunks.length + 1} 段`,
      pageStart,
      pageEnd,
      summaryFocus: inferChunkFocus(chunkText),
      imagePages: chunkImages.length > 0 ? chunkImages : undefined,
    });

    startPage = pageEnd + 1;
    currentLength = 0;
  }

  return chunks.length > 0 ? chunks : buildTextFallbackChunkPlan(bundle.text);
};

export const buildChunkPrompt = ({
  sourcePrompt,
  workflowPlan,
  chunk,
  chunkText,
  fileName,
  pageImageTokens,
  includeImages = true,
}: {
  sourcePrompt: string;
  workflowPlan: AnalysisWorkflowPlan;
  chunk: ChunkPlan;
  chunkText: string;
  fileName: string;
  pageImageTokens: string[];
  includeImages?: boolean;
}): string => {
  const imageTokenHint = includeImages
    ? pageImageTokens.length > 0
        ? `\n\n本段对应图片占位符候选：${pageImageTokens.join("、")}。请在合适位置保留这些占位符，不要自行编造图片。`
        : "\n\n本段没有可用图片素材。"
    : "";

  return [
    sourcePrompt.trim(),
    "",
    "# 分段写作任务",
    `- 文件名：${fileName}`,
    `- 当前段：${chunk.title}`,
    `- 页码范围：第 ${chunk.pageStart} 页 - 第 ${chunk.pageEnd} 页`,
    chunk.summaryFocus ? `- 当前段关注点：${chunk.summaryFocus}` : "",
    `- 总体计划：${workflowPlan.overview}`,
    "",
    "## 任务要求",
    "- 你只负责当前页码范围内的内容，不要输出完整总标题。",
    "- 保留原文的专业术语、公式、定理、图表说明和例题步骤。",
    "- 如果发现适合插图的位置，请保留对应图片占位符。",
    "- 不要丢失原文的重要细节，不要把多个概念合并成一段空泛总结。",
    imageTokenHint,
    "",
    "## 当前页内容",
    chunkText.trim(),
  ]
    .filter(Boolean)
    .join("\n");
};

export const buildComposerPrompt = ({
  sourcePrompt,
  workflowPlan,
  fragments,
  fileName,
  imageManifest,
  includeImages = true,
}: {
  sourcePrompt: string;
  workflowPlan: AnalysisWorkflowPlan;
  fragments: string[];
  fileName: string;
  imageManifest: DocumentImageAsset[];
  includeImages?: boolean;
}): string => {
  const imageLines = includeImages
    ? imageManifest.length > 0
        ? imageManifest
            .map((image) => {
              const token = getImageToken(image.pageNumber);
              const pathHint = image.localPath || image.dataUrl || "";
              return `${token} => ${pathHint}`;
            })
            .join("\n")
        : "无可用图片素材。"
    : "";

  return [
    sourcePrompt.trim(),
    "",
    "# 最终整合任务",
    `- 文件名：${fileName}`,
    `- 工作流概览：${workflowPlan.overview}`,
    "",
    "## 任务说明",
    "- 你需要把下方所有分段结果拼接成完整、连续、无重复的最终文档。",
    "- 必须保留原有知识顺序，并补齐基础知识与典型例题的整体结构。",
    "- 对于图片占位符，必须保留原占位符文本，不要替换成其它文字。",
    "- 输出最终 Markdown，不要输出分析过程。",
    "",
    includeImages ? "## 图片映射" : "",
    includeImages ? imageLines : "",
    "",
    "## 分段结果",
    fragments.join("\n\n---\n\n"),
  ]
    .filter(Boolean)
    .join("\n");
};

export const applyImagePlacements = (
  markdown: string,
  images: DocumentImageAsset[],
): string => {
  if (!markdown || images.length === 0) {
    return markdown;
  }

  let nextMarkdown = markdown;

  for (const image of images) {
    const token = getImageToken(image.pageNumber);
    const imageTarget = image.localPath || image.dataUrl || "";
    if (!imageTarget) {
      continue;
    }

    const imageMarkdown = `![第 ${image.pageNumber} 页图片](${normalizeMarkdownPath(imageTarget)})`;
    if (nextMarkdown.includes(token)) {
      nextMarkdown = nextMarkdown.split(token).join(imageMarkdown);
    }
  }

  if (nextMarkdown === markdown) {
    const fallbackImages = images
      .filter((image) => image.localPath || image.dataUrl)
      .map((image) => `![第 ${image.pageNumber} 页图片](${normalizeMarkdownPath(image.localPath || image.dataUrl || "")})`)
      .join("\n\n");

    if (fallbackImages) {
      return `${markdown}\n\n## 附加图片素材\n\n${fallbackImages}`;
    }
  }

  return nextMarkdown;
};

export const buildImageTokenList = (images: DocumentImageAsset[]): string[] => {
  return images.map((image) => getImageToken(image.pageNumber));
};

export const getImageToken = (pageNumber: number): string => {
  return `${PAGE_IMAGE_TOKEN_PREFIX}${String(pageNumber).padStart(3, "0")}]]`;
};

export const splitTextIntoChunks = (text: string, maxChunkLength = DEFAULT_CHAR_CHUNK_SIZE): string[] => {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  if (normalized.length <= maxChunkLength) {
    return [normalized];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + maxChunkLength, normalized.length);
    if (end < normalized.length) {
      const nextBreak = normalized.lastIndexOf("\n\n", end);
      if (nextBreak > start + Math.floor(maxChunkLength * 0.5)) {
        end = nextBreak;
      }
    }

    const slice = normalized.slice(start, end).trim();
    if (slice) {
      chunks.push(slice);
    }

    start = end;
  }

  return chunks;
};

const buildTextFallbackChunkPlan = (text: string): ChunkPlan[] => {
  const chunks = splitTextIntoChunks(text, DEFAULT_CHAR_CHUNK_SIZE);
  return chunks.map((chunkText, index) => ({
    id: `chunk_${index + 1}`,
    title: `第 ${index + 1} 段`,
    pageStart: index + 1,
    pageEnd: index + 1,
    summaryFocus: inferChunkFocus(chunkText),
  }));
};


const inferPreferredSection = (text: string): string => {
  if (/例题|习题|答案/.test(text)) {
    return "典型例题";
  }

  return "基础知识";
};

const normalizeMarkdownPath = (pathValue: string): string => {
  return pathValue.replace(/\\/g, "/");
};

const inferChunkFocus = (text: string): string => {
  if (/例题|例 题|习题/.test(text)) {
    return "例题与解题步骤";
  }

  if (/定义|概念|原理|定理|公式/.test(text)) {
    return "核心概念与公式";
  }

  if (/图|表|曲线|流程/.test(text)) {
    return "图表与结构说明";
  }

  return "知识要点梳理";
};
