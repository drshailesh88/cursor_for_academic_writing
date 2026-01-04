'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { Slide, SlideContent, Theme } from '@/lib/presentations/types';
import {
  Wand2,
  Expand,
  Minimize2,
  RefreshCw,
  Layout,
  MessageSquare,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface AIAssistPanelProps {
  slide: Slide;
  theme: Theme;
  onSlideUpdate: (slide: Slide) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

function ActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  isLoading,
  disabled,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full flex items-start gap-3 p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
        ) : (
          <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </div>
      </div>
    </button>
  );
}

interface LayoutOptionProps {
  layout: string;
  isActive: boolean;
  onClick: () => void;
}

function LayoutOption({ layout, isActive, onClick }: LayoutOptionProps) {
  const layoutIcons: Record<string, JSX.Element> = {
    full: (
      <div className="w-full h-full bg-current opacity-50" />
    ),
    split: (
      <div className="w-full h-full flex gap-0.5">
        <div className="flex-1 bg-current opacity-50" />
        <div className="flex-1 bg-current opacity-50" />
      </div>
    ),
    centered: (
      <div className="w-full h-full flex items-center justify-center p-1">
        <div className="w-3/4 h-3/4 bg-current opacity-50" />
      </div>
    ),
    'left-heavy': (
      <div className="w-full h-full flex gap-0.5">
        <div className="flex-[2] bg-current opacity-50" />
        <div className="flex-1 bg-current opacity-50" />
      </div>
    ),
    'right-heavy': (
      <div className="w-full h-full flex gap-0.5">
        <div className="flex-1 bg-current opacity-50" />
        <div className="flex-[2] bg-current opacity-50" />
      </div>
    ),
    grid: (
      <div className="w-full h-full grid grid-cols-2 gap-0.5">
        <div className="bg-current opacity-50" />
        <div className="bg-current opacity-50" />
        <div className="bg-current opacity-50" />
        <div className="bg-current opacity-50" />
      </div>
    ),
  };

  return (
    <button
      onClick={onClick}
      className={`
        aspect-[16/9] rounded-lg border-2 transition-all overflow-hidden
        ${
          isActive
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      <div className={`w-full h-full ${isActive ? 'text-purple-500' : 'text-gray-400'}`}>
        {layoutIcons[layout] || layoutIcons.full}
      </div>
      <div className="sr-only">{layout}</div>
    </button>
  );
}

interface ChatBubbleProps {
  message: ChatMessage;
}

function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[85%] rounded-lg p-3 text-sm
          ${
            isUser
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
          }
        `}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div
          className={`
            text-xs mt-1 opacity-70
            ${isUser ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'}
          `}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AIAssistPanel({
  slide,
  theme,
  onSlideUpdate,
  isCollapsed = false,
  onToggleCollapse,
}: AIAssistPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ========================================================================
  // ACTION HANDLERS
  // ========================================================================

  const handleRegenerate = useCallback(async () => {
    setIsLoading(true);
    setActiveAction('regenerate');
    setError(null);

    try {
      const response = await fetch('/api/presentations/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate',
          slide,
          themeId: theme.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate slide');
      }

      if (data.success && data.content) {
        onSlideUpdate({ ...slide, content: data.content });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate slide');
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  }, [slide, theme.id, onSlideUpdate]);

  const handleExpand = useCallback(async () => {
    setIsLoading(true);
    setActiveAction('expand');
    setError(null);

    try {
      const response = await fetch('/api/presentations/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'expand',
          slide,
          themeId: theme.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to expand content');
      }

      if (data.success && data.content) {
        onSlideUpdate({ ...slide, content: data.content });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to expand content');
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  }, [slide, theme.id, onSlideUpdate]);

  const handleSimplify = useCallback(async () => {
    setIsLoading(true);
    setActiveAction('simplify');
    setError(null);

    try {
      const response = await fetch('/api/presentations/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simplify',
          slide,
          themeId: theme.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to simplify content');
      }

      if (data.success && data.content) {
        onSlideUpdate({ ...slide, content: data.content });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to simplify content');
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  }, [slide, theme.id, onSlideUpdate]);

  const handleImprove = useCallback(async () => {
    setIsLoading(true);
    setActiveAction('improve');
    setError(null);

    try {
      const response = await fetch('/api/presentations/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'improve',
          slide,
          themeId: theme.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to improve writing');
      }

      if (data.success && data.content) {
        onSlideUpdate({ ...slide, content: data.content });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to improve writing');
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  }, [slide, theme.id, onSlideUpdate]);

  const handleLayoutChange = useCallback(
    async (newLayout: string) => {
      setIsLoading(true);
      setActiveAction('layout');
      setError(null);

      try {
        // Optimistically update the UI
        const updatedSlide = { ...slide, layout: newLayout as any };
        onSlideUpdate(updatedSlide);

        // Request AI to adapt content to new layout if needed
        const response = await fetch('/api/presentations/ai-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'adapt-layout',
            slide: updatedSlide,
            themeId: theme.id,
            newLayout,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Revert on error
          onSlideUpdate(slide);
          throw new Error(data.error || 'Failed to change layout');
        }

        if (data.success && data.content) {
          onSlideUpdate({ ...updatedSlide, content: data.content });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to change layout');
      } finally {
        setIsLoading(false);
        setActiveAction(null);
      }
    },
    [slide, theme.id, onSlideUpdate]
  );

  const handleSendChat = useCallback(async () => {
    if (!chatMessage.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatMessage.trim(),
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setChatMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/presentations/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          slide,
          themeId: theme.id,
          message: userMessage.content,
          history: chatHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setChatHistory((prev) => [...prev, assistantMessage]);

      // If the chat resulted in a slide update
      if (data.content) {
        onSlideUpdate({ ...slide, content: data.content });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [chatMessage, chatHistory, slide, theme.id, onSlideUpdate]);

  // ========================================================================
  // COLLAPSED STATE
  // ========================================================================

  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 writing-mode-vertical-rl rotate-180">
            AI Assist
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // EXPANDED STATE
  // ========================================================================

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            AI Assist
          </span>
        </div>
        {onToggleCollapse && (
          <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex-shrink-0 p-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Quick Actions
        </p>

        <ActionButton
          icon={RefreshCw}
          label="Regenerate Slide"
          description="Create a new version of this slide"
          onClick={handleRegenerate}
          isLoading={activeAction === 'regenerate'}
          disabled={isLoading}
        />

        <ActionButton
          icon={Expand}
          label="Expand Content"
          description="Add more detail and explanation"
          onClick={handleExpand}
          isLoading={activeAction === 'expand'}
          disabled={isLoading}
        />

        <ActionButton
          icon={Minimize2}
          label="Simplify"
          description="Make content more concise"
          onClick={handleSimplify}
          isLoading={activeAction === 'simplify'}
          disabled={isLoading}
        />

        <ActionButton
          icon={Wand2}
          label="Improve Writing"
          description="Enhance clarity and flow"
          onClick={handleImprove}
          isLoading={activeAction === 'improve'}
          disabled={isLoading}
        />
      </div>

      {/* Layout Options */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Change Layout
        </p>
        <div className="grid grid-cols-3 gap-2">
          {['full', 'split', 'centered', 'left-heavy', 'right-heavy', 'grid'].map(
            (layout) => (
              <LayoutOption
                key={layout}
                layout={layout}
                isActive={slide.layout === layout}
                onClick={() => handleLayoutChange(layout)}
              />
            )
          )}
        </div>
      </div>

      {/* AI Chat */}
      <div className="flex-1 flex flex-col p-3 min-h-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Ask AI about this slide
        </p>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
          {chatHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center p-4">
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Ask me anything about this slide. I can help you improve content,
                suggest changes, or answer questions.
              </div>
            </div>
          ) : (
            chatHistory.map((msg, i) => <ChatBubble key={i} message={msg} />)
          )}
        </div>

        {/* Chat Input */}
        <div className="flex-shrink-0 flex gap-2">
          <input
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendChat();
              }
            }}
            disabled={isLoading}
          />
          <Button
            size="sm"
            onClick={handleSendChat}
            disabled={!chatMessage.trim() || isLoading}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            {isLoading && activeAction !== 'chat' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
