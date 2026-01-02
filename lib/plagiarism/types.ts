/**
 * Plagiarism Detection Types
 * Phase 4: Plagiarism Detection System
 */

// ============================================================================
// Core Result Types
// ============================================================================

/**
 * Complete plagiarism detection result
 */
export interface PlagiarismResult {
  /** Unique identifier for this check */
  id: string;
  /** Document ID that was checked */
  documentId: string;
  /** Timestamp of check */
  checkedAt: number;
  /** Similarity score (0-100, lower is better) */
  similarityScore: number;
  /** Originality score (100 - similarityScore) */
  originalityScore: number;
  /** Classification based on score */
  classification: PlagiarismClassification;
  /** Confidence level in the result */
  confidence: 'high' | 'medium' | 'low';
  /** All detected matches */
  matches: PlagiarismMatch[];
  /** Self-plagiarism matches (against user's own documents) */
  selfPlagiarism: SelfPlagiarismMatch[];
  /** Uncited quotations */
  uncitedQuotes: UncitedQuote[];
  /** Suspicious patterns */
  suspiciousPatterns: SuspiciousPattern[];
  /** Statistics */
  stats: PlagiarismStats;
  /** Sources summary */
  sources: SourceSummary[];
  /** Check configuration used */
  config: PlagiarismConfig;
}

/**
 * Classification based on similarity score
 */
export type PlagiarismClassification =
  | 'original'        // 0-10% similarity
  | 'acceptable'      // 10-20% similarity
  | 'needs-review'    // 20-40% similarity
  | 'concerning'      // 40-60% similarity
  | 'high-risk'       // 60-80% similarity
  | 'critical';       // 80-100% similarity

/**
 * Get classification from similarity score
 */
export function getClassification(score: number): PlagiarismClassification {
  if (score <= 10) return 'original';
  if (score <= 20) return 'acceptable';
  if (score <= 40) return 'needs-review';
  if (score <= 60) return 'concerning';
  if (score <= 80) return 'high-risk';
  return 'critical';
}

/**
 * Classification display information
 */
