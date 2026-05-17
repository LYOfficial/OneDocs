import { useAppStore } from "@/store/useAppStore";
import { APIService } from "@/services/api";
import { DocumentProcessor } from "@/utils/documentProcessor";
import { PROMPT_CONFIGS } from "@/config/prompts";
import { MODEL_PROVIDERS } from "@/config/providers";
import { useToast } from "@/components/Toast";
import {
  applyImagePlacements,
  insertImagesByPageContext,
  stripLeadingMarkers,
  stripMarkdownFence,
} from "@/utils/analysisWorkflow";
import { chunkText } from "@/services/rag/textChunking";
import {
  EMBEDDING_MODEL,
  generateEmbeddingsBatch,
  getFreeEmbeddingUses,
  hasUserEmbeddingToken,
  isEmbeddingAvailable,
} from "@/services/rag/embeddingService";
import type { AIProvider, DocumentAnalysisBundle } from "@/types";
import { writeTextFile, mkdir } from "@tauri-apps/plugin-fs";

const SCIENCE_FORMAT_REVIEW_PROMPT = `你是中文学术排版审校助手，只负责在不改变含义的前提下修正格式。必须遵循：
- 仅处理理工速知的输出内容，保持全中文。
- 一级标题只有 "# 基础知识" 与 "# 典型例题"。
- 二级标题按数字递增（如 ## 1. xxx、## 2. xxx），三级标题使用 1.1、1.2 依次递进。
- 复杂公式使用单行 $$公式$$ 包裹，禁止跨行的 $\n公式\n$；行内简单变量用 $x$ 形式。
- 重要概念需加粗，例题结论用 **【最终结论】结论内容** 高亮。
- 保留所有本地图片路径（如 ![描述](C:/...) 或 ![描述](/...)），不要删除或改写图像引用，不要将图片路径替换为占位符。
- 保留原有内容顺序，仅修正格式；若内容已符合规范请原样返回。`;

