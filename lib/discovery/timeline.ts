/**
 * Temporal Evolution Analysis
 *
 * Create research timelines showing:
 * - Historical development of topics
 * - Milestone papers and breakthroughs
 * - Trend detection (rising/declining topics)
 * - Era-based grouping
 */

import type { SearchResult } from '@/lib/research/types';
import type {
  ResearchTimeline,
  TimelineConfig,
  Milestone,
  TimePeriod,
  TimelinePaper,
  Trend,
} from './types';
import { searchSemanticScholar } from '@/lib/research/semantic-scholar';
import { searchOpenAlex } from '@/lib/research/openalex';

/**
 * Generate research timeline for a topic
 */
export async function generateTimeline(
  topic: string,
  config: Partial<TimelineConfig> = {}
): Promise<ResearchTimeline> {
  const currentYear = new Date().getFullYear();

  const fullConfig: TimelineConfig = {
    startYear: config.startYear ?? currentYear - 20,
    endYear: config.endYear ?? currentYear,
    groupBy: config.groupBy ?? 'era',
    showMilestones: config.showMilestones ?? true,
    showTrends: config.showTrends ?? true,
  };

  // Fetch papers across time range
  const papers = await fetchHistoricalPapers(topic, fullConfig);

  // Identify milestone papers
  const milestones = fullConfig.showMilestones
    ? identifyMilestones(papers)
    : [];

  // Group into time periods
  const periods = groupByEra(papers, fullConfig);

  // Detect trends
  const trends = fullConfig.showTrends
    ? detectTrends(papers, fullConfig)
    : [];

  // Position papers on timeline
  const timelinePapers = positionPapers(papers, milestones);

  return {
    id: `timeline-${Date.now()}`,
    userId: '',
    topic,
    milestones,
    periods,
    papers: timelinePapers,
    trends,
    config: fullConfig,
    createdAt: new Date() as any,
  };
}

/**
 * Identify milestone/breakthrough papers
 */
export function identifyMilestones(papers: SearchResult[]): Milestone[] {
  const milestones: Milestone[] = [];

  // Sort by citation count
  const sorted = [...papers].sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));

  // Calculate citation velocity
  const currentYear = new Date().getFullYear();
  const withVelocity = sorted.map((paper) => ({
    paper,
    velocity: (paper.citationCount || 0) / Math.max(1, currentYear - paper.year),
  }));

  // Top cited papers are likely milestones
  const topCited = withVelocity.slice(0, 5);

  for (const { paper, velocity } of topCited) {
    // High citation count suggests importance
    if ((paper.citationCount || 0) > 50) {
      milestones.push({
        id: `milestone-${paper.id}`,
        year: paper.year,
        paperId: paper.id,
        label: paper.title.substring(0, 50) + '...',
        description: `Highly cited work (${paper.citationCount} citations)`,
        type: 'breakthrough',
      });
    }
  }

  // Papers with high velocity in recent years
  const recentHighVelocity = withVelocity.filter(
    (p) => p.velocity > 10 && p.paper.year >= currentYear - 5
  );

  for (const { paper } of recentHighVelocity.slice(0, 3)) {
    milestones.push({
      id: `milestone-${paper.id}`,
      year: paper.year,
      paperId: paper.id,
      label: paper.title.substring(0, 50) + '...',
      description: 'Rapidly gaining citations',
      type: 'methodology',
    });
  }

  return milestones;
}

/**
 * Detect rising, stable, or declining trends
 */
export function detectTrends(
  papers: SearchResult[],
  config: TimelineConfig
): Trend[] {
  const trends: Trend[] = [];

  // Group papers by key topics
  const topicGroups = groupByTopic(papers);

  for (const [topic, topicPapers] of topicGroups.entries()) {
    // Count papers per year
    const yearCounts = new Map<number, number>();
    for (const paper of topicPapers) {
      yearCounts.set(paper.year, (yearCounts.get(paper.year) || 0) + 1);
    }

    // Calculate trend
    const years = Array.from(yearCounts.keys()).sort();
    if (years.length < 3) continue;

    const recentYears = years.slice(-3);
    const earlierYears = years.slice(0, -3);

    const recentAvg =
      recentYears.reduce((sum, y) => sum + (yearCounts.get(y) || 0), 0) /
      recentYears.length;
    const earlierAvg =
      earlierYears.length > 0
        ? earlierYears.reduce((sum, y) => sum + (yearCounts.get(y) || 0), 0) /
          earlierYears.length
        : 0;

    const growthRate = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;

    let direction: 'rising' | 'stable' | 'declining';
    if (growthRate > 20) direction = 'rising';
    else if (growthRate < -20) direction = 'declining';
    else direction = 'stable';

    trends.push({
      topic,
      direction,
      growthRate,
      startYear: years[0],
      papers: topicPapers.map((p) => p.id),
    });
  }

  return trends.filter((t) => t.direction !== 'stable').slice(0, 5);
}

