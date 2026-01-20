// Deep Research - Base Agent Class
// All specialized agents extend this base class

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type {
  AgentType,
  AgentMessage,
  AgentState,
  ResearchSession,
} from '../types';

export interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  model?: string;
  systemPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AgentContext {
  session: ResearchSession;
  sharedMemory: Map<string, unknown>;
  previousAgentOutputs: Map<AgentType, unknown>;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  messages: AgentMessage[];
  tokensUsed: number;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected state: AgentState;
  protected messages: AgentMessage[] = [];

  constructor(config: AgentConfig, sessionId: string) {
    this.config = config;
    this.state = {
      sessionId,
      agentType: config.type,
      status: 'idle',
      progress: 0,
      messages: [],
      lastUpdated: new Date() as any, // Stored as timestamp in the database
    };
  }

  // Abstract method - each agent implements its core logic
  abstract execute(context: AgentContext): Promise<AgentResult>;

  // Get current agent state
  getState(): AgentState {
    return { ...this.state };
  }

  // Update agent status
  protected updateStatus(status: AgentState['status'], task?: string, progress?: number): void {
    this.state.status = status;
    if (task) this.state.currentTask = task;
    if (progress !== undefined) this.state.progress = progress;
    this.state.lastUpdated = new Date() as any;
  }

  // Add message to agent history
  protected addMessage(role: AgentMessage['role'], content: string, metadata?: Record<string, unknown>): AgentMessage {
    const message: AgentMessage = {
      id: `${this.config.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentType: this.config.type,
      role,
      content,
      metadata,
      timestamp: new Date() as any,
    };
    this.messages.push(message);
    this.state.messages = [...this.messages];
    return message;
  }

  // Build prompt with context
  protected buildPrompt(userMessage: string, context?: Record<string, unknown>): string {
    let prompt = this.config.systemPrompt + '\n\n';

    if (context) {
      prompt += '## Context\n';
      for (const [key, value] of Object.entries(context)) {
        prompt += `### ${key}\n${JSON.stringify(value, null, 2)}\n\n`;
      }
    }

    prompt += `## Task\n${userMessage}`;
    return prompt;
  }

  /**
   * Call the LLM with the given prompt
   * Supports multiple models with DeepSeek as default (cheapest option)
   */
  protected async callLLM(prompt: string, modelType: string = 'deepseek'): Promise<{ text: string; tokensUsed: number }> {
    const model = this.createModelInstance(modelType);

    const result = await generateText({
      model,
      prompt,
      maxTokens: this.config.maxTokens || 4096,
      temperature: this.config.temperature || 0.7,
    });

    return {
      text: result.text,
      tokensUsed: result.usage?.totalTokens || 0,
    };
  }

  /**
   * Create model instance based on model type
   */
  private createModelInstance(modelType: string) {
    switch (modelType) {
      case 'openai': {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OpenAI API key not configured.');
        const openai = createOpenAI({ apiKey });
        return openai('gpt-4o');
      }

      case 'claude': {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error('Anthropic API key not configured.');
        const anthropic = createAnthropic({ apiKey });
        return anthropic('claude-sonnet-4-20250514');
      }

      case 'gemini': {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) throw new Error('Google API key not configured.');
        const google = createGoogleGenerativeAI({ apiKey });
        return google('gemini-1.5-flash');
      }

      case 'deepseek':
      default: {
        // DeepSeek as default - cheapest and reliable
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) throw new Error('DeepSeek API key not configured. Set DEEPSEEK_API_KEY in .env.local.');
        const deepseek = createOpenAI({
          baseURL: 'https://api.deepseek.com/v1',
          apiKey,
        });
        return deepseek('deepseek-chat');
      }
    }
  }

  // Get agent info
  getInfo(): { type: AgentType; name: string; description: string } {
    return {
      type: this.config.type,
      name: this.config.name,
      description: this.config.description,
    };
  }

  // Get agent type
  getType(): AgentType {
    return this.config.type;
  }
}

// Type for agent constructor
export type AgentConstructor = new (sessionId: string) => BaseAgent;

// Registry for agent implementations
export const agentRegistry = new Map<AgentType, AgentConstructor>();

// Decorator to register agents
export function RegisterAgent(type: AgentType) {
  return function <T extends AgentConstructor>(constructor: T) {
    agentRegistry.set(type, constructor);
    return constructor;
  };
}
