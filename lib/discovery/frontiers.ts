/**
 * Research Frontiers Detection
 *
 * Identify emerging topics and research opportunities:
 * - Detect emerging topics
 * - Calculate growth metrics
 * - Find research gaps
 * - Identify underexplored areas
 */

import type { SearchResult } from '@/lib/research/types';
import type {
  ResearchFrontier,
  FrontierMetrics,
  EmergingTopic,
  ResearchOpportunity,
  GrowthMetrics,
} from './types';
import { searchSemanticScholar } from '@/lib/research/semantic-scholar';
import { searchOpenAlex } from '@/lib/research/openalex';
import { toDiscoveredPapers } from './utils';

/**
 * Detect research frontiers in a domain
 */
export async function detectFrontiers(
  domain: string,
  yearRange = 5
): Promise<ResearchFrontier> {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - yearRange;

  // Fetch recent papers in domain
  const papers = await fetchDomainPapers(domain, startYear, currentYear);

  // Identify emerging topics
  const frontiers = await identifyEmergingTopics(papers);

  // Find research gaps
  const gaps = findResearchGaps(papers, frontiers);

  // Identify research opportunities
  const opportunities = identifyOpportunities(papers, frontiers, gaps);

  // Calculate overall metrics
  const metrics = calculateFrontierMetrics(papers, frontiers);

  return {
    domain,
    frontiers,
    gaps,
    opportunities,
    metrics,
    generatedAt: new Date() as any,
  };
}

/**
 * Calculate growth metrics for a topic
 */
export async function calculateGrowthMetrics(
  topic: string,
  yearsBack = 10
): Promise<GrowthMetrics> {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - yearsBack;

  const yearlyData: { year: number; papers: SearchResult[] }[] = [];

  // Fetch papers year by year
  for (let year = startYear; year <= currentYear; year++) {
    try {
      const results = await searchSemanticScholar({
        text: topic,
        yearRange: { start: year, end: year },
        limit: 100,
      });
      yearlyData.push({ year, papers: results.results });
    } catch {
      yearlyData.push({ year, papers: [] });
    }
  }

  // Calculate yearly publications
  const yearlyPublications = yearlyData.map((d) => ({
    year: d.year,
    count: d.papers.length,
  }));

  // Calculate yearly citations
  const yearlyCitations = yearlyData.map((d) => ({
    year: d.year,
    count: d.papers.reduce((sum, p) => sum + (p.citationCount || 0), 0),
  }));

  // Calculate CAGR (Compound Annual Growth Rate)
  const firstYearCount = yearlyPublications[0]?.count || 1;
  const lastYearCount = yearlyPublications[yearlyPublications.length - 1]?.count || 1;
  const years = yearlyPublications.length - 1 || 1;
  const compoundGrowthRate =
    (Math.pow(lastYearCount / firstYearCount, 1 / years) - 1) * 100;

  // Determine acceleration phase
  const recentGrowth = yearlyPublications.slice(-3).map((y) => y.count);
  const earlyGrowth = yearlyPublications.slice(0, 3).map((y) => y.count);
  const recentAvg = recentGrowth.reduce((a, b) => a + b, 0) / recentGrowth.length;
  const earlyAvg = earlyGrowth.reduce((a, b) => a + b, 0) / earlyGrowth.length;

  let accelerationPhase: 'early' | 'growth' | 'mature' | 'decline';
  if (recentAvg < 10) accelerationPhase = 'early';
  else if (recentAvg > earlyAvg * 2) accelerationPhase = 'growth';
  else if (recentAvg < earlyAvg * 0.8) accelerationPhase = 'decline';
  else accelerationPhase = 'mature';

  // Project next year (simple linear extrapolation)
  const recent3 = yearlyPublications.slice(-3);
  const avgGrowth =
    recent3.length >= 2
      ? (recent3[recent3.length - 1].count - recent3[0].count) / (recent3.length - 1)
      : 0;
  const projectedGrowth = lastYearCount + avgGrowth;

  return {
    topic,
    yearlyPublications,
    yearlyCitations,
    compoundGrowthRate,
    accelerationPhase,
    projectedGrowth: Math.max(0, projectedGrowth),
  };
}

/**
 * Find underexplored research areas
 */
