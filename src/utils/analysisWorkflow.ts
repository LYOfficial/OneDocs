import { useAppStore } from "@/store/useAppStore";
import { APIService } from "@/services/api";
import type {
  AnalysisWorkflowPlan,
  ChunkPlan,
  DocumentAnalysisBundle,
  DocumentImageAsset,
  PageImageMap,
  SupportedFileType,
} from "@/types";

const pushDevLog = (
  level: "info" | "warn" | "error",
  scope: string,
  message: string,
  payload?: unknown,
) => {
  const { addLog } = useAppStore.getState();
  if (addLog) {
    addLog({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      level,
      scope,
      message,
      payload,
    });
  }
};

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
    pushDevLog("info", "image-insert", "applyImagePlacements: 无图片需要插入或 Markdown 为空", {
      hasMarkdown: Boolean(markdown),
      imageCount: images.length,
    });
    return markdown;
  }

  pushDevLog("info", "image-insert", "applyImagePlacements: 开始替换图片占位符", {
    imageCount: images.length,
    images: images.map(img => ({ page: img.pageNumber, name: img.fileName, path: img.localPath })),
  });

  let nextMarkdown = markdown;
  const usedImageKeys = new Set<string>();
  let replacedCount = 0;

  for (const image of images) {
    const token = getImageToken(image.pageNumber);
    const imageTarget = image.localPath || image.dataUrl || "";
    if (!imageTarget) {
      continue;
    }

    const imageMarkdown = `![第 ${image.pageNumber} 页图片](${normalizeMarkdownPath(imageTarget)})`;
    if (nextMarkdown.includes(token)) {
      nextMarkdown = nextMarkdown.split(token).join(imageMarkdown);
      usedImageKeys.add(imageTarget);
      replacedCount++;
    }
  }

  // Single unified pass: replace all placeholder patterns with extracted images
  // Patterns handled (in priority order):
  //   1. [[PAGE_IMAGE_NNN]] tokens
  //   2. ![alt](placeholder) — markdown image with placeholder URL
  //   3. [图片：xxx] — text-only placeholders
  //   4. ![alt] — bare image without URL
  const allRemainingImages = images.filter((image) => {
    const target = image.localPath || image.dataUrl || "";
    return target && !usedImageKeys.has(target);
  });

  if (allRemainingImages.length > 0) {
    let imageIndex = 0;

    const getNextImage = (): string | null => {
      while (imageIndex < allRemainingImages.length) {
        const image = allRemainingImages[imageIndex];
        imageIndex++;
        const imageTarget = image.localPath || image.dataUrl || "";
        if (!imageTarget) continue;
        usedImageKeys.add(imageTarget);
        return normalizeMarkdownPath(imageTarget);
      }
      return null;
    };

    // Pass 1: Replace ![alt](placeholder) patterns (must come before text-only)
    // This prevents double-replacement where [图片：xxx] → ![图片：xxx](path) then ![图片：xxx](path) → !!![...]
    const mdImageRegex = /!\[([^\]]*?)\]\(([^)]*)\)/g;
    nextMarkdown = nextMarkdown.replace(mdImageRegex, (match, alt, url) => {
      const trimmedUrl = url.trim();
      const looksPlaceholder =
        !trimmedUrl ||
        /^placeholder$/i.test(trimmedUrl) ||
        /^image_placeholder$/i.test(trimmedUrl) ||
        /图片占位符/.test(trimmedUrl) ||
        /^占位$/.test(trimmedUrl) ||
        /^[a-z_]*placeholder[a-z_]*$/i.test(trimmedUrl) ||
        /^image[_\-]?\d+\.[a-z]+$/i.test(trimmedUrl);
      if (!looksPlaceholder) {
        return match;
      }
      const imgPath = getNextImage();
      if (imgPath) replacedCount++;
      return imgPath ? `![${alt.trim()}](${imgPath})` : match;
    });

    // Pass 2: Replace text-only placeholders like [图片：xxx]
    const textPlaceholderRegex = /\[(图片|图|示意图|照片|插图)[:：\s][^\]]+\]/g;
    nextMarkdown = nextMarkdown.replace(textPlaceholderRegex, (match) => {
      const imgPath = getNextImage();
      if (imgPath) replacedCount++;
      return imgPath ? `![${match.slice(1, -1)}](${imgPath})` : match;
    });

    // Pass 3: Replace bare ![alt] without URL
    const bareImageRegex = /!\[([^\]]+)\](?!\()/g;
    nextMarkdown = nextMarkdown.replace(bareImageRegex, (match, alt) => {
      const imgPath = getNextImage();
      if (imgPath) replacedCount++;
      return imgPath ? `![${alt.trim()}](${imgPath})` : match;
    });
  }

  pushDevLog("info", "image-insert", `applyImagePlacements 完成: 替换了 ${replacedCount} 处图片引用`, {
    replacedCount,
    usedImageCount: usedImageKeys.size,
    totalImages: images.length,
  });

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
  // Only normalize backslashes to forward slashes for Markdown compatibility.
  // Do NOT convert to Tauri asset protocol URLs here — that is the
  // responsibility of MarkdownRenderer.rewriteLocalImageSources at render time.
  // Keeping real local paths in the Markdown source ensures:
  //   1. Source view shows readable local file paths
  //   2. Render view can properly convert them via convertFileSrc
  return pathValue.replace(/\\/g, "/");
};

