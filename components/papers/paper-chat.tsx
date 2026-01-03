// Paper Chat Interface
// Multi-paper AI chat with citations and RAG

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Quote,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { usePaperLibrary } from './paper-library-context';

interface Citation {
  paperId: string;
  paperTitle: string;
  authors?: string;
  year?: number;
  section?: string;
  quote: string;
  pageNumber?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

interface PaperChatProps {
  userId: string;
}

export function PaperChat({ userId }: PaperChatProps) {
  const {
    papers,
    isChatOpen,
    chatPaperIds,
    closeChat,
    addPaperToChat,
    removePaperFromChat,
    selectPaper,
  } = usePaperLibrary();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaperSelector, setShowPaperSelector] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get selected papers
  const selectedPapers = papers.filter((p) => chatPaperIds.includes(p.id));
  const availablePapers = papers.filter(
    (p) => !chatPaperIds.includes(p.id) && p.processingStatus === 'ready'
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen) {
      inputRef.current?.focus();
    }
  }, [isChatOpen]);

  // Toggle citation expansion
  const toggleCitation = (messageId: string, citationIndex: number) => {
    const key = `${messageId}-${citationIndex}`;
    setExpandedCitations((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Send message with streaming
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || selectedPapers.length === 0) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

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
          paperIds: chatPaperIds,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      // Get citations from header
      const citationsHeader = response.headers.get('X-Citations');
      const citations: Citation[] = citationsHeader
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

      // Finalize message with citations
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: fullContent || 'I couldn\'t generate a response. Please try again.', citations }
            : m
        )
      );

    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: 'Sorry, I encountered an error. Please make sure the papers are fully processed and try again.',
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, selectedPapers, chatPaperIds, userId]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setExpandedCitations(new Set());
  };

  // Render message content with highlighted citations
  const renderMessageContent = (content: string) => {
    // Highlight citation markers like [1], [2], etc.
    const parts = content.split(/(\[\d+(?:,\s*\d+)*\])/g);

    return parts.map((part, i) => {
      if (/^\[\d+(?:,\s*\d+)*\]$/.test(part)) {
        return (
          <span
            key={i}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 bg-primary/20 text-primary rounded text-xs font-medium cursor-help"
            title="Click Sources below to see this reference"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!isChatOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed right-4 top-4 bottom-4 w-[480px] bg-background rounded-2xl border border-border shadow-2xl flex flex-col z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Paper Chat</h3>
              <p className="text-xs text-muted-foreground">
                {selectedPapers.length} paper{selectedPapers.length !== 1 ? 's' : ''} • RAG-powered
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="Clear chat"
            >
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={closeChat}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Papers */}
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedPapers.map((paper) => (
              <div
                key={paper.id}
                className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-lg text-xs"
              >
                <FileText className="w-3 h-3 text-primary" />
                <span className="max-w-[120px] truncate">{paper.title}</span>
                <button
                  onClick={() => removePaperFromChat(paper.id)}
                  className="p-0.5 hover:bg-primary/20 rounded"
                >
                  <X className="w-3 h-3 text-primary" />
                </button>
              </div>
            ))}

            {/* Add Paper Button */}
            <div className="relative">
              <button
                onClick={() => setShowPaperSelector(!showPaperSelector)}
                className="flex items-center gap-1 px-2 py-1 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>

              {/* Paper Selector Dropdown */}
              {showPaperSelector && availablePapers.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-64 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-lg z-10">
                  {availablePapers.map((paper) => (
                    <button
                      key={paper.id}
                      onClick={() => {
                        addPaperToChat(paper.id);
                        setShowPaperSelector(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors"
                    >
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{paper.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-medium mb-2">Ask about your papers</h4>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                I'll search through your papers and cite my sources.
              </p>

              {/* Suggested Questions */}
              <div className="mt-6 space-y-2">
                <p className="text-xs text-muted-foreground">Try asking:</p>
                {[
                  'What are the main findings?',
                  'Compare the methodologies',
                  'What limitations are discussed?',
                  'Summarize the key contributions',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="block w-full text-left px-3 py-2 text-sm bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.role === 'assistant'
                      ? renderMessageContent(message.content)
                      : message.content}
                  </div>

                  {/* Citations Panel */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <p className="text-xs font-medium opacity-70 flex items-center gap-1 mb-2">
                        <Quote className="w-3 h-3" />
                        Sources ({message.citations.length})
                      </p>
                      <div className="space-y-2">
                        {message.citations.map((citation, i) => {
                          const isExpanded = expandedCitations.has(`${message.id}-${i}`);
                          return (
                            <div
                              key={i}
                              className="bg-background/60 rounded-lg overflow-hidden"
                            >
                              <button
                                onClick={() => toggleCitation(message.id, i)}
                                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-background/80 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="flex-shrink-0 w-5 h-5 rounded bg-primary/20 text-primary text-xs font-medium flex items-center justify-center">
                                    {i + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">
                                      {citation.paperTitle}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {citation.authors?.split(',')[0]}
                                      {citation.year && `, ${citation.year}`}
                                      {citation.section && ` • ${citation.section}`}
                                    </p>
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                )}
                              </button>

                              {/* Expanded citation quote */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-border/30"
                                  >
                                    <div className="px-3 py-2">
                                      <p className="text-xs text-muted-foreground italic leading-relaxed">
                                        "{citation.quote}"
                                      </p>
                                      <button
                                        onClick={() => selectPaper(citation.paperId)}
                                        className="mt-2 flex items-center gap-1 text-[10px] text-primary hover:underline"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        View in paper
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {isLoading && messages[messages.length - 1]?.content === '' && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching papers...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          {selectedPapers.length === 0 ? (
            <div className="text-center py-2 text-sm text-muted-foreground">
              Add at least one paper to start chatting
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask a question about your papers..."
                rows={1}
                className="flex-1 px-4 py-2.5 bg-muted border-0 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 max-h-32"
                style={{
                  height: 'auto',
                  minHeight: '42px',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
