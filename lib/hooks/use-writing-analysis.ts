/**
 * Writing Analysis Hook
 *
 * Provides real-time writing analysis for the editor.
 * Debounces analysis to avoid performance issues.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Editor } from '@tiptap/react';
import {
  analyzeWriting,
  stripHtml,
} from '@/lib/writing-analysis/analyzers';
import {
  WritingAnalysis,
  WritingIssue,
  AnalysisConfig,
  DEFAULT_ANALYSIS_CONFIG,
  getReadabilityLevel,
  getScoreRating,
} from '@/lib/writing-analysis/types';

interface UseWritingAnalysisOptions {
  editor: Editor | null;
  enabled?: boolean;
  debounceMs?: number;
  config?: Partial<AnalysisConfig>;
}

interface UseWritingAnalysisReturn {
  // Analysis results
  analysis: WritingAnalysis | null;
  isAnalyzing: boolean;

  // Issues
  issues: WritingIssue[];
  issueCount: number;
  issuesByCategory: Record<string, WritingIssue[]>;

  // Scores
  overallScore: number;
  scores: WritingAnalysis['scores'] | null;

  // Readability
  readabilityLevel: { level: string; description: string } | null;
  fleschScore: number | null;

  // Quick stats
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgSentenceLength: number;

  // Style stats
  passiveVoicePercentage: number;
  adverbPercentage: number;

  // Actions
  refreshAnalysis: () => void;
  setConfig: (config: Partial<AnalysisConfig>) => void;

  // Helpers
  getIssuesForPosition: (pos: number) => WritingIssue[];
  getScoreRating: (score: number) => { rating: string; color: string };
}

/**
 * Hook for real-time writing analysis
 */
export function useWritingAnalysis({
  editor,
  enabled = true,
  debounceMs = 1000,
  config: initialConfig,
}: UseWritingAnalysisOptions): UseWritingAnalysisReturn {
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [config, setConfigState] = useState<AnalysisConfig>({
    ...DEFAULT_ANALYSIS_CONFIG,
    ...initialConfig,
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');

  /**
   * Run analysis on current content
   */
  const runAnalysis = useCallback(() => {
    if (!editor || !enabled) return;

    const content = editor.getHTML();
    const plainText = stripHtml(content);

    // Skip if content hasn't changed
    if (plainText === lastContentRef.current) return;
    lastContentRef.current = plainText;

    // Skip if content is too short
    if (plainText.length < 50) {
      setAnalysis(null);
      return;
    }

    setIsAnalyzing(true);

    // Run analysis (could be async in future for large documents)
    try {
      const result = analyzeWriting(content, config);
      setAnalysis(result);
    } catch (error) {
      console.error('Writing analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [editor, enabled, config]);

  /**
   * Debounced analysis
   */
  const debouncedAnalysis = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      runAnalysis();
    }, debounceMs);
  }, [runAnalysis, debounceMs]);

  /**
   * Force refresh analysis
   */
  const refreshAnalysis = useCallback(() => {
    lastContentRef.current = ''; // Reset to force reanalysis
    runAnalysis();
  }, [runAnalysis]);

  /**
   * Update config
   */
  const setConfig = useCallback((newConfig: Partial<AnalysisConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Listen to editor changes
   */
  useEffect(() => {
    if (!editor || !enabled) return;

    const handleUpdate = () => {
      debouncedAnalysis();
    };

    editor.on('update', handleUpdate);

    // Initial analysis
    runAnalysis();

    return () => {
      editor.off('update', handleUpdate);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [editor, enabled, debouncedAnalysis, runAnalysis]);

  /**
   * Rerun analysis when config changes
   */
  useEffect(() => {
    if (editor && enabled) {
      refreshAnalysis();
    }
  }, [config, editor, enabled, refreshAnalysis]);

  // Computed values
  const issues = useMemo(() => analysis?.issues || [], [analysis]);

  const issuesByCategory = useMemo(() => {
    const grouped: Record<string, WritingIssue[]> = {};
    for (const issue of issues) {
      if (!grouped[issue.category]) {
        grouped[issue.category] = [];
      }
      grouped[issue.category].push(issue);
    }
    return grouped;
  }, [issues]);

  const readabilityLevel = useMemo(() => {
    if (!analysis) return null;
    return getReadabilityLevel(analysis.readability.fleschReadingEase);
  }, [analysis]);

  /**
   * Get issues at a specific position
   */
  const getIssuesForPosition = useCallback((pos: number): WritingIssue[] => {
    return issues.filter(issue => pos >= issue.start && pos <= issue.end);
  }, [issues]);

  return {
    // Analysis results
    analysis,
    isAnalyzing,

    // Issues
    issues,
    issueCount: issues.length,
    issuesByCategory,

    // Scores
    overallScore: analysis?.scores.overall || 0,
    scores: analysis?.scores || null,

    // Readability
    readabilityLevel,
    fleschScore: analysis?.readability.fleschReadingEase || null,

    // Quick stats
    wordCount: analysis?.readability.totalWords || 0,
    sentenceCount: analysis?.readability.totalSentences || 0,
    paragraphCount: analysis?.readability.totalParagraphs || 0,
    avgSentenceLength: analysis?.readability.avgSentenceLength || 0,

    // Style stats
    passiveVoicePercentage: analysis?.style.passiveVoicePercentage || 0,
    adverbPercentage: analysis?.style.adverbPercentage || 0,

    // Actions
    refreshAnalysis,
    setConfig,

    // Helpers
    getIssuesForPosition,
    getScoreRating,
  };
}

export default useWritingAnalysis;
