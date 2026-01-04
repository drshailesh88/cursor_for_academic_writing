/**
 * Main Plagiarism Detector
 *
 * Orchestrates all plagiarism detection functionality:
 * - Document fingerprinting
 * - Self-plagiarism detection
 * - Citation/quote verification
 * - Suspicious pattern detection
 * - Result aggregation
 */

import type {
  PlagiarismResult,
  PlagiarismMatch,
  SelfPlagiarismMatch,
  UncitedQuote,
  SuspiciousPattern,
  PlagiarismStats,
  SourceSummary,
  PlagiarismConfig,
  MatchSource,
} from './types';
import {
  DEFAULT_PLAGIARISM_CONFIG,
  getClassification,
  COMMON_ACADEMIC_PHRASES,
} from './types';
import { generateFingerprints, splitIntoWords } from './fingerprint';
import { compareDocuments, wordBasedSimilarity } from './similarity';

// ============================================================================
// Quote Detection
// ============================================================================

/**
 * Detect quoted text in document
 */
export function detectQuotes(text: string): Array<{
  text: string;
  startOffset: number;
  endOffset: number;
  quoteType: 'double' | 'single' | 'smart' | 'guillemet';
}> {
  const quotes: Array<{
    text: string;
    startOffset: number;
    endOffset: number;
    quoteType: 'double' | 'single' | 'smart' | 'guillemet';
  }> = [];

  // Different quote patterns
  const patterns: Array<{ regex: RegExp; type: 'double' | 'single' | 'smart' | 'guillemet' }> = [
    { regex: /"([^"]+)"/g, type: 'double' },
    { regex: /'([^']+)'/g, type: 'single' },
    { regex: /"([^"]+)"/g, type: 'smart' },
    { regex: /«([^»]+)»/g, type: 'guillemet' },
    { regex: /「([^」]+)」/g, type: 'guillemet' },
  ];

  for (const { regex, type } of patterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      quotes.push({
        text: match[1],
        startOffset: match.index,
        endOffset: match.index + match[0].length,
        quoteType: type,
      });
    }
  }

  return quotes.sort((a, b) => a.startOffset - b.startOffset);
}

/**
 * Detect citations in text (various formats)
 */
export function detectCitations(text: string): Array<{
  citation: string;
  startOffset: number;
  endOffset: number;
  format: 'author-year' | 'numeric' | 'footnote';
}> {
  const citations: Array<{
    citation: string;
    startOffset: number;
    endOffset: number;
    format: 'author-year' | 'numeric' | 'footnote';
  }> = [];

  // Author-year: (Smith, 2023), (Smith et al., 2023), (Smith & Jones, 2023)
  const authorYearRegex = /\([A-Z][a-z]+(?:\s+(?:et\s+al\.|&\s+[A-Z][a-z]+))?,\s*\d{4}[a-z]?\)/g;
  let match;
  while ((match = authorYearRegex.exec(text)) !== null) {
    citations.push({
      citation: match[0],
      startOffset: match.index,
      endOffset: match.index + match[0].length,
      format: 'author-year',
    });
  }

  // Numeric: [1], [1,2,3], [1-5]
  const numericRegex = /\[[\d,\-\s]+\]/g;
  while ((match = numericRegex.exec(text)) !== null) {
    citations.push({
      citation: match[0],
      startOffset: match.index,
      endOffset: match.index + match[0].length,
      format: 'numeric',
    });
  }

  // Superscript numbers (simple detection)
  const superscriptRegex = /[.!?]\s*(\d{1,3})(?=\s|$)/g;
  while ((match = superscriptRegex.exec(text)) !== null) {
    citations.push({
      citation: match[1],
      startOffset: match.index + match[0].length - match[1].length,
      endOffset: match.index + match[0].length,
      format: 'footnote',
    });
  }

  return citations.sort((a, b) => a.startOffset - b.startOffset);
}

/**
 * Check if a quote has a nearby citation
 */
