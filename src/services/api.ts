import { invoke } from "@tauri-apps/api/core";
import type { AIProvider } from "@/types";
import { MODEL_PROVIDERS } from "@/config/providers";

interface CallAIParams {
  systemPrompt: string;
  content: string;
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

interface CallCustomAIParams {
  systemPrompt: string;
  content: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class APIService {
  static async callAIWithProvider(
    provider: string,
    systemPrompt: string,
    content: string,
    settings: { apiKey: string; baseUrl: string; model: string }
  ): Promise<string> {
    if (provider.startsWith('custom_')) {
      return this.callCustomAI({
        systemPrompt,
        content,
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
      });
    } else {
      return this.callAI({
        systemPrompt,
        content,
        provider: provider as AIProvider,
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
      });
    }
  }

  static async callAI({
    systemPrompt,
    content,
    provider,
    apiKey,
    baseUrl,
    model,
  }: CallAIParams): Promise<string> {
    const config = MODEL_PROVIDERS[provider];
    if (!config) {
      throw new Error(`不支持的模型提供商: ${provider}`);
    }

    const finalModel = model || config.defaultModel;
    const finalBaseUrl = baseUrl || config.baseUrl;

    console.log(`调用 ${config.name} API`, {
      provider,
      model: finalModel,
      baseUrl: finalBaseUrl,
    });

    try {
      const result = await invoke<string>("analyze_content_rust", {
        apiKey,
        apiBaseUrl: finalBaseUrl,
        systemPrompt,
        textContent: `请分析以下文档内容：\n\n${content}`,
        model: finalModel,
      });

      return result;
    } catch (error: any) {
      console.error("API 调用失败:", error);
      throw this.handleAPIError(error, provider);
    }
  }

  static async callCustomAI({
    systemPrompt,
    content,
    apiKey,
    baseUrl,
    model,
  }: CallCustomAIParams): Promise<string> {
    console.log(`调用自定义 API`, {
      model,
      baseUrl,
    });

    try {
      // 通过 Tauri 后端调用 API
      const result = await invoke<string>("analyze_content_rust", {
        apiKey,
        apiBaseUrl: baseUrl,
        systemPrompt,
        textContent: `请分析以下文档内容：\n\n${content}`,
        model,
      });

      return result;
    } catch (error: any) {
      console.error("自定义 API 调用失败:", error);
      throw this.handleCustomAPIError(error);
    }
  }

  /**
   * 测试 API 连接
   */
  static async testConnection(
    provider: AIProvider,
    apiKey: string,
    baseUrl?: string,
    model?: string,
  ): Promise<boolean> {
    try {
      await this.callAI({
        systemPrompt: "You are a helpful assistant.",
        content: "Hello, this is a connection test.",
        provider,
        apiKey,
        baseUrl,
        model,
      });
      return true;
    } catch (error: any) {
      // 检查是否是余额不足错误 - 这种情况下连接是正常的，只是余额问题
      if ((error as any).isBalanceError) {
        let rechargeMessage = "";
        
        // 根据不同提供商给出相应的充值提示
        switch (provider) {
          case 'deepseek':
            rechargeMessage = "请前往 DeepSeek 官网充值后使用";
            break;
          case 'glm':
            rechargeMessage = "请前往智谱GLM官网充值后使用";
            break;
          case 'openai':
            rechargeMessage = "请前往 OpenAI 官网充值后使用";
            break;
          default:
            rechargeMessage = "请前往相应官网充值后使用";
        }
        
        // 余额不足时抛出一个特殊的"成功但有警告"的错误
        const warningError = new Error("BALANCE_WARNING");
        (warningError as any).isWarning = true;
        (warningError as any).originalMessage = `连接正常，但账户余额不足\n\n${rechargeMessage}`;
        throw warningError;
      }
      
      // 其他错误照常抛出
      throw error;
    }
  }

  /**
   * 测试自定义 API 连接
   */
  static async testCustomConnection(
    apiKey: string,
    baseUrl: string,
    model: string,
  ): Promise<boolean> {
    try {
      await this.callCustomAI({
        systemPrompt: "You are a helpful assistant.",
        content: "Hello, this is a connection test.",
        apiKey,
        baseUrl,
        model,
      });
      return true;
    } catch (error: any) {
      // 检查是否是余额不足错误 - 这种情况下连接是正常的，只是余额问题
      if ((error as any).isBalanceError) {
        const rechargeMessage = "请检查账户余额是否充足";
        
        // 余额不足时抛出一个特殊的"成功但有警告"的错误
        const warningError = new Error("BALANCE_WARNING");
        (warningError as any).isWarning = true;
        (warningError as any).originalMessage = `连接正常，但账户余额不足\n\n${rechargeMessage}`;
        throw warningError;
      }
      
      // 其他错误照常抛出
      throw error;
    }
  }

  /**
   * 处理自定义 API 错误
   */
  private static handleCustomAPIError(error: any): Error {
    let errorMessage = `自定义模型 API 调用失败`;

    if (typeof error === "string") {
      errorMessage += `: ${error}`;
    } else if (error?.message) {
      errorMessage += `: ${error.message}`;
    }

    // 提供针对性的错误提示
    if (
      errorMessage.includes("InsufficientBalance") ||
      errorMessage.includes("InsuffcientBalance") || // API返回的拼写错误
      errorMessage.includes("insufficient_balance") ||
      errorMessage.includes("PaymentRequired") ||
      errorMessage.includes("402") ||
      errorMessage.includes("余额不足")
    ) {
      const providerSpecificMessage = `账户余额不足\n\n解决方案：\n1. 检查账户余额是否充足\n2. 确认账户状态是否正常\n3. 联系服务商确认账户问题`;
      
      // 创建特殊的余额不足错误，带有标记
      const balanceError = new Error(providerSpecificMessage);
      (balanceError as any).isBalanceError = true;
      return balanceError;
    } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      errorMessage = `API Key 无效或已过期\n\n请检查：\n1. API Key 是否正确\n2. API Key 是否有足够的权限\n3. 账户是否有足够的余额`;
    } else if (
      errorMessage.includes("403") ||
      errorMessage.includes("Forbidden")
    ) {
      errorMessage = `访问被拒绝\n\n可能原因：\n1. API Key 权限不足\n2. 请求频率超限\n3. IP 地址被限制`;
    } else if (
      errorMessage.includes("1211") || 
      errorMessage.includes("模型不存在") ||
      errorMessage.includes("model")
    ) {
      errorMessage = `模型不存在或不可用\n\n请检查：\n1. 模型名称拼写是否正确\n2. 确认API Key有对应模型的访问权限\n3. 检查账户是否已开通相应的模型服务`;
    } else if (
      errorMessage.includes("429") ||
      errorMessage.includes("Too Many Requests")
    ) {
      errorMessage = `请求频率过高\n\n建议：\n1. 稍后再试\n2. 检查账户限额\n3. 考虑升级服务计划`;
    } else if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("ETIMEDOUT")
    ) {
      errorMessage = `请求超时\n\n可能原因：\n1. 网络连接不稳定\n2. 服务器响应缓慢\n3. 文档内容过长`;
    } else if (
      errorMessage.includes("network") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      errorMessage = `网络连接失败\n\n建议：\n1. 检查网络连接\n2. 确认 Base URL 是否正确\n3. 检查防火墙设置`;
    }

