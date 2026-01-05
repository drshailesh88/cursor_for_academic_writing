/**
 * Research Synthesis
 *
 * Tools for synthesizing findings from multiple perspectives,
 * generating reports, and performing quality reviews.
 */

import type { SearchResult } from '../types';
import type {
  Perspective,
  ResearchSynthesis,
  Finding,
  Contradiction,
  QualityReview,
  QualityIssue,
  ReportFormat,
} from './types';
import { toCitation } from '../types';

/**
 * Synthesize findings from multiple perspectives
 */
export async function synthesizeFindings(
  sources: SearchResult[],
  perspectives: Perspective[]
): Promise<ResearchSynthesis> {
  // Group sources by perspective
  const sourcesByPerspective = groupSourcesByPerspective(sources, perspectives);

  // Extract key findings for each perspective
  const keyFindings: Finding[] = [];
  for (const perspective of perspectives) {
    const perspectiveSources = sourcesByPerspective.get(perspective.id) || [];
    const findings = await extractFindings(perspectiveSources, perspective.id);
    keyFindings.push(...findings);
  }

  // Identify consensus areas
  const consensus = await identifyConsensus(keyFindings, sources);

  // Identify gaps in research
  const gaps = identifyResearchGaps(sources, perspectives);

  // Identify contradictions
  const contradictions = await identifyContradictions(sources);

  // Generate recommendations
  const recommendations = generateRecommendations(keyFindings, gaps, contradictions);

  // Calculate date range
  const years = sources.map((s) => s.year);
  const dateRange = {
    start: Math.min(...years),
    end: Math.max(...years),
  };

  // Get unique databases
  const databases = [...new Set(sources.map((s) => s.source))];

  return {
    topic: '', // Will be set by caller
    perspectives,
    keyFindings,
    consensus,
    gaps,
    contradictions,
    recommendations,
    sources,
    metadata: {
      totalSources: sources.length,
      dateRange,
      databases,
      generatedAt: Date.now(),
    },
  };
}

/**
 * Group sources by their most relevant perspective
 */
function groupSourcesByPerspective(
  sources: SearchResult[],
  perspectives: Perspective[]
): Map<string, SearchResult[]> {
  const grouped = new Map<string, SearchResult[]>();

  // Initialize with empty arrays
  for (const perspective of perspectives) {
    grouped.set(perspective.id, []);
  }

  // Assign each source to most relevant perspective
  for (const source of sources) {
    const bestMatch = findBestPerspectiveMatch(source, perspectives);
    const existing = grouped.get(bestMatch.id) || [];
    existing.push(source);
    grouped.set(bestMatch.id, existing);
  }

  return grouped;
}

/**
 * Find the perspective that best matches a source
 */
function findBestPerspectiveMatch(
  source: SearchResult,
  perspectives: Perspective[]
): Perspective {
  let bestPerspective = perspectives[0];
  let bestScore = 0;

  for (const perspective of perspectives) {
    const score = calculatePerspectiveRelevance(source, perspective);
    if (score > bestScore) {
      bestScore = score;
      bestPerspective = perspective;
    }
  }

  return bestPerspective;
}

/**
 * Calculate how relevant a source is to a perspective
 */
function calculatePerspectiveRelevance(
  source: SearchResult,
  perspective: Perspective
): number {
  const text = `${source.title} ${source.abstract}`.toLowerCase();

  let score = 0;
  // Use search strategies as keyword proxies
  for (const strategy of perspective.searchStrategies) {
    const keywords = strategy.toLowerCase().split(/\s+/);
    for (const keyword of keywords) {
      if (keyword.length > 3 && text.includes(keyword)) {
        score += 1;
      }
    }
  }

  return score;
}

/**
 * Extract key findings from sources
 */
async function extractFindings(
  sources: SearchResult[],
  perspectiveId: string
): Promise<Finding[]> {
  // This would ideally use an LLM to extract key findings
  // For now, create findings based on high-quality sources

  const highQualitySources = sources
    .filter((s) => s.citationCount && s.citationCount > 10)
    .slice(0, 5);

  return highQualitySources.map((source) => ({
    statement: `Finding from ${toCitation(source)}`,
    support: [source],
    confidence: 'medium' as const,
    evidenceGrade: 'B' as const,
    perspective: perspectiveId,
  }));
}

/**
 * Identify consensus across sources
 */
async function identifyConsensus(
  findings: Finding[],
  sources: SearchResult[]
): Promise<any[]> {
  // This would use consensus analysis tools
  // For now, return empty array as placeholder
  return [];
}

/**
 * Identify gaps in research coverage
 */