export function hasNearbyCitation(
  quote: { startOffset: number; endOffset: number },
  citations: Array<{ startOffset: number; endOffset: number }>,
  maxDistance: number = 100 // characters
): boolean {
  for (const citation of citations) {
    // Citation before quote
    if (
      citation.endOffset <= quote.startOffset &&
      quote.startOffset - citation.endOffset <= maxDistance
    ) {
      return true;
    }
    // Citation after quote
    if (
      citation.startOffset >= quote.endOffset &&
      citation.startOffset - quote.endOffset <= maxDistance
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Find uncited quotes
 */
export function findUncitedQuotes(text: string): UncitedQuote[] {
  const quotes = detectQuotes(text);
  const citations = detectCitations(text);
  const uncited: UncitedQuote[] = [];

  for (const quote of quotes) {
    // Skip very short quotes (likely not substantive)
    if (quote.text.length < 20) continue;

    if (!hasNearbyCitation(quote, citations)) {
      uncited.push({
        id: `uncited-${quote.startOffset}`,
        text: quote.text,
        startOffset: quote.startOffset,
        endOffset: quote.endOffset,
        quoteType: quote.quoteType,
        suggestion: 'Add a citation for this quoted text',
      });
    }
  }

  return uncited;
}

// ============================================================================
// Suspicious Pattern Detection
// ============================================================================

/**
 * Detect character substitution (Unicode lookalikes)
 */
export function detectCharacterSubstitution(text: string): SuspiciousPattern | null {
  // Common substitutions: Cyrillic а (U+0430) for Latin a, etc.
  const suspiciousChars: Array<{ char: string; name: string }> = [
    { char: '\u0430', name: 'Cyrillic a' }, // а
    { char: '\u0435', name: 'Cyrillic e' }, // е
    { char: '\u043E', name: 'Cyrillic o' }, // о
    { char: '\u0440', name: 'Cyrillic p' }, // р
    { char: '\u0441', name: 'Cyrillic c' }, // с
    { char: '\u0445', name: 'Cyrillic x' }, // х
    { char: '\u0443', name: 'Cyrillic y' }, // у
    { char: '\u200B', name: 'Zero-width space' },
    { char: '\u200C', name: 'Zero-width non-joiner' },
    { char: '\u200D', name: 'Zero-width joiner' },
    { char: '\uFEFF', name: 'BOM' },
  ];

  const positions: Array<{ start: number; end: number }> = [];

  for (let i = 0; i < text.length; i++) {
    for (const { char } of suspiciousChars) {
      if (text[i] === char) {
        positions.push({ start: i, end: i + 1 });
      }
    }
  }

  if (positions.length > 0) {
    return {
      type: 'character-substitution',
      description: `Found ${positions.length} suspicious character(s) that may be Unicode lookalikes`,
      severity: positions.length > 5 ? 4 : positions.length > 2 ? 3 : 2,
      positions,
    };
  }

  return null;
}

/**
 * Detect invisible characters
 */
export function detectInvisibleCharacters(text: string): SuspiciousPattern | null {
  const invisibleRegex = /[\u200B-\u200F\u2028-\u202F\u205F-\u206F\uFEFF]/g;
  const positions: Array<{ start: number; end: number }> = [];

  let match;
  while ((match = invisibleRegex.exec(text)) !== null) {
    positions.push({ start: match.index, end: match.index + 1 });
  }

  if (positions.length > 0) {
    return {
      type: 'invisible-characters',
      description: `Found ${positions.length} invisible character(s) that may be used to evade detection`,
      severity: positions.length > 10 ? 5 : positions.length > 5 ? 4 : 3,
      positions,
    };
  }

  return null;
}

/**
 * Detect inconsistent writing style (basic)
 */
export function detectStyleInconsistency(text: string): SuspiciousPattern | null {
  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 100);

  if (paragraphs.length < 2) return null;

  // Calculate average sentence length per paragraph
  const paragraphStats = paragraphs.map(p => {
    const sentences = p.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength =
      sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    return { avgLength, text: p.substring(0, 50) };
  });

  // Check for significant variance
  const lengths = paragraphStats.map(p => p.avgLength);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // High variance might indicate inconsistent style
  if (stdDev > 10 && mean > 0) {
    const coefficient = stdDev / mean;
    if (coefficient > 0.5) {
      return {
        type: 'inconsistent-style',
        description: 'Writing style varies significantly between paragraphs',
        severity: coefficient > 0.8 ? 3 : 2,
        positions: [], // Style is document-wide
      };
    }
  }

  return null;
}

/**
 * Collect all suspicious patterns
 */
export function detectSuspiciousPatterns(text: string): SuspiciousPattern[] {
  const patterns: SuspiciousPattern[] = [];

  const charSub = detectCharacterSubstitution(text);
  if (charSub) patterns.push(charSub);

  const invisible = detectInvisibleCharacters(text);
  if (invisible) patterns.push(invisible);

  const style = detectStyleInconsistency(text);
  if (style) patterns.push(style);

  return patterns;
}

// ============================================================================
// Exclusion Handling
// ============================================================================

/**
 * Check if a match should be excluded based on config
 */
export function shouldExcludeMatch(
  match: PlagiarismMatch,
  text: string,
  config: PlagiarismConfig
): { excluded: boolean; reason?: string } {
  // Check if match is within quotes
  if (config.exclusions.quotes) {
    const quotes = detectQuotes(text);
    for (const quote of quotes) {
      if (match.startOffset >= quote.startOffset && match.endOffset <= quote.endOffset) {
        return { excluded: true, reason: 'quoted' };
      }
    }
  }

  // Check if match has nearby citation
  if (config.exclusions.citations) {
    const citations = detectCitations(text);
    if (hasNearbyCitation(match, citations, 150)) {
      return { excluded: true, reason: 'cited' };
    }
  }

  // Check for common academic phrases
  if (config.exclusions.commonPhrases) {
    const matchTextLower = match.text.toLowerCase();
    for (const phrase of COMMON_ACADEMIC_PHRASES) {
      if (matchTextLower.includes(phrase)) {
        return { excluded: true, reason: 'common-phrase' };
      }
    }
  }

  // Check custom exclusions
  for (const customPhrase of config.exclusions.customPhrases) {
    if (match.text.toLowerCase().includes(customPhrase.toLowerCase())) {
      return { excluded: true, reason: 'user-excluded' };
    }
  }

  return { excluded: false };
}

/**
 * Apply exclusions to matches
 */
export function applyExclusions(
  matches: PlagiarismMatch[],
  text: string,
  config: PlagiarismConfig
): PlagiarismMatch[] {
  return matches.map(match => {
    const { excluded, reason } = shouldExcludeMatch(match, text, config);
    if (excluded) {
      return {
        ...match,
        excluded: true,
        exclusionReason: reason as PlagiarismMatch['exclusionReason'],
      };
    }
    return match;
  });
}

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Perform plagiarism detection on a document
 */
export async function detectPlagiarism(
  text: string,
  documentId: string,
  userDocuments: Array<{ id: string; title: string; content: string; createdAt: number }> = [],
  config: PlagiarismConfig = DEFAULT_PLAGIARISM_CONFIG
): Promise<PlagiarismResult> {
  const startTime = Date.now();

  // Generate fingerprints for the query document
  const queryFingerprints = generateFingerprints(text, documentId, config.ngramSize);

  // Initialize results
  const allMatches: PlagiarismMatch[] = [];
  const selfPlagiarismMatches: SelfPlagiarismMatch[] = [];
  const sourceSummaries: SourceSummary[] = [];

  // Check against user's other documents (self-plagiarism)
  if (config.checks.selfPlagiarism && userDocuments.length > 0) {
    for (const userDoc of userDocuments) {
      // Skip the current document
      if (userDoc.id === documentId) continue;

      const userDocFingerprints = generateFingerprints(
        userDoc.content,
        userDoc.id,
        config.ngramSize
      );

      const source: MatchSource = {
        type: 'user-document',
        title: userDoc.title,
      };

      const comparison = compareDocuments(
        queryFingerprints,
        userDocFingerprints,
        text,
        source,
        { minMatchLength: config.minMatchLength }
      );

      if (comparison.matches.length > 0) {
        // Add to self-plagiarism list
        for (const match of comparison.matches) {
          selfPlagiarismMatches.push({
            id: `self-${userDoc.id}-${match.startOffset}`,
            text: match.text,
            startOffset: match.startOffset,
            endOffset: match.endOffset,
            similarity: match.similarity,
            wordCount: match.wordCount,
            sourceDocument: {
              id: userDoc.id,
              title: userDoc.title,
              createdAt: userDoc.createdAt,
              snippet: userDoc.content.substring(0, 100),
            },
          });
        }

        sourceSummaries.push({
          source,
          matchCount: comparison.matches.length,
          wordsMatched: comparison.matchedWordCount,
          contributionPercent: wordBasedSimilarity(
            queryFingerprints.wordCount,
            comparison.matchedWordCount
          ),
        });
      }
    }
  }

  // Check for uncited quotes
  const uncitedQuotes = config.checks.uncitedQuotes ? findUncitedQuotes(text) : [];

  // Check for suspicious patterns
  const suspiciousPatterns = config.checks.suspiciousPatterns
    ? detectSuspiciousPatterns(text)
    : [];

  // Apply exclusions to matches
  const processedMatches = applyExclusions(allMatches, text, config);

  // Calculate statistics
  const words = splitIntoWords(text);
  const totalWords = words.length;

  const matchedWords = processedMatches
    .filter(m => !m.excluded)
    .reduce((sum, m) => sum + m.wordCount, 0);

  const quotes = detectQuotes(text);
  const quotedWords = quotes.reduce((sum, q) => sum + splitIntoWords(q.text).length, 0);

  const citations = detectCitations(text);
  const citedMatches = processedMatches.filter(
    m => m.excluded && m.exclusionReason === 'cited'
  );
  const citedWords = citedMatches.reduce((sum, m) => sum + m.wordCount, 0);

  const excludedWords = processedMatches
    .filter(m => m.excluded)
    .reduce((sum, m) => sum + m.wordCount, 0);

  // Calculate similarity score
  const similarityScore = wordBasedSimilarity(totalWords, matchedWords);
  const originalityScore = 100 - similarityScore;

  const stats: PlagiarismStats = {
    totalWords,
    matchedWords,
    quotedWords,
    citedWords,
    excludedWords,
    uniqueSources: sourceSummaries.length,
    fingerprintsGenerated: queryFingerprints.fingerprints.length,
    fingerprintsMatched: processedMatches.length,
    processingTime: Date.now() - startTime,
  };

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (totalWords > 500 && queryFingerprints.fingerprints.length > 50) {
    confidence = 'high';
  } else if (totalWords < 100) {
    confidence = 'low';
  }

  const result: PlagiarismResult = {
    id: `check-${documentId}-${Date.now()}`,
    documentId,
    checkedAt: Date.now(),
    similarityScore: Math.round(similarityScore * 10) / 10,
    originalityScore: Math.round(originalityScore * 10) / 10,
    classification: getClassification(similarityScore),
    confidence,
    matches: processedMatches,
    selfPlagiarism: selfPlagiarismMatches,
    uncitedQuotes,
    suspiciousPatterns,
    stats,
    sources: sourceSummaries,
    config,
  };

  return result;
}

/**
 * Quick plagiarism check (local only, faster)
 */
export function quickPlagiarismCheck(
  text: string,
  documentId: string,
  userDocuments: Array<{ id: string; title: string; content: string; createdAt: number }> = []
): {
  similarityScore: number;
  originalityScore: number;
  selfPlagiarismCount: number;
  uncitedQuoteCount: number;
} {
  const config = {
    ...DEFAULT_PLAGIARISM_CONFIG,
    checks: {
      ...DEFAULT_PLAGIARISM_CONFIG.checks,
      suspiciousPatterns: false, // Skip for speed
      externalApi: false,
    },
  };

  // Use smaller n-gram for speed
  const quickConfig = { ...config, ngramSize: 4 };

  const queryFingerprints = generateFingerprints(text, documentId, quickConfig.ngramSize);

  let selfPlagiarismCount = 0;

  for (const userDoc of userDocuments) {
    if (userDoc.id === documentId) continue;

    const userDocFingerprints = generateFingerprints(
      userDoc.content,
      userDoc.id,
      quickConfig.ngramSize
    );

    // Quick containment check
    const queryHashes = new Set(queryFingerprints.fingerprints.map(f => f.hash));
    const sourceHashes = new Set(userDocFingerprints.fingerprints.map(f => f.hash));

    let matches = 0;
    for (const hash of queryHashes) {
      if (sourceHashes.has(hash)) matches++;
    }

    if (matches > 5) selfPlagiarismCount++;
  }

  const uncitedQuotes = findUncitedQuotes(text);

  // Basic similarity (self-plagiarism based for now)
  const similarityScore = selfPlagiarismCount > 0 ? Math.min(selfPlagiarismCount * 10, 50) : 0;

  return {
    similarityScore,
    originalityScore: 100 - similarityScore,
    selfPlagiarismCount,
    uncitedQuoteCount: uncitedQuotes.length,
  };
}

export default {
  detectQuotes,
  detectCitations,
  hasNearbyCitation,
  findUncitedQuotes,
  detectCharacterSubstitution,
  detectInvisibleCharacters,
  detectStyleInconsistency,
  detectSuspiciousPatterns,
  shouldExcludeMatch,
  applyExclusions,
  detectPlagiarism,
  quickPlagiarismCheck,
};
