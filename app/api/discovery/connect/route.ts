import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findPaths, explainConnection } from '@/lib/discovery/connector';

/**
 * POST /api/discovery/connect
 *
 * Find connection paths between two papers
 *
 * Request body:
 * - sourcePaperId: string - Starting paper ID
 * - targetPaperId: string - Target paper ID
 * - maxDepth?: number - Maximum path length to search (default: 3)
 */

const requestSchema = z.object({
  sourcePaperId: z.string().min(1, 'Source paper ID required'),
  targetPaperId: z.string().min(1, 'Target paper ID required'),
  maxDepth: z.number().min(1).max(5).optional().default(3),
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

    const { sourcePaperId, targetPaperId, maxDepth } = validationResult.data;

    // Validate that source and target are different
    if (sourcePaperId === targetPaperId) {
      return NextResponse.json(
        { error: 'Source and target papers must be different' },
        { status: 400 }
      );
    }

    // Find all paths
    const connection = await findPaths(sourcePaperId, targetPaperId, maxDepth);

    // Generate explanations for paths
    const pathsWithExplanations = await Promise.all(
      connection.paths.slice(0, 5).map(async (path) => {
        const explanation = await explainConnection(path);
        return {
          ...path,
          explanation,
          length: path.papers.length,
          pathType: path.type,
        };
      })
    );

    // Calculate connection strength based on number and quality of paths
    const connectionStrength = Math.min(
      connection.paths.length / 5, // More paths = stronger connection
      1.0
    );

    // Extract intermediate papers (bridges)
    const intermediatePapers = new Set<string>();
    connection.paths.forEach(path => {
      // Add all papers except source and target
      path.papers.slice(1, -1).forEach(paperId => {
        intermediatePapers.add(paperId);
      });
    });

    return NextResponse.json({
      success: true,
      connection: {
        sourcePaperId,
        targetPaperId,
        paths: pathsWithExplanations,
        shortestPath: connection.shortestPath,
        connectionStrength,
      },
      intermediatePapers: Array.from(intermediatePapers),
      summary: {
        totalPaths: connection.paths.length,
        shortestPathLength: connection.shortestPath.papers.length,
        connectionTypes: Array.from(new Set(connection.paths.map(p => p.type))),
        strongConnection: connectionStrength > 0.5,
      },
      message: connection.paths.length > 0
        ? `Found ${connection.paths.length} path(s) connecting the papers`
        : 'No direct connection found between these papers',
    });
  } catch (error) {
    console.error('Connect API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find connection',
        message: 'An error occurred while searching for connections. Please try again.',
      },
      { status: 500 }
    );
  }
}
