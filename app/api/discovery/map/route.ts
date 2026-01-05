import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateMap, detectGaps } from '@/lib/discovery/knowledge-map';
import type { MapConfig } from '@/lib/discovery/types';

/**
 * POST /api/discovery/map
 *
 * Generate knowledge map for a research topic or set of papers
 *
 * Request body:
 * - topic?: string - Research topic to map
 * - paperIds?: string[] - Alternative: map from specific papers
 * - clusterCount?: number - Target number of clusters (default: 5)
 * - paperLimit?: number - Max papers to include (default: 100)
 * - timeRange?: { start: number, end: number } - Filter by year range
 * - showLabels?: boolean - Show cluster labels (default: true)
 * - showConnections?: boolean - Show inter-cluster connections (default: true)
 */

const requestSchema = z.object({
  topic: z.string().optional(),
  paperIds: z.array(z.string()).optional(),
  clusterCount: z.number().min(2).max(10).optional(),
  paperLimit: z.number().min(20).max(500).optional(),
  timeRange: z.object({
    start: z.number(),
    end: z.number(),
  }).optional(),
  showLabels: z.boolean().optional(),
  showConnections: z.boolean().optional(),
}).refine(
  data => data.topic || (data.paperIds && data.paperIds.length > 0),
  { message: 'Either topic or paperIds must be provided' }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { topic, paperIds, ...config } = validationResult.data;

    // For now, we only support topic-based maps
    // TODO: Support paperIds-based maps in future
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic parameter is required (paperIds-based maps not yet implemented)' },
        { status: 400 }
      );
    }

    // Generate knowledge map
    const map = await generateMap(topic, config as Partial<MapConfig>);

    // Detect research gaps
    const gaps = detectGaps(map);

    // Extract representative papers for each cluster
    const representativePapers = map.clusters.map(cluster => ({
      clusterId: cluster.id,
      clusterLabel: cluster.label,
      papers: map.papers
        .filter(p => p.clusterId === cluster.id && p.isKeyPaper)
        .map(p => p.paperId)
        .slice(0, 3),
    }));

    return NextResponse.json({
      success: true,
      map: {
        id: map.id,
        query: map.query,
        clusters: map.clusters,
        papers: map.papers,
        connections: map.connections,
        config: map.config,
      },
      gaps: gaps.map(gap => ({
        topic: gap.topic,
        adjacentClusters: gap.adjacentClusters,
        explanation: gap.explanation,
      })),
      representativePapers,
      summary: {
        totalClusters: map.clusters.length,
        totalPapers: map.papers.length,
        totalConnections: map.connections.length,
        gapsIdentified: gaps.length,
      },
      message: `Generated knowledge map with ${map.clusters.length} clusters and ${map.papers.length} papers`,
    });
  } catch (error) {
    console.error('Knowledge map API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate knowledge map',
        message: 'An error occurred while generating the knowledge map. Please try again.',
      },
      { status: 500 }
    );
  }
}
