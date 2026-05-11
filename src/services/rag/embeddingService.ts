/**
 * Local embedding service using fallback hash-based embeddings
 * 
 * This module provides embedding generation using simple hash-based
 * pseudo-vectors for demo/testing purposes.
 */

import type { TextChunk } from '@/types';

/** Generate embedding for a single text using fallback */
export async function generateEmbedding(text: string): Promise<number[]> {
  return generateFallbackEmbedding(text);
}

/** Generate embeddings for multiple chunks in batch */
export async function generateEmbeddingsForChunks(
  chunks: Array<{ id: string; content: string }>
): Promise<Map<string, number[]>> {
  const results = new Map<string, number[]>();
  
  for (const chunk of chunks) {
    results.set(chunk.id, generateFallbackEmbedding(chunk.content));
  }
  
  return results;
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
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, topK);
}

/**
 * Fallback embedding using simple hash (for demo purposes)
 * NOT a real embedding - produces deterministic pseudo-vectors
 */
export function generateFallbackEmbedding(text: string): number[] {
  const dim = 384; // Standard embedding dimension
  const embedding = new Array(dim).fill(0);
  
  // Simple hash-based pseudo-embedding
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const idx = (charCode * (i + 1) * 31) % dim;
    embedding[idx] += charCode / 255;
  }
  
  // Normalize
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
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Get chunks with embeddings
  const chunksWithEmbeddings = chunks
    .filter((c) => c.embedding && c.embedding.length > 0)
    .map((chunk) => ({
      chunk,
      embedding: chunk.embedding!,
    }));
  
  // Find top-k similar
  return findTopKSimilar(queryEmbedding, chunksWithEmbeddings, topK);
}