/**
 * N-gram Fingerprinting for Plagiarism Detection
 *
 * Implements document fingerprinting using:
 * - N-gram extraction (word-level)
 * - Rolling hash (Rabin-Karp style)
 * - Winnowing algorithm for fingerprint selection
 */

import type { DocumentFingerprint, FingerprintSet } from './types';

// ============================================================================
// Constants
// ============================================================================

/** Prime number for hashing */
const HASH_PRIME = 31;
/** Modulo for hash to prevent overflow */
const HASH_MOD = 1e9 + 7;
/** Window size for winnowing (w) */
const WINNOW_WINDOW = 4;

// ============================================================================
// Text Normalization
// ============================================================================

/**
 * Normalize text for fingerprinting
 * - Convert to lowercase
 * - Remove punctuation
 * - Collapse whitespace
 * - Remove special characters
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    // Remove punctuation but keep apostrophes in contractions
    .replace(/[^\w\s']/g, ' ')
    // Remove standalone apostrophes
    .replace(/\s'\s/g, ' ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split text into words
 */
export function splitIntoWords(text: string): string[] {
  return normalizeText(text).split(' ').filter(w => w.length > 0);
}

/**
 * Get word positions in original text
 */
export function getWordPositions(text: string): Array<{ word: string; start: number; end: number }> {
  const positions: Array<{ word: string; start: number; end: number }> = [];
  const normalized = text.toLowerCase();

  // Match words including contractions
  const wordRegex = /\b[\w']+\b/g;
  let match;

  while ((match = wordRegex.exec(normalized)) !== null) {
    positions.push({
      word: match[0].replace(/'/g, ''),
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return positions;
}

// ============================================================================
// Hash Functions
// ============================================================================

/**
 * Compute hash for a string using polynomial rolling hash
 */
export function computeHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * HASH_PRIME + str.charCodeAt(i)) % HASH_MOD;
  }
  return hash;
}

/**
 * Compute hash for an n-gram (array of words)
 */
export function computeNgramHash(words: string[]): number {
  // Join with space and hash
  return computeHash(words.join(' '));
}

/**
 * Rolling hash update (add new char, remove old char)
 * Used for efficient sequential hashing
 */
export function rollingHashUpdate(
  oldHash: number,
  oldChar: number,
  newChar: number,
  highestPower: number
): number {
  // Remove contribution of old char and add new char
  let newHash = (oldHash - (oldChar * highestPower) % HASH_MOD + HASH_MOD) % HASH_MOD;
  newHash = (newHash * HASH_PRIME + newChar) % HASH_MOD;
  return newHash;
}

// ============================================================================
// N-gram Generation
// ============================================================================

/**
 * Generate all n-grams from text
 */
export function generateNgrams(text: string, n: number = 5): Array<{
  ngram: string;
  words: string[];
  position: number;
  wordOffset: number;
}> {
  const words = splitIntoWords(text);
  const ngrams: Array<{
    ngram: string;
    words: string[];
    position: number;
    wordOffset: number;
  }> = [];

  if (words.length < n) {
    return ngrams;
  }

  // Get word positions for accurate character offsets
  const wordPositions = getWordPositions(text);

  for (let i = 0; i <= words.length - n; i++) {
    const ngramWords = words.slice(i, i + n);
    const ngramText = ngramWords.join(' ');

    // Find character position (approximate)
    const charPosition = i < wordPositions.length ? wordPositions[i].start : 0;

    ngrams.push({
      ngram: ngramText,
      words: ngramWords,
      position: charPosition,
      wordOffset: i,
    });
  }

  return ngrams;
}

/**
 * Generate n-grams with their hashes
 */
export function generateNgramHashes(text: string, n: number = 5): Array<{
  hash: number;
  ngram: string;
  position: number;
  wordOffset: number;
}> {
  const ngrams = generateNgrams(text, n);

  return ngrams.map(ng => ({
    hash: computeNgramHash(ng.words),
    ngram: ng.ngram,
    position: ng.position,
    wordOffset: ng.wordOffset,
  }));
}

// ============================================================================
// Winnowing Algorithm
// ============================================================================

/**
 * Winnowing: Select representative fingerprints from document
 *
 * Guarantees: If there is a match at least w+k-1 characters long,
 * it will be detected (where w = window size, k = n-gram size)
 *
 * Algorithm:
 * 1. Slide window of size w over hash sequence
 * 2. Select minimum hash in each window
 * 3. If same minimum as previous window, skip (avoid duplicates)
 * 4. Record selected hashes as fingerprints
 */
export function winnow(
  hashes: Array<{ hash: number; ngram: string; position: number; wordOffset: number }>,
  windowSize: number = WINNOW_WINDOW
): DocumentFingerprint[] {
  if (hashes.length === 0) {
    return [];
  }

  if (hashes.length <= windowSize) {
    // Document too short, use all hashes
    return hashes.map(h => ({
      hash: h.hash,
      position: h.position,
      ngram: h.ngram,
      wordOffset: h.wordOffset,
    }));
  }

  const fingerprints: DocumentFingerprint[] = [];
  let previousMinIndex = -1;

  for (let i = 0; i <= hashes.length - windowSize; i++) {
    const window = hashes.slice(i, i + windowSize);

    // Find minimum in window (rightmost in case of ties)
    let minIndex = i;
    let minHash = hashes[i].hash;

    for (let j = 1; j < windowSize; j++) {
      const currentHash = hashes[i + j].hash;
      // Use <= for rightmost minimum (as per original winnowing paper)
      if (currentHash <= minHash) {
        minHash = currentHash;
        minIndex = i + j;
      }
    }

    // Only add if different from previous minimum
    if (minIndex !== previousMinIndex) {
      fingerprints.push({
        hash: hashes[minIndex].hash,
        position: hashes[minIndex].position,
        ngram: hashes[minIndex].ngram,
        wordOffset: hashes[minIndex].wordOffset,
      });
      previousMinIndex = minIndex;
    }
  }

  return fingerprints;
}

// ============================================================================
// Main Fingerprinting Function
// ============================================================================

/**
 * Generate fingerprint set for a document
 */
export function generateFingerprints(
  text: string,
  documentId: string,
  ngramSize: number = 5,
  windowSize: number = WINNOW_WINDOW
): FingerprintSet {
  // Generate n-gram hashes
  const ngramHashes = generateNgramHashes(text, ngramSize);

  // Apply winnowing to select fingerprints
  const fingerprints = winnow(ngramHashes, windowSize);

  // Count words
  const wordCount = splitIntoWords(text).length;

  return {
    documentId,
    fingerprints,
    ngramSize,
    wordCount,
    generatedAt: Date.now(),
  };
}

/**
 * Generate fingerprints for multiple documents efficiently
 */
export function generateFingerprintsForDocuments(
  documents: Array<{ id: string; text: string }>,
  ngramSize: number = 5
): Map<string, FingerprintSet> {
  const fingerprintMap = new Map<string, FingerprintSet>();

  for (const doc of documents) {
    const fingerprints = generateFingerprints(doc.text, doc.id, ngramSize);
    fingerprintMap.set(doc.id, fingerprints);
  }

  return fingerprintMap;
}

// ============================================================================
// Fingerprint Comparison
// ============================================================================

/**
 * Find matching fingerprints between two documents
 */
export function findMatchingFingerprints(
  doc1: FingerprintSet,
  doc2: FingerprintSet
): Array<{
  doc1Fingerprint: DocumentFingerprint;
  doc2Fingerprint: DocumentFingerprint;
}> {
  const matches: Array<{
    doc1Fingerprint: DocumentFingerprint;
    doc2Fingerprint: DocumentFingerprint;
  }> = [];

  // Build hash set from doc2 for O(1) lookup
  const doc2HashSet = new Map<number, DocumentFingerprint[]>();
  for (const fp of doc2.fingerprints) {
    const existing = doc2HashSet.get(fp.hash) || [];
    existing.push(fp);
    doc2HashSet.set(fp.hash, existing);
  }

  // Find matches
  for (const fp1 of doc1.fingerprints) {
    const matchingFps = doc2HashSet.get(fp1.hash);
    if (matchingFps) {
      for (const fp2 of matchingFps) {
        // Verify actual text match (not just hash collision)
        if (fp1.ngram === fp2.ngram) {
          matches.push({
            doc1Fingerprint: fp1,
            doc2Fingerprint: fp2,
          });
        }
      }
    }
  }

  return matches;
}

/**
 * Find matching fingerprints between a document and a collection
 */
export function findMatchesInCollection(
  document: FingerprintSet,
  collection: Map<string, FingerprintSet>
): Map<string, Array<{
  doc1Fingerprint: DocumentFingerprint;
  doc2Fingerprint: DocumentFingerprint;
}>> {
  const results = new Map<string, Array<{
    doc1Fingerprint: DocumentFingerprint;
    doc2Fingerprint: DocumentFingerprint;
  }>>();

  for (const [docId, fingerprints] of collection) {
    // Skip comparing with itself
    if (docId === document.documentId) continue;

    const matches = findMatchingFingerprints(document, fingerprints);
    if (matches.length > 0) {
      results.set(docId, matches);
    }
  }

  return results;
}

/**
 * Build a fingerprint index for fast lookup across many documents
 */
export function buildFingerprintIndex(
  documents: Map<string, FingerprintSet>
): Map<number, Array<{ documentId: string; fingerprint: DocumentFingerprint }>> {
  const index = new Map<number, Array<{ documentId: string; fingerprint: DocumentFingerprint }>>();

  for (const [docId, fpSet] of documents) {
    for (const fp of fpSet.fingerprints) {
      const existing = index.get(fp.hash) || [];
      existing.push({ documentId: docId, fingerprint: fp });
      index.set(fp.hash, existing);
    }
  }

  return index;
}

/**
 * Search for matches using fingerprint index
 */
export function searchWithIndex(
  document: FingerprintSet,
  index: Map<number, Array<{ documentId: string; fingerprint: DocumentFingerprint }>>
): Map<string, Array<{
  queryFingerprint: DocumentFingerprint;
  matchFingerprint: DocumentFingerprint;
}>> {
  const results = new Map<string, Array<{
    queryFingerprint: DocumentFingerprint;
    matchFingerprint: DocumentFingerprint;
  }>>();

  for (const fp of document.fingerprints) {
    const matches = index.get(fp.hash);
    if (matches) {
      for (const match of matches) {
        // Skip self-matches
        if (match.documentId === document.documentId) continue;

        // Verify text match
        if (fp.ngram === match.fingerprint.ngram) {
          const docMatches = results.get(match.documentId) || [];
          docMatches.push({
            queryFingerprint: fp,
            matchFingerprint: match.fingerprint,
          });
          results.set(match.documentId, docMatches);
        }
      }
    }
  }

  return results;
}

export default {
  normalizeText,
  splitIntoWords,
  getWordPositions,
  computeHash,
  computeNgramHash,
  generateNgrams,
  generateNgramHashes,
  winnow,
  generateFingerprints,
  generateFingerprintsForDocuments,
  findMatchingFingerprints,
  findMatchesInCollection,
  buildFingerprintIndex,
  searchWithIndex,
};