/**
 * Insert images into markdown using LLM-based image-text matching.
 *
 * Strategy:
 * 1. Find which images are already referenced in the markdown (skip those)
 * 2. Build a prompt with the markdown content and the page→image mapping
 * 3. Ask the LLM to determine where each image should be inserted
 * 4. Apply the LLM's placement decisions
 *
 * If LLM matching fails, fall back to page-context-based insertion.
 */
export const insertImagesByPageContext = async (
  markdown: string,
  images: DocumentImageAsset[],
  pageImageMap?: PageImageMap[],
  llmContext?: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
  },
): Promise<string> => {
  if (!markdown || images.length === 0) {
    pushDevLog("info", "image-insert", "insertImagesByPageContext: 无图片需要插入或 Markdown 为空", {
      hasMarkdown: Boolean(markdown),
      imageCount: images.length,
    });
    return markdown;
  }

  // Find images already referenced in the markdown
  const referencedPaths = new Set<string>();
  const imgRefRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  let refMatch;
  while ((refMatch = imgRefRegex.exec(markdown)) !== null) {
    referencedPaths.add(refMatch[1]);
  }

  // Filter to unreferenced images
  const unreferencedImages = images.filter((img) => {
    const target = img.localPath || img.dataUrl || "";
    if (!target) return false;
    const normalized = normalizeMarkdownPath(target);
    return !referencedPaths.has(normalized) && !referencedPaths.has(target);
  });

  if (unreferencedImages.length === 0) {
    pushDevLog("info", "image-insert", "insertImagesByPageContext: 所有图片已在 Markdown 中引用，无需额外插入");
    return markdown;
  }

  pushDevLog("info", "image-insert", `insertImagesByPageContext: 需要插入 ${unreferencedImages.length} 张未引用图片`, {
    unreferencedCount: unreferencedImages.length,
    unreferencedImages: unreferencedImages.map(img => ({ page: img.pageNumber, name: img.fileName, path: img.localPath })),
  });

  // Try LLM-based matching if context is provided
  if (llmContext && pageImageMap && pageImageMap.length > 0) {
    try {
      const llmResult = await matchImagesWithLLM(markdown, unreferencedImages, pageImageMap, llmContext);
      if (llmResult) {
        pushDevLog("info", "image-insert", `LLM 图文匹配成功，已插入 ${unreferencedImages.length} 张图片`);
        return llmResult;
      }
    } catch (error: any) {
      pushDevLog("warn", "image-insert", `LLM 图文匹配失败，回退到规则匹配: ${error?.message || String(error)}`);
    }
  }

  // Fallback: page-context-based insertion (no LLM)
  return insertImagesByPageContextFallback(markdown, unreferencedImages);
};

