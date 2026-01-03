// Dense Embeddings Service
// Uses OpenAI text-embedding-3-small for cost-effective embeddings

import { TextChunk } from './types';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

interface EmbeddingResponse {
  embedding: number[];
  tokensUsed: number;
}

interface BatchEmbeddingResponse {
  embeddings: number[][];
  totalTokens: number;
}

/**
 * Get embedding for a single text
 */
export async function getEmbedding(text: string): Promise<EmbeddingResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }

  const data = await response.json();
  return {
    embedding: data.data[0].embedding,
    tokensUsed: data.usage.total_tokens,
  };
}

/**
 * Get embeddings for multiple texts (batched for efficiency)
 */
export async function getBatchEmbeddings(
  texts: string[]
): Promise<BatchEmbeddingResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // OpenAI allows up to 2048 inputs per batch
  const BATCH_SIZE = 100;
  const allEmbeddings: number[][] = [];
  let totalTokens = 0;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: batch,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Embedding API error: ${error}`);
    }

    const data = await response.json();
    totalTokens += data.usage.total_tokens;

    // Sort by index to maintain order
    const sortedData = data.data.sort(
      (a: { index: number }, b: { index: number }) => a.index - b.index
    );
    for (const item of sortedData) {
      allEmbeddings.push(item.embedding);
    }
  }

  return {
    embeddings: allEmbeddings,
    totalTokens,
  };
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Embed chunks and store embeddings
 * Returns chunks with embeddings attached
 */
export async function embedChunks(
  chunks: TextChunk[]
): Promise<{ chunks: TextChunk[]; tokensUsed: number }> {
  // Filter chunks that don't have embeddings yet
  const chunksToEmbed = chunks.filter((c) => !c.embedding);

  if (chunksToEmbed.length === 0) {
    return { chunks, tokensUsed: 0 };
  }

  const texts = chunksToEmbed.map((c) => c.text);
  const { embeddings, totalTokens } = await getBatchEmbeddings(texts);

  // Attach embeddings to chunks
  let embedIndex = 0;
  const embeddedChunks = chunks.map((chunk) => {
    if (!chunk.embedding) {
      return {
        ...chunk,
        embedding: embeddings[embedIndex++],
      };
    }
    return chunk;
  });

  return {
    chunks: embeddedChunks,
    tokensUsed: totalTokens,
  };
}

/**
 * Dense retrieval using cosine similarity
 */
export async function denseSearch(
  query: string,
  chunks: TextChunk[],
  topK: number = 20
): Promise<{ results: Array<{ chunk: TextChunk; score: number }>; tokensUsed: number }> {
  // Get query embedding
  const { embedding: queryEmbedding, tokensUsed } = await getEmbedding(query);

  // Calculate similarities
  const results = chunks
    .filter((chunk) => chunk.embedding) // Only chunks with embeddings
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding!),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return { results, tokensUsed };
}
