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
import type { DocumentImageAsset } from "@/types";

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
  try {
    const resultJson = await invoke<string>("extract_pdf_images", {
      pdfPath,
      outputDir,
      baseName,
    });

    const result: ExtractImagesResult = JSON.parse(resultJson || "{}");

    if (!result.images || !Array.isArray(result.images)) {
      return [];
    }

    return result.images.map((img) => ({
      pageNumber: img.page_number,
      fileName: img.file_name,
      localPath: img.local_path,
    }));
  } catch (error) {
    console.error("PDF 图片提取失败:", error);
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

  await mkdir(imageDir, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  const { writeFile } = await import("@tauri-apps/plugin-fs");
  await writeFile(pdfPath, new Uint8Array(arrayBuffer));

  return { pdfPath, baseName, imageDir };
}
