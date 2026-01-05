// Papers Management Hook
// Centralized state management for paper library and chat

'use client';

import { useState, useCallback, useEffect } from 'react';
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

interface UsePapersOptions {
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function usePapers(options: UsePapersOptions = {}) {
  const { userId, autoRefresh = true, refreshInterval = 3000 } = options;

  // Paper library state
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [selectedPaperContent, setSelectedPaperContent] = useState<PaperContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Chat state
  const [chatMessages, setMessages] = useState<Message[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [activeChatPaperIds, setActiveChatPaperIds] = useState<string[]>([]);

  // Extraction state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResults, setExtractionResults] = useState<
    Array<{ type: string; content: string }>
  >([]);

  /**
   * Fetch user's paper library
   */
  const refreshLibrary = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/papers?userId=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch papers');
      }

      const { papers: fetchedPapers } = await response.json();
      setPapers(fetchedPapers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load papers';
      setError(errorMessage);
      console.error('Error fetching papers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Upload a paper
   */
  const uploadPaper = useCallback(
    async (file: File) => {
      if (!userId) {
        throw new Error('User ID is required to upload papers');
      }

      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        // Validate file type
        if (file.type !== 'application/pdf') {
          throw new Error('Only PDF files are allowed');
        }

        // Validate file size (100MB limit)
        const MAX_SIZE = 100 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
          throw new Error('File size exceeds 100MB limit');
        }

        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);

        // Upload with simulated progress
        setUploadProgress(50);

        const response = await fetch('/api/papers/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const { paperId } = await response.json();
        setUploadProgress(100);

        // Refresh library to show new paper
        await refreshLibrary();

        return paperId;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    },
    [userId, refreshLibrary]
  );

  /**
   * Select a paper and load its content
   */
  const selectPaper = useCallback(async (paperId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/papers/${paperId}?content=true`);

      if (!response.ok) {
        throw new Error('Failed to fetch paper');
      }

      const { paper, content } = await response.json();
      setSelectedPaper(paper);
      setSelectedPaperContent(content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load paper';
      setError(errorMessage);
      console.error('Error selecting paper:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a paper
   */
  const deletePaper = useCallback(
    async (paperId: string) => {
      try {
        const response = await fetch(`/api/papers/${paperId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete paper');
        }

        // Update local state
        setPapers((prev) => prev.filter((p) => p.id !== paperId));

        // Clear selection if deleted paper was selected
        if (selectedPaper?.id === paperId) {
          setSelectedPaper(null);
          setSelectedPaperContent(null);
        }

        // Remove from active chat if present
        setActiveChatPaperIds((prev) => prev.filter((id) => id !== paperId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete paper';
        setError(errorMessage);
        throw err;
      }
    },
    [selectedPaper]
  );

  /**
   * Send a chat message
   */
  const sendChatMessage = useCallback(
    async (question: string, model?: string) => {
      if (!userId || activeChatPaperIds.length === 0) {
        throw new Error('User ID and at least one paper are required');
      }

      setIsChatting(true);
      setError(null);

      // Add user message
      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: question,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Create placeholder for assistant message
      const assistantMessageId = `msg_${Date.now() + 1}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          citations: [],
          timestamp: new Date(),
        },
      ]);

      try {
        const response = await fetch('/api/papers/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            paperIds: activeChatPaperIds,
            messages: [...chatMessages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            model,
          }),
        });

        if (!response.ok) {
          throw new Error('Chat request failed');
        }

        // Get citations from header
        const citationsHeader = response.headers.get('X-Citations');
        const citations: PaperChatCitation[] = citationsHeader
          ? JSON.parse(citationsHeader)
          : [];

        // Stream the response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // Parse SSE data chunks
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('0:')) {
                // Text chunk from Vercel AI SDK
                try {
                  const text = JSON.parse(line.slice(2));
                  fullContent += text;

                  // Update message content
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: fullContent, citations }
                        : m
                    )
                  );
                } catch {
                  // Not JSON, might be raw text
                  fullContent += line.slice(2);
                }
              }
            }
          }
        }

        // Finalize message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: fullContent || "I couldn't generate a response. Please try again.",
                  citations,
                }
              : m
          )
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Chat failed';
        setError(errorMessage);

        // Update message with error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content:
                    'Sorry, I encountered an error. Please make sure the papers are fully processed and try again.',
                }
              : m
          )
        );

        throw err;
      } finally {
        setIsChatting(false);
      }
    },
    [userId, activeChatPaperIds, chatMessages]
  );

  /**
   * Extract specific content from a paper
   */
  const extractContent = useCallback(
    async (
      type: 'findings' | 'methods' | 'limitations' | 'citation',
      paperId?: string
    ) => {
      const targetPaperId = paperId || selectedPaper?.id;

      if (!targetPaperId) {
        throw new Error('No paper selected for extraction');
      }

      setIsExtracting(true);
      setError(null);

      try {
        const response = await fetch('/api/papers/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paperId: targetPaperId,
            extractionType: type,
            format: 'markdown',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Extraction failed');
        }

        const result = await response.json();

        // Add to extraction results
        setExtractionResults((prev) => [
          { type, content: result.content },
          ...prev,
        ]);

        return result.content;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Extraction failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsExtracting(false);
      }
    },
    [selectedPaper]
  );

  /**
   * Clear chat messages
   */
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Set active papers for chat
   */
  const setChatPapers = useCallback((paperIds: string[]) => {
    setActiveChatPaperIds(paperIds);
  }, []);

  /**
   * Clear extraction results
   */
  const clearExtractions = useCallback(() => {
    setExtractionResults([]);
  }, []);

  // Load papers on mount
  useEffect(() => {
    if (userId) {
      refreshLibrary();
    }
  }, [userId, refreshLibrary]);

  // Auto-refresh for processing papers
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const processingPapers = papers.filter((p) =>
      [
        'uploading',
        'processing',
        'extracting_text',
        'extracting_figures',
        'extracting_tables',
        'parsing_references',
        'generating_embeddings',
      ].includes(p.processingStatus)
    );

    if (processingPapers.length === 0) return;

    const interval = setInterval(() => {
      refreshLibrary();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [papers, autoRefresh, userId, refreshInterval, refreshLibrary]);

  return {
    // Paper library
    papers,
    selectedPaper,
    selectedPaperContent,
    isLoading,
    error,

    // Upload
    isUploading,
    uploadProgress,
    uploadPaper,

    // Library operations
    refreshLibrary,
    selectPaper,
    deletePaper,

    // Chat
    chatMessages,
    isChatting,
    activeChatPaperIds,
    sendChatMessage,
    clearChat,
    setChatPapers,

    // Extraction
    isExtracting,
    extractionResults,
    extractContent,
    clearExtractions,
  };
}
