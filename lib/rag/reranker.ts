// Cohere Reranker
// Uses Cohere's rerank API for high-quality relevance scoring

import { TextChunk, RerankResult } from './types';

const COHERE_RERANK_MODEL = 'rerank-english-v3.0';

interface CohereRerankResponse {
  results: Array<{
    index: number;
    relevance_score: number;
  }>;
}

/**
 * Rerank chunks using Cohere's rerank API
 * Cost: ~$0.002 per 1000 search units (very cheap)
 */
export async function cohereRerank(
  query: string,
  chunks: TextChunk[],
  topK: number = 10
): Promise<RerankResult[]> {
  const apiKey = process.env.COHERE_API_KEY;

  // If no API key, fall back to original ordering
  if (!apiKey) {
    console.warn('COHERE_API_KEY not configured, skipping reranking');
    return chunks.slice(0, topK).map((chunk, i) => ({
      chunk,
      score: 1 - i * 0.1, // Preserve original order with decreasing scores
      relevanceScore: 1 - i * 0.1,
    }));
  }

  try {
    const response = await fetch('https://api.cohere.ai/v1/rerank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Client-Name': 'academic-writing-platform',
      },
      body: JSON.stringify({
        model: COHERE_RERANK_MODEL,
        query,
        documents: chunks.map((c) => c.text),
        top_n: topK,
        return_documents: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Cohere rerank error:', error);
      // Fall back to original ordering
      return chunks.slice(0, topK).map((chunk, i) => ({
        chunk,
        score: 1 - i * 0.1,
        relevanceScore: 1 - i * 0.1,
      }));
    }

    const data: CohereRerankResponse = await response.json();

    // Map results back to chunks
    const results: RerankResult[] = data.results.map((r) => ({
      chunk: chunks[r.index],
      score: r.relevance_score,
      relevanceScore: r.relevance_score,
    }));

    return results;
  } catch (error) {
    console.error('Cohere rerank failed:', error);
    // Fall back to original ordering
    return chunks.slice(0, topK).map((chunk, i) => ({
      chunk,
      score: 1 - i * 0.1,
      relevanceScore: 1 - i * 0.1,
    }));
  }
}

/**
 * Simple relevance scorer when Cohere is not available
 * Uses query term overlap and position-based scoring
 */
export function simpleRerank(
  query: string,
  chunks: TextChunk[],
  topK: number = 10
): RerankResult[] {
  const queryTerms = new Set(
    query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );

  const scored = chunks.map((chunk) => {
    const text = chunk.text.toLowerCase();
    let score = 0;

    // Term overlap score
    for (const term of queryTerms) {
      if (text.includes(term)) {
        score += 1;
        // Bonus for exact phrase matches
        if (text.includes(query.toLowerCase())) {
          score += 2;
        }
      }
    }

    // Normalize by query length
    score = score / queryTerms.size;

    // Section boost
    const section = chunk.section?.toLowerCase() || '';
    if (section.includes('abstract') || section.includes('conclusion')) {
      score *= 1.3;
    } else if (section.includes('result') || section.includes('discussion')) {
      score *= 1.2;
    }

    return {
      chunk,
      score,
      relevanceScore: Math.min(score, 1), // Cap at 1
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
