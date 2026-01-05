import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateTimeline, identifyMilestones, detectTrends } from '@/lib/discovery/timeline';
import type { TimelineConfig } from '@/lib/discovery/types';

/**
 * POST /api/discovery/timeline
 *
 * Generate research timeline for a topic showing evolution over time
 *
 * Request body:
 * - topic: string - Research topic to analyze
 * - startYear?: number - Start year (default: current year - 20)
 * - endYear?: number - End year (default: current year)
 * - groupBy?: 'year' | 'quarter' | 'era' - How to group papers (default: 'era')
 * - showMilestones?: boolean - Include milestone papers (default: true)
 * - showTrends?: boolean - Include trend analysis (default: true)
 */

const requestSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  startYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  endYear: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  groupBy: z.enum(['year', 'quarter', 'era']).optional(),
  showMilestones: z.boolean().optional(),
  showTrends: z.boolean().optional(),
}).refine(
  data => !data.startYear || !data.endYear || data.startYear <= data.endYear,
  { message: 'Start year must be before or equal to end year' }
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

    const { topic, ...config } = validationResult.data;

    // Generate timeline
    const timeline = await generateTimeline(topic, config as Partial<TimelineConfig>);

    // Extract evolution narrative
    const evolution = timeline.periods.map(period => ({
      period: period.label,
      years: `${period.startYear}-${period.endYear}`,
      paperCount: period.paperCount,
      keyTopics: period.keyTopics,
      description: period.description,
    }));

    // Identify breakthrough papers
    const breakthroughs = timeline.milestones
      .filter(m => m.type === 'breakthrough')
      .map(m => ({
        year: m.year,
        paperId: m.paperId,
        label: m.label,
        description: m.description,
      }));

    // Extract trend insights
    const trendInsights = timeline.trends.map(trend => ({
      topic: trend.topic,
      direction: trend.direction,
      growthRate: Math.round(trend.growthRate * 10) / 10, // Round to 1 decimal
      period: `${trend.startYear}-present`,
      paperCount: trend.papers.length,
    }));

    return NextResponse.json({
      success: true,
      timeline: {
        id: timeline.id,
        topic: timeline.topic,
        periods: timeline.periods,
        milestones: timeline.milestones,
        papers: timeline.papers,
        trends: timeline.trends,
        config: timeline.config,
      },
      evolution,
      breakthroughs,
      trendInsights,
      summary: {
        totalPapers: timeline.papers.length,
        timeSpan: `${timeline.config.startYear}-${timeline.config.endYear}`,
        periods: timeline.periods.length,
        milestones: timeline.milestones.length,
        risingTopics: timeline.trends.filter(t => t.direction === 'rising').length,
        decliningTopics: timeline.trends.filter(t => t.direction === 'declining').length,
      },
      message: `Generated timeline for "${topic}" spanning ${timeline.config.endYear - timeline.config.startYear} years`,
    });
  } catch (error) {
    console.error('Timeline API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate timeline',
        message: 'An error occurred while generating the research timeline. Please try again.',
      },
      { status: 500 }
    );
  }
}