function identifyResearchGaps(
  sources: SearchResult[],
  perspectives: Perspective[]
): string[] {
  const gaps: string[] = [];

  // Check for temporal gaps
  const currentYear = new Date().getFullYear();
  const recentSources = sources.filter((s) => s.year >= currentYear - 3);
  if (recentSources.length < sources.length * 0.3) {
    gaps.push('Limited recent research (last 3 years)');
  }

  // Check for perspective coverage
  const sourcesByPerspective = groupSourcesByPerspective(sources, perspectives);
  for (const perspective of perspectives) {
    const count = sourcesByPerspective.get(perspective.id)?.length || 0;
    if (count < 3) {
      gaps.push(`Limited coverage of ${perspective.name} perspective`);
    }
  }

  // Check for study design diversity
  const studyTypes = new Set<string>();
  for (const source of sources) {
    const type = inferStudyType(source);
    studyTypes.add(type);
  }

  if (studyTypes.size < 3) {
    gaps.push('Limited diversity in study designs');
  }

  return gaps;
}

/**
 * Infer study type from paper metadata
 */
function inferStudyType(source: SearchResult): string {
  const text = `${source.title} ${source.abstract}`.toLowerCase();

  if (text.includes('systematic review') || text.includes('meta-analysis')) {
    return 'systematic-review';
  }
  if (text.includes('randomized') || text.includes('rct')) {
    return 'rct';
  }
  if (text.includes('cohort')) {
    return 'cohort';
  }
  if (text.includes('case-control')) {
    return 'case-control';
  }

  return 'other';
}

/**
 * Identify contradictions in the literature
 */
async function identifyContradictions(
  sources: SearchResult[]
): Promise<Contradiction[]> {
  const contradictions: Contradiction[] = [];

  // This would use an LLM to identify contradictory findings
  // For now, return empty array as placeholder

  return contradictions;
}

/**
 * Generate recommendations based on synthesis
 */
function generateRecommendations(
  findings: Finding[],
  gaps: string[],
  contradictions: Contradiction[]
): string[] {
  const recommendations: string[] = [];

  // Recommendations based on gaps
  if (gaps.length > 0) {
    recommendations.push(
      'Address identified research gaps through targeted literature search'
    );
  }

  // Recommendations based on contradictions
  if (contradictions.length > 0) {
    recommendations.push(
      'Resolve contradictions by examining methodological differences'
    );
  }

  // Recommendations based on evidence quality
  const highConfidenceFindings = findings.filter((f) => f.confidence === 'high');
  if (highConfidenceFindings.length < findings.length * 0.5) {
    recommendations.push(
      'Seek additional high-quality evidence to strengthen conclusions'
    );
  }

  return recommendations;
}

/**
 * Generate a research report in the specified format
 */
