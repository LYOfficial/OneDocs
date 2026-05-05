import { useAppStore } from "@/store/useAppStore";
import { APIService } from "@/services/api";
import { DocumentProcessor } from "@/utils/documentProcessor";
import { PROMPT_CONFIGS } from "@/config/prompts";
import { MODEL_PROVIDERS } from "@/config/providers";
import { useToast } from "@/components/Toast";
import {
  WORKFLOW_PLANNER_MODEL,
  WORKFLOW_COMPOSER_MODEL,
  applyImagePlacements,
  buildChunkPrompt,
  buildComposerPrompt,
  buildImageTokenList,
  buildLocalWorkflowPlan,
  parseWorkflowPlan,
  splitTextIntoChunks,
  stripLeadingMarkers,
  stripMarkdownFence,
} from "@/utils/analysisWorkflow";
import type { AIProvider, DocumentAnalysisBundle } from "@/types";
import { writeTextFile } from "@tauri-apps/plugin-fs";

const SCIENCE_FORMAT_REVIEW_PROMPT = `你是中文学术排版审校助手，只负责在不改变含义的前提下修正格式。必须遵循：
- 仅处理理工速知的输出内容，保持全中文。
- 一级标题只有 “# 基础知识” 与 “# 典型例题”。
- 二级标题按数字递增（如 ## 1. xxx、## 2. xxx），三级标题使用 1.1、1.2 依次递进。
- 复杂公式使用单行 $$公式$$ 包裹，禁止跨行的 $\n公式\n$；行内简单变量用 $x$ 形式。
- 重要概念需加粗，例题结论用 **【最终结论】结论内容** 高亮。
- 保留图片占位符与本地图片路径，不要删除或改写图像引用。
- 保留原有内容顺序，仅修正格式；若内容已符合规范请原样返回。`;

const WORKFLOW_PLANNER_SYSTEM_PROMPT = `你是文档分析工作流规划器，只输出合法 JSON，不要输出多余解释。你的任务是基于文档内容、页码结构和图片素材，制定分段分析与图片插入计划。`;

const WORKFLOW_COMPOSER_SYSTEM_PROMPT = `你是最终文档组装器，只输出完整 Markdown，不要输出分析过程。你需要把多个分段结果整合成连贯、完整、不重复的最终文档。`;