export function findResearchGaps(
  papers: SearchResult[],
  emergingTopics: EmergingTopic[]
): ResearchOpportunity[] {
  const gaps: ResearchOpportunity[] = [];

  // Find topic pairs with weak connections
  for (let i = 0; i < emergingTopics.length; i++) {
    for (let j = i + 1; j < emergingTopics.length; j++) {
      const topic1 = emergingTopics[i];
      const topic2 = emergingTopics[j];

      // Check if there are papers bridging these topics
      const bridgePapers = papers.filter((p) => {
        const text = `${p.title} ${p.abstract} ${p.keywords?.join(' ')}`.toLowerCase();
        const has1 = topic1.label.toLowerCase().split(' ').some((w) => text.includes(w));
        const has2 = topic2.label.toLowerCase().split(' ').some((w) => text.includes(w));
        return has1 && has2;
      });

      if (bridgePapers.length < 3) {
        gaps.push({
          id: `gap-${i}-${j}`,
          type: 'intersection',
          description: `Intersection of ${topic1.label} and ${topic2.label}`,
          relatedTopics: [topic1.label, topic2.label],
          potentialImpact: 'high',
          difficulty: 'moderate',
          resources: bridgePapers.map((p) => p.title).slice(0, 3),
        });
      }
    }
  }

  // Find underexplored applications
  const methodPapers = papers.filter((p) => {
    const title = p.title.toLowerCase();
    return (
      title.includes('method') ||
      title.includes('algorithm') ||
      title.includes('approach') ||
      title.includes('technique')
    );
  });

  const applicationPapers = papers.filter((p) => {
    const title = p.title.toLowerCase();
    return (
      title.includes('application') ||
      title.includes('case study') ||
      title.includes('clinical') ||
      title.includes('real-world')
    );
  });

  if (methodPapers.length > applicationPapers.length * 2) {
    gaps.push({
      id: 'gap-application',
      type: 'application',
      description: 'Many new methods but few practical applications',
      relatedTopics: ['methodology', 'applications'],
      potentialImpact: 'high',
      difficulty: 'accessible',
      resources: methodPapers.slice(0, 5).map((p) => p.title),
    });
  }

  return gaps.slice(0, 10);
}

// ============================================================================
// Emerging Topic Detection
// ============================================================================

async function identifyEmergingTopics(papers: SearchResult[]): Promise<EmergingTopic[]> {
  // Group papers by topic
  const topicGroups = groupPapersByTopic(papers);

  const emergingTopics: EmergingTopic[] = [];

  for (const [topicLabel, topicPapers] of Array.from(topicGroups.entries())) {
    if (topicPapers.length < 5) continue; // Need minimum papers

    // Calculate growth metrics
    const currentYear = new Date().getFullYear();
    const recentPapers = topicPapers.filter((p) => p.year >= currentYear - 2);
    const olderPapers = topicPapers.filter((p) => p.year < currentYear - 2);

    const growthRate =
      olderPapers.length > 0
        ? ((recentPapers.length - olderPapers.length) / olderPapers.length) * 100
        : 100;

    // Calculate citation growth
    const recentCitations = recentPapers.reduce((sum, p) => sum + (p.citationCount || 0), 0);
    const olderCitations = olderPapers.reduce((sum, p) => sum + (p.citationCount || 0), 0);
    const citationGrowth =
      olderCitations > 0 ? ((recentCitations - olderCitations) / olderCitations) * 100 : 100;

    // Calculate recency
    const avgYear = topicPapers.reduce((sum, p) => sum + p.year, 0) / topicPapers.length;
    const recency = currentYear - avgYear;

    // Determine momentum
    let momentum: 'emerging' | 'accelerating' | 'plateau' | 'declining';
    if (growthRate > 50) momentum = 'accelerating';
    else if (growthRate > 20) momentum = 'emerging';
    else if (growthRate < -20) momentum = 'declining';
    else momentum = 'plateau';

    // Extract key authors
    const authorCounts = new Map<string, number>();
    topicPapers.forEach((p) => {
      p.authors.forEach((a) => {
        authorCounts.set(a.name, (authorCounts.get(a.name) || 0) + 1);
      });
    });
    const keyAuthors = Array.from(authorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((e) => e[0]);

    // Find related established topics
    const relatedEstablished = findRelatedTopics(topicLabel, Array.from(topicGroups.keys()));

    emergingTopics.push({
      id: `topic-${emergingTopics.length}`,
      label: topicLabel,
      description: generateTopicDescription(topicPapers),
      papers: toDiscoveredPapers(topicPapers),
      growthRate,
      citationGrowth,
      recency,
      momentum,
      keyAuthors,
      relatedEstablished: relatedEstablished.slice(0, 3),
    });
  }

  // Sort by momentum and growth
  return emergingTopics
    .filter((t) => t.momentum === 'emerging' || t.momentum === 'accelerating')
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, 10);
}

