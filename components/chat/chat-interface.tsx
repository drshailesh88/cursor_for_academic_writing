'use client';

import { useChat } from 'ai/react';
import { useState, useCallback, useEffect } from 'react';
import { Send, Loader2, Copy, Check, ClipboardPaste, Search, AlertTriangle, RefreshCw, Settings, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DisciplineSelector, useDiscipline, DisciplineBadge } from '@/components/discipline/discipline-selector';
import type { DisciplineId } from '@/lib/prompts/disciplines';
import { useSettings } from '@/lib/hooks/use-settings';
import { AI_MODELS, TESTING_MODELS } from '@/lib/settings/types';

interface ChatInterfaceProps {
  documentId?: string;
  onInsertToEditor?: (content: string) => void;
  initialDiscipline?: DisciplineId;
  onDisciplineChange?: (discipline: DisciplineId) => void;
}

export function ChatInterface({
  documentId,
  onInsertToEditor,
  initialDiscipline,
  onDisciplineChange,
}: ChatInterfaceProps) {
  const { settings } = useSettings();
  const [selectedModel, setSelectedModel] = useState<string>('glm-4-plus');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDisciplineSelector, setShowDisciplineSelector] = useState(false);
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);

  const { discipline, setDiscipline, config: disciplineConfig } = useDiscipline(
    initialDiscipline || 'life-sciences'
  );

  // Update model when settings load
  useEffect(() => {
    if (settings?.ai?.defaultModel) {
      setSelectedModel(settings.ai.defaultModel);
    }
  }, [settings?.ai?.defaultModel]);

  // Check if API key is configured for selected model
  const hasApiKey = useCallback(() => {
    if (!settings?.ai?.personalApiKeys) return false;
    if (selectedModel === 'glm-4-plus') return !!settings.ai.personalApiKeys.zhipu;
    if (selectedModel === 'claude') return !!settings.ai.personalApiKeys.anthropic;
    if (selectedModel === 'openai') return !!settings.ai.personalApiKeys.openai;
    if (selectedModel === 'gemini') return !!settings.ai.personalApiKeys.google;
    return false;
  }, [selectedModel, settings?.ai?.personalApiKeys]);

  const handleDisciplineChange = useCallback(
    (newDiscipline: DisciplineId) => {
      setDiscipline(newDiscipline);
      onDisciplineChange?.(newDiscipline);
      setShowDisciplineSelector(false);
    },
    [setDiscipline, onDisciplineChange]
  );

  // Create a unique ID based on model to force hook re-initialization when model changes
  const chatId = `chat-${selectedModel}`;

  const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading, error, reload, setMessages } = useChat({
    id: chatId,
    api: '/api/chat',
    body: {
      model: selectedModel,
      documentId,
      discipline,
      // Pass personal API keys
      personalApiKeys: settings?.ai?.personalApiKeys || {},
    },
  });

  // Wrap handleSubmit to ensure current model is always sent
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    originalHandleSubmit(e, {
      body: {
        model: selectedModel,
        documentId,
        discipline,
        personalApiKeys: settings?.ai?.personalApiKeys || {},
      },
    });
  }, [originalHandleSubmit, selectedModel, documentId, discipline, settings?.ai?.personalApiKeys]);

  const handleCopy = async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (content: string) => {
    onInsertToEditor?.(content);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Model & Discipline Selector */}
      <div className="p-3 border-b border-border space-y-2">
        {/* Discipline Badge/Selector */}
        <div className="flex items-center justify-between gap-2">
          <DisciplineSelector
            selected={discipline}
            onSelect={handleDisciplineChange}
            compact
          />
          <div className="text-xs text-muted-foreground hidden sm:block">
            {disciplineConfig.databases.slice(0, 2).join(' + ')}
          </div>
        </div>

        {/* Simplified Model Selector */}
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
          aria-label="Select AI model"
        >
          <optgroup label="Choose AI Model">
            {AI_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="🧪 Testing (BYOK)">
            {TESTING_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </optgroup>
        </select>

        {/* API Key Warning */}
        {!hasApiKey() && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <Key className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs">
              Add your API key in Settings to use {selectedModel === 'glm-4-plus' ? 'GLM-4.7' : selectedModel}
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
              style={{ backgroundColor: disciplineConfig.color + '20' }}
            >
              <span className="text-2xl">{disciplineConfig.icon}</span>
            </div>
            <p className="text-lg font-medium mb-2">
              {disciplineConfig.name} Assistant
            </p>
            <p className="text-sm mb-4">
              I can search {disciplineConfig.databases.join(', ')} and help you write with{' '}
              {disciplineConfig.defaultCitationStyle.toUpperCase()} citations.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-muted">
                <Search className="w-3 h-3 inline mr-1" />
                Search papers
              </span>
              <span className="px-2 py-1 rounded-full bg-muted">
                Write sections
              </span>
              <span className="px-2 py-1 rounded-full bg-muted">
                Generate citations
              </span>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`group relative max-w-[85%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        code: ({ children, className }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-background/50 px-1 py-0.5 rounded text-xs">{children}</code>
                          ) : (
                            <code className="block bg-background/50 p-2 rounded text-xs overflow-x-auto my-2">{children}</code>
                          );
                        },
                        pre: ({ children }) => <pre className="bg-background/50 p-2 rounded overflow-x-auto my-2">{children}</pre>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                        table: ({ children }) => <table className="border-collapse border border-border my-2 w-full text-xs">{children}</table>,
                        th: ({ children }) => <th className="border border-border px-2 py-1 bg-muted font-semibold">{children}</th>,
                        td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
                        blockquote: ({ children }) => <blockquote className="border-l-2 border-primary pl-3 italic my-2">{children}</blockquote>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Action buttons for assistant messages */}
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(message.content, message.id)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-background/50 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedId === message.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                    {onInsertToEditor && (
                      <button
                        onClick={() => handleInsert(message.content)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-background/50 transition-colors"
                        title="Insert into editor"
                      >
                        <ClipboardPaste className="w-3 h-3" />
                        Insert
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground max-w-[80%] rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Searching {disciplineConfig.databases[0]}...
                </span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start">
            <div className="bg-destructive/10 text-destructive border border-destructive/20 max-w-[90%] rounded-lg px-4 py-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Chat Error</p>
                  <p className="text-sm opacity-90 mb-2">
                    {error.message || 'Failed to get a response. Please check your API configuration.'}
                  </p>
                  <p className="text-xs opacity-75 mb-3">
                    Make sure you have configured API keys in your .env.local file (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
                  </p>
                  <button
                    onClick={() => reload()}
                    className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-destructive/20 hover:bg-destructive/30 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={`Ask about ${disciplineConfig.name.toLowerCase()}...`}
            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-1.5 text-center">
          Searching: {disciplineConfig.databases.join(', ')} | Style: {disciplineConfig.defaultCitationStyle}
        </p>
      </div>
    </div>
  );
}
