/**
 * Research Stream API
 *
 * GET endpoint with Server-Sent Events (SSE) for streaming research progress
 * Accepts sessionId as query parameter and streams real-time updates
 */

import { NextRequest } from 'next/server';
import {
  type StreamEventType,
  type StreamEvent,
  sessionStore,
  getOrCreateSession,
} from '@/lib/research/stream-utils';

/**
 * GET /api/research/stream?sessionId=xxx
 *
 * Streams research progress events using Server-Sent Events (SSE).
 * The client connects to this endpoint and receives real-time updates
 * as the research progresses through different stages.
 *
 * @example
 * GET /api/research/stream?sessionId=research-123456
 *
 * Stream events:
 * event: status
 * data: {"stage":"planning","progress":10,"message":"Generating perspectives..."}
 *
 * event: perspective_added
 * data: {"id":"clinical","name":"Clinical Outcomes","description":"..."}
 *
 * event: source_found
 * data: {"title":"Paper title","authors":["Author"],"year":2023}
 *
 * event: complete
 * data: {"totalSources":25,"duration":45000}
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  // Validate sessionId
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'sessionId query parameter is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Get or create session
  getOrCreateSession(sessionId);

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE events
      const sendEvent = (type: StreamEventType, data: unknown) => {
        const event: StreamEvent = {
          type,
          timestamp: Date.now(),
          data,
        };

        // Store event in session
        const currentSession = sessionStore.get(sessionId);
        if (currentSession) {
          currentSession.events.push(event);
        }

        // Send to client
        const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        // Send initial connection event
        sendEvent('status', {
          stage: 'connected',
          sessionId,
          message: 'Connected to research stream',
          progress: 0,
        });

        // Simulate research workflow events
        // In production, this would listen to actual research engine events

        // If session already completed, send cached events
        const currentSession = sessionStore.get(sessionId);
        if (currentSession?.completedAt) {
          // Send all cached events
          for (const event of currentSession.events) {
            sendEvent(event.type, event.data);
            // Small delay to prevent overwhelming client
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          controller.close();
          return;
        }

        // Example workflow simulation (replace with actual engine integration)
        // In production, you would:
        // 1. Get the research engine instance
        // 2. Subscribe to session events
        // 3. Forward events to SSE stream

        // Keep connection alive with heartbeat
        const heartbeatInterval = setInterval(() => {
          try {
            // Send heartbeat comment (SSE comments keep connection alive)
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch {
            clearInterval(heartbeatInterval);
          }
        }, 15000); // Every 15 seconds

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);

          sendEvent('status', {
            stage: 'disconnected',
            message: 'Client disconnected',
            sessionId,
          });

          controller.close();
        });

        // Note: In a full implementation, you would integrate with the research engine here:
        //
        // const engine = getResearchEngine();
        // const unsubscribe = engine.subscribe(sessionId, (event) => {
        //   sendEvent(event.type, event.data);
        //   if (event.type === 'complete' || event.type === 'error') {
        //     unsubscribe();
        //     controller.close();
        //   }
        // });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Stream error';
        console.error('Stream error:', error);

        sendEvent('error', {
          message: errorMessage,
          recoverable: false,
        });

        controller.close();
      }
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering for Vercel
    },
  });
}