/**
 * Group papers by era/time period
 */
export function groupByEra(
  papers: SearchResult[],
  config: TimelineConfig
): TimePeriod[] {
  const periods: TimePeriod[] = [];
  const yearRange = config.endYear - config.startYear;

  if (config.groupBy === 'era') {
    // Divide into 4-5 eras
    const eraLength = Math.ceil(yearRange / 4);

    for (let i = 0; i < 4; i++) {
      const startYear = config.startYear + i * eraLength;
      const endYear = Math.min(startYear + eraLength - 1, config.endYear);

      const eraPapers = papers.filter(
        (p) => p.year >= startYear && p.year <= endYear
      );

      if (eraPapers.length === 0) continue;

      const keyTopics = extractKeyTopics(eraPapers);

      periods.push({
        startYear,
        endYear,
        label: generateEraLabel(i, startYear, endYear),
        description: `${eraPapers.length} papers published`,
        paperCount: eraPapers.length,
        keyTopics,
      });
    }
  } else if (config.groupBy === 'year') {
    // Group by individual years
    for (let year = config.startYear; year <= config.endYear; year++) {
      const yearPapers = papers.filter((p) => p.year === year);

      if (yearPapers.length === 0) continue;

      periods.push({
        startYear: year,
        endYear: year,
        label: String(year),
        description: `${yearPapers.length} papers`,
        paperCount: yearPapers.length,
        keyTopics: extractKeyTopics(yearPapers),
      });
    }
  }

  return periods;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function fetchHistoricalPapers(
  topic: string,
  config: TimelineConfig
): Promise<SearchResult[]> {
  const papers: SearchResult[] = [];

  // Fetch from multiple sources
  try {
    const ss = await searchSemanticScholar({
      text: topic,
      limit: 100,
      yearRange: { start: config.startYear, end: config.endYear },
    });
    papers.push(...ss.results);
  } catch (error) {
    console.error('Semantic Scholar error:', error);
  }

  try {
    const oa = await searchOpenAlex({
      text: topic,
      limit: 100,
      yearRange: { start: config.startYear, end: config.endYear },
    });
    papers.push(...oa.results);
  } catch (error) {
    console.error('OpenAlex error:', error);
  }

  // Deduplicate
  const seen = new Set<string>();
  return papers.filter((p) => {
    if (p.normalizedTitle && seen.has(p.normalizedTitle)) return false;
    if (p.normalizedTitle) seen.add(p.normalizedTitle);
    return true;
  });
}

function groupByTopic(papers: SearchResult[]): Map<string, SearchResult[]> {
  const topicMap = new Map<string, SearchResult[]>();

  for (const paper of papers) {
    // Use categories as topics
    const topics = paper.categories || ['uncategorized'];

    for (const topic of topics) {
      if (!topicMap.has(topic)) {
        topicMap.set(topic, []);
      }
      topicMap.get(topic)!.push(paper);
    }
  }

  return topicMap;
}

function extractKeyTopics(papers: SearchResult[]): string[] {
  const topicCounts = new Map<string, number>();

  for (const paper of papers) {
    const topics = [
      ...(paper.categories || []),
      ...(paper.keywords || []),
    ];

    for (const topic of topics) {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    }
  }

  return Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((e) => e[0]);
}

function generateEraLabel(index: number, startYear: number, endYear: number): string {
  const labels = [
    'Early Foundations',
    'Growth & Development',
    'Rapid Expansion',
    'Modern Era',
    'Current State',
  ];

  return `${labels[index] || `Era ${index + 1}`} (${startYear}-${endYear})`;
}

function positionPapers(
  papers: SearchResult[],
  milestones: Milestone[]
): TimelinePaper[] {
  const milestoneIds = new Set(milestones.map((m) => m.paperId).filter(Boolean));

  const currentYear = new Date().getFullYear();
  const minYear = Math.min(...papers.map((p) => p.year));
  const maxYear = Math.max(...papers.map((p) => p.year));
  const yearRange = maxYear - minYear || 1;

  return papers.map((paper) => {
    // Normalize year to 0-1000 range for x position
    const x = ((paper.year - minYear) / yearRange) * 1000;

    // Calculate importance based on citations
    const maxCitations = Math.max(...papers.map((p) => p.citationCount || 0));
    const importance =
      maxCitations > 0 ? (paper.citationCount || 0) / maxCitations : 0.5;

    return {
      paperId: paper.id,
      year: paper.year,
      x,
      importance,
      isSeminal: milestoneIds.has(paper.id),
    };
  });
}
