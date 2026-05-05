import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";
import JSZip from "jszip";
import ExcelJS from "exceljs";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";
import { mkdir, writeFile } from "@tauri-apps/plugin-fs";
import type {
  DocumentAnalysisBundle,
  DocumentImageAsset,
  SupportedFileType,
} from "@/types";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export class DocumentProcessor {
  private static isTauriRuntime(): boolean {
    return (
      typeof window !== "undefined" &&
      Object.prototype.hasOwnProperty.call(window, "__TAURI__")
    );
  }

  private static async loadPdfDocument(arrayBuffer: ArrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    try {
      return await pdfjsLib.getDocument({
        data,
        useSystemFonts: true,
        disableAutoFetch: true,
      }).promise;
    } catch (error) {
      console.warn("PDF 解析失败，改用主线程模式", error);
      try {
        return await pdfjsLib.getDocument({
          data,
          disableWorker: true,
          useSystemFonts: true,
          disableAutoFetch: true,
        }).promise;
      } catch (fallbackError) {
        console.warn("主线程解析失败，改用字节数组模式", fallbackError);
        return await pdfjsLib.getDocument({
          data,
          disableWorker: true,
          isEvalSupported: false,
          useSystemFonts: true,
        }).promise;
      }
    }
  }

  static async extractAnalysisBundle(
    file: File,
    outputRoot?: string,
  ): Promise<DocumentAnalysisBundle> {
    const fileType = file.type as SupportedFileType;

    switch (fileType) {
      case "application/pdf":
        if (this.isTauriRuntime()) {
          return await this.extractPDFAnalysisBundleWithContentCore(file, outputRoot);
        }
        return await this.extractPDFAnalysisBundle(file, outputRoot);

      case "text/plain":
      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "application/vnd.ms-powerpoint":
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      case "application/vnd.ms-excel":
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        return {
          text: await this.extractContent(file),
          pageTexts: [],
          images: [],
          pageCount: 0,
        };

      default:
        throw new Error(`不支持的文件格式: ${fileType}`);
    }
  }

  static async extractContent(file: File): Promise<string> {
    const fileType = file.type as SupportedFileType;

    switch (fileType) {
      case "text/plain":
        return await this.extractTextFile(file);

      case "application/pdf":
        if (this.isTauriRuntime()) {
          const bundle = await this.extractPDFAnalysisBundleWithContentCore(file);
          return bundle.text;
        }
        return await this.extractPDFText(file);

      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return await this.extractWordText(file);

      case "application/vnd.ms-powerpoint":
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        return await this.extractPowerPointText(file);

      case "application/vnd.ms-excel":
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        return await this.extractExcelText(file);

      default:
        throw new Error(`不支持的文件格式: ${fileType}`);
    }
  }

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

  private static async extractPDFText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await this.loadPdfDocument(arrayBuffer);
      let fullText = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

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
      throw new Error(
        `PDF文件解析失败：${error?.message || "未知错误"}，请确认文件格式正确或尝试转换为TXT格式`,
      );
    }
  }

  private static async extractPDFAnalysisBundle(
    file: File,
    outputRoot?: string,
  ): Promise<DocumentAnalysisBundle> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await this.loadPdfDocument(arrayBuffer);
      const pageTexts: string[] = [];
      const imageAssets: DocumentImageAsset[] = [];
      let fullText = "";

      const baseName = this.sanitizeFileStem(file.name) || "OneDocs";
      const imageFolder = outputRoot
        ? `${this.normalizePath(outputRoot)}/${baseName}_pdf_assets`
        : "";

      if (imageFolder) {
        await mkdir(imageFolder, { recursive: true });
      }

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .trim();

        pageTexts.push(pageText);
        fullText += `\n=== 第 ${pageNum} 页 ===\n${pageText}\n`;

        {
          try {
            const pageImage = await this.renderPdfPageToImage(
              page,
              pageNum,
              imageFolder,
              baseName,
            );
            if (pageImage) {
              imageAssets.push(pageImage);
            }
          } catch (imageError) {
            console.warn(`PDF 页面渲染失败，跳过图片: 第 ${pageNum} 页`, imageError);
          }
        }
      }

      if (fullText.trim().length === 0) {
        throw new Error("PDF文件中未检测到文本内容，可能是图片扫描版PDF");
      }

      return {
        text: fullText.trim(),
        pageTexts,
        images: imageAssets,
        pageCount: pdf.numPages,
      };
    } catch (error: any) {
      console.error("PDF解析错误:", error);
      const message = error?.message || String(error) || "未知错误";
      if (message.includes("图片扫描版")) {
        throw error;
      }
      throw new Error(
        `PDF文件解析失败：${message}，请确认文件格式正确或尝试转换为TXT格式`,
      );
    }
  }

  private static async extractPDFAnalysisBundleWithContentCore(
    file: File,
    outputRoot?: string,
  ): Promise<DocumentAnalysisBundle> {
    const arrayBuffer = await file.arrayBuffer();
    const baseName = this.sanitizeFileStem(file.name) || "OneDocs";
    const baseDir = outputRoot
      ? this.normalizePath(outputRoot)
      : this.normalizePath(await appDataDir());
    const imageFolder = `${baseDir}/${baseName}_contentcore_assets`;
    const inputPath = `${baseDir}/${baseName}_contentcore_input.pdf`;

    await mkdir(imageFolder, { recursive: true });
    await writeFile(inputPath, new Uint8Array(arrayBuffer));
    try {
      const result = await invoke<string>("extract_pdf_analysis_bundle_embedded", {
        inputPath,
        outputRoot: imageFolder,
        baseName,
      });
      const payload = JSON.parse(result || "{}");
      return {
        text: String(payload.text || "").trim(),
        pageTexts: Array.isArray(payload.pageTexts) ? payload.pageTexts : [],
        images: Array.isArray(payload.images) ? payload.images : [],
        pageCount: Number(payload.pageCount || 0),
      };
    } catch (error) {
      throw new Error(`content-core 返回结果解析失败，请重试：${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private static async renderPdfPageToImage(
    page: any,
    pageNum: number,
    imageFolder: string,
    baseName: string,
  ): Promise<DocumentImageAsset | null> {
    if (typeof document === "undefined") {
      return null;
    }

    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    try {
      await page.render({ canvasContext: context, viewport }).promise;
    } catch (error) {
      console.warn(`PDF 页面渲染失败：第 ${pageNum} 页`, error);
      return null;
    }

    let dataUrl = "";
    try {
      dataUrl = canvas.toDataURL("image/png");
    } catch (error) {
      console.warn(`PDF 页面导出失败：第 ${pageNum} 页`, error);
      return null;
    }
    const fileName = `${baseName}_page_${String(pageNum).padStart(3, "0")}.png`;
    const localPath = imageFolder ? `${imageFolder}/${fileName}` : "";

    if (localPath) {
      try {
        await mkdir(imageFolder, { recursive: true });
        await writeFile(localPath, this.dataUrlToBytes(dataUrl));
      } catch (error) {
        console.warn(`写入 PDF 页面图片失败：${fileName}`, error);
      }
    }

    return {
      pageNumber: pageNum,
      fileName,
      localPath,
      dataUrl,
    };
  }

  private static dataUrlToBytes(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(",")[1] || "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  }

  private static sanitizeFileStem(fileName: string): string {
    return fileName.replace(/\.[^./\\]+$/, "").replace(/[\\/:*?"<>|]+/g, "_").trim();
  }

  private static normalizePath(pathValue: string): string {
    return pathValue.replace(/[\\/]+$/, "").replace(/\\/g, "/");
  }

  private static async extractWordText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });

      if (!result.value || result.value.trim().length === 0) {
        throw new Error("Word文档中未检测到文本内容");
      }

      if (result.messages && result.messages.length > 0) {
        console.warn("Word文档解析警告:", result.messages);
      }

      return result.value.trim();
    } catch (error: any) {
      console.error("Word文档解析错误:", error);
      throw new Error(`Word文档解析失败：${error.message}`);
    }
  }

  private static async extractPowerPointText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      let fullText = "";

      const slideFiles = Object.keys(zip.files).filter(
        (filename) =>
          filename.startsWith("ppt/slides/slide") && filename.endsWith(".xml"),
      );

      slideFiles.sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || "0");
        const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || "0");
        return numA - numB;
      });

      for (const filename of slideFiles) {
        const content = await zip.files[filename].async("string");

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

  private static async extractExcelText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      let fullText = "";

      workbook.eachSheet((worksheet) => {
        let sheetText = "";
        worksheet.eachRow((row) => {
          const cells: string[] = [];
          row.eachCell((cell) => {
            if (cell.value !== undefined && cell.value !== null) {
              const value =
                typeof cell.value === "object"
                  ? JSON.stringify(cell.value)
                  : String(cell.value);
              cells.push(value);
            }
          });
          if (cells.length > 0) {
            sheetText += cells.join("\t") + "\n";
          }
        });
        
        if (sheetText.trim().length > 0) {
          fullText += `\n=== 工作表：${worksheet.name} ===\n${sheetText}\n`;
        }
      });

      if (fullText.trim().length === 0) {
        throw new Error("Excel 文档中未检测到文本内容");
      }

      return fullText.trim();
    } catch (error: any) {
      console.error("Excel 解析错误:", error);
      throw new Error(`Excel 解析失败：${error.message}`);
    }
  }

  static isValidFileType(type: string): type is SupportedFileType {
    const supportedTypes: SupportedFileType[] = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];
    return supportedTypes.includes(type as SupportedFileType);
  }

  static getFileTypeHint(type: SupportedFileType): string {
    const hints: Record<SupportedFileType, string> = {
      "application/pdf": "已选择PDF文件，正在准备解析...",
      "application/msword": "已选择Word文档，正在准备解析...",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "已选择Word文档，正在准备解析...",
      "application/vnd.ms-powerpoint": "已选择PowerPoint文档，正在准备解析...",
      "application/vnd.ms-excel": "已选择Excel表格，正在准备解析...",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "已选择Excel表格，正在准备解析...",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "已选择PowerPoint文档，正在准备解析...",
      "text/plain": "已选择TXT文件，解析速度最快",
    };
    return hints[type] || "已选择文件";
  }
}