    return new Error(errorMessage);
  }

  /**
   * 处理 API 错误
   */
  private static handleAPIError(error: any, provider: AIProvider): Error {
    const providerName = MODEL_PROVIDERS[provider]?.name || provider;

    let errorMessage = `${providerName} API 调用失败`;

    if (typeof error === "string") {
      errorMessage += `: ${error}`;
    } else if (error?.message) {
      errorMessage += `: ${error.message}`;
    }

    // 提供针对性的错误提示
    if (
      errorMessage.includes("InsufficientBalance") ||
      errorMessage.includes("InsuffcientBalance") || // API返回的拼写错误
      errorMessage.includes("insufficient_balance") ||
      errorMessage.includes("PaymentRequired") ||
      errorMessage.includes("402") ||
      errorMessage.includes("余额不足")
    ) {
      // 根据提供商生成相应的充值提示
      let providerSpecificMessage = "";
      let websiteName = "";
      
      switch (provider) {
        case 'deepseek':
          websiteName = "DeepSeek";
          break;
        case 'glm':
          websiteName = "智谱GLM";
          break;
        case 'openai':
          websiteName = "OpenAI";
          break;
        default:
          websiteName = providerName;
      }
      
      providerSpecificMessage = `账户余额不足\n\n解决方案：\n1. 前往 ${websiteName} 官网充值账户\n2. 检查当前账户余额是否充足\n3. 确认账户状态是否正常\n4. 联系 ${websiteName} 客服确认账户问题`;
      
      // 创建特殊的余额不足错误，带有标记
      const balanceError = new Error(providerSpecificMessage);
      (balanceError as any).isBalanceError = true;
      return balanceError;
    } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      errorMessage = `API Key 无效或已过期\n\n请检查：\n1. API Key 是否正确\n2. API Key 是否有足够的权限\n3. 账户是否有足够的余额`;
    } else if (
      errorMessage.includes("403") ||
      errorMessage.includes("Forbidden")
    ) {
      errorMessage = `访问被拒绝\n\n可能原因：\n1. API Key 权限不足\n2. 请求频率超限\n3. IP 地址被限制`;
    } else if (
      errorMessage.includes("1211") || 
      errorMessage.includes("模型不存在") ||
      (provider === 'glm' && errorMessage.includes("model"))
    ) {
      errorMessage = `模型不存在或不可用\n\n智谱GLM常见解决方案：\n1. 尝试使用 glm-4-plus 或 glm-4-flashx 模型\n2. 确认API Key有对应模型的访问权限\n3. 检查账户是否已开通相应的模型服务\n4. 确认模型名称拼写正确`;
    } else if (
      errorMessage.includes("429") ||
      errorMessage.includes("Too Many Requests")
    ) {
      errorMessage = `请求频率过高\n\n建议：\n1. 稍后再试\n2. 检查账户限额\n3. 考虑升级服务计划`;
    } else if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("ETIMEDOUT")
    ) {
      errorMessage = `请求超时\n\n可能原因：\n1. 网络连接不稳定\n2. 服务器响应缓慢\n3. 文档内容过长`;
    } else if (
      errorMessage.includes("network") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      errorMessage = `网络连接失败\n\n建议：\n1. 检查网络连接\n2. 确认 Base URL 是否正确\n3. 检查防火墙设置`;
    }

    return new Error(errorMessage);
  }
}