export function getClassificationInfo(classification: PlagiarismClassification): {
  label: string;
  description: string;
  color: string;
  bgColor: string;
} {
  const info: Record<PlagiarismClassification, { label: string; description: string; color: string; bgColor: string }> = {
    'original': {
      label: 'Original',
      description: 'Content appears to be highly original with minimal matches.',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    'acceptable': {
      label: 'Acceptable',
      description: 'Some similarity detected, likely from properly cited sources or common phrases.',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    'needs-review': {
      label: 'Needs Review',
      description: 'Moderate similarity detected. Review matches to ensure proper attribution.',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    'concerning': {
      label: 'Concerning',
      description: 'Significant similarity detected. Careful review of sources recommended.',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    'high-risk': {
      label: 'High Risk',
      description: 'High levels of similarity. Major revision or proper citation needed.',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    'critical': {
      label: 'Critical',
      description: 'Very high similarity indicates potential plagiarism. Immediate attention required.',
      color: 'text-red-600',
      bgColor: 'bg-red-600/10',
    },
  };
  return info[classification];
}

// ============================================================================
// Match Types
// ============================================================================

/**
 * A detected plagiarism match
 */
export interface PlagiarismMatch {
  /** Unique identifier */
  id: string;
  /** Matched text from the document */
  text: string;
  /** Start position in document */
  startOffset: number;
  /** End position in document */
  endOffset: number;
  /** Similarity percentage (0-100) */
  similarity: number;
  /** Word count of matched text */
  wordCount: number;
  /** Type of match */
  type: MatchType;
  /** Source information */
  source: MatchSource;
  /** Whether this match is excluded from score */
  excluded: boolean;
  /** Reason for exclusion if applicable */
  exclusionReason?: ExclusionReason;
}

/**
 * Types of plagiarism matches
 */
export type MatchType =
  | 'exact'           // Word-for-word copy
  | 'near-exact'      // Minor word changes
  | 'paraphrase'      // Rephrased content
  | 'mosaic'          // Pieced together from multiple sources
  | 'structural';     // Similar structure/organization

/**
 * Source of a match
 */
export interface MatchSource {
  /** Source type */
  type: SourceType;
  /** Source title */
  title?: string;
  /** URL if available */
  url?: string;
  /** Author(s) */
  author?: string;
  /** DOI if academic source */
  doi?: string;
  /** Publication date */
  publicationDate?: string;
  /** Snippet from source */
  sourceSnippet?: string;
  /** Database source came from */
  database?: string;
}

/**
 * Types of sources
 */
export type SourceType =
  | 'web'             // Website
  | 'academic'        // Academic paper/journal
  | 'book'            // Published book
  | 'news'            // News article
  | 'user-document'   // User's own document (self-plagiarism)
  | 'internal'        // Internal/private document
  | 'unknown';        // Unknown source

/**
 * Reasons for excluding a match from score
 */
export type ExclusionReason =
  | 'quoted'          // Text is properly quoted
  | 'cited'           // Text has citation
  | 'common-phrase'   // Common academic phrase
  | 'reference'       // Part of reference/bibliography
  | 'user-excluded';  // Manually excluded by user

// ============================================================================
// Self-Plagiarism Types
// ============================================================================

/**
 * Self-plagiarism match (against user's own documents)
 */
export interface SelfPlagiarismMatch {
  /** Unique identifier */
  id: string;
  /** Matched text */
  text: string;
  /** Position in current document */
  startOffset: number;
  endOffset: number;
  /** Similarity percentage */
  similarity: number;
  /** Word count */
  wordCount: number;
  /** Source document info */
  sourceDocument: {
    id: string;
    title: string;
    createdAt: number;
    snippet: string;
  };
}

// ============================================================================
// Citation/Quote Types
// ============================================================================

/**
 * Uncited quotation detected in document
 */
export interface UncitedQuote {
  /** Unique identifier */
  id: string;
  /** The quoted text */
  text: string;
  /** Position in document */
  startOffset: number;
  endOffset: number;
  /** Type of quote marks used */
  quoteType: 'double' | 'single' | 'smart' | 'guillemet';
  /** Suggested action */
  suggestion: string;
}

// ============================================================================
// Suspicious Patterns
// ============================================================================

/**
 * Suspicious pattern detected
 */
export interface SuspiciousPattern {
  /** Type of pattern */
  type: SuspiciousPatternType;
  /** Description */
  description: string;
  /** Severity (1-5) */
  severity: number;
  /** Affected text positions */
  positions: Array<{ start: number; end: number }>;
}

/**
 * Types of suspicious patterns
 */
export type SuspiciousPatternType =
  | 'character-substitution'  // Unicode lookalikes (e.g., Cyrillic 'а' for Latin 'a')
  | 'white-text'              // Hidden white-on-white text
  | 'invisible-characters'    // Zero-width characters
  | 'font-manipulation'       // Font tricks to evade detection
  | 'excessive-synonyms'      // Unusual synonym replacement patterns
  | 'inconsistent-style';     // Writing style changes drastically

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Plagiarism check statistics
 */
export interface PlagiarismStats {
  /** Total words in document */
  totalWords: number;
  /** Words that matched sources */
  matchedWords: number;
  /** Words in quoted sections */
  quotedWords: number;
  /** Words with proper citations */
  citedWords: number;
  /** Words excluded from scoring */
  excludedWords: number;
  /** Number of unique sources matched */
  uniqueSources: number;
  /** Number of fingerprints generated */
  fingerprintsGenerated: number;
  /** Number of fingerprints matched */
  fingerprintsMatched: number;
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Source summary for display
 */
export interface SourceSummary {
  /** Source info */
  source: MatchSource;
  /** Number of matches from this source */
  matchCount: number;
  /** Total words matched from this source */
  wordsMatched: number;
  /** Percentage contribution to similarity */
  contributionPercent: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Plagiarism check configuration
 */
export interface PlagiarismConfig {
  /** N-gram size for fingerprinting (default: 5) */
  ngramSize: number;
  /** Minimum match length in words (default: 5) */
  minMatchLength: number;
  /** Similarity threshold to report (default: 20%) */
  similarityThreshold: number;
  /** Exclusions */
  exclusions: {
    /** Exclude quoted text */
    quotes: boolean;
    /** Exclude text with citations */
    citations: boolean;
    /** Exclude reference/bibliography section */
    references: boolean;
    /** Exclude common academic phrases */
    commonPhrases: boolean;
    /** Custom phrases to exclude */
    customPhrases: string[];
  };
  /** Check options */
  checks: {
    /** Check against user's own documents */
    selfPlagiarism: boolean;
    /** Check for uncited quotes */
    uncitedQuotes: boolean;
    /** Check for suspicious patterns */
    suspiciousPatterns: boolean;
    /** Use external API (if configured) */
    externalApi: boolean;
  };
  /** Sources to check */
  sources: {
    /** Check against web sources (requires API) */
    web: boolean;
    /** Check against academic databases */
    academic: boolean;
    /** Check against user's documents */
    userDocuments: boolean;
  };
}

/**
 * Default configuration
 */
export const DEFAULT_PLAGIARISM_CONFIG: PlagiarismConfig = {
  ngramSize: 5,
  minMatchLength: 5,
  similarityThreshold: 20,
  exclusions: {
    quotes: true,
    citations: true,
    references: true,
    commonPhrases: true,
    customPhrases: [],
  },
  checks: {
    selfPlagiarism: true,
    uncitedQuotes: true,
    suspiciousPatterns: true,
    externalApi: false,
  },
  sources: {
    web: false,
    academic: true,
    userDocuments: true,
  },
};

// ============================================================================
// Fingerprint Types
// ============================================================================

/**
 * Document fingerprint for comparison
 */
export interface DocumentFingerprint {
  /** Hash value */
  hash: number;
  /** Position in document (character offset) */
  position: number;
  /** The n-gram text that was hashed */
  ngram: string;
  /** Word offset */
  wordOffset: number;
}

/**
 * Fingerprint set for a document
 */
export interface FingerprintSet {
  /** Document identifier */
  documentId: string;
  /** All fingerprints */
  fingerprints: DocumentFingerprint[];
  /** N-gram size used */
  ngramSize: number;
  /** Total word count */
  wordCount: number;
  /** Generation timestamp */
  generatedAt: number;
}

// ============================================================================
// API Types (for external integration)
// ============================================================================

/**
 * External API check request
 */
export interface ExternalCheckRequest {
  /** Text to check */
  text: string;
  /** Document title (optional) */
  title?: string;
  /** Callback URL for results (webhook) */
  callbackUrl?: string;
}

/**
 * External API check response
 */
export interface ExternalCheckResponse {
  /** Scan ID for tracking */
  scanId: string;
  /** Status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Results if completed */
  results?: {
    similarityScore: number;
    matches: Array<{
      text: string;
      similarity: number;
      source: {
        url?: string;
        title?: string;
      };
    }>;
  };
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Common Academic Phrases
// ============================================================================

/**
 * Common academic phrases that should not be flagged
 */
export const COMMON_ACADEMIC_PHRASES: string[] = [
  'in this study',
  'the results show',
  'it has been shown',
  'previous research',
  'the purpose of this study',
  'in conclusion',
  'the findings suggest',
  'according to',
  'in addition',
  'on the other hand',
  'for example',
  'in other words',
  'as a result',
  'in particular',
  'with respect to',
  'in the context of',
  'in terms of',
  'based on the findings',
  'the data suggests',
  'further research is needed',
  'limitations of this study',
  'implications for practice',
  'significant difference',
  'statistical analysis',
  'the present study',
  'literature review',
  'research methodology',
  'data collection',
  'qualitative analysis',
  'quantitative analysis',
];

export default {
  getClassification,
  getClassificationInfo,
  DEFAULT_PLAGIARISM_CONFIG,
  COMMON_ACADEMIC_PHRASES,
};
