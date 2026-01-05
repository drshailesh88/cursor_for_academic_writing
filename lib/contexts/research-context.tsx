/**
 * Research Context
 *
 * React Context for sharing deep research state across components
 * Wraps the useDeepResearch hook and provides it to child components
 */

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
  useDeepResearch,
  type ResearchProgress,
  type ResearchResults,
} from '@/lib/hooks/use-deep-research';
import type { ResearchMode, ResearchConfig } from '@/lib/research/deep-research/types';

/**
 * Research context value interface
 */
interface ResearchContextValue {
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
 * Create the research context
 */
const ResearchContext = createContext<ResearchContextValue | null>(null);

/**
 * Research Provider Props
 */
interface ResearchProviderProps {
  children: ReactNode;
}

/**
 * Research Provider Component
 *
 * Wraps components that need access to research state
 *
 * @example
 * ```tsx
 * <ResearchProvider>
 *   <IntegratedResearchPanel />
 * </ResearchProvider>
 * ```
 */
export function ResearchProvider({ children }: ResearchProviderProps) {
  const research = useDeepResearch();

  return (
    <ResearchContext.Provider value={research}>
      {children}
    </ResearchContext.Provider>
  );
}

/**
 * Hook to access research context
 *
 * Must be used within a ResearchProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { startResearch, isResearching, results } = useResearchContext();
 *
 *   return (
 *     <button
 *       onClick={() => startResearch('AI in medicine', 'standard')}
 *       disabled={isResearching}
 *     >
 *       Start Research
 *     </button>
 *   );
 * }
 * ```
 */
export function useResearchContext() {
  const context = useContext(ResearchContext);

  if (!context) {
    throw new Error('useResearchContext must be used within a ResearchProvider');
  }

  return context;
}
