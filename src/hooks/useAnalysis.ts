import { useAppStore } from "@/store/useAppStore";
import { APIService } from "@/services/api";
import { DocumentProcessor } from "@/utils/documentProcessor";
import { PROMPT_CONFIGS } from "@/config/prompts";
import { useToast } from "@/components/Toast";

export const useAnalysis = () => {
  const {
    files,
    currentFile,
    selectedFunction,
    currentProvider,
    getCurrentSettings,
    setIsAnalyzing,
    setAnalysisProgress,
    setAnalysisResult,
    setMultiFileAnalysisResult,
  } = useAppStore();

  const toast = useToast();

  const analyzeDocument = async () => {
    // 支持多文件分析
    const filesToAnalyze = files.length > 0 ? files : (currentFile ? [currentFile] : []);
    
    if (filesToAnalyze.length === 0) {
      toast.show("请先选择文档");
      return;
    }

    const settings = getCurrentSettings();
    if (!settings.apiKey) {
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

      // 批量分析所有文件
      for (let i = 0; i < totalFiles; i++) {
        const fileInfo = filesToAnalyze[i];
        const fileId = fileInfo.id || `file_${i}`;
        
        setAnalysisProgress({
          percentage: Math.round((i / totalFiles) * 100),
          message: `正在分析文件 ${i + 1}/${totalFiles}: ${fileInfo.name}...`,
        });

        try {
          // 解析文档
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

          // 调用 AI API
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

          // 保存单个文件的分析结果
          const analysisResult = {
            content: result,
            timestamp: Date.now(),
            fileId: fileId,
          };
          
          setMultiFileAnalysisResult(fileId, analysisResult);

          // 如果是最后一个文件或者是单个文件，更新当前结果（向后兼容）
          if (i === totalFiles - 1 || totalFiles === 1) {
            setAnalysisResult(analysisResult);
          }
        } catch (error: any) {
          console.error(`文件 ${fileInfo.name} 分析失败:`, error);
          let errorMessage = error.message || "分析失败";
          
          // 提供针对性的错误提示
          if (errorMessage.includes("图片扫描版PDF")) {
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
