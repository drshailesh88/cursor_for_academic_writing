// Papers Context Provider
// React Context wrapper for usePapers hook

'use client';

import {
  createContext,
  useContext,
  ReactNode,
} from 'react';
import { usePapers } from '@/lib/hooks/use-papers';
import type { Paper, PaperContent, Citation } from '@/lib/firebase/schema';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: PaperChatCitation[];
  timestamp: Date;
}

interface PaperChatCitation {
  paperId: string;
  paperTitle: string;
  authors?: string;
  year?: number;
  section?: string;
  quote: string;
  pageNumber?: number;
}

interface PapersContextValue {
  // Paper library
  papers: Paper[];
  selectedPaper: Paper | null;
  selectedPaperContent: PaperContent | null;
  isLoading: boolean;
  error: string | null;

  // Upload
  isUploading: boolean;
  uploadProgress: number;
  uploadPaper: (file: File) => Promise<string>;

  // Library operations
  refreshLibrary: () => Promise<void>;
  selectPaper: (paperId: string) => Promise<void>;
  deletePaper: (paperId: string) => Promise<void>;

  // Chat
  chatMessages: Message[];
  isChatting: boolean;
  activeChatPaperIds: string[];
  sendChatMessage: (question: string, model?: string) => Promise<void>;
  clearChat: () => void;
  setChatPapers: (paperIds: string[]) => void;

  // Extraction
  isExtracting: boolean;
  extractionResults: Array<{ type: string; content: string }>;
  extractContent: (
    type: 'findings' | 'methods' | 'limitations' | 'citation',
    paperId?: string
  ) => Promise<string>;
  clearExtractions: () => void;
}

const PapersContext = createContext<PapersContextValue | null>(null);

/**
 * Hook to access Papers context
 * Must be used within PapersProvider
 */
export function usePapersContext() {
  const context = useContext(PapersContext);
  if (!context) {
    throw new Error('usePapersContext must be used within PapersProvider');
  }
  return context;
}

interface PapersProviderProps {
  userId: string;
  children: ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Papers Context Provider
 * Wraps components that need access to paper library and chat functionality
 */
export function PapersProvider({
  userId,
  children,
  autoRefresh = true,
  refreshInterval = 3000,
}: PapersProviderProps) {
  const papersState = usePapers({
    userId,
    autoRefresh,
    refreshInterval,
  });

  return (
    <PapersContext.Provider value={papersState}>
      {children}
    </PapersContext.Provider>
  );
}
