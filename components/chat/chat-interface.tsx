'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ChatInterface({ documentId }: { documentId?: string }) {
  const [selectedModel, setSelectedModel] = useState<string>('anthropic');

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      model: selectedModel,
      documentId,
    },
  });

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
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground max-w-[80%] rounded-lg px-4 py-2">
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