/**
 * Use LLM to match images with their corresponding text sections.
 *
 * The LLM receives:
 * - The current markdown content (with section headings)
 * - A list of images with their page numbers and file names
 * - The page→image mapping with text snippets
 *
 * The LLM returns a JSON mapping of image file names to section headings
 * where each image should be inserted.
 */
async function matchImagesWithLLM(
  markdown: string,
  unreferencedImages: DocumentImageAsset[],
  pageImageMap: PageImageMap[],
  llmContext: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
  },
): Promise<string | null> {
  // Build image info list for the prompt
  const imageInfoList = unreferencedImages.map(img => {
    const pageEntry = pageImageMap.find(p => p.pageNumber === img.pageNumber);
    const snippet = pageEntry?.textSnippet || "";
    return `- 文件: ${img.fileName} (第${img.pageNumber}页) 上下文: "${snippet.substring(0, 100)}"`;
  }).join("\n");

  // Build section headings list for the prompt
  const headingRegex = /^(#{1,3})\s+(.+)/gm;
  const sections: string[] = [];
  let headingMatch;
  while ((headingMatch = headingRegex.exec(markdown)) !== null) {
    sections.push(`  - ${headingMatch[1]} ${headingMatch[2]}`);
  }
  const sectionList = sections.length > 0 ? sections.join("\n") : "  (无标题)";

  // Build page-image mapping for context
  const pageMapStr = pageImageMap
    .filter(p => p.imageFileNames.length > 0)
    .map(p => `第${p.pageNumber}页: ${p.imageFileNames.join(", ")} | 文本摘要: "${p.textSnippet.substring(0, 80)}"`)
    .join("\n");

  const prompt = `你是一个文档图文匹配助手。你需要根据图片所在页码和该页的文本上下文，将图片插入到文档中最合适的章节位置。

## 文档章节结构
${sectionList}

## 待插入图片信息
${imageInfoList}

## 页码-图片-文本映射
${pageMapStr}

## 任务要求
1. 根据图片所在页码的文本上下文，判断该图片最可能对应文档中的哪个章节
2. 同一页的多张图片应插入到同一个章节
3. 图片应插入到相关文字说明之后，而不是章节开头
4. 返回JSON格式：{ "placements": [{ "fileName": "xxx.jpg", "afterText": "该图片应插入在此文本之后（取原文中一段独特的文字）" }] }
5. afterText 必须是原文中实际存在的一段文字（10-50字），用于定位插入点
6. 只返回JSON，不要返回其他内容`;

  const response = await APIService.callAIWithProvider(
    llmContext.provider,
    "你是一个文档图文匹配助手，只返回JSON格式的匹配结果。",
    prompt,
    {
      apiKey: llmContext.apiKey,
      baseUrl: llmContext.baseUrl,
      model: llmContext.model,
    },
  );

  // Parse the LLM response
  const cleaned = stripMarkdownFence(response).trim();
  let placements: Array<{ fileName: string; afterText: string }>;

  try {
    const parsed = JSON.parse(cleaned);
    placements = parsed.placements || [];
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = cleaned.match(/\{[\s\S]*"placements"[\s\S]*\}/);
    if (!jsonMatch) {
      pushDevLog("warn", "image-insert", "LLM 返回的JSON无法解析");
      return null;
    }
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      placements = parsed.placements || [];
    } catch {
      pushDevLog("warn", "image-insert", "LLM 返回的JSON格式错误");
      return null;
    }
  }

  if (placements.length === 0) {
    pushDevLog("warn", "image-insert", "LLM 未返回任何图片匹配结果");
    return null;
  }

  // Apply placements
  let result = markdown;
  let insertedCount = 0;

  for (const placement of placements) {
    const image = unreferencedImages.find(img => img.fileName === placement.fileName);
    if (!image) continue;

    const imageTarget = image.localPath || image.dataUrl || "";
    if (!imageTarget) continue;

    const imageMarkdown = `\n![第 ${image.pageNumber} 页图片](${normalizeMarkdownPath(imageTarget)})\n`;
    const afterText = placement.afterText.trim();

    if (afterText && result.includes(afterText)) {
      // Insert after the specified text
      const idx = result.indexOf(afterText);
      const insertPos = idx + afterText.length;
      result = result.substring(0, insertPos) + imageMarkdown + result.substring(insertPos);
      insertedCount++;
    } else {
      // Fallback: try to find a partial match
      const partialText = afterText.substring(0, Math.min(20, afterText.length));
      if (partialText && result.includes(partialText)) {
        const idx = result.indexOf(partialText);
        const insertPos = idx + partialText.length;
        result = result.substring(0, insertPos) + imageMarkdown + result.substring(insertPos);
        insertedCount++;
      }
    }
  }

  pushDevLog("info", "image-insert", `LLM 图文匹配: 请求 ${placements.length} 处，成功插入 ${insertedCount} 处`, {
    requestedPlacements: placements.length,
    insertedCount,
  });

  return insertedCount > 0 ? result : null;
}

