// Deep Research - Base Agent Class
// All specialized agents extend this base class

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
      lastUpdated: new Date() as any, // Will be Timestamp in Firestore
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

  // Get agent info
  getInfo(): { type: AgentType; name: string; description: string } {
    return {
      type: this.config.type,
      name: this.config.name,
      description: this.config.description,
    };
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
