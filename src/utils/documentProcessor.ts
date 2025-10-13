import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import JSZip from "jszip";
import type { SupportedFileType } from "@/types";

// 设置 PDF.js worker - 使用 CDN 以确保稳定性
if (typeof window !== "undefined") {
  // 使用与安装版本 4.10.38 匹配的 worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
}

export class DocumentProcessor {
  /**
   * 提取文件内容
   */
  static async extractContent(file: File): Promise<string> {
    const fileType = file.type as SupportedFileType;

    switch (fileType) {
      case "text/plain":
        return await this.extractTextFile(file);

      case "application/pdf":
        return await this.extractPDFText(file);

      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return await this.extractWordText(file);

      case "application/vnd.ms-powerpoint":
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        return await this.extractPowerPointText(file);

      default:
        throw new Error(`不支持的文件格式: ${fileType}`);
    }
  }

  /**
   * 提取纯文本文件
   */
  private static async extractTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content || content.trim().length === 0) {
          reject(new Error("文本文件内容为空"));
        } else {
          resolve(content);
        }
      };

      reader.onerror = () => reject(new Error("文件读取失败"));
      reader.readAsText(file, "UTF-8");
    });
  }

  /**
   * 提取 PDF 文本
   */
  private static async extractPDFText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      // 遍历所有页面
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // 提取文本内容
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");

        fullText += `\n=== 第 ${pageNum} 页 ===\n${pageText}\n`;
      }

      if (fullText.trim().length === 0) {
        throw new Error("PDF文件中未检测到文本内容，可能是图片扫描版PDF");
      }

      return fullText.trim();
    } catch (error: any) {
      console.error("PDF解析错误:", error);
      if (error.message?.includes("图片扫描版")) {
        throw error;
      }
      throw new Error("PDF文件解析失败，请确认文件格式正确或尝试转换为TXT格式");
    }
  }

  /**
   * 提取 Word 文档文本
   */
  private static async extractWordText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });

      if (!result.value || result.value.trim().length === 0) {
        throw new Error("Word文档中未检测到文本内容");
      }

      // 记录警告信息
      if (result.messages && result.messages.length > 0) {
        console.warn("Word文档解析警告:", result.messages);
      }

      return result.value.trim();
    } catch (error: any) {
      console.error("Word文档解析错误:", error);
      throw new Error(`Word文档解析失败：${error.message}`);
    }
  }

  /**
   * 提取 PowerPoint 文本
   */
  private static async extractPowerPointText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      let fullText = "";

      // PPTX 文件中的幻灯片存储在 ppt/slides/ 目录下
      const slideFiles = Object.keys(zip.files).filter(
        (filename) =>
          filename.startsWith("ppt/slides/slide") && filename.endsWith(".xml"),
      );

      // 按幻灯片编号排序
      slideFiles.sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || "0");
        const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || "0");
        return numA - numB;
      });

      // 提取每个幻灯片的文本
      for (const filename of slideFiles) {
        const content = await zip.files[filename].async("string");

        // 从 XML 中提取文本内容（a:t 标签内的文本）
        const textMatches = content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);

        if (textMatches) {
          const slideNumber = filename.match(/slide(\d+)\.xml/)?.[1];
          fullText += `\n\n--- 幻灯片 ${slideNumber} ---\n`;

          textMatches.forEach((match) => {
            const text = match.replace(/<a:t[^>]*>([^<]+)<\/a:t>/, "$1");
            fullText += text + "\n";
          });
        }
      }

      if (!fullText || fullText.trim().length === 0) {
        throw new Error("PowerPoint文档中未检测到文本内容");
      }

      console.log(`成功解析 ${slideFiles.length} 张幻灯片`);
      return fullText.trim();
    } catch (error: any) {
      console.error("PowerPoint文档解析错误:", error);
      if (error.message?.includes("处理库未加载")) {
        throw error;
      }
      throw new Error(
        "PowerPoint文档解析失败，请确认文件格式正确或尝试转换为TXT格式",
      );
    }
  }

  /**
   * 验证文件类型
   */
  static isValidFileType(type: string): type is SupportedFileType {
    const supportedTypes: SupportedFileType[] = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ];
    return supportedTypes.includes(type as SupportedFileType);
  }

  /**
   * 获取文件类型友好提示
   */
  static getFileTypeHint(type: SupportedFileType): string {
    const hints: Record<SupportedFileType, string> = {
      "application/pdf": "已选择PDF文件，正在准备解析...",
      "application/msword": "已选择Word文档，正在准备解析...",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "已选择Word文档，正在准备解析...",
      "application/vnd.ms-powerpoint": "已选择PowerPoint文档，正在准备解析...",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "已选择PowerPoint文档，正在准备解析...",
      "text/plain": "已选择TXT文件，解析速度最快",
    };
    return hints[type] || "已选择文件";
  }
}