/**
 * Fallback: Insert images by page context (rule-based, no LLM).
 * Used when LLM matching is unavailable or fails.
 */
function insertImagesByPageContextFallback(
  markdown: string,
  unreferencedImages: DocumentImageAsset[],
): string {
  const lines = markdown.split("\n");

  // Build section boundaries
  interface Section {
    headingLine: number;
    endLine: number;
    level: number;
    title: string;
    pageHints: number[];
  }

  const sections: Section[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(headingRegex);
    if (match) {
      sections.push({
        headingLine: i,
        endLine: lines.length,
        level: match[1].length,
        title: match[2],
        pageHints: [],
      });
    }
  }

  for (let i = 0; i < sections.length; i++) {
    sections[i].endLine = i + 1 < sections.length ? sections[i + 1].headingLine : lines.length;
  }

  // Scan each section for page number references
  for (const section of sections) {
    const sectionText = lines.slice(section.headingLine, section.endLine).join(" ");
    const pageRefRegex = /第\s*(\d+)\s*页/g;
    let pageRefMatch;
    while ((pageRefMatch = pageRefRegex.exec(sectionText)) !== null) {
      section.pageHints.push(parseInt(pageRefMatch[1], 10));
    }
  }

  const insertions: { lineIndex: number; imageMarkdown: string; pageNum: number }[] = [];

  for (const image of unreferencedImages) {
    const imageTarget = image.localPath || image.dataUrl || "";
    if (!imageTarget) continue;

    const imageMarkdown = `\n![第 ${image.pageNumber} 页图片](${normalizeMarkdownPath(imageTarget)})\n`;
    const pageNum = image.pageNumber;

    let insertAt = -1;

    // Strategy 1: Find a section that explicitly mentions this page number
    for (const section of sections) {
      if (section.pageHints.includes(pageNum)) {
        insertAt = section.endLine;
        break;
      }
    }

    // Strategy 2: Find the section whose page range covers this image's page
    if (insertAt === -1 && sections.length > 0) {
      const allPageHints = sections.flatMap(s => s.pageHints.map(p => ({ page: p, sectionIdx: sections.indexOf(s) })));
      allPageHints.sort((a, b) => a.page - b.page);

      for (const hint of allPageHints) {
        if (hint.page <= pageNum) {
          insertAt = sections[hint.sectionIdx].endLine;
        } else {
          break;
        }
      }
    }

    // Strategy 3: Distribute proportionally
    if (insertAt === -1 && sections.length > 0) {
      const maxPage = Math.max(...unreferencedImages.map(img => img.pageNumber), 1);
      const targetSectionIdx = Math.min(
        Math.floor((pageNum / maxPage) * sections.length),
        sections.length - 1,
      );
      insertAt = sections[targetSectionIdx].endLine;
    }

    if (insertAt === -1) {
      insertAt = lines.length;
    }

    insertions.push({ lineIndex: insertAt, imageMarkdown, pageNum });
  }

  insertions.sort((a, b) => b.lineIndex - a.lineIndex);

  for (const { lineIndex, imageMarkdown } of insertions) {
    lines.splice(lineIndex, 0, imageMarkdown);
  }

  pushDevLog("info", "image-insert", `规则匹配插入完成: ${insertions.length} 张图片`, {
    insertedCount: insertions.length,
  });

  return lines.join("\n");
}

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
