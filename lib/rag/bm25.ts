// BM25 Sparse Retrieval
// Implements Okapi BM25 algorithm for keyword-based retrieval

import { TextChunk, RetrievalResult } from './types';

// BM25 parameters (tuned for academic text)
const K1 = 1.5; // Term frequency saturation
const B = 0.75; // Length normalization

interface BM25Index {
  documents: TextChunk[];
  docFreq: Map<string, number>; // Document frequency for each term
  avgDocLength: number;
  totalDocs: number;
}

/**
 * Tokenize text into terms
 * Handles academic text with proper stemming-lite
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // Keep hyphens for compound terms
    .split(/\s+/)
    .filter((term) => term.length > 2) // Filter short terms
    .map((term) => {
      // Simple stemming for common suffixes
      if (term.endsWith('ing')) return term.slice(0, -3);
      if (term.endsWith('tion')) return term.slice(0, -4);
      if (term.endsWith('ly')) return term.slice(0, -2);
      if (term.endsWith('ed') && term.length > 4) return term.slice(0, -2);
      if (term.endsWith('s') && term.length > 3) return term.slice(0, -1);
      return term;
    });
}

/**
 * Build BM25 index from chunks
 */
export function buildBM25Index(chunks: TextChunk[]): BM25Index {
  const docFreq = new Map<string, number>();
  let totalLength = 0;

  // Calculate document frequencies
  for (const chunk of chunks) {
    const terms = new Set(tokenize(chunk.text));
    totalLength += chunk.text.length;

    for (const term of terms) {
      docFreq.set(term, (docFreq.get(term) || 0) + 1);
    }
  }

  return {
    documents: chunks,
    docFreq,
    avgDocLength: totalLength / chunks.length,
    totalDocs: chunks.length,
  };
}

/**
 * Calculate BM25 score for a document given a query
 */
function calculateBM25Score(
  queryTerms: string[],
  docTerms: string[],
  docLength: number,
  index: BM25Index
): number {
  let score = 0;
  const termFreq = new Map<string, number>();

  // Count term frequencies in document
  for (const term of docTerms) {
    termFreq.set(term, (termFreq.get(term) || 0) + 1);
  }

  for (const queryTerm of queryTerms) {
    const tf = termFreq.get(queryTerm) || 0;
    if (tf === 0) continue;

    const df = index.docFreq.get(queryTerm) || 0;
    if (df === 0) continue;

    // IDF component
    const idf = Math.log(
      (index.totalDocs - df + 0.5) / (df + 0.5) + 1
    );

    // TF component with length normalization
    const tfNorm =
      (tf * (K1 + 1)) /
      (tf + K1 * (1 - B + B * (docLength / index.avgDocLength)));

    score += idf * tfNorm;
  }

  return score;
}

/**
 * Search using BM25
 */
export function bm25Search(
  query: string,
  index: BM25Index,
  topK: number = 20
): RetrievalResult[] {
  const queryTerms = tokenize(query);
  const results: RetrievalResult[] = [];

  for (const chunk of index.documents) {
    const docTerms = tokenize(chunk.text);
    const score = calculateBM25Score(
      queryTerms,
      docTerms,
      chunk.text.length,
      index
    );

    if (score > 0) {
      results.push({
        chunk,
        score,
        source: 'bm25',
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, topK);
}

/**
 * Boost scores based on section importance
 */
export function applyAcademicBoosts(results: RetrievalResult[]): RetrievalResult[] {
  const sectionBoosts: Record<string, number> = {
    abstract: 1.5,
    introduction: 1.3,
    conclusion: 1.3,
    results: 1.2,
    discussion: 1.2,
    methods: 1.0,
    methodology: 1.0,
    'materials and methods': 1.0,
    references: 0.5, // Downweight references
    acknowledgments: 0.3,
    acknowledgements: 0.3,
  };

  return results.map((result) => {
    const sectionLower = result.chunk.section?.toLowerCase() || '';
    let boost = 1.0;

    for (const [section, sectionBoost] of Object.entries(sectionBoosts)) {
      if (sectionLower.includes(section)) {
        boost = sectionBoost;
        break;
      }
    }

    return {
      ...result,
      score: result.score * boost,
    };
  });
}