const ANALYSIS_MARKDOWN_SYSTEM_PROMPT = `你是严谨的文档分析助手，只输出 Markdown 内容，不要输出任何解释、前言或结尾寒暄。`;

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

  const getOneDocsSettings = () => {
    const onedocsConfig = MODEL_PROVIDERS.onedocs;
    const currentSettings = getCurrentSettings();
    const isUsingOneDocsProvider = currentProvider === "onedocs";

    return {
      apiKey: onedocsConfig.defaultApiKey || (isUsingOneDocsProvider ? currentSettings.apiKey : ""),
      baseUrl: onedocsConfig.baseUrl || (isUsingOneDocsProvider ? currentSettings.baseUrl : ""),
      model: isUsingOneDocsProvider ? currentSettings.model : onedocsConfig.defaultModel,
    };
  };

  const hasOneDocsCoreConfig = () => {
    const settings = getOneDocsSettings();
    return Boolean(settings.baseUrl && settings.apiKey);
  };

  const callOneDocsAgent = async (model: string, systemPrompt: string, content: string) => {
    const settings = getOneDocsSettings();

    if (!settings.baseUrl || !settings.apiKey) {
      throw new Error("未配置 OneDocs 核心模型地址或密钥，请先设置 VITE_ONEDOCS_API_URL / VITE_ONEDOCS_API_KEY");
    }

    return await APIService.callAI({
      systemPrompt,
      content,
      provider: "onedocs",
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      model,
    });
  };

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

  const runLegacyAnalysis = async (
    fileInfo: { file: File; name: string },
    prompt: string,
    settings: { apiKey: string; baseUrl: string; model: string },
  ) => {
    pushDevLog("info", "analysis", `开始全文析文: ${fileInfo.name}`, {
      provider: currentProvider,
      model: settings.model,
    });
    const analysisText = await DocumentProcessor.extractContent(fileInfo.file);

    if (!analysisText || analysisText.trim().length === 0) {
      throw new Error(`文档 ${fileInfo.name} 内容为空或无法读取`);
    }

    const result = await APIService.callAIWithProvider(
      currentProvider,
      prompt,
      analysisText,
      {
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
      },
    );

    return stripLeadingMarkers(stripMarkdownFence(result)).trim();
  };

  const runScienceTwoPartAnalysis = async (
    fileInfo: { file: File; name: string },
    prompt: string,
    settings: { apiKey: string; baseUrl: string; model: string },
    analysisBundle: DocumentAnalysisBundle,
    includeImages: boolean,
  ) => {
    const imageTokens = includeImages
      ? buildImageTokenList(analysisBundle.images)
      : [];
    const imageHint = includeImages
      ? imageTokens.length > 0
          ? `\n\n可用图片占位符：${imageTokens.join("、")}。请根据内容需要保留占位符。`
          : "\n\n无可用图片素材。"
      : "";

    const buildSectionPrompt = (extraInstruction: string) => [
      prompt.trim(),
      "",
      "# 追加要求",
      extraInstruction,
      imageHint,
      "",
      "## 文档内容",
      analysisBundle.text.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    const basicPrompt = buildSectionPrompt(
      "仅输出“基础知识”部分，必须以“# 基础知识”开头，禁止输出“# 典型例题”。",
    );

    const examplePrompt = buildSectionPrompt(
      "仅输出“典型例题”部分，必须以“# 典型例题”开头，禁止输出“# 基础知识”。",
    );

    pushDevLog("info", "analysis", `理工速知拆分输出: ${fileInfo.name}`, {
      provider: currentProvider,
      model: settings.model,
      mode: "two-part",
    });

    const basicResponse = await APIService.callAIWithProvider(
      currentProvider,
      ANALYSIS_MARKDOWN_SYSTEM_PROMPT,
      basicPrompt,
      {
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
      },
    );

    const exampleResponse = await APIService.callAIWithProvider(
      currentProvider,
      ANALYSIS_MARKDOWN_SYSTEM_PROMPT,
      examplePrompt,
      {
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
      },
    );

    const basicContent = stripLeadingMarkers(stripMarkdownFence(basicResponse)).trim();
    const exampleContent = stripLeadingMarkers(stripMarkdownFence(exampleResponse)).trim();

    if (basicContent && exampleContent) {
      return `${basicContent}\n\n${exampleContent}`;
    }

    return basicContent || exampleContent;
  };

  const autoSaveIfNeeded = async (
    content: string,
    originalFileName: string,
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
    const fileName = `${baseName}_OneDocs_分析结果_${dateStr}.md`;
    const fullPath = `${normalizedDir}/${fileName}`;

    try {
      await writeTextFile(fullPath, content);
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
      }[] = [];

      for (let i = 0; i < totalFiles; i++) {
        const fileInfo = filesToAnalyze[i];
        const fileId = fileInfo.id || `file_${i}`;
        
        setAnalysisProgress({
          percentage: Math.round((i / totalFiles) * 100),
          message: `正在分析文件 ${i + 1}/${totalFiles}: ${fileInfo.name}...`,
        });
        pushDevLog("info", "analysis", `开始处理文件: ${fileInfo.name}`, {
          index: i + 1,
          totalFiles,
        });

        try {
          const analysisBundle = await DocumentProcessor.extractAnalysisBundle(
            fileInfo.file,
            dataDirectory.trim() || undefined,
          );

          const effectiveBundle = analysisBundle;

          if (!effectiveBundle.text || effectiveBundle.text.trim().length === 0) {
            throw new Error(`文档 ${fileInfo.name} 内容为空或无法读取`);
          }

          let finalContent = "";

          try {
            if (selectedFunction === "science") {
              setAnalysisProgress({
                percentage: Math.round((i / totalFiles) * 100 + 10 / totalFiles),
                message: `正在生成理工速知内容 ${i + 1}/${totalFiles}: ${fileInfo.name}...`,
              });
              finalContent = await runScienceTwoPartAnalysis(
                fileInfo,
                promptConfig.prompt,
                settings,
                effectiveBundle,
                true,
              );
            } else if (hasOneDocsCoreConfig()) {
              setAnalysisProgress({
                percentage: Math.round((i / totalFiles) * 100 + 15 / totalFiles),
                message: `正在制定工作流计划 ${i + 1}/${totalFiles}: ${fileInfo.name}...`,
              });

              const fallbackPlan = buildLocalWorkflowPlan(
                effectiveBundle,
                fileInfo.name,
                fileInfo.type,
              );

              const plannerPayload = [
                `【文件名】${fileInfo.name}`,
                `【功能】${promptConfig.name}`,
                `【原始提示】\n${promptConfig.prompt}`,
                `【页码与摘要】\n${effectiveBundle.pageTexts
                  .map((pageText, pageIndex) => `第 ${pageIndex + 1} 页：${pageText.slice(0, 800) || "（无文本）"}`)
                  .join("\n\n")}`,
                `【图片素材】\n${effectiveBundle.images.length > 0
                  ? effectiveBundle.images
                      .map((image) => `第 ${image.pageNumber} 页 -> ${image.localPath || image.dataUrl ? image.fileName : "未落盘"}`)
                      .join("\n")
                  : "无图片素材"}`,
                `【本地候选计划】\n${JSON.stringify(fallbackPlan, null, 2)}`,
              ].join("\n\n");

              const plannerResponse = await callOneDocsAgent(
                WORKFLOW_PLANNER_MODEL,
                WORKFLOW_PLANNER_SYSTEM_PROMPT,
                plannerPayload,
              );

              pushDevLog("info", "analysis", `工作流规划完成: ${fileInfo.name}`, {
                model: WORKFLOW_PLANNER_MODEL,
                response: plannerResponse,
              });

              const workflowPlan = parseWorkflowPlan(plannerResponse, fallbackPlan);

              const chunkOutputs: string[] = [];
              const pageTexts = effectiveBundle.pageTexts.length > 0
                ? effectiveBundle.pageTexts
                : splitTextIntoChunks(effectiveBundle.text, 7000);

              for (const chunk of workflowPlan.chunks) {
                setAnalysisProgress({
                  percentage: Math.round(
                    (i / totalFiles) * 100 + 15 / totalFiles + chunkOutputs.length * (45 / Math.max(workflowPlan.chunks.length, 1)) / totalFiles,
                  ),
                  message: `正在分段生成 ${chunk.title} ${i + 1}/${totalFiles}: ${fileInfo.name}...`,
                });

                const chunkText = effectiveBundle.pageTexts.length > 0
                  ? pageTexts.slice(chunk.pageStart - 1, chunk.pageEnd).join("\n\n")
                  : pageTexts[workflowPlan.chunks.indexOf(chunk)] || effectiveBundle.text;

                const pageImageTokens = buildImageTokenList(
                  effectiveBundle.images.filter(
                    (image) => image.pageNumber >= chunk.pageStart && image.pageNumber <= chunk.pageEnd,
                  ),
                );

                const chunkPrompt = buildChunkPrompt({
                  sourcePrompt: promptConfig.prompt,
                  workflowPlan,
                  chunk,
                  chunkText,
                  fileName: fileInfo.name,
                  pageImageTokens,
                  includeImages: true,
                });

                const chunkResponse = await APIService.callAIWithProvider(
                  currentProvider,
                  ANALYSIS_MARKDOWN_SYSTEM_PROMPT,
                  chunkPrompt,
                  {
                    apiKey: settings.apiKey,
                    baseUrl: settings.baseUrl,
                    model: settings.model,
                  },
                );

                const cleanedChunk = stripLeadingMarkers(stripMarkdownFence(chunkResponse)).trim();
                if (cleanedChunk) {
                  chunkOutputs.push(cleanedChunk);
                }
              }

              if (chunkOutputs.length > 0) {
                setAnalysisProgress({
                  percentage: Math.round((i / totalFiles) * 100 + 75 / totalFiles),
                  message: `正在组装最终文档 ${i + 1}/${totalFiles}: ${fileInfo.name}...`,
                });

                const composerPayload = buildComposerPrompt({
                  sourcePrompt: promptConfig.prompt,
                  workflowPlan,
                  fragments: chunkOutputs,
                  fileName: fileInfo.name,
                  imageManifest: effectiveBundle.images,
                  includeImages: true,
                });

                const composedResponse = await callOneDocsAgent(
                  WORKFLOW_COMPOSER_MODEL,
                  WORKFLOW_COMPOSER_SYSTEM_PROMPT,
                  composerPayload,
                );

                pushDevLog("info", "analysis", `工作流组装完成: ${fileInfo.name}`, {
                  model: WORKFLOW_COMPOSER_MODEL,
                  response: composedResponse,
                });

                finalContent = stripLeadingMarkers(stripMarkdownFence(composedResponse)).trim();
              }
            }
          } catch (workflowError: any) {
            console.warn(`文件 ${fileInfo.name} 新工作流失败，回退到单模型全文析文:`, workflowError);
            pushDevLog("warn", "analysis", `新工作流失败，回退全文析文: ${fileInfo.name}`, {
              error: workflowError?.message || String(workflowError),
            });
            try {
              finalContent = await runLegacyAnalysis(fileInfo, promptConfig.prompt, settings);
            } catch (legacyError: any) {
              throw legacyError;
            }
          }

          if (!finalContent.trim()) {
            finalContent = await runLegacyAnalysis(fileInfo, promptConfig.prompt, settings);
          }

          finalContent = applyImagePlacements(finalContent, effectiveBundle.images);

          if (selectedFunction === "science" && enableFormatReview) {
            setAnalysisProgress({
              percentage: Math.round((i / totalFiles) * 100 + 88 / totalFiles),
              message: `正在进行格式复查 ${i + 1}/${totalFiles}: ${fileInfo.name}...`,
            });

            const formatReviewContent = `请根据理工速知的格式要求，审查并仅修正以下内容的标题层级、加粗标记、公式排版与图片引用格式：\n\n【格式要求】\n1. 一级标题仅为“# 基础知识”“# 典型例题”\n2. 二级标题从1开始递增，格式“## 1. 标题”\n3. 三级标题为“### 1.1 小节”依次递进\n4. 复杂公式使用同一行的 $$公式$$，禁止换行的 $\n公式\n$；行内公式用 $x$ 形式\n5. 重要概念加粗，例题结论用 **【最终结论】结论内容** 标识\n6. 保留图片占位符或本地图片路径，不要删除图像引用\n7. 保留内容顺序，不新增英文解释\n\n【待复查内容】\n${finalContent}`;

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
                finalContent = applyImagePlacements(reviewedContent, effectiveBundle.images);
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
          processedResults.push({ fileId, result: analysisResult, fileName: fileInfo.name });
          pushDevLog("info", "analysis", `文件分析完成: ${fileInfo.name}`, {
            fileId,
          });
        } catch (error: any) {
          console.error(`文件 ${fileInfo.name} 分析失败:`, error);
          pushDevLog("error", "analysis", `文件分析失败: ${fileInfo.name}`, {
            error: error?.message || String(error),
          });
          let errorMessage = error.message || "分析失败";
          
          if (errorMessage.includes("401")) {
            errorMessage +=
              "\n\n建议：请使用带有可选择文本的PDF，或将内容复制到TXT文件中";
          } else if (errorMessage.includes("PDF")) {
            errorMessage += "\n\n建议：请尝试重新生成PDF或转换为其他格式";
          } else if (errorMessage.includes("Word")) {
            errorMessage += "\n\n建议：请检查Word文档格式是否正确，或另存为新文档";
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
        await autoSaveIfNeeded(item.result.content, item.fileName);
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
