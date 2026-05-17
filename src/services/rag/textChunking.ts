/**
 * Text chunking utilities for RAG
 * 
 * Strategy:
 * - Chunk by paragraphs first (natural semantic boundaries)
 * - If paragraph is too large, split by sentences
 * - If sentence is too large, split by token count approximation
 */

export interface ChunkResult {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  sourcePage: number;
  chunkIndex: number;
}

/** Split text into chunks with a target size and overlap */
export function chunkText(
  text: string,
  pageTexts: string[],
  options: {
    targetChunkSize?: number;  // target characters per chunk (default 500)
    overlapChars?: number;     // overlap between chunks (default 50)
    minChunkSize?: number;     // minimum chunk size (default 100)
  } = {}
): ChunkResult[] {
  const {
    targetChunkSize = 500,
    overlapChars = 50,
    minChunkSize = 100,
  } = options;

  const chunks: ChunkResult[] = [];
  let chunkIndex = 0;
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  
  let currentChunk = '';
  let currentStart = 0;
  
  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx].trim();
    if (!para) continue;
    
    // Find which page this paragraph belongs to
    const pageStart = findPageForPosition(pageTexts, text.indexOf(para, currentStart));
    
    // If adding this paragraph exceeds target size
    if (currentChunk.length + para.length + 2 > targetChunkSize && currentChunk.length >= minChunkSize) {
      // Save current chunk
      chunks.push({
        id: `chunk_${chunkIndex}_${Date.now()}`,
        content: currentChunk.trim(),
        startIndex: currentStart,
        endIndex: currentStart + currentChunk.length,
        sourcePage: pageStart,
        chunkIndex,
      });
      chunkIndex++;
      
      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-overlapChars);
      currentChunk = overlapText;
      currentStart = currentStart + currentChunk.length - overlapChars;
    }
    
    if (currentChunk.length === 0) {
      currentChunk = para;
      currentStart = text.indexOf(para, currentStart === 0 ? 0 : currentStart - 1);
      if (currentStart === -1) currentStart = 0;
    } else {
      currentChunk += '\n\n' + para;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim().length >= minChunkSize) {
    const lastPage = findPageForPosition(pageTexts, currentStart + currentChunk.length - 1);
    chunks.push({
      id: `chunk_${chunkIndex}_${Date.now()}`,
      content: currentChunk.trim(),
      startIndex: currentStart,
      endIndex: currentStart + currentChunk.length,
      sourcePage: lastPage,
      chunkIndex,
    });
  }
  
  return chunks;
}

/** Find which page a character position belongs to */
function findPageForPosition(pageTexts: string[], position: number): number {
  if (!pageTexts || pageTexts.length === 0) return 0;
  
  let charCount = 0;
  for (let i = 0; i < pageTexts.length; i++) {
    charCount += pageTexts[i].length;
    if (position < charCount) {
      return i + 1; // 1-indexed
    }
  }
  return pageTexts.length;
}

/** Simple approximate token count (Chinese chars count as 1, English words as ~1.5) */
export function approximateTokenCount(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  // Rough approximation: 1 Chinese char ≈ 1 token, 1 English word ≈ 1.5 tokens
  return chineseChars + englishWords * 1.5;
}