/**
 * Deep Research Hook
 *
 * React hook for managing deep research state and API interactions
 * Features:
 * - Start research session with topic and mode
 * - Handle SSE streaming for progress updates
 * - Store research results
 * - Handle clarification flow
 * - Error handling and retry logic
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ResearchMode,
  ResearchConfig,
  Perspective,
  SessionStatus,
} from '@/lib/research/deep-research/types';
import type { SearchResult } from '@/lib/research/types';

/**
 * SSE Event types from the research API
 */
interface SSEEvent {
  type: 'status' | 'session_created' | 'perspectives_generated' | 'tree_built' | 'progress' | 'sources_deduplicated' | 'complete' | 'error';
  [key: string]: unknown;
}

/**
 * Progress update structure
 */
export interface ResearchProgress {
  stage: string;
  message?: string;
  progress: number;
  perspectivesGenerated?: number;
  nodesExplored?: number;
  sourcesFound?: number;
  currentPhase?: string;
}

/**
 * Research results structure
 */
export interface ResearchResults {
  sessionId: string;
  topic: string;
  mode: ResearchMode;
  sources: SearchResult[];
  perspectives: Perspective[];
  metadata: {
    totalSources: number;
    duplicatesRemoved: number;
  };
  tree: {
    totalNodes: number;
    completedNodes: number;
  };
}

/**
 * Hook return type
 */
interface UseDeepResearchReturn {
  // State
  isResearching: boolean;
  progress: ResearchProgress | null;
  results: ResearchResults | null;
  error: string | null;
  clarificationQuestions: string[] | null;

  // Methods
  startResearch: (topic: string, mode: ResearchMode, config?: Partial<ResearchConfig>) => Promise<void>;
  submitClarifications: (answers: Array<{ question: string; answer: string }>) => Promise<void>;
  cancelResearch: () => void;
  clearResults: () => void;
  clearError: () => void;
}

/**
 * Deep Research Hook
 */
export function useDeepResearch(): UseDeepResearchReturn {
  // State
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState<ResearchProgress | null>(null);
  const [results, setResults] = useState<ResearchResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[] | null>(null);

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  /**
   * Cleanup function to abort ongoing requests
   */
  const cleanup = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Parse SSE data
   */
  const parseSSEData = useCallback((text: string): SSEEvent | null => {
    const lines = text.split('\n');
    let eventType = 'message';
    let data = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        data = line.slice(5).trim();
      }
    }

    if (data) {
      try {
        return {
          type: eventType as SSEEvent['type'],
          ...JSON.parse(data),
        };
      } catch (e) {
        console.error('Failed to parse SSE data:', e);
        return null;
      }
    }

    return null;
  }, []);

  /**
   * Handle SSE events
   */
  const handleSSEEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'status':
        setProgress({
          stage: event.stage as string,
          message: event.message as string,
          progress: event.progress as number,
        });
        break;

      case 'session_created':
        // Session created successfully
        break;

      case 'perspectives_generated':
        setProgress(prev => ({
          ...prev,
          stage: 'perspective-generation',
          message: `Generated ${event.count} perspectives`,
          progress: prev?.progress || 10,
          perspectivesGenerated: event.count as number,
        }));
        break;

      case 'tree_built':
        setProgress(prev => ({
          ...prev,
          stage: 'research',
          message: 'Exploration tree built',
          progress: prev?.progress || 20,
        }));
        break;

      case 'progress':
        setProgress({
          stage: event.stage as string,
          progress: event.progress as number,
          perspectivesGenerated: event.perspectivesGenerated as number,
          nodesExplored: event.nodesExplored as number,
          sourcesFound: event.sourcesFound as number,
        });
        break;

      case 'sources_deduplicated':
        setProgress(prev => ({
          ...prev,
          stage: 'analysis',
          message: `Deduplicated sources: ${event.uniqueSources} unique out of ${event.totalSources}`,
          progress: prev?.progress || 85,
        }));
        break;

      case 'complete':
        setProgress({
          stage: 'complete',
          message: 'Research complete!',
          progress: 100,
        });
        setResults(event as unknown as ResearchResults);
        setIsResearching(false);
        cleanup();
        break;

      case 'error':
        setError(event.message as string);
        setIsResearching(false);
        cleanup();
        break;
    }
  }, [cleanup]);

  /**
   * Process SSE stream
   */
  const processStream = useCallback(async (response: Response) => {
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    readerRef.current = reader;
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by \n\n)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (message.trim()) {
            const event = parseSSEData(message);
            if (event) {
              handleSSEEvent(event);
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Stream processing error:', err);
        setError(err instanceof Error ? err.message : 'Stream processing failed');
      }
    } finally {
      readerRef.current = null;
    }
  }, [parseSSEData, handleSSEEvent]);

  /**
   * Start research session
   */
  const startResearch = useCallback(async (
    topic: string,
    mode: ResearchMode,
    config?: Partial<ResearchConfig>
  ) => {
    // Validate input
    if (!topic.trim()) {
      setError('Topic is required');
      return;
    }

    // Reset state
    setError(null);
    setResults(null);
    setProgress({
      stage: 'initialization',
      message: 'Starting research...',
      progress: 0,
    });
    setIsResearching(true);
    setClarificationQuestions(null);

    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Make API request
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          mode,
          config,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start research');
      }

      // Process SSE stream
      await processStream(response);

    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start research';
        setError(errorMessage);
        setIsResearching(false);
        cleanup();
      }
    }
  }, [processStream, cleanup]);

  /**
   * Submit clarification answers
   */
  const submitClarifications = useCallback(async (
    answers: Array<{ question: string; answer: string }>
  ) => {
    try {
      const response = await fetch('/api/research/clarify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit clarifications');
      }

      setClarificationQuestions(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit clarifications';
      setError(errorMessage);
    }
  }, []);

  /**
   * Cancel ongoing research
   */
  const cancelResearch = useCallback(() => {
    cleanup();
    setIsResearching(false);
    setProgress(null);
    setError('Research cancelled');
  }, [cleanup]);

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setResults(null);
    setProgress(null);
    setError(null);
    setClarificationQuestions(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isResearching,
    progress,
    results,
    error,
    clarificationQuestions,
    startResearch,
    submitClarifications,
    cancelResearch,
    clearResults,
    clearError,
  };
}
