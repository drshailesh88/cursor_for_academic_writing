/**
 * Similarity Calculation for Plagiarism Detection
 *
 * Implements various similarity metrics:
 * - Jaccard similarity
 * - Cosine similarity
 * - Containment similarity
 * - Match clustering for contiguous regions
 */

import type {
  DocumentFingerprint,
  FingerprintSet,
  PlagiarismMatch,
  MatchType,
  MatchSource,
} from './types';
import { findMatchingFingerprints } from './fingerprint';

// ============================================================================
// Similarity Metrics
// ============================================================================

/**
 * Calculate Jaccard similarity between two fingerprint sets
 * J(A,B) = |A ∩ B| / |A ∪ B|
 */
export function jaccardSimilarity(set1: FingerprintSet, set2: FingerprintSet): number {
  const hashes1 = new Set(set1.fingerprints.map(f => f.hash));
  const hashes2 = new Set(set2.fingerprints.map(f => f.hash));

  let intersection = 0;
  for (const hash of hashes1) {
    if (hashes2.has(hash)) {
      intersection++;
    }
  }

  const union = hashes1.size + hashes2.size - intersection;

  if (union === 0) return 0;
  return (intersection / union) * 100;
}

/**
 * Calculate containment similarity (asymmetric)
 * C(A,B) = |A ∩ B| / |A|
 * Measures how much of A is contained in B
 */
export function containmentSimilarity(query: FingerprintSet, source: FingerprintSet): number {
  if (query.fingerprints.length === 0) return 0;

  const queryHashes = new Set(query.fingerprints.map(f => f.hash));
  const sourceHashes = new Set(source.fingerprints.map(f => f.hash));

  let intersection = 0;
  for (const hash of queryHashes) {
    if (sourceHashes.has(hash)) {
      intersection++;
    }
  }

  return (intersection / queryHashes.size) * 100;
}

/**
 * Calculate overlap coefficient
 * O(A,B) = |A ∩ B| / min(|A|, |B|)
 */
export function overlapCoefficient(set1: FingerprintSet, set2: FingerprintSet): number {
  const hashes1 = new Set(set1.fingerprints.map(f => f.hash));
  const hashes2 = new Set(set2.fingerprints.map(f => f.hash));

  let intersection = 0;
  for (const hash of hashes1) {
    if (hashes2.has(hash)) {
      intersection++;
    }
  }

  const minSize = Math.min(hashes1.size, hashes2.size);
  if (minSize === 0) return 0;

  return (intersection / minSize) * 100;
}

/**
 * Calculate word-based similarity
 * More intuitive metric based on matched words
 */
export function wordBasedSimilarity(
  queryWordCount: number,
  matchedWordCount: number
): number {
  if (queryWordCount === 0) return 0;
  return Math.min((matchedWordCount / queryWordCount) * 100, 100);
}

// ============================================================================
// Match Clustering
// ============================================================================

/**
 * Cluster consecutive fingerprint matches into contiguous regions
 * This helps identify larger plagiarized sections rather than isolated matches
 */
export function clusterMatches(
  matches: Array<{
    doc1Fingerprint: DocumentFingerprint;
    doc2Fingerprint: DocumentFingerprint;
  }>,
  maxGap: number = 2 // Maximum word gap to consider matches as part of same cluster
): Array<{
  fingerprints: Array<{
    doc1Fingerprint: DocumentFingerprint;
    doc2Fingerprint: DocumentFingerprint;
  }>;
  startOffset: number;
  endOffset: number;
  wordCount: number;
}> {
  if (matches.length === 0) return [];

  // Sort matches by position in document 1
  const sortedMatches = [...matches].sort(
    (a, b) => a.doc1Fingerprint.wordOffset - b.doc1Fingerprint.wordOffset
  );

  const clusters: Array<{
    fingerprints: Array<{
      doc1Fingerprint: DocumentFingerprint;
      doc2Fingerprint: DocumentFingerprint;
    }>;
    startOffset: number;
    endOffset: number;
    wordCount: number;
  }> = [];

  let currentCluster: typeof sortedMatches = [sortedMatches[0]];

  for (let i = 1; i < sortedMatches.length; i++) {
    const prevMatch = sortedMatches[i - 1];
    const currMatch = sortedMatches[i];

    // Check if current match is close enough to previous
    const gap = currMatch.doc1Fingerprint.wordOffset - prevMatch.doc1Fingerprint.wordOffset;

    if (gap <= maxGap + 1) {
      // Part of same cluster
      currentCluster.push(currMatch);
    } else {
      // Start new cluster
      if (currentCluster.length > 0) {
        clusters.push(createCluster(currentCluster));
      }
      currentCluster = [currMatch];
    }
  }

  // Don't forget the last cluster
  if (currentCluster.length > 0) {
    clusters.push(createCluster(currentCluster));
  }

  return clusters;
}

/**
 * Create a cluster object from fingerprint matches
 */
