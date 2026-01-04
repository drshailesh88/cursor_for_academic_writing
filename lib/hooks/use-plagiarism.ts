'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  PlagiarismResult,
  PlagiarismConfig,
  PlagiarismMatch,
} from '@/lib/plagiarism/types';
import { DEFAULT_PLAGIARISM_CONFIG } from '@/lib/plagiarism/types';
import { detectPlagiarism, quickPlagiarismCheck } from '@/lib/plagiarism/detector';

export interface UsePlagiarismOptions {
  /** Document ID */
  documentId: string;
  /** Configuration overrides */
  config?: Partial<PlagiarismConfig>;
  /** User's other documents for self-plagiarism check */
  userDocuments?: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: number;
  }>;
  /** Auto-check on text change (debounced) */
  autoCheck?: boolean;
  /** Debounce delay in ms (default: 5000) */
  debounceMs?: number;
}

export interface UsePlagiarismReturn {
  /** Current plagiarism result */
  result: PlagiarismResult | null;
  /** Whether check is in progress */
  isChecking: boolean;
  /** Last error if any */
  error: string | null;
  /** Run full plagiarism check */
  checkPlagiarism: (text: string) => Promise<void>;
  /** Run quick check (faster, less thorough) */
  quickCheck: (text: string) => {
    similarityScore: number;
    originalityScore: number;
    selfPlagiarismCount: number;
    uncitedQuoteCount: number;
  };
  /** Clear results */
  clearResults: () => void;
  /** Exclude a match from scoring */
  excludeMatch: (matchId: string) => void;
  /** Include a previously excluded match */
  includeMatch: (matchId: string) => void;
  /** Get matches for a specific position */
  getMatchAtPosition: (position: number) => PlagiarismMatch | null;
  /** Quick stats for display */
  quickStats: {
    originalityScore: number;
    matchCount: number;
    selfPlagiarismCount: number;
    uncitedQuoteCount: number;
  } | null;
}

/**
 * Hook for plagiarism detection
 */
export function usePlagiarism(options: UsePlagiarismOptions): UsePlagiarismReturn {
  const {
    documentId,
    config: configOverrides,
    userDocuments = [],
    autoCheck = false,
    debounceMs = 5000,
  } = options;

  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTextRef = useRef<string>('');

  // Merge config with defaults
  const config: PlagiarismConfig = {
    ...DEFAULT_PLAGIARISM_CONFIG,
    ...configOverrides,
    exclusions: {
      ...DEFAULT_PLAGIARISM_CONFIG.exclusions,
      ...configOverrides?.exclusions,
    },
    checks: {
      ...DEFAULT_PLAGIARISM_CONFIG.checks,
      ...configOverrides?.checks,
    },
    sources: {
      ...DEFAULT_PLAGIARISM_CONFIG.sources,
      ...configOverrides?.sources,
    },
  };

  /**
   * Run full plagiarism check
   */
  const checkPlagiarism = useCallback(
    async (text: string) => {
      if (!text || text.trim().length < 50) {
        setError('Text must be at least 50 characters');
        return;
      }

      setIsChecking(true);
      setError(null);

      try {
        const plagiarismResult = await detectPlagiarism(
          text,
          documentId,
          userDocuments,
          config
        );
        setResult(plagiarismResult);
        lastTextRef.current = text;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Plagiarism check failed');
      } finally {
        setIsChecking(false);
      }
    },
    [documentId, userDocuments, config]
  );

  /**
   * Run quick check (synchronous, faster)
   */
  const quickCheck = useCallback(
    (text: string) => {
      return quickPlagiarismCheck(text, documentId, userDocuments);
    },
    [documentId, userDocuments]
  );

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  /**
   * Exclude a match from scoring
   */
  const excludeMatch = useCallback((matchId: string) => {
    setResult(prev => {
      if (!prev) return prev;

      const updatedMatches = prev.matches.map(match =>
        match.id === matchId
          ? { ...match, excluded: true, exclusionReason: 'user-excluded' as const }
          : match
      );

      // Recalculate score
      const matchedWords = updatedMatches
        .filter(m => !m.excluded)
        .reduce((sum, m) => sum + m.wordCount, 0);

      const similarityScore = (matchedWords / prev.stats.totalWords) * 100;

      return {
        ...prev,
        matches: updatedMatches,
        similarityScore: Math.round(similarityScore * 10) / 10,
        originalityScore: Math.round((100 - similarityScore) * 10) / 10,
        stats: {
          ...prev.stats,
          matchedWords,
          excludedWords: updatedMatches
            .filter(m => m.excluded)
            .reduce((sum, m) => sum + m.wordCount, 0),
        },
      };
    });
  }, []);

  /**
   * Include a previously excluded match
   */
  const includeMatch = useCallback((matchId: string) => {
    setResult(prev => {
      if (!prev) return prev;

      const updatedMatches = prev.matches.map(match =>
        match.id === matchId
          ? { ...match, excluded: false, exclusionReason: undefined }
          : match
      );

      // Recalculate score
      const matchedWords = updatedMatches
        .filter(m => !m.excluded)
        .reduce((sum, m) => sum + m.wordCount, 0);

      const similarityScore = (matchedWords / prev.stats.totalWords) * 100;

      return {
        ...prev,
        matches: updatedMatches,
        similarityScore: Math.round(similarityScore * 10) / 10,
        originalityScore: Math.round((100 - similarityScore) * 10) / 10,
        stats: {
          ...prev.stats,
          matchedWords,
          excludedWords: updatedMatches
            .filter(m => m.excluded)
            .reduce((sum, m) => sum + m.wordCount, 0),
        },
      };
    });
  }, []);

  /**
   * Get match at a specific position
   */
  const getMatchAtPosition = useCallback(
    (position: number): PlagiarismMatch | null => {
      if (!result) return null;

      return (
        result.matches.find(
          match => position >= match.startOffset && position <= match.endOffset
        ) || null
      );
    },
    [result]
  );

  /**
   * Auto-check effect
   */
  useEffect(() => {
    if (!autoCheck) return;

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [autoCheck]);

  /**
   * Quick stats for display
   */
  const quickStats = result
    ? {
        originalityScore: result.originalityScore,
        matchCount: result.matches.filter(m => !m.excluded).length,
        selfPlagiarismCount: result.selfPlagiarism.length,
        uncitedQuoteCount: result.uncitedQuotes.length,
      }
    : null;

  return {
    result,
    isChecking,
    error,
    checkPlagiarism,
    quickCheck,
    clearResults,
    excludeMatch,
    includeMatch,
    getMatchAtPosition,
    quickStats,
  };
}

export default usePlagiarism;
