/**
 * Deep Research API - Main Endpoint
 *
 * POST endpoint to initialize and execute deep research sessions
 * Returns SSE stream with real-time progress updates
 */

import { NextRequest } from 'next/server';
import {
  startResearch,
  generatePerspectives,
  buildExplorationTree,
  executeResearch,
  deduplicateSources,
  type ResearchMode,
  type ResearchConfig,
  type ResearchProgress,
} from '@/lib/research/deep-research';

/**
 * Request body interface
 */
interface ResearchRequest {
  topic: string;
  mode?: 'quick' | 'standard' | 'deep' | 'exhaustive' | 'systematic';
  config?: Partial<ResearchConfig>;
  clarifications?: Array<{ question: string; answer: string }>;
}

/**
 * POST /api/research - Start a new deep research session
 *
 * Accepts research parameters and returns an SSE stream with progress updates.
 * The stream emits events for each stage of the research process.
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    // Parse request body
    const body: ResearchRequest = await request.json();
    const { topic, mode = 'standard', config, clarifications } = body;

    // Validate required fields
    if (!topic || !topic.trim()) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        // Helper to send SSE events
        const sendEvent = (event: string, data: unknown) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Stage 1: Initialize session
          sendEvent('status', {
            stage: 'initialization',
            message: 'Starting research session...',
            progress: 0,
          });

          const session = await startResearch(topic.trim(), mode, config);

          sendEvent('session_created', {
            sessionId: session.id,
            topic: session.topic,
            mode: session.mode,
            config: session.config,
          });

          // Stage 2: Generate perspectives
          sendEvent('status', {
            stage: 'perspective-generation',
            message: 'Generating expert perspectives...',
            progress: 10,
          });

          const perspectives = await generatePerspectives(
            topic.trim(),
            session.config!
          );

          sendEvent('perspectives_generated', {
            count: perspectives.length,
            perspectives: perspectives.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
            })),
          });

          // Stage 3: Build exploration tree
          sendEvent('status', {
            stage: 'research',
            message: 'Building exploration tree...',
            progress: 20,
          });

          const tree = buildExplorationTree(topic.trim(), perspectives);

          sendEvent('tree_built', {
            totalNodes: tree.totalNodes,
            rootId: tree.rootId,
          });

          // Stage 4: Execute research with progress tracking
          sendEvent('status', {
            stage: 'research',
            message: 'Executing parallel research across databases...',
            progress: 30,
          });

          const allSources = await executeResearch(
            tree,
            session.config!,
            (progress: ResearchProgress) => {
              // Send progress updates
              const progressPercentage = 30 + (progress.sourcesFound / session.config!.maxSources) * 50;

              sendEvent('progress', {
                stage: progress.currentPhase,
                perspectivesGenerated: progress.perspectivesGenerated,
                nodesExplored: progress.nodesExplored,
                sourcesFound: progress.sourcesFound,
                progress: Math.min(progressPercentage, 80),
              });
            }
          );

          // Stage 5: Deduplicate sources
          sendEvent('status', {
            stage: 'analysis',
            message: 'Deduplicating sources...',
            progress: 85,
          });

          const { deduplicated, duplicateCount, deduplicationMap } = deduplicateSources(allSources);

          sendEvent('sources_deduplicated', {
            totalSources: allSources.length,
            uniqueSources: deduplicated.length,
            duplicatesRemoved: duplicateCount,
          });

          // Stage 6: Send final results
          sendEvent('status', {
            stage: 'synthesis',
            message: 'Research complete!',
            progress: 100,
          });

          sendEvent('complete', {
            sessionId: session.id,
            sources: deduplicated.map(source => ({
              id: source.id,
              title: source.title,
              authors: source.authors,
              year: source.year,
              journal: source.journal,
              abstract: source.abstract,
              url: source.url,
              doi: source.doi,
              pmid: source.pmid,
              citationCount: source.citationCount,
              source: source.source,
            })),
            perspectives,
            tree: {
              totalNodes: tree.totalNodes,
              completedNodes: tree.completedNodes,
            },
            metadata: {
              topic: session.topic,
              mode: session.mode,
              totalSources: deduplicated.length,
              duplicatesRemoved: duplicateCount,
            },
          });

          // Close the stream
          controller.close();

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Research execution error:', error);

          sendEvent('error', {
            message: errorMessage,
            stage: 'execution',
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
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });

  } catch (error) {
    console.error('Research API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process research request';

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