function identifyOpportunities(
  papers: SearchResult[],
  frontiers: EmergingTopic[],
  gaps: ResearchOpportunity[]
): ResearchOpportunity[] {
  const opportunities: ResearchOpportunity[] = [...gaps];

  // Find methodology opportunities
  const currentYear = new Date().getFullYear();
  const recentPapers = papers.filter((p) => p.year >= currentYear - 2);

  // Look for frequently mentioned but underutilized methods
  const methodMentions = new Map<string, number>();
  recentPapers.forEach((p) => {
    const methods = extractMethods(p);
    methods.forEach((m) => {
      methodMentions.set(m, (methodMentions.get(m) || 0) + 1);
    });
  });

  const topMethods = Array.from(methodMentions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  for (const [method, count] of topMethods) {
    if (count > 5) {
      opportunities.push({
        id: `opp-method-${method}`,
        type: 'methodology',
        description: `${method} is gaining traction (mentioned in ${count} recent papers)`,
        relatedTopics: [method],
        potentialImpact: 'medium',
        difficulty: 'moderate',
        resources: [],
      });
    }
  }

  return opportunities.slice(0, 15);
}

// ============================================================================
// Helper Functions
// ============================================================================

async function fetchDomainPapers(
  domain: string,
  startYear: number,
  endYear: number
): Promise<SearchResult[]> {
  const papers: SearchResult[] = [];

  try {
    const ss = await searchSemanticScholar({
      text: domain,
      limit: 100,
      yearRange: { start: startYear, end: endYear },
    });
    papers.push(...ss.results);
  } catch (error) {
    console.error('Semantic Scholar error:', error);
  }

  try {
    const oa = await searchOpenAlex({
      text: domain,
      limit: 100,
      yearRange: { start: startYear, end: endYear },
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

function groupPapersByTopic(papers: SearchResult[]): Map<string, SearchResult[]> {
  const topicMap = new Map<string, SearchResult[]>();

  papers.forEach((paper) => {
    const topics = [...(paper.categories || []), ...(paper.keywords || [])];

    if (topics.length === 0) {
      // Extract from title
      const titleTopics = extractTopicsFromTitle(paper.title);
      topics.push(...titleTopics);
    }

    topics.forEach((topic) => {
      if (!topicMap.has(topic)) {
        topicMap.set(topic, []);
      }
      topicMap.get(topic)!.push(paper);
    });
  });

  return topicMap;
}

function extractTopicsFromTitle(title: string): string[] {
  // Extract potential topics from title
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 4);

  // Create bigrams
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }

  return bigrams.slice(0, 3);
}

function generateTopicDescription(papers: SearchResult[]): string {
  const avgYear = Math.round(papers.reduce((sum, p) => sum + p.year, 0) / papers.length);
  const avgCitations = Math.round(
    papers.reduce((sum, p) => sum + (p.citationCount || 0), 0) / papers.length
  );

  return `${papers.length} papers, avg ${avgYear}, ${avgCitations} citations`;
}

function findRelatedTopics(topic: string, allTopics: string[]): string[] {
  const related: string[] = [];

  const topicWords = new Set(topic.toLowerCase().split(/\s+/));

  for (const other of allTopics) {
    if (other === topic) continue;

    const otherWords = new Set(other.toLowerCase().split(/\s+/));
    const intersection = new Set([...topicWords].filter((x) => otherWords.has(x)));

    if (intersection.size > 0) {
      related.push(other);
    }
  }

  return related;
}

function extractMethods(paper: SearchResult): string[] {
  const methods: string[] = [];
  const text = `${paper.title} ${paper.abstract}`.toLowerCase();

  // Common method indicators
  const methodKeywords = [
    'neural network',
    'deep learning',
    'machine learning',
    'regression',
    'classification',
    'clustering',
    'transformer',
    'cnn',
    'rnn',
    'lstm',
    'attention',
    'bert',
    'gpt',
  ];

  methodKeywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      methods.push(keyword);
    }
  });

  return methods;
}

function calculateFrontierMetrics(
  papers: SearchResult[],
  frontiers: EmergingTopic[]
): FrontierMetrics {
  const currentYear = new Date().getFullYear();
  const years = papers.map((p) => p.year);

  const avgGrowthRate =
    frontiers.length > 0
      ? frontiers.reduce((sum, f) => sum + f.growthRate, 0) / frontiers.length
      : 0;

  // Calculate diversity (unique topics / total papers)
  const uniqueTopics = new Set<string>();
  papers.forEach((p) => {
    (p.categories || []).forEach((c) => uniqueTopics.add(c));
    (p.keywords || []).forEach((k) => uniqueTopics.add(k));
  });
  const diversityScore = papers.length > 0 ? uniqueTopics.size / papers.length : 0;

  // Maturity: ratio of old to new papers
  const oldPapers = papers.filter((p) => p.year < currentYear - 5).length;
  const newPapers = papers.filter((p) => p.year >= currentYear - 2).length;
  const maturityScore = papers.length > 0 ? oldPapers / papers.length : 0;

  return {
    totalPapers: papers.length,
    timeSpan: {
      start: Math.min(...years),
      end: Math.max(...years),
    },
    avgGrowthRate,
    diversityScore,
    maturityScore,
  };
}
