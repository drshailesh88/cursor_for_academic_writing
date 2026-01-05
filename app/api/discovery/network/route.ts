import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildNetwork } from '@/lib/discovery/network';
import type { NetworkConfig } from '@/lib/discovery/types';

/**
 * POST /api/discovery/network
 *
 * Build citation network from seed papers
 *
 * Request body:
 * - seedPaperIds: string[] - Array of paper IDs to use as seeds
 * - depth?: number - How many hops from seed papers (default: 2)
 * - maxPapers?: number - Maximum papers to include (default: 50)
 * - minCitations?: number - Minimum citations filter (default: 5)
 * - algorithms?: string[] - Algorithms to use (default: ['co_citation', 'bibliographic_coupling', 'direct'])
 * - yearRange?: { start: number, end: number } - Filter by year
 * - onlyOpenAccess?: boolean - Only include open access papers
 */

const requestSchema = z.object({
  seedPaperIds: z.array(z.string()).min(1, 'At least one seed paper required'),
  depth: z.number().min(1).max(3).optional(),
  maxPapers: z.number().min(10).max(200).optional(),
  minCitations: z.number().min(0).optional(),
  algorithms: z.array(z.enum(['co_citation', 'bibliographic_coupling', 'semantic', 'direct'])).optional(),
  yearRange: z.object({
    start: z.number(),
    end: z.number(),
  }).optional(),
  onlyOpenAccess: z.boolean().optional(),
});

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

    const { seedPaperIds, ...config } = validationResult.data;

    // Build network
    const network = await buildNetwork(seedPaperIds, config as Partial<NetworkConfig>);

    // Calculate basic network metrics from the structure
    const totalPapers = network.papers.length;
    const totalEdges = network.edges.length;
    const avgConnections = totalPapers > 0 ? totalEdges / totalPapers : 0;

    // Find key papers (highest centrality/influence)
    const keyPapers = network.papers
      .sort((a, b) => b.connectionStrength - a.connectionStrength)
      .slice(0, 10)
      .map(p => p.paperId);

    return NextResponse.json({
      success: true,
      network: {
        id: network.id,
        seedPaperIds: network.seedPaperIds,
        papers: network.papers,
        edges: network.edges,
        clusters: network.clusters,
        config: network.config,
        layout: network.layout,
      },
      metrics: {
        totalPapers,
        totalEdges,
        avgConnections,
        clusterCount: network.clusters.length,
      },
      keyPapers,
      message: `Built network with ${network.papers.length} papers and ${network.edges.length} connections`,
    });
  } catch (error) {
    console.error('Network API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build citation network',
        message: 'An error occurred while building the citation network. Please try again.',
      },
      { status: 500 }
    );
  }
}
