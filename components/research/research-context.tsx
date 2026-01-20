// Deep Research - Research Mode Context
// Manages research state and mode transitions with real API integration

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuth } from '@/lib/supabase/auth';
import type {
  ResearchSession,
  ResearchMode,
  ResearchStatus,
  Perspective,
  ResearchSource,
  SynthesisResult,
  Clarification,
} from '@/lib/deep-research/types';
import type { EngineEvent, ClarifyingQuestion, ClarificationAnswer } from '@/lib/deep-research/engine';

/** LLM model options for research */
type ResearchModelType = 'deepseek' | 'claude' | 'openai' | 'gemini';

interface ResearchContextValue {
  // Mode
  isResearchMode: boolean;
  enterResearchMode: () => void;
  exitResearchMode: () => void;

  // Session
  session: Partial<ResearchSession> | null;
  sessionId: string | null;
  topic: string;
  setTopic: (topic: string) => void;
  mode: ResearchMode;
  setMode: (mode: ResearchMode) => void;
  /** LLM model to use for research (same as chat dropdown) */
  selectedModel: ResearchModelType;
  setSelectedModel: (model: ResearchModelType) => void;

  // Status
  status: ResearchStatus | 'idle';
  progress: number;
  currentAgent: string | null;
  error: string | null;

  // Clarification
  clarificationQuestions: ClarifyingQuestion[];
  submitClarifications: (answers: ClarificationAnswer[]) => Promise<void>;
  skipClarification: () => Promise<void>;

  // Actions
  startResearch: () => Promise<void>;
  cancelResearch: () => void;

  // Results
  clarifications: Clarification[];
  perspectives: Perspective[];
  sources: ResearchSource[];
  synthesis: SynthesisResult | null;
}

const ResearchContext = createContext<ResearchContextValue | null>(null);

export function ResearchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Mode state
  const [isResearchMode, setIsResearchMode] = useState(false);

  // Research input
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<ResearchMode>('standard');
  const [selectedModel, setSelectedModel] = useState<ResearchModelType>('deepseek');

  // Session state
  const [session, setSession] = useState<Partial<ResearchSession> | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<ResearchStatus | 'idle'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clarification state
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarifyingQuestion[]>([]);

  // Results
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [perspectives, setPerspectives] = useState<Perspective[]>([]);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);

  // SSE connection ref
  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const enterResearchMode = useCallback(() => {
    setIsResearchMode(true);
  }, []);

  const exitResearchMode = useCallback(() => {
    setIsResearchMode(false);
    // Reset state when exiting if idle
    if (status === 'idle' || status === 'complete') {
      setTopic('');
      setSession(null);
      setSessionId(null);
      setClarifications([]);
      setPerspectives([]);
      setSources([]);
      setSynthesis(null);
      setError(null);
    }
  }, [status]);

  /**
   * Handle SSE events from the research engine
   */
  const handleEvent = useCallback((event: EngineEvent) => {
    switch (event.type) {
      case 'status':
        setStatus(event.status);
        setProgress(event.progress);
        break;

      case 'agent_start':
        setCurrentAgent(event.task);
        break;

      case 'agent_progress':
        setCurrentAgent(event.message);
        break;

      case 'agent_complete':
        // Agent completed, wait for next
        break;

      case 'agent_error':
        if (!event.retrying) {
          setError(`Agent ${event.agentType} failed: ${event.error}`);
        }
        break;

      case 'clarification_needed':
        setClarificationQuestions(event.questions);
        break;

      case 'clarification_answered':
        setClarifications(event.clarifications);
        setClarificationQuestions([]);
        break;

      case 'perspective_added':
        setPerspectives((prev) => [...prev, event.perspective]);
        break;

      case 'source_found':
        setSources((prev) => {
          // Avoid duplicates
          if (prev.some((s) => s.id === event.source.id)) return prev;
          return [...prev, event.source];
        });
        break;

      case 'synthesis_ready':
        setSynthesis(event.synthesis);
        break;

      case 'complete':
        setStatus('complete');
        setProgress(100);
        setCurrentAgent(null);
        setSession(event.session);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        break;

      case 'error':
        setError(event.error);
        setStatus('error');
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        break;
    }
  }, []);

  /**
   * Start research with real API
   */
  const startResearch = useCallback(async () => {
    if (!topic.trim()) return;
    if (!user?.uid) {
      setError('Please sign in to start research');
      return;
    }

    setError(null);
    setStatus('clarifying');
    setProgress(0);
    setCurrentAgent('Initializing research...');
    setClarifications([]);
    setPerspectives([]);
    setSources([]);
    setSynthesis(null);
    setClarificationQuestions([]);

    try {
      // Create session via API
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          mode,
          userId: user.uid,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create research session');
      }

      const { sessionId: newSessionId } = await response.json();
      setSessionId(newSessionId);

      // Connect to SSE stream
      const eventSource = new EventSource(`/api/research/${newSessionId}/stream`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data: EngineEvent = JSON.parse(event.data);
          handleEvent(data);
        } catch (e) {
          console.error('Failed to parse SSE event:', e);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        setError('Connection to research engine lost');
        setStatus('error');
        eventSource.close();
        eventSourceRef.current = null;
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setStatus('error');
    }
  }, [topic, mode, user, handleEvent, selectedModel]);

  /**
   * Submit clarification answers
   */
  const submitClarifications = useCallback(async (answers: ClarificationAnswer[]) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/research/${sessionId}/clarify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit clarifications');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  }, [sessionId]);

  /**
   * Skip clarification
   */
  const skipClarification = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/research/${sessionId}/clarify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to skip clarification');
      }

      setClarificationQuestions([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  }, [sessionId]);

  /**
   * Cancel research
   */
  const cancelResearch = useCallback(async () => {
    // Close SSE connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Cancel via API if we have a session
    if (sessionId) {
      try {
        await fetch(`/api/research/${sessionId}`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.error('Failed to cancel session:', e);
      }
    }

    setStatus('idle');
    setProgress(0);
    setCurrentAgent(null);
    setSessionId(null);
  }, [sessionId]);

  const value: ResearchContextValue = {
    isResearchMode,
    enterResearchMode,
    exitResearchMode,
    session,
    sessionId,
    topic,
    setTopic,
    mode,
    setMode,
    selectedModel,
    setSelectedModel,
    status,
    progress,
    currentAgent,
    error,
    clarificationQuestions,
    submitClarifications,
    skipClarification,
    startResearch,
    cancelResearch,
    clarifications,
    perspectives,
    sources,
    synthesis,
  };

  return (
    <ResearchContext.Provider value={value}>
      {children}
    </ResearchContext.Provider>
  );
}

export function useResearch() {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error('useResearch must be used within a ResearchProvider');
  }
  return context;
}
