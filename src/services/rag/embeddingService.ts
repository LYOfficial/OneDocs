/**
 * SiliconFlow Embedding Service
 *
 * Uses BAAI/bge-m3 (8192 token limit, 1024-dim) via SiliconFlow API.
 * Falls back to hash-based pseudo-embeddings when no token is available.
 *
 * API docs: https://docs.siliconflow.cn/cn/api-reference/embeddings/create-embeddings
 * Endpoint: POST https://api.siliconflow.cn/v1/embeddings
 */

import type { TextChunk } from '@/types';

const SILICONFLOW_EMBED_URL = 'https://api.siliconflow.cn/v1/embeddings';
export const EMBEDDING_MODEL = 'BAAI/bge-m3';
const EMBEDDING_DIM = 1024; // bge-m3 outputs 1024-dim vectors

/** Get the active SiliconFlow token: user-provided > env default */
function getToken(): string | null {
  // Priority: user-set token in localStorage > env default
  try {
    const stored = localStorage.getItem('onedocs-sf-token');
    if (stored) return stored;
  } catch { /* ignore */ }
  const envToken = import.meta.env.VITE_SILICONFLOW_TOKEN;
  if (envToken) return envToken;
  return null;
}

/** Check if a real embedding token is available */
export function hasEmbeddingToken(): boolean {
  return Boolean(getToken());
}

/** Get the user's own SiliconFlow token (never exposes the env default) */
export function getUserEmbeddingToken(): string {
  try {
    return localStorage.getItem('onedocs-sf-token') || '';
  } catch { return ''; }
}

/** Set the user's SiliconFlow token */
export function setEmbeddingToken(token: string): void {
  try {
    if (token) {
      localStorage.setItem('onedocs-sf-token', token);
    } else {
      localStorage.removeItem('onedocs-sf-token');
    }
  } catch { /* ignore */ }
}

/** Check if user has set their own token (vs using the env default) */
export function hasUserEmbeddingToken(): boolean {
  try {
    return Boolean(localStorage.getItem('onedocs-sf-token'));
  } catch { return false; }
}

/** Get the number of free uses remaining (only relevant for env default token) */
export function getFreeEmbeddingUses(): number {
  try {
    const stored = localStorage.getItem('onedocs-sf-uses');
    if (stored) return Math.max(0, parseInt(stored, 10) || 0);
  } catch { /* ignore */ }
  return 3; // default 3 free uses with the env token
}

/** Decrement free use count */
export function decrementFreeEmbeddingUse(): void {
  try {
    const current = getFreeEmbeddingUses();
    localStorage.setItem('onedocs-sf-uses', String(current - 1));
  } catch { /* ignore */ }
}

/** Set free use count */
export function setFreeEmbeddingUses(count: number): void {
  try {
    localStorage.setItem('onedocs-sf-uses', String(count));
  } catch { /* ignore */ }
}

/** Check if embedding is available (has token or free uses remaining) */
export function isEmbeddingAvailable(): boolean {
  const token = getToken();
  if (!token) return false;
  // If user has their own token, always available
  if (hasUserEmbeddingToken()) return true;
  // Using env default token, check free uses
  return getFreeEmbeddingUses() > 0;
}

interface EmbeddingResponse {
  object: string;
  model: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call SiliconFlow embedding API
 */
async function callEmbeddingAPI(texts: string[], token: string): Promise<number[][]> {
  const response = await fetch(SILICONFLOW_EMBED_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
      encoding_format: 'float',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`SiliconFlow API error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const result: EmbeddingResponse = await response.json();

  if (!result.data || result.data.length === 0) {
    throw new Error('SiliconFlow API returned empty embeddings');
  }

  // Sort by index to maintain order
  result.data.sort((a, b) => a.index - b.index);
  return result.data.map((d) => d.embedding);
}

/**
 * Generate embedding for a single text using SiliconFlow API
 * Falls back to hash-based pseudo-embedding if no token or API fails
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const token = getToken();

  if (!token) {
    return generateFallbackEmbedding(text);
  }

  // Check free uses for env token
  if (!hasUserEmbeddingToken() && getFreeEmbeddingUses() <= 0) {
    console.warn('免费嵌入次数已用完，请配置自己的 SiliconFlow Token');
    return generateFallbackEmbedding(text);
  }

  try {
    const embeddings = await callEmbeddingAPI([text], token);
    // Decrement free use if using env token
    if (!hasUserEmbeddingToken()) decrementFreeEmbeddingUse();
    return embeddings[0];
  } catch (err) {
    console.warn('SiliconFlow embedding API failed, using fallback:', err);
    return generateFallbackEmbedding(text);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * Batches of 32 to stay within RPM limits
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  options: { decrementOnce?: boolean } = {}
): Promise<number[][]> {
  const token = getToken();

  if (!token) {
    return texts.map((t) => generateFallbackEmbedding(t));
  }

  // Check free uses for env token
  if (!hasUserEmbeddingToken() && getFreeEmbeddingUses() <= 0) {
    console.warn('免费嵌入次数已用完，请配置自己的 SiliconFlow Token');
    return texts.map((t) => generateFallbackEmbedding(t));
  }

  const BATCH_SIZE = 32;
  const { decrementOnce = true } = options;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    try {
      const batchEmbeddings = await callEmbeddingAPI(batch, token);
      allEmbeddings.push(...batchEmbeddings);
      if (!hasUserEmbeddingToken() && !decrementOnce) {
        decrementFreeEmbeddingUse();
      }
    } catch (err) {
      console.warn(`Batch embedding failed (batch ${i}), using fallback:`, err);
      allEmbeddings.push(...batch.map((t) => generateFallbackEmbedding(t)));
    }
  }

  if (!hasUserEmbeddingToken() && decrementOnce && texts.length > 0) {
    decrementFreeEmbeddingUse();
  }

  return allEmbeddings;
}

/**
 * Simple cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Find most similar chunks to a query
 */
export function findTopKSimilar(
  queryEmbedding: number[],
  chunksWithEmbeddings: Array<{ chunk: TextChunk; embedding: number[] }>,
  topK: number = 5
): Array<{ chunk: TextChunk; score: number }> {
  const scored = chunksWithEmbeddings.map(({ chunk, embedding }) => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * Fallback embedding using simple hash (for offline/no-token scenarios)
 * NOT a real embedding - produces deterministic pseudo-vectors
 */
export function generateFallbackEmbedding(text: string): number[] {
  const dim = EMBEDDING_DIM;
  const embedding = new Array(dim).fill(0);

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const idx = (charCode * (i + 1) * 31) % dim;
    embedding[idx] += charCode / 255;
  }

  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      embedding[i] /= norm;
    }
  }

  return embedding;
}

/**
 * Retrieve relevant chunks using RAG
 */
export async function retrieveRelevantChunks(
  chunks: TextChunk[],
  query: string,
  topK: number = 5
): Promise<Array<{ chunk: TextChunk; score: number }>> {
  const queryEmbedding = await generateEmbedding(query);

  const chunksWithEmbeddings = chunks
    .filter((c) => c.embedding && c.embedding.length > 0)
    .map((chunk) => ({
      chunk,
      embedding: chunk.embedding!,
    }));

  return findTopKSimilar(queryEmbedding, chunksWithEmbeddings, topK);
}