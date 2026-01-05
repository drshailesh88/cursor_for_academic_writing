import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { detectFrontiers, calculateGrowthMetrics } from '@/lib/discovery/frontiers';

/**
 * POST /api/discovery/frontiers
 *
 * Detect emerging research frontiers and opportunities in a domain
 *
 * Request body:
 * - topic: string - Research domain to analyze
 * - yearRange?: number - How many years back to analyze (default: 5)
 * - includeGrowthMetrics?: boolean - Include detailed growth metrics (default: false)
 */

const requestSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  yearRange: z.number().min(1).max(20).optional().default(5),
  includeGrowthMetrics: z.boolean().optional().default(false),
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

    const { topic, yearRange, includeGrowthMetrics } = validationResult.data;

    // Detect frontiers
    const frontiers = await detectFrontiers(topic, yearRange);

    // Categorize emerging topics by momentum
    const emergingTopics = frontiers.frontiers.map(frontier => ({
      id: frontier.id,
      label: frontier.label,
      description: frontier.description,
      momentum: frontier.momentum,
      growthRate: Math.round(frontier.growthRate * 10) / 10,
      paperCount: frontier.papers.length,
      keyAuthors: frontier.keyAuthors.slice(0, 3),
      relatedEstablished: frontier.relatedEstablished,
    }));

    // Categorize by momentum
    const accelerating = emergingTopics.filter(t => t.momentum === 'accelerating');
    const emerging = emergingTopics.filter(t => t.momentum === 'emerging');

    // Extract research gaps
    const gaps = frontiers.gaps.map(gap => ({
      id: gap.id,
      type: gap.type,
      description: gap.description,
      relatedTopics: gap.relatedTopics,
      potentialImpact: gap.potentialImpact,
      difficulty: gap.difficulty,
    }));

    // Prioritize gaps by impact
    const highImpactGaps = gaps.filter(g => g.potentialImpact === 'high' || g.potentialImpact === 'transformative');

    // Extract opportunities
    const opportunities = frontiers.opportunities.map(opp => ({
      id: opp.id,
      type: opp.type,
      description: opp.description,
      relatedTopics: opp.relatedTopics,
      potentialImpact: opp.potentialImpact,
      difficulty: opp.difficulty,
    }));

    // Get growth metrics if requested
    let growthMetrics = null;
    if (includeGrowthMetrics && emergingTopics.length > 0) {
      try {
        // Get metrics for top emerging topic
        const topTopic = emergingTopics[0];
        growthMetrics = await calculateGrowthMetrics(topTopic.label, 10);
      } catch (error) {
        console.error('Failed to calculate growth metrics:', error);
      }
    }

    // Generate predictions
    const predictions = emergingTopics
      .filter(t => t.momentum === 'accelerating')
      .slice(0, 3)
      .map(t => ({
        topic: t.label,
        prediction: `Likely to see continued rapid growth (${t.growthRate}% annual increase)`,
        confidence: t.growthRate > 50 ? 'high' : 'medium',
      }));

    return NextResponse.json({
      success: true,
      frontiers: {
        domain: frontiers.domain,
        emergingTopics: {
          accelerating,
          emerging,
          all: emergingTopics,
        },
        gaps: {
          highImpact: highImpactGaps,
          all: gaps,
        },
        opportunities,
        metrics: frontiers.metrics,
      },
      predictions,
      growthMetrics,
      summary: {
        totalEmergingTopics: emergingTopics.length,
        acceleratingTopics: accelerating.length,
        gapsIdentified: gaps.length,
        highImpactGaps: highImpactGaps.length,
        opportunitiesFound: opportunities.length,
        timeSpan: `${frontiers.metrics.timeSpan.start}-${frontiers.metrics.timeSpan.end}`,
        avgGrowthRate: Math.round(frontiers.metrics.avgGrowthRate * 10) / 10,
      },
      message: `Detected ${emergingTopics.length} emerging topics and ${gaps.length} research gaps in ${topic}`,
    });
  } catch (error) {
    console.error('Frontiers API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to detect research frontiers',
        message: 'An error occurred while analyzing research frontiers. Please try again.',
      },
      { status: 500 }
    );
  }
}
