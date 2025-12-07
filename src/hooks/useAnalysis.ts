import { useAppStore } from "@/store/useAppStore";
import { APIService } from "@/services/api";
import { DocumentProcessor } from "@/utils/documentProcessor";
import { PROMPT_CONFIGS } from "@/config/prompts";
import { MODEL_PROVIDERS } from "@/config/providers";
import { useToast } from "@/components/Toast";
import type { AIProvider } from "@/types";

const SCIENCE_FORMAT_REVIEW_PROMPT = `你是中文学术排版审校助手，只负责在不改变含义的前提下修正格式。必须遵循：
- 仅处理理工速知的输出内容，保持全中文。
- 一级标题只有 “# 基础知识” 与 “# 典型例题”。
- 二级标题按数字递增（如 ## 1. xxx、## 2. xxx），三级标题使用 1.1、1.2 依次递进。
- 复杂公式使用单行 $$公式$$ 包裹，禁止跨行的 $\n公式\n$；行内简单变量用 $x$ 形式。
- 重要概念需加粗，例题结论用 **【最终结论】结论内容** 高亮。
- 保留原有内容顺序，仅修正格式；若内容已符合规范请原样返回。`;

export const useAnalysis = () => {
  const {
    files,
    currentFile,
    selectedFunction,
    currentProvider,
    getCurrentSettings,
    enableFormatReview,
    setIsAnalyzing,
    setAnalysisProgress,
    setAnalysisResult,
    setMultiFileAnalysisResult,
  } = useAppStore();

  const toast = useToast();

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

    try {
      const totalFiles = filesToAnalyze.length;
      const promptConfig = PROMPT_CONFIGS[selectedFunction];
      if (!promptConfig) {
        throw new Error(`未找到 ${selectedFunction} 功能的配置`);
      }

      for (let i = 0; i < totalFiles; i++) {
        const fileInfo = filesToAnalyze[i];
        const fileId = fileInfo.id || `file_${i}`;
        
        setAnalysisProgress({
          percentage: Math.round((i / totalFiles) * 100),
          message: `正在分析文件 ${i + 1}/${totalFiles}: ${fileInfo.name}...`,
        });

        try {
          const fileContent = await DocumentProcessor.extractContent(
            fileInfo.file,
          );

          if (!fileContent || fileContent.trim().length === 0) {
            throw new Error(`文档 ${fileInfo.name} 内容为空或无法读取`);
          }

          setAnalysisProgress({
            percentage: Math.round((i / totalFiles) * 100 + 30 / totalFiles),
            message: `正在调用AI分析文件 ${i + 1}/${totalFiles}: ${fileInfo.name}...`,
          });

          const result = await APIService.callAIWithProvider(
            currentProvider,
            promptConfig.prompt,
            fileContent,
            {
              apiKey: settings.apiKey,
              baseUrl: settings.baseUrl,
              model: settings.model,
            }
          );

          let reviewedContent = result;

          const shouldReviewFormat = selectedFunction === "science" && enableFormatReview;

          if (shouldReviewFormat) {
            setAnalysisProgress({
              percentage: Math.round((i / totalFiles) * 100 + 60 / totalFiles),
              message: `正在进行格式复查 ${i + 1}/${totalFiles}: ${fileInfo.name}...`,
            });

            const formatReviewContent = `请根据理工速知的格式要求，审查并仅修正以下内容的标题层级、加粗标记与公式排版：\n\n【格式要求】\n1. 一级标题仅为“# 基础知识”“# 典型例题”\n2. 二级标题从1开始递增，格式“## 1. 标题”\n3. 三级标题为“### 1.1 小节”依次递进\n4. 复杂公式使用同一行的 $$公式$$，禁止换行的 $\\n公式\\n$；行内公式用 $x$ 形式\n5. 重要概念加粗，例题结论用 **【最终结论】结论内容** 标识\n6. 保留内容顺序，不新增英文解释\n\n【待复查内容】\n${reviewedContent}`;

            try {
              reviewedContent = await APIService.callAIWithProvider(
                currentProvider,
                SCIENCE_FORMAT_REVIEW_PROMPT,
                formatReviewContent,
                {
                  apiKey: settings.apiKey,
                  baseUrl: settings.baseUrl,
                  model: settings.model,
                }
              );
            } catch (reviewError: any) {
              console.error(`文件 ${fileInfo.name} 格式复查失败:`, reviewError);
              toast.show(`格式复查失败，已返回初步结果：${reviewError.message || "请稍后重试"}`, 5000);
            }
          }

          const analysisResult = {
            content: reviewedContent,
            timestamp: Date.now(),
            fileId: fileId,
          };
          
          setMultiFileAnalysisResult(fileId, analysisResult);

          if (i === totalFiles - 1 || totalFiles === 1) {
            setAnalysisResult(analysisResult);
          }
        } catch (error: any) {
          console.error(`文件 ${fileInfo.name} 分析失败:`, error);
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

      setAnalysisProgress({ percentage: 100, message: "所有文件分析完成！" });
      toast.show(`成功分析 ${totalFiles} 个文件！`);
    } catch (error: any) {
      console.error("批量分析失败:", error);
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