function createCluster(
  fingerprints: Array<{
    doc1Fingerprint: DocumentFingerprint;
    doc2Fingerprint: DocumentFingerprint;
  }>
): {
  fingerprints: typeof fingerprints;
  startOffset: number;
  endOffset: number;
  wordCount: number;
} {
  const sorted = fingerprints.sort(
    (a, b) => a.doc1Fingerprint.position - b.doc1Fingerprint.position
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  // Estimate end position (position + ngram length)
  const estimatedEnd = last.doc1Fingerprint.position + last.doc1Fingerprint.ngram.length;

  // Word count from word offsets
  const firstWordOffset = first.doc1Fingerprint.wordOffset;
  const lastWordOffset = last.doc1Fingerprint.wordOffset;
  // Add 5 for the n-gram size
  const wordCount = lastWordOffset - firstWordOffset + 5;

  return {
    fingerprints: sorted,
    startOffset: first.doc1Fingerprint.position,
    endOffset: estimatedEnd,
    wordCount,
  };
}

// ============================================================================
// Match Type Detection
// ============================================================================

/**
 * Determine the type of match based on text comparison
 */
export function determineMatchType(
  queryText: string,
  sourceText: string
): MatchType {
  // Normalize for comparison
  const normalizedQuery = queryText.toLowerCase().trim();
  const normalizedSource = sourceText.toLowerCase().trim();

  // Exact match
  if (normalizedQuery === normalizedSource) {
    return 'exact';
  }

  // Calculate Levenshtein distance ratio
  const distance = levenshteinDistance(normalizedQuery, normalizedSource);
  const maxLen = Math.max(normalizedQuery.length, normalizedSource.length);
  const similarity = 1 - distance / maxLen;

  if (similarity >= 0.95) {
    return 'near-exact';
  }

  if (similarity >= 0.7) {
    return 'paraphrase';
  }

  // Check for mosaic (partial matches interspersed)
  const words1 = normalizedQuery.split(/\s+/);
  const words2 = normalizedSource.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w));
  const commonRatio = commonWords.length / Math.max(words1.length, words2.length);

  if (commonRatio >= 0.5) {
    return 'mosaic';
  }

  return 'structural';
}

/**
 * Levenshtein distance for string comparison
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create distance matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first column and row
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill in the rest
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

// ============================================================================
// Match to PlagiarismMatch Conversion
// ============================================================================

/**
 * Convert clustered matches to PlagiarismMatch objects
 */
export function clustersToMatches(
  clusters: Array<{
    fingerprints: Array<{
      doc1Fingerprint: DocumentFingerprint;
      doc2Fingerprint: DocumentFingerprint;
    }>;
    startOffset: number;
    endOffset: number;
    wordCount: number;
  }>,
  originalText: string,
  source: MatchSource,
  minWordCount: number = 5
): PlagiarismMatch[] {
  return clusters
    .filter(cluster => cluster.wordCount >= minWordCount)
    .map((cluster, index) => {
      // Extract the actual text from original document
      const text = originalText.substring(cluster.startOffset, cluster.endOffset);

      // Calculate similarity based on match density
      const matchDensity = cluster.fingerprints.length / Math.max(cluster.wordCount - 4, 1);
      const similarity = Math.min(matchDensity * 100, 100);

      return {
        id: `match-${index}-${cluster.startOffset}`,
        text,
        startOffset: cluster.startOffset,
        endOffset: cluster.endOffset,
        similarity: Math.round(similarity),
        wordCount: cluster.wordCount,
        type: determineMatchType(text, cluster.fingerprints[0].doc2Fingerprint.ngram),
        source,
        excluded: false,
      };
    });
}

// ============================================================================
// Full Comparison
// ============================================================================

/**
 * Compare two documents and return detailed match information
 */
export function compareDocuments(
  queryFingerprints: FingerprintSet,
  sourceFingerprints: FingerprintSet,
  queryText: string,
  source: MatchSource,
  options: {
    minMatchLength?: number;
    maxGap?: number;
  } = {}
): {
  similarity: number;
  containment: number;
  matches: PlagiarismMatch[];
  matchedWordCount: number;
} {
  const { minMatchLength = 5, maxGap = 2 } = options;

  // Find matching fingerprints
  const matchingFingerprints = findMatchingFingerprints(queryFingerprints, sourceFingerprints);

  if (matchingFingerprints.length === 0) {
    return {
      similarity: 0,
      containment: 0,
      matches: [],
      matchedWordCount: 0,
    };
  }

  // Cluster matches
  const clusters = clusterMatches(matchingFingerprints, maxGap);

  // Convert to PlagiarismMatch objects
  const matches = clustersToMatches(clusters, queryText, source, minMatchLength);

  // Calculate total matched word count
  const matchedWordCount = matches.reduce((sum, m) => sum + m.wordCount, 0);

  // Calculate similarities
  const similarity = jaccardSimilarity(queryFingerprints, sourceFingerprints);
  const containment = containmentSimilarity(queryFingerprints, sourceFingerprints);

  return {
    similarity,
    containment,
    matches,
    matchedWordCount,
  };
}

