'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';
import { Send, Loader2, Copy, Check, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatInterfaceProps {
  documentId?: string;
  onInsertToEditor?: (content: string) => void;
}

export function ChatInterface({ documentId, onInsertToEditor }: ChatInterfaceProps) {
  const [selectedModel, setSelectedModel] = useState<string>('anthropic');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      model: selectedModel,
      documentId,
    },
  });

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
      {/* Header with Model Selector */}
      <div className="p-4 border-b border-border">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
        >
          <optgroup label="Premium Models">
            <option value="anthropic">Claude Sonnet 3.5</option>
            <option value="openai">GPT-4o</option>
            <option value="google">Gemini 2.0 Flash</option>
          </optgroup>
          <optgroup label="Free Models - Best Quality (OpenRouter)">
            <option value="openrouter-hermes-405b">Nous Hermes 3 405B (Free)</option>
            <option value="openrouter-llama-3.3-70b">Meta Llama 3.3 70B (Free)</option>
            <option value="openrouter-qwen">Qwen 2.5 72B (Free)</option>
            <option value="openrouter-gemini-2-flash">Google Gemini 2.0 Flash Exp (Free)</option>
          </optgroup>
          <optgroup label="Free Models - Coding (OpenRouter)">
            <option value="openrouter-deepseek-chat">DeepSeek V3 (Free)</option>
            <option value="openrouter-qwen-coder">Qwen 2.5 Coder 32B (Free)</option>
          </optgroup>
          <optgroup label="Free Models - Fast & Light (OpenRouter)">
            <option value="openrouter-llama-3.2-3b">Meta Llama 3.2 3B (Free)</option>
            <option value="openrouter-mistral-7b">Mistral 7B Instruct (Free)</option>
            <option value="openrouter-phi-3-mini">Microsoft Phi-3 Mini (Free)</option>
          </optgroup>
          <optgroup label="Free Models - Other (OpenRouter)">
            <option value="openrouter-mythomax-13b">MythoMax 13B (Free)</option>
            <option value="openrouter-toppy-7b">Toppy M 7B (Free)</option>
          </optgroup>
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-lg font-medium mb-2">Start a conversation</p>
            <p className="text-sm">
              Ask me to search PubMed, generate a table of contents, or write sections of your paper.
            </p>
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
              <Loader2 className="h-4 w-4 animate-spin" />
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
            placeholder="Ask me anything about academic writing..."
            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
