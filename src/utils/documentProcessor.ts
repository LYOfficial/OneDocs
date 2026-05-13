import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { appDataDir } from "@tauri-apps/api/path";
import { mkdir, writeFile } from "@tauri-apps/plugin-fs";
import { extractPdfImages } from "@/services/pdfImageExtractor";
import { useAppStore } from "@/store/useAppStore";
import type {
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

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export class DocumentProcessor {
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

  /**
   * Extract a complete analysis bundle from a PDF file.
   *
   * Pipeline:
   * 1. Extract text using pdfjs
   * 2. Save PDF to data directory
   * 3. Call Rust extract_pdf_images to extract embedded images (lopdf + easyyun API fallback)
   * 4. Return combined bundle
   */
  static async extractAnalysisBundle(
    file: File,
    outputRoot?: string,
  ): Promise<DocumentAnalysisBundle> {
    const fileType = file.type as SupportedFileType;

    if (fileType !== "application/pdf") {
      throw new Error(`不支持的文件格式: ${fileType}，仅支持 PDF 文件`);
    }

    try {
      // Step 1: Read the file into an ArrayBuffer.
      // IMPORTANT: pdfjsLib.getDocument() transfers ownership of the underlying
      // ArrayBuffer to the Web Worker, which detaches it. We must create a copy
      // for the file-saving step BEFORE passing it to pdfjs.
      const arrayBuffer = await file.arrayBuffer();
      const arrayBufferForSave = arrayBuffer.slice(0);  // copy before pdfjs consumes it

      // Step 2: Extract text using pdfjs
      const pdf = await this.loadPdfDocument(arrayBuffer);
      const pageTexts: string[] = [];
      let fullText = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .trim();

        pageTexts.push(pageText);
        fullText += `\n=== 第 ${pageNum} 页 ===\n${pageText}\n`;
      }

      if (fullText.trim().length === 0) {
        throw new Error("PDF文件中未检测到文本内容，可能是图片扫描版PDF");
      }

      // Step 3: Save PDF to data directory and extract images via Rust
      let imageAssets: DocumentImageAsset[] = [];
      const baseDir = outputRoot
        ? this.normalizePath(outputRoot)
        : this.normalizePath(await appDataDir());

      // Use a short hash of the file content to avoid folder name collisions
      const hashDir = await this.computeShortHash(arrayBufferForSave);
      const imageDir = `${baseDir}/${hashDir}_pdf_assets`;

      try {
        await mkdir(imageDir, { recursive: true });

        // Save PDF file to data directory for Rust processing
        // Use the pre-copied buffer since the original may have been detached by pdfjs
        const pdfPath = `${baseDir}/${hashDir}_input.pdf`;
        await writeFile(pdfPath, new Uint8Array(arrayBufferForSave));

        pushDevLog("info", "document-processor", "PDF 已保存到数据目录，准备提取图片", {
          pdfPath,
          imageDir,
          hashDir,
          fileSize: arrayBufferForSave.byteLength,
        });

        // Step 3: Call Rust to extract images (lopdf + easyyun API fallback)
        imageAssets = await extractPdfImages(pdfPath, imageDir, hashDir);
        console.log(`[DocumentProcessor] 图片提取完成: ${imageAssets.length} 张图片`,
          imageAssets.map(img => ({ page: img.pageNumber, name: img.fileName, path: img.localPath })));

        pushDevLog("info", "document-processor", `图片提取完成: ${imageAssets.length} 张`, {
          imageCount: imageAssets.length,
          hashDir,
          images: imageAssets.map(img => ({ page: img.pageNumber, name: img.fileName, path: img.localPath })),
        });
      } catch (imageError: any) {
        console.warn("PDF 图片提取失败，继续无图片分析:", imageError);
        pushDevLog("warn", "document-processor", "PDF 图片提取失败，继续无图片分析", {
          error: imageError?.message || String(imageError),
        });
        // Images are optional - continue without them
      }

      // Note: No page-render fallback — we only want actual embedded images,
      // not full-page screenshots. The Rust backend (lopdf) handles extraction.

      // Build pageImageMap: for each page, record which images and a text snippet
      const pageImageMap: PageImageMap[] = [];
      for (let i = 0; i < pageTexts.length; i++) {
        const pageNum = i + 1;
        const pageImages = imageAssets.filter(img => img.pageNumber === pageNum);
        const textSnippet = (pageTexts[i] || "").substring(0, 200).trim();
        if (pageImages.length > 0 || textSnippet) {
          pageImageMap.push({
            pageNumber: pageNum,
            textSnippet,
            imageFileNames: pageImages.map(img => img.fileName),
          });
        }
      }

      return {
        text: fullText.trim(),
        pageTexts,
        images: imageAssets,
        pageImageMap,
        pageCount: pdf.numPages,
        hashDir,
      };
    } catch (error: any) {
      console.error("PDF解析错误:", error);
      const message = error?.message || String(error) || "未知错误";
      if (message.includes("图片扫描版")) {
        throw error;
      }
      throw new Error(
        `PDF文件解析失败：${message}，请确认文件格式正确`,
      );
    }
  }

  static async extractContent(file: File): Promise<string> {
    const fileType = file.type as SupportedFileType;

    if (fileType !== "application/pdf") {
      throw new Error(`不支持的文件格式: ${fileType}，仅支持 PDF 文件`);
    }

    return await this.extractPDFText(file);
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
        `PDF文件解析失败：${error?.message || "未知错误"}，请确认文件格式正确`,
      );
    }
  }

  /**
   * Compute a short 12-character hex hash from an ArrayBuffer using SubtleCrypto.
   * This provides a unique, collision-resistant directory name for each document.
   */
  private static async computeShortHash(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = new Uint8Array(hashBuffer);
    // Take first 6 bytes (12 hex chars) — sufficient for uniqueness
    const hex = Array.from(hashArray.slice(0, 6))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hex;
  }

  private static normalizePath(pathValue: string): string {
    return pathValue.replace(/[\\/]+$/, "").replace(/\\/g, "/");
  }

  static isValidFileType(type: string): type is SupportedFileType {
    const supportedTypes: SupportedFileType[] = [
      "application/pdf",
    ];
    return supportedTypes.includes(type as SupportedFileType);
  }

  static getFileTypeHint(type: SupportedFileType): string {
    const hints: Record<SupportedFileType, string> = {
      "application/pdf": "已选择PDF文件，正在准备解析...",
    };
    return hints[type] || "已选择文件";
  }
}