/**
 * Compare a document against multiple sources
 */
export function compareAgainstSources(
  queryFingerprints: FingerprintSet,
  queryText: string,
  sources: Map<string, { fingerprints: FingerprintSet; source: MatchSource }>,
  options: {
    minMatchLength?: number;
    maxGap?: number;
    minSimilarity?: number;
  } = {}
): {
  totalSimilarity: number;
  matches: PlagiarismMatch[];
  sourceSummaries: Array<{
    source: MatchSource;
    similarity: number;
    matchCount: number;
    matchedWords: number;
  }>;
} {
  const { minSimilarity = 0 } = options;

  const allMatches: PlagiarismMatch[] = [];
  const sourceSummaries: Array<{
    source: MatchSource;
    similarity: number;
    matchCount: number;
    matchedWords: number;
  }> = [];

  for (const [, { fingerprints, source }] of sources) {
    const result = compareDocuments(
      queryFingerprints,
      fingerprints,
      queryText,
      source,
      options
    );

    if (result.similarity >= minSimilarity || result.matches.length > 0) {
      allMatches.push(...result.matches);
      sourceSummaries.push({
        source,
        similarity: result.similarity,
        matchCount: result.matches.length,
        matchedWords: result.matchedWordCount,
      });
    }
  }

  // Deduplicate overlapping matches (keep highest similarity)
  const deduplicatedMatches = deduplicateMatches(allMatches);

  // Calculate total similarity
  const totalMatchedWords = deduplicatedMatches.reduce((sum, m) => sum + m.wordCount, 0);
  const totalSimilarity = wordBasedSimilarity(queryFingerprints.wordCount, totalMatchedWords);

  return {
    totalSimilarity,
    matches: deduplicatedMatches,
    sourceSummaries,
  };
}

/**
 * Deduplicate overlapping matches, keeping the one with highest similarity
 */
function deduplicateMatches(matches: PlagiarismMatch[]): PlagiarismMatch[] {
  if (matches.length <= 1) return matches;

  // Sort by start position
  const sorted = [...matches].sort((a, b) => a.startOffset - b.startOffset);
  const result: PlagiarismMatch[] = [];

  for (const match of sorted) {
    // Check if this match overlaps with any existing match
    const overlappingIndex = result.findIndex(
      existing =>
        (match.startOffset >= existing.startOffset && match.startOffset < existing.endOffset) ||
        (match.endOffset > existing.startOffset && match.endOffset <= existing.endOffset) ||
        (match.startOffset <= existing.startOffset && match.endOffset >= existing.endOffset)
    );

    if (overlappingIndex === -1) {
      // No overlap, add directly
      result.push(match);
    } else {
      // Overlap found - keep the one with higher similarity
      const existing = result[overlappingIndex];
      if (match.similarity > existing.similarity) {
        result[overlappingIndex] = match;
      }
      // If existing has higher or equal similarity, keep it (do nothing)
    }
  }

  return result;
}

// ============================================================================
// Text Similarity (for non-fingerprint comparison)
// ============================================================================

/**
 * Quick text similarity using word overlap (no fingerprinting)
 * Useful for short text comparisons
 */
export function quickTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return 0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  let intersection = 0;
  for (const word of set1) {
    if (set2.has(word)) intersection++;
  }

  const union = set1.size + set2.size - intersection;
  return (intersection / union) * 100;
}

/**
 * N-gram based text similarity (without full fingerprinting)
 */
export function ngramTextSimilarity(text1: string, text2: string, n: number = 3): number {
  const ngrams1 = extractCharNgrams(text1.toLowerCase(), n);
  const ngrams2 = extractCharNgrams(text2.toLowerCase(), n);

  if (ngrams1.size === 0 || ngrams2.size === 0) return 0;

  let intersection = 0;
  for (const ngram of ngrams1) {
    if (ngrams2.has(ngram)) intersection++;
  }

  const union = ngrams1.size + ngrams2.size - intersection;
  return (intersection / union) * 100;
}

/**
 * Extract character n-grams from text
 */
function extractCharNgrams(text: string, n: number): Set<string> {
  const ngrams = new Set<string>();
  const normalized = text.replace(/\s+/g, ' ').trim();

  for (let i = 0; i <= normalized.length - n; i++) {
    ngrams.add(normalized.substring(i, i + n));
  }

  return ngrams;
}

export default {
  jaccardSimilarity,
  containmentSimilarity,
  overlapCoefficient,
  wordBasedSimilarity,
  clusterMatches,
  determineMatchType,
  clustersToMatches,
  compareDocuments,
  compareAgainstSources,
  quickTextSimilarity,
  ngramTextSimilarity,
};
