/**
 * PDF Image Extraction Service
 *
 * Extracts images from PDF files using:
 * 1. Rust-side lopdf extraction (primary, works offline)
 * 2. easyyun API fallback (requires publicly accessible PDF URL)
 *
 * Extracted images are saved to the data directory.
 */

import { invoke } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";
import { mkdir } from "@tauri-apps/plugin-fs";
import { useAppStore } from "@/store/useAppStore";
import type { DocumentImageAsset } from "@/types";

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

interface ExtractedImage {
  page_number: number;
  file_name: string;
  local_path: string;
}

interface ExtractImagesResult {
  images: ExtractedImage[];
}

/**
 * Extract images from a PDF file.
 *
 * The Rust backend will:
 * 1. Try to extract embedded images using lopdf
 * 2. If no embedded images found, try the easyyun API as fallback
 *
 * @param pdfPath - Local path to the PDF file
 * @param outputDir - Directory to save extracted images
 * @param baseName - Base name for output image files
 * @returns Array of DocumentImageAsset
 */
export async function extractPdfImages(
  pdfPath: string,
  outputDir: string,
  baseName: string,
): Promise<DocumentImageAsset[]> {
  pushDevLog("info", "image-extract", "开始调用 Rust 提取 PDF 图片", {
    pdfPath,
    outputDir,
    baseName,
  });

  try {
    const resultJson = await invoke<string>("extract_pdf_images", {
      pdfPath,
      outputDir,
      baseName,
    });

    const result: ExtractImagesResult = JSON.parse(resultJson || "{}");

    if (!result.images || !Array.isArray(result.images)) {
      pushDevLog("warn", "image-extract", "Rust 返回的图片数据为空或格式异常", {
        resultJson: resultJson?.substring(0, 500),
      });
      return [];
    }

    const assets = result.images.map((img) => ({
      pageNumber: img.page_number,
      fileName: img.file_name,
      localPath: img.local_path,
    }));

    pushDevLog("info", "image-extract", `PDF 图片提取成功: ${assets.length} 张`, {
      images: assets.map((a) => ({ page: a.pageNumber, name: a.fileName, path: a.localPath })),
    });

    return assets;
  } catch (error: any) {
    console.error("PDF 图片提取失败:", error);
    pushDevLog("error", "image-extract", "PDF 图片提取失败", {
      error: error?.message || String(error),
      pdfPath,
    });
    // Return empty array rather than throwing - images are optional
    return [];
  }
}

/**
 * Save a PDF file to the app data directory and return its path.
 * This is needed before calling extract_pdf_images.
 */
export async function savePdfToDataDir(
  file: File,
  dataDir?: string,
): Promise<{ pdfPath: string; baseName: string; imageDir: string }> {
  const baseName = file.name.replace(/\.[^./\\]+$/, "").replace(/[\\/:*?"<>|]+/g, "_").trim() || "OneDocs";
  const baseDir = dataDir
    ? dataDir.replace(/[\\/]+$/, "").replace(/\\/g, "/")
    : (await appDataDir()).replace(/[\\/]+$/, "").replace(/\\/g, "/");

  const imageDir = `${baseDir}/${baseName}_pdf_assets`;
  const pdfPath = `${baseDir}/${baseName}_input.pdf`;

  pushDevLog("info", "image-extract", "保存 PDF 到数据目录", {
    fileName: file.name,
    fileSize: file.size,
    pdfPath,
    imageDir,
  });

  await mkdir(imageDir, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  const { writeFile } = await import("@tauri-apps/plugin-fs");
  await writeFile(pdfPath, new Uint8Array(arrayBuffer));

  pushDevLog("info", "image-extract", "PDF 文件保存成功", {
    pdfPath,
    imageDir,
  });

  return { pdfPath, baseName, imageDir };
}