export const useAnalysis = () => {
  const {
    files,
    currentFile,
    selectedFunction,
    currentProvider,
    getCurrentSettings,
    enableFormatReview,
    autoSaveAnalysisResult,
    dataDirectory,
    addLog,
    setIsAnalyzing,
    setAnalysisProgress,
    setAnalysisResult,
    setMultiFileAnalysisResult,
  } = useAppStore();

  const toast = useToast();

  const pushDevLog = (
    level: "info" | "warn" | "error",
    scope: string,
    message: string,
    payload?: unknown,
  ) => {
    if (!addLog) return;
    addLog({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      level,
      scope,
      message,
      payload,
    });
  };

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const stripLeadingSectionHeading = (text: string, header: string) => {
    const lines = text.split("\n");
    const headerRegex = new RegExp(`^#\\s*${escapeRegExp(header)}\\s*$`, "i");

    while (lines.length > 0) {
      const line = lines[0].trim();
      if (!line) {
        lines.shift();
        continue;
      }
      if (headerRegex.test(line)) {
        lines.shift();
        continue;
      }
      break;
    }

    return lines.join("\n").trimStart();
  };

  /**
   * Full-coverage section pipeline (inspired by open-notebook):
   * Instead of RAG top-K (which only sees ~25% of the document),
   * we iterate through ALL text chunks in page order for each section task.
   * Chunks are batched to fit within LLM context limits, and outputs
   * are accumulated per section to ensure complete coverage.
   */
  const runSectionPipeline = async (
    fileInfo: { file: File; name: string },
    promptConfig: typeof PROMPT_CONFIGS.science,
    settings: { apiKey: string; baseUrl: string; model: string },
    analysisBundle: DocumentAnalysisBundle,
    progressStart: number = 20,
    progressEnd: number = 85,
  ): Promise<string> => {
    const { coreSystemPrompt, chunkTasks, sectionHeaders } = promptConfig;

    // Chunk the entire document in page order (no RAG retrieval)
    const allChunks = chunkText(analysisBundle.text, analysisBundle.pageTexts, {
      targetChunkSize: 400,
      overlapChars: 60,
      minChunkSize: 60,
    });

    // Trigger embedding generation once per document to power RAG and logging
    if (allChunks.length > 0) {
      if (isEmbeddingAvailable()) {
        setAnalysisProgress({
          percentage: progressStart,
          message: `正在生成嵌入向量 (${allChunks.length} 个文本片段)...`,
        });
        const startAt = Date.now();
        pushDevLog("info", "embedding", "开始生成嵌入向量", {
          model: EMBEDDING_MODEL,
          chunkCount: allChunks.length,
          hasUserToken: hasUserEmbeddingToken(),
          freeUsesBefore: hasUserEmbeddingToken() ? null : getFreeEmbeddingUses(),
        });
        try {
          await generateEmbeddingsBatch(
            allChunks.map((chunk) => chunk.content),
            { decrementOnce: true }
          );
          pushDevLog("info", "embedding", "嵌入向量生成完成", {
            model: EMBEDDING_MODEL,
            durationMs: Date.now() - startAt,
            freeUsesAfter: hasUserEmbeddingToken() ? null : getFreeEmbeddingUses(),
          });
        } catch (error: any) {
          pushDevLog("warn", "embedding", "嵌入向量生成失败，已降级", {
            model: EMBEDDING_MODEL,
            error: error?.message || String(error),
          });
        }
      } else {
        pushDevLog("warn", "embedding", "未配置可用的嵌入 Token，已跳过嵌入生成", {
          model: EMBEDDING_MODEL,
          freeUsesRemaining: getFreeEmbeddingUses(),
        });
      }
    }

    pushDevLog("info", "analysis", `全量分段管道启动: ${fileInfo.name}`, {
      sections: sectionHeaders.length,
      tasks: chunkTasks.length,
      totalChunks: allChunks.length,
      imageCount: analysisBundle.images.length,
    });

    const sectionOutputs: Record<string, string> = {};
    const totalSteps = chunkTasks.length;
    const sectionProgressStart = progressStart + Math.round((progressEnd - progressStart) * 0.05);
    const sectionProgressEnd = progressEnd;

    for (let taskIdx = 0; taskIdx < chunkTasks.length; taskIdx++) {
      const task = chunkTasks[taskIdx];
      const sectionHeader = sectionHeaders[taskIdx] || sectionHeaders[sectionHeaders.length - 1];

      setAnalysisProgress({
        percentage: Math.round(sectionProgressStart + ((taskIdx) / totalSteps) * (sectionProgressEnd - sectionProgressStart)),
        message: `正在调用模型生成「${sectionHeader}」(${taskIdx + 1}/${totalSteps})...`,
      });

      // Process ALL chunks in batches for this section task
      const MAX_CHARS_PER_BATCH = 8000;
      const chunkOutputs: string[] = [];
      let batchChunks: string[] = [];
      let batchLen = 0;

      const flushBatch = async (batch: string[], batchIdx: number, totalBatches: number) => {
        if (batch.length === 0) return;

        const batchText = batch.join("\n\n");

        // Build image tag context for this batch — ONLY include image tags for pages
        // that appear in this batch, to reduce token waste (was injecting ALL 19 tags per batch)
        const imageTagLines: string[] = [];
        if (analysisBundle.pageImageMap.length > 0) {
          const pagesInBatch = new Set<number>();
          // Extract page numbers from chunk sourcePage markers like [片段1（第2页）]
          const chunkPageRegex = /片段\d+（第(\d+)页）/g;
          let chunkPageMatch;
          while ((chunkPageMatch = chunkPageRegex.exec(batchText)) !== null) {
            pagesInBatch.add(parseInt(chunkPageMatch[1], 10));
          }

          // Only include image tags for pages that appear in this batch
          for (const pageEntry of analysisBundle.pageImageMap) {
            if (pageEntry.imageTags.length > 0 && pagesInBatch.has(pageEntry.pageNumber)) {
              imageTagLines.push(
                `第${pageEntry.pageNumber}页: ${pageEntry.imageTags.join(", ")} (上下文: "${pageEntry.textSnippet.substring(0, 80)}")`,
              );
            }
          }
        }

        const imageTagSection = imageTagLines.length > 0
          ? [
              ``,
              `# 可用图片标签`,
              `原文中包含以下图片，请在相关内容后插入对应标签。每张图片都必须被引用，不要遗漏。`,
              imageTagLines.join("\n"),
              ``,
            ].join("\n")
          : "";

        const userPrompt = [
          `# 任务`,
          `输出部分：${sectionHeader}`,
          `要求：${task}`,
          ``,
          `# 文档内容（批次 ${batchIdx + 1}/${totalBatches}，共 ${batch.length} 片段）`,
          batchText.trim(),
          imageTagSection,
          `请基于以上内容完成该部分输出。如果内容不足以完成该任务，请输出你能够确定的部分。`,
        ].filter(Boolean).join("\n");

        // Update progress for each batch within a section
        const batchProgressBase = Math.round(sectionProgressStart + (taskIdx / totalSteps) * (sectionProgressEnd - sectionProgressStart));
        const batchProgressNext = Math.round(sectionProgressStart + ((taskIdx + 1) / totalSteps) * (sectionProgressEnd - sectionProgressStart));
        setAnalysisProgress({
          percentage: Math.round(batchProgressBase + (batchIdx / Math.max(totalBatches, 1)) * (batchProgressNext - batchProgressBase)),
          message: `正在生成「${sectionHeader}」批次 ${batchIdx + 1}/${totalBatches}...`,
        });

        try {
          // Don't pass local image paths to LLM — most models can't use them.
          // Images will be inserted by post-processing (applyImagePlacements + insertImagesByPageContext)
          const response = await APIService.callAIWithProvider(
            currentProvider,
            coreSystemPrompt,
            userPrompt,
            {
              apiKey: settings.apiKey,
              baseUrl: settings.baseUrl,
              model: settings.model,
            },
            undefined, // Don't send images to LLM
          );

          const cleanedRaw = stripLeadingMarkers(stripMarkdownFence(response)).trim();
          const cleaned = stripLeadingSectionHeading(cleanedRaw, sectionHeader).trim();
          if (cleaned) {
            chunkOutputs.push(cleaned);
          }
        } catch (err: any) {
          pushDevLog("warn", "analysis", `批次处理失败: ${sectionHeader} 批次${batchIdx + 1}`, {
            error: err?.message || String(err),
          });
        }
      };

      // All chunks are sent to every task (no keyword filtering)
      const effectiveChunks = allChunks;

      pushDevLog("info", "analysis", `Task "${sectionHeader}" 使用全部 ${allChunks.length} 个片段`, {
        taskIdx,
        sectionHeader,
        totalChunks: allChunks.length,
      });

      // Pre-count total batches for progress reporting
      const tempBatches: string[][] = [];
      let tempBatch: string[] = [];
      let tempLen = 0;
      for (let i = 0; i < effectiveChunks.length; i++) {
        const chunkContent = `[片段${i + 1}（第${effectiveChunks[i].sourcePage}页）]\n${allChunks[i].content}`;
        if (tempLen + chunkContent.length > MAX_CHARS_PER_BATCH && tempBatch.length > 0) {
          tempBatches.push(tempBatch);
          tempBatch = [];
          tempLen = 0;
        }
        tempBatch.push(chunkContent);
        tempLen += chunkContent.length;
      }
      if (tempBatch.length > 0) tempBatches.push(tempBatch);
      const totalBatches = tempBatches.length;

      // Iterate through filtered chunks in page order, batching them
      let batchIndex = 0;
      for (let i = 0; i < effectiveChunks.length; i++) {
        const chunkContent = `[片段${i + 1}（第${effectiveChunks[i].sourcePage}页）]\n${allChunks[i].content}`;

        if (batchLen + chunkContent.length > MAX_CHARS_PER_BATCH && batchChunks.length > 0) {
          // Flush current batch
          await flushBatch(batchChunks, batchIndex, totalBatches);
          batchIndex++;
          batchChunks = [];
          batchLen = 0;
        }

        batchChunks.push(chunkContent);
        batchLen += chunkContent.length;
      }

      // Flush remaining batch
      await flushBatch(batchChunks, batchIndex, totalBatches);

      // Merge all batch outputs for this section
      if (chunkOutputs.length > 0) {
        sectionOutputs[sectionHeader] = chunkOutputs.join("\n\n");
      }

      pushDevLog("info", "analysis", `分段完成: ${sectionHeader}`, {
        batches: batchIndex + 1,
        outputChunks: chunkOutputs.length,
      });
    }

    // Assemble sections in order
    const assembledParts: string[] = [];
    for (const header of sectionHeaders) {
      const output = sectionOutputs[header];
      if (output) {
        assembledParts.push(`# ${header}\n\n${output}`);
      }
    }

    let finalContent = assembledParts.join("\n\n");

    // Image insertion is now handled in analyzeDocument after the pipeline completes,
    // using both placeholder-based replacement and page-context insertion.

    pushDevLog("info", "analysis", `全量分段管道完成: ${fileInfo.name}`, {
      sections: sectionHeaders.length,
      imageCount: analysisBundle.images.length,
    });

    return finalContent;
  };

  const autoSaveIfNeeded = async (
    content: string,
    originalFileName: string,
    hashDir?: string,
  ) => {
    if (!autoSaveAnalysisResult) return;

    const dir = (dataDirectory || "").trim();
    if (!dir) {
      toast.show("自动保存失败：请先在数据管理中设置数据目录");
      return;
    }

    const normalizedDir = dir.replace(/[\\/]+$/, "");
    const baseName = originalFileName.replace(/\.[^./\\]+$/, "") || "OneDocs";
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

    // Save to hash-based directory if available, otherwise flat
    const saveDir = hashDir
      ? `${normalizedDir}/${hashDir}`
      : normalizedDir;
    const mdFileName = `${baseName}_OneDocs_分析结果_${dateStr}.md`;
    const mdFullPath = `${saveDir}/${mdFileName}`;

    try {
      // Ensure the directory exists
      await mkdir(saveDir, { recursive: true });

      // Save Markdown file
      await writeTextFile(mdFullPath, content);
      pushDevLog("info", "analysis", `分析结果已自动保存 (MD): ${mdFullPath}`, {
        path: mdFullPath,
        hashDir,
      });
    } catch (error: any) {
      console.error("自动保存析文结果失败", error);
      toast.show(error?.message || "自动保存失败，请检查数据目录权限", 5000);
    }
  };

  const analyzeDocument = async () => {
    const filesToAnalyze = files.length > 0 ? files : (currentFile ? [currentFile] : []);
    
    if (filesToAnalyze.length === 0) {
      toast.show("请先选择文档");
      return;
    }

    const settings = getCurrentSettings();
    const providerKey =
      typeof currentProvider === "string" && currentProvider.startsWith("custom_")
        ? null
        : (currentProvider as AIProvider);
    const requiresApiKey = providerKey
      ? MODEL_PROVIDERS[providerKey]?.requiresApiKey !== false
      : true;

    if (requiresApiKey && !settings.apiKey) {
      toast.show("请先在设置中配置 API Key");
      return;
    }

    setIsAnalyzing(true);
    pushDevLog("info", "analysis", "开始析文", {
      totalFiles: filesToAnalyze.length,
      selectedFunction,
      provider: currentProvider,
    });

    try {
      const totalFiles = filesToAnalyze.length;
      const promptConfig = PROMPT_CONFIGS[selectedFunction];
      if (!promptConfig) {
        throw new Error(`未找到 ${selectedFunction} 功能的配置`);
      }

      const processedResults: {
        fileId: string;
        result: { content: string; timestamp: number; fileId: string };
        fileName: string;
        hashDir: string;
      }[] = [];

      for (let i = 0; i < totalFiles; i++) {
        const fileInfo = filesToAnalyze[i];
        const fileId = fileInfo.id || `file_${i}`;
        const fileBase = Math.round((i / totalFiles) * 100);
        const fileSpan = Math.round(100 / totalFiles);

        setAnalysisProgress({
          percentage: fileBase,
          message: `正在读取文件 ${i + 1}/${totalFiles}: ${fileInfo.name}`,
        });
        pushDevLog("info", "analysis", `开始处理文件: ${fileInfo.name}`, {
          index: i + 1,
          totalFiles,
        });

        try {
          setAnalysisProgress({
            percentage: fileBase + Math.round(fileSpan * 0.05),
            message: `正在解析 PDF 文本: ${fileInfo.name}`,
          });

          const analysisBundle = await DocumentProcessor.extractAnalysisBundle(
            fileInfo.file,
            dataDirectory.trim() || undefined,
          );

          if (!analysisBundle.text || analysisBundle.text.trim().length === 0) {
            throw new Error(`文档 ${fileInfo.name} 内容为空或无法读取`);
          }

          setAnalysisProgress({
            percentage: fileBase + Math.round(fileSpan * 0.15),
            message: `已提取 ${analysisBundle.images.length} 张图片，${analysisBundle.pageCount} 页文本`,
          });

          let finalContent = "";

          try {
            finalContent = await runSectionPipeline(
              fileInfo,
              promptConfig,
              settings,
              analysisBundle,
              fileBase + Math.round(fileSpan * 0.2),
              fileBase + Math.round(fileSpan * 0.85),
            );
          } catch (pipelineError: any) {
            console.warn(`文件 ${fileInfo.name} 分段管道失败:`, pipelineError);
            pushDevLog("warn", "analysis", `分段管道失败: ${fileInfo.name}`, {
              error: pipelineError?.message || String(pipelineError),
            });
            throw pipelineError;
          }

          if (!finalContent.trim()) {
            throw new Error("分段管道未生成有效内容");
          }

          setAnalysisProgress({
            percentage: fileBase + Math.round(fileSpan * 0.87),
            message: `正在插入 ${analysisBundle.images.length} 张提取图片...`,
          });

          pushDevLog("info", "analysis", `开始图片插入: ${analysisBundle.images.length} 张图片`, {
            imageCount: analysisBundle.images.length,
            images: analysisBundle.images.map(img => ({ page: img.pageNumber, name: img.fileName, path: img.localPath })),
          });

          // First try placeholder-based replacement (for any placeholders LLM may have generated)
          finalContent = applyImagePlacements(finalContent, analysisBundle.images);

          // Then insert remaining images by page context (for images not matched by placeholders)
          // Uses LLM-based matching when available, falls back to rule-based matching
          finalContent = await insertImagesByPageContext(
            finalContent,
            analysisBundle.images,
            analysisBundle.pageImageMap,
            {
              provider: currentProvider,
              apiKey: settings.apiKey,
              baseUrl: settings.baseUrl,
              model: settings.model,
            },
          );

          pushDevLog("info", "analysis", `图片插入完成，最终内容长度: ${finalContent.length}`, {
            contentLength: finalContent.length,
            imageRefCount: (finalContent.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length,
          });

          if (selectedFunction === "science" && enableFormatReview) {
            setAnalysisProgress({
              percentage: fileBase + Math.round(fileSpan * 0.9),
              message: `正在进行格式复查: ${fileInfo.name}`,
            });

            const formatReviewContent = `请根据理工速知的格式要求，审查并仅修正以下内容的标题层级、加粗标记、公式排版与图片引用格式：\n\n【格式要求】\n1. 一级标题仅为"# 基础知识""# 典型例题"\n2. 二级标题从1开始递增，格式"## 1. 标题"\n3. 三级标题为"### 1.1 小节"依次递进\n4. 复杂公式使用同一行的 $$公式$$，禁止换行的 $\n公式\n$；行内公式用 $x$ 形式\n5. 重要概念加粗，例题结论用 **【最终结论】结论内容** 标识\n6. 保留所有本地图片路径（如 ![描述](C:/...) 或 ![描述](/...)），不要删除或改写图像引用，不要将图片路径替换为占位符\n7. 保留内容顺序，不新增英文解释\n\n【待复查内容】\n${finalContent}`;

            try {
              const reviewResponse = await APIService.callAIWithProvider(
                currentProvider,
                SCIENCE_FORMAT_REVIEW_PROMPT,
                formatReviewContent,
                {
                  apiKey: settings.apiKey,
                  baseUrl: settings.baseUrl,
                  model: settings.model,
                },
              );

              const reviewedContent = stripLeadingMarkers(stripMarkdownFence(reviewResponse)).trim();
              if (reviewedContent) {
                finalContent = applyImagePlacements(reviewedContent, analysisBundle.images);
                finalContent = await insertImagesByPageContext(
                  finalContent,
                  analysisBundle.images,
                  analysisBundle.pageImageMap,
                  {
                    provider: currentProvider,
                    apiKey: settings.apiKey,
                    baseUrl: settings.baseUrl,
                    model: settings.model,
                  },
                );
              }
            } catch (reviewError: any) {
              console.error(`文件 ${fileInfo.name} 格式复查失败:`, reviewError);
              toast.show(`格式复查失败，已返回初步结果：${reviewError.message || "请稍后重试"}`, 5000);
            }
          }

          const analysisResult = {
            content: finalContent,
            timestamp: Date.now(),
            fileId: fileId,
          };

          setMultiFileAnalysisResult(fileId, analysisResult);
          processedResults.push({ fileId, result: analysisResult, fileName: fileInfo.name, hashDir: analysisBundle.hashDir });
          pushDevLog("info", "analysis", `文件分析完成: ${fileInfo.name}`, {
            fileId,
            hashDir: analysisBundle.hashDir,
          });
        } catch (error: any) {
          console.error(`文件 ${fileInfo.name} 分析失败:`, error);
          pushDevLog("error", "analysis", `文件分析失败: ${fileInfo.name}`, {
            error: error?.message || String(error),
          });
          let errorMessage = error.message || "分析失败";
          
          if (errorMessage.includes("401")) {
            errorMessage +=
              "\n\n建议：请使用带有可选择文本的PDF";
          } else if (errorMessage.includes("PDF")) {
            errorMessage += "\n\n建议：请尝试重新生成PDF";
          }

          toast.show(`文件 ${fileInfo.name} 分析失败: ${errorMessage}`, 5000);
        }
      }

      if (processedResults.length === 0) {
        throw new Error("未生成任何有效分析结果，请检查文档内容、模型配置或网络连接");
      }

      setAnalysisProgress({ percentage: 100, message: "所有文件分析完成！" });

      const last = processedResults[processedResults.length - 1].result;
      setAnalysisResult(last);

      for (const item of processedResults) {
        await autoSaveIfNeeded(item.result.content, item.fileName, item.hashDir);
      }

      toast.show(`成功分析 ${processedResults.length} 个文件！`);
      pushDevLog("info", "analysis", "批量析文完成", {
        count: processedResults.length,
      });
    } catch (error: any) {
      console.error("批量分析失败:", error);
      pushDevLog("error", "analysis", "批量析文失败", {
        error: error?.message || String(error),
      });
      toast.show(error.message || "批量分析失败", 5000);
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => {
        setAnalysisProgress(null);
      }, 1000);
    }
  };

  return {
    analyzeDocument,
  };
};
