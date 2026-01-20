/**
 * Research Stream Utilities
 * Shared utilities for managing research session streams
 */

/**
 * Event types that can be streamed
 */
export type StreamEventType =
  | 'status'
  | 'perspective_added'
  | 'branch_update'
  | 'learning'
  | 'source_found'
  | 'synthesis'
  | 'complete'
  | 'error';

export interface StreamEvent {
  type: StreamEventType;
  timestamp: number;
  data: unknown;
}

export interface SessionState {
  status: string;
  progress: number;
  events: StreamEvent[];
  completedAt?: number;
}

/**
 * In-memory session store (in production, use Redis or similar)
 * This simulates a session tracking system
 */
export const sessionStore = new Map<string, SessionState>();

/**
 * Utility: Publish event to a session stream
 * This would be called by the research engine to push events
 */
export function publishToStream(sessionId: string, type: StreamEventType, data: unknown) {
  const session = sessionStore.get(sessionId);
  if (session) {
    session.events.push({
      type,
      timestamp: Date.now(),
      data,
    });
  }
}

/**
 * Utility: Mark session as complete
 */
export function completeSession(sessionId: string) {
  const session = sessionStore.get(sessionId);
  if (session) {
    session.status = 'complete';
    session.progress = 100;
    session.completedAt = Date.now();
  }
}

/**
 * Utility: Get or create session
 */
export function getOrCreateSession(sessionId: string): SessionState {
  let session = sessionStore.get(sessionId);
  if (!session) {
    session = {
      status: 'initializing',
      progress: 0,
      events: [],
    };
    sessionStore.set(sessionId, session);
  }
  return session;
}
