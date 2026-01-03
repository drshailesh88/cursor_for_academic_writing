// Paper Chat Interface
// Multi-paper AI chat with citations

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
  ChevronDown,
  BookOpen,
  Quote,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { usePaperLibrary } from './paper-library-context';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{
    paperId: string;
    paperTitle: string;
    quote?: string;
    pageNumber?: number;
  }>;
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

  // Send message
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

    try {
      // TODO: Replace with actual API call to paper chat endpoint
      // For now, simulate a response
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
      }).catch(() => null);

      // Simulate response if API not available
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response
          ? (await response.json()).content
          : `Based on the ${selectedPapers.length} paper(s) in your library, I can help answer questions about ${selectedPapers.map((p) => `"${p.title}"`).join(', ')}. Please note that the chat API endpoint is still being implemented. Once complete, I'll be able to provide detailed answers with citations from your papers.`,
        citations: [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
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
  };

  if (!isChatOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed right-4 top-4 bottom-4 w-[450px] bg-background rounded-2xl border border-border shadow-2xl flex flex-col z-50"
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
                {selectedPapers.length} paper{selectedPapers.length !== 1 ? 's' : ''} selected
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
                <span className="max-w-[150px] truncate">{paper.title}</span>
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
                Add paper
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
                I can help you understand, compare, and synthesize insights from
                your research papers.
              </p>

              {/* Suggested Questions */}
              <div className="mt-6 space-y-2">
                <p className="text-xs text-muted-foreground">Try asking:</p>
                {[
                  'What are the main findings?',
                  'Compare the methodologies used',
                  'What are the limitations discussed?',
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
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/20 space-y-2">
                      <p className="text-xs opacity-70 flex items-center gap-1">
                        <Quote className="w-3 h-3" />
                        Sources
                      </p>
                      {message.citations.map((citation, i) => (
                        <button
                          key={i}
                          onClick={() => selectPaper(citation.paperId)}
                          className="block text-left w-full px-2 py-1.5 bg-background/50 rounded-lg text-xs hover:bg-background transition-colors"
                        >
                          <span className="font-medium">{citation.paperTitle}</span>
                          {citation.pageNumber && (
                            <span className="opacity-70"> (p. {citation.pageNumber})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
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
