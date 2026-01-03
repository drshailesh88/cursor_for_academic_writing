// Deep Research - Research Mode Context
// Manages research state and mode transitions

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  ResearchSession,
  ResearchMode,
  ResearchStatus,
  Perspective,
  ResearchSource,
} from '@/lib/deep-research/types';

interface ResearchContextValue {
  // Mode
  isResearchMode: boolean;
  enterResearchMode: () => void;
  exitResearchMode: () => void;

  // Session
  session: Partial<ResearchSession> | null;
  topic: string;
  setTopic: (topic: string) => void;
  mode: ResearchMode;
  setMode: (mode: ResearchMode) => void;

  // Status
  status: ResearchStatus | 'idle';
  progress: number;
  currentAgent: string | null;

  // Actions
  startResearch: () => Promise<void>;
  cancelResearch: () => void;

  // Results
  perspectives: Perspective[];
  sources: ResearchSource[];
  synthesis: string | null;
}

const ResearchContext = createContext<ResearchContextValue | null>(null);

export function ResearchProvider({ children }: { children: ReactNode }) {
  // Mode state
  const [isResearchMode, setIsResearchMode] = useState(false);

  // Research input
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<ResearchMode>('standard');

  // Session state
  const [session, setSession] = useState<Partial<ResearchSession> | null>(null);
  const [status, setStatus] = useState<ResearchStatus | 'idle'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);

  // Results
  const [perspectives, setPerspectives] = useState<Perspective[]>([]);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [synthesis, setSynthesis] = useState<string | null>(null);

  const enterResearchMode = useCallback(() => {
    setIsResearchMode(true);
  }, []);

  const exitResearchMode = useCallback(() => {
    setIsResearchMode(false);
    // Reset state when exiting
    if (status === 'idle') {
      setTopic('');
      setSession(null);
      setPerspectives([]);
      setSources([]);
      setSynthesis(null);
    }
  }, [status]);

  const startResearch = useCallback(async () => {
    if (!topic.trim()) return;

    setStatus('clarifying');
    setProgress(0);
    setCurrentAgent('clarifier');

    // Create session
    const newSession: Partial<ResearchSession> = {
      id: `session-${Date.now()}`,
      topic,
      mode,
      status: 'clarifying',
      progress: 0,
    };
    setSession(newSession);

    // Simulate research progress for now
    // In production, this would connect to the actual agent system
    const stages = [
      { status: 'clarifying', agent: 'Clarifying topic', duration: 1500 },
      { status: 'planning', agent: 'Analyzing perspectives', duration: 2000 },
      { status: 'researching', agent: 'Searching databases', duration: 3000 },
      { status: 'reviewing', agent: 'Analyzing citations', duration: 2000 },
      { status: 'synthesizing', agent: 'Synthesizing findings', duration: 2500 },
    ];

    let progressAccum = 0;
    for (const stage of stages) {
      setStatus(stage.status as ResearchStatus);
      setCurrentAgent(stage.agent);

      // Animate progress
      const stageProgress = 100 / stages.length;
      const startProgress = progressAccum;
      const endProgress = progressAccum + stageProgress;

      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          setProgress((p) => {
            if (p >= endProgress - 1) {
              clearInterval(interval);
              resolve();
              return endProgress;
            }
            return p + 1;
          });
        }, stage.duration / stageProgress);
      });

      progressAccum = endProgress;
    }

    setStatus('complete');
    setProgress(100);
    setCurrentAgent(null);
  }, [topic, mode]);

  const cancelResearch = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setCurrentAgent(null);
  }, []);

  const value: ResearchContextValue = {
    isResearchMode,
    enterResearchMode,
    exitResearchMode,
    session,
    topic,
    setTopic,
    mode,
    setMode,
    status,
    progress,
    currentAgent,
    startResearch,
    cancelResearch,
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