export async function generateReport(
  synthesis: ResearchSynthesis,
  format: ReportFormat = 'markdown'
): Promise<string> {
  switch (format) {
    case 'markdown':
      return generateMarkdownReport(synthesis);
    case 'json':
      return JSON.stringify(synthesis, null, 2);
    case 'html':
      return generateHTMLReport(synthesis);
    case 'academic':
      return generateAcademicReport(synthesis);
    default:
      return generateMarkdownReport(synthesis);
  }
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(synthesis: ResearchSynthesis): string {
  let report = `# Research Report: ${synthesis.topic}\n\n`;

  // Executive summary
  report += `## Executive Summary\n\n`;
  report += `This report synthesizes findings from ${synthesis.sources.length} sources across ${synthesis.perspectives.length} expert perspectives.\n\n`;

  // Key findings
  if (synthesis.keyFindings.length > 0) {
    report += `## Key Findings\n\n`;
    for (const finding of synthesis.keyFindings) {
      report += `### ${finding.statement}\n\n`;
      report += `- **Evidence Grade**: ${finding.evidenceGrade}\n`;
      report += `- **Confidence**: ${finding.confidence}\n`;
      report += `- **Sources**: ${finding.support.length}\n\n`;
    }
  }

  // Perspectives
  report += `## Expert Perspectives\n\n`;
  for (const perspective of synthesis.perspectives) {
    report += `### ${perspective.name}\n\n`;
    report += `${perspective.description}\n\n`;
  }

  // Research gaps
  if (synthesis.gaps.length > 0) {
    report += `## Identified Gaps\n\n`;
    for (const gap of synthesis.gaps) {
      report += `- ${gap}\n`;
    }
    report += `\n`;
  }

  // Contradictions
  if (synthesis.contradictions.length > 0) {
    report += `## Contradictions in Literature\n\n`;
    for (const contradiction of synthesis.contradictions) {
      report += `### ${contradiction.claim1} vs ${contradiction.claim2}\n\n`;
      if (contradiction.explanation) {
        report += `${contradiction.explanation}\n\n`;
      }
    }
  }

  // Recommendations
  if (synthesis.recommendations.length > 0) {
    report += `## Recommendations\n\n`;
    for (const recommendation of synthesis.recommendations) {
      report += `- ${recommendation}\n`;
    }
    report += `\n`;
  }

  // Sources
  report += `## Sources\n\n`;
  for (const source of synthesis.sources) {
    const citation = toCitation(source);
    report += `- ${source.title}. ${citation}. ${source.journal || source.venue || 'Unknown venue'}.\n`;
  }

  return report;
}

/**
 * Generate HTML report
 */
function generateHTMLReport(synthesis: ResearchSynthesis): string {
  // Convert markdown to HTML (simplified)
  const markdown = generateMarkdownReport(synthesis);
  return `<!DOCTYPE html>
<html>
<head>
  <title>${synthesis.topic}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a1a; }
    h2 { color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; }
  </style>
</head>
<body>
  <pre>${markdown}</pre>
</body>
</html>`;
}

/**
 * Generate academic-style report
 */
function generateAcademicReport(synthesis: ResearchSynthesis): string {
  let report = `${synthesis.topic}\n\n`;
  report += `Abstract\n\n`;
  report += `This systematic analysis synthesizes findings from ${synthesis.sources.length} peer-reviewed sources. `;
  report += `The analysis spans research from ${synthesis.metadata.dateRange.start} to ${synthesis.metadata.dateRange.end}.\n\n`;

  // Methods
  report += `Methods\n\n`;
  report += `A comprehensive search was conducted across ${synthesis.metadata.databases.join(', ')}. `;
  report += `The analysis employed a multi-perspective framework encompassing ${synthesis.perspectives.length} expert viewpoints.\n\n`;

  // Results
  report += `Results\n\n`;
  for (const finding of synthesis.keyFindings) {
    report += `${finding.statement} (Evidence Grade: ${finding.evidenceGrade}). `;
  }
  report += `\n\n`;

  // Discussion
  report += `Discussion\n\n`;
  if (synthesis.gaps.length > 0) {
    report += `Several gaps in the literature were identified: ${synthesis.gaps.join('; ')}. `;
  }
  if (synthesis.contradictions.length > 0) {
    report += `Contradictory findings were noted in ${synthesis.contradictions.length} areas. `;
  }
  report += `\n\n`;

  // References
  report += `References\n\n`;
  for (let i = 0; i < synthesis.sources.length; i++) {
    const source = synthesis.sources[i];
    const authors = source.authors.map((a) => a.name).join(', ');
    report += `${i + 1}. ${authors}. ${source.title}. ${source.journal || source.venue || 'Unknown'}. ${source.year}.\n`;
  }

  return report;
}

/**
 * Perform quality review of synthesis
 */
export async function qualityReview(
  synthesis: ResearchSynthesis
): Promise<QualityReview> {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];

  // Check source count
  if (synthesis.sources.length < 10) {
    issues.push({
      type: 'insufficient-evidence',
      severity: 'high',
      description: `Only ${synthesis.sources.length} sources. Minimum recommended: 10.`,
    });
    suggestions.push('Expand search to include additional databases');
  }

  // Check for gaps
  if (synthesis.gaps.length > 3) {
    issues.push({
      type: 'gap',
      severity: 'medium',
      description: `${synthesis.gaps.length} research gaps identified`,
      affectedPerspectives: synthesis.perspectives.map((p) => p.id),
    });
    suggestions.push('Address identified gaps through targeted search');
  }

  // Check for contradictions
  if (synthesis.contradictions.length > 0) {
    issues.push({
      type: 'contradiction',
      severity: 'medium',
      description: `${synthesis.contradictions.length} contradictions found`,
    });
    suggestions.push('Analyze contradictions for methodological differences');
  }

  // Check recency
  const currentYear = new Date().getFullYear();
  const recentSources = synthesis.sources.filter(
    (s) => s.year >= currentYear - 3
  ).length;
  const recencyRatio = recentSources / synthesis.sources.length;

  if (recencyRatio < 0.3) {
    issues.push({
      type: 'gap',
      severity: 'low',
      description: 'Limited recent research (< 30% from last 3 years)',
    });
    suggestions.push('Include more recent publications');
  }

  // Check perspective balance
  const sourcesByPerspective = groupSourcesByPerspective(
    synthesis.sources,
    synthesis.perspectives
  );
  for (const perspective of synthesis.perspectives) {
    const count = sourcesByPerspective.get(perspective.id)?.length || 0;
    if (count < 2) {
      issues.push({
        type: 'gap',
        severity: 'medium',
        description: `Insufficient coverage of ${perspective.name}`,
        affectedPerspectives: [perspective.id],
      });
    }
  }

  // Calculate quality score
  const score = calculateQualityScore(synthesis, issues);

  return {
    passed: issues.filter((i) => i.severity === 'high').length === 0,
    score,
    issues,
    suggestions,
  };
}

/**
 * Calculate overall quality score
 */
function calculateQualityScore(
  synthesis: ResearchSynthesis,
  issues: QualityIssue[]
): number {
  let score = 100;

  // Deduct points for issues
  for (const issue of issues) {
    if (issue.severity === 'high') {
      score -= 20;
    } else if (issue.severity === 'medium') {
      score -= 10;
    } else {
      score -= 5;
    }
  }

  // Bonus points for quality indicators
  if (synthesis.sources.length >= 20) {
    score += 5;
  }
  if (synthesis.perspectives.length >= 5) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}
