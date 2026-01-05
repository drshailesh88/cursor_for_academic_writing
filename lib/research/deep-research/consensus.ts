/**
 * Consensus Analysis
 *
 * Tools for calculating consensus across research literature,
 * assessing confidence levels, and grading evidence quality.
 */

import type { SearchResult } from '../types';
import type { ConsensusResult, EvidenceGrade, ConfidenceLevel } from './types';

/**
 * Study design hierarchy for evidence grading
 */
const STUDY_DESIGN_HIERARCHY: Record<string, number> = {
  'systematic review': 10,
  'meta-analysis': 10,
  'randomized controlled trial': 9,
  'rct': 9,
  'cohort study': 7,
  'case-control study': 6,
  'cross-sectional study': 5,
  'case series': 4,
  'case report': 3,
  'expert opinion': 2,
  'narrative review': 2,
};

/**
 * Calculate consensus distribution for a research question
 */
export function calculateConsensus(
  sources: SearchResult[],
  question: string
): ConsensusResult {
  // This would ideally use LLM to classify each paper's stance
  // For now, use heuristics based on abstract content

  let supporting = 0;
  let contradicting = 0;
  let neutral = 0;

  for (const source of sources) {
    const stance = classifyStance(source, question);

    switch (stance.type) {
      case 'support-strong':
      case 'support-moderate':
      case 'support-weak':
        supporting++;
        break;
      case 'dispute-strong':
      case 'dispute-moderate':
      case 'dispute-weak':
        contradicting++;
        break;
      default:
        neutral++;
    }
  }

  const total = supporting + contradicting + neutral;
  const currentYear = new Date().getFullYear();
  const recentStudies = sources.filter((s) => s.year >= currentYear - 5);

  // Calculate confidence based on sample size and agreement
  const agreement = total > 0 ? Math.max(supporting, contradicting, neutral) / total : 0;

  let confidence: ConfidenceLevel = 'very_low';
  let confidenceReason = '';

  if (total >= 20 && agreement >= 0.7) {
    confidence = 'high';
    confidenceReason = 'Large sample size with high agreement';
  } else if (total >= 10 && agreement >= 0.6) {
    confidence = 'moderate';
    confidenceReason = 'Moderate sample size with fair agreement';
  } else if (total >= 5) {
    confidence = 'low';
    confidenceReason = 'Small sample size or low agreement';
  } else {
    confidenceReason = 'Insufficient evidence';
  }

  // Grade evidence based on study quality
  const evidenceGrade = gradeEvidenceQuality(sources);

  return {
    question,
    questionType: 'yes_no',
    distribution: {
      supporting,
      neutral,
      contradicting,
    },
    breakdown: [],
    confidence,
    confidenceReason,
    keyStudies: {
      supporting: [],
      contradicting: [],
    },
    totalStudies: total,
    metrics: {
      averageStudyQuality: 0,
      hasRCTs: evidenceGrade.criteria.some((c) => c.toLowerCase().includes('rct')),
      hasMetaAnalyses: evidenceGrade.criteria.some((c) =>
        c.toLowerCase().includes('meta-analysis')
      ),
      recentStudiesCount: recentStudies.length,
    },
  };
}

/**
 * Classify a paper's stance on a question
 */
function classifyStance(
  source: SearchResult,
  question: string
): {
  type:
    | 'support-strong'
    | 'support-moderate'
    | 'support-weak'
    | 'dispute-strong'
    | 'dispute-moderate'
    | 'dispute-weak'
    | 'neutral';
  confidence: number;
} {
  const abstract = source.abstract.toLowerCase();
  const title = source.title.toLowerCase();

  // Extract key terms from question
  const questionTerms = question
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 3);

  // Count term matches
  let titleMatches = 0;
  let abstractMatches = 0;

  for (const term of questionTerms) {
    if (title.includes(term)) titleMatches++;
    if (abstract.includes(term)) abstractMatches++;
  }

  // Look for supporting language
  const supportingTerms = [
    'effective',
    'beneficial',
    'improved',
    'significant improvement',
    'superior',
    'advantage',
  ];
  const supportingCount = supportingTerms.filter(
    (term) => abstract.includes(term) || title.includes(term)
  ).length;

  // Look for disputing language
  const disputingTerms = [
    'ineffective',
    'no benefit',
    'no significant',
    'did not improve',
    'inferior',
    'disadvantage',
  ];
  const disputingCount = disputingTerms.filter(
    (term) => abstract.includes(term) || title.includes(term)
  ).length;

  // Determine stance
  if (supportingCount > disputingCount && titleMatches + abstractMatches >= 2) {
    if (supportingCount >= 3) {
      return { type: 'support-strong', confidence: 0.8 };
    } else if (supportingCount >= 2) {
      return { type: 'support-moderate', confidence: 0.7 };
    } else {
      return { type: 'support-weak', confidence: 0.6 };
    }
  } else if (
    disputingCount > supportingCount &&
    titleMatches + abstractMatches >= 2
  ) {
    if (disputingCount >= 3) {
      return { type: 'dispute-strong', confidence: 0.8 };
    } else if (disputingCount >= 2) {
      return { type: 'dispute-moderate', confidence: 0.7 };
    } else {
      return { type: 'dispute-weak', confidence: 0.6 };
    }
  }

  return { type: 'neutral', confidence: 0.5 };
}

/**
 * Assess confidence level based on evidence quality and quantity
 */
export function assessConfidence(sources: SearchResult[]): {
  level: 'high' | 'medium' | 'low';
  reasoning: string;
  factors: {
    sampleSize: number;
    studyQuality: number;
    consistency: number;
    recency: number;
  };
} {
  const sampleSize = sources.length;

  // Calculate study quality score
  const qualityScore = calculateAverageQuality(sources);

  // Calculate consistency (simplified - would need LLM for real implementation)
  const consistency = 0.7; // Placeholder

  // Calculate recency score
  const currentYear = new Date().getFullYear();
  const avgYear =
    sources.reduce((sum, s) => sum + s.year, 0) / sources.length;
  const recency = Math.max(0, 1 - (currentYear - avgYear) / 10);

  // Overall confidence
  const factors = {
    sampleSize: Math.min(sampleSize / 20, 1),
    studyQuality: qualityScore,
    consistency,
    recency,
  };

  const overallScore =
    factors.sampleSize * 0.3 +
    factors.studyQuality * 0.4 +
    factors.consistency * 0.2 +
    factors.recency * 0.1;

  let level: 'high' | 'medium' | 'low';
  let reasoning: string;

  if (overallScore >= 0.7) {
    level = 'high';
    reasoning = 'Strong evidence from high-quality, consistent studies';
  } else if (overallScore >= 0.5) {
    level = 'medium';
    reasoning = 'Moderate evidence with some limitations';
  } else {
    level = 'low';
    reasoning = 'Limited or inconsistent evidence';
  }

  return { level, reasoning, factors };
}

/**
 * Grade evidence quality based on study design
 */
export function gradeEvidence(sources: SearchResult[]): EvidenceGrade {
  const designs = identifyStudyDesigns(sources);

  // Count high-quality study types
  const systematicReviews = designs.filter(
    (d) => d.design === 'systematic review' || d.design === 'meta-analysis'
  ).length;
  const rcts = designs.filter(
    (d) => d.design === 'randomized controlled trial' || d.design === 'rct'
  ).length;
  const cohortStudies = designs.filter((d) => d.design === 'cohort study').length;

  let grade: 'A' | 'B' | 'C' | 'D';
  const criteria: string[] = [];
  const strengths: string[] = [];
  const limitations: string[] = [];

  if (systematicReviews >= 2) {
    grade = 'A';
    criteria.push('Multiple systematic reviews or meta-analyses');
    strengths.push('High-quality synthesized evidence');
  } else if (systematicReviews >= 1 || rcts >= 3) {
    grade = 'B';
    criteria.push('At least one systematic review or multiple RCTs');
    strengths.push('Strong experimental evidence');
  } else if (rcts >= 1 || cohortStudies >= 3) {
    grade = 'C';
    criteria.push('At least one RCT or multiple cohort studies');
    strengths.push('Moderate quality observational evidence');
  } else {
    grade = 'D';
    criteria.push('Limited high-quality evidence');
    limitations.push('Reliance on lower-quality study designs');
  }

  // Add sample size consideration
  if (sources.length < 5) {
    limitations.push('Small number of studies');
  } else if (sources.length >= 10) {
    strengths.push('Large number of studies');
  }

  // Add recency consideration
  const currentYear = new Date().getFullYear();
  const recentStudies = sources.filter((s) => s.year >= currentYear - 3).length;
  if (recentStudies / sources.length >= 0.5) {
    strengths.push('Majority of studies are recent');
  } else if (recentStudies / sources.length < 0.2) {
    limitations.push('Limited recent evidence');
  }

  return { grade, criteria, strengths, limitations };
}

/**
 * Identify study designs from paper metadata
 */
function identifyStudyDesigns(
  sources: SearchResult[]
): Array<{ paperId: string; design: string; confidence: number }> {
  return sources.map((source) => {
    const text = `${source.title} ${source.abstract}`.toLowerCase();

    // Check for study design keywords
    for (const [design, _score] of Object.entries(STUDY_DESIGN_HIERARCHY)) {
      if (text.includes(design)) {
        return {
          paperId: source.id,
          design,
          confidence: 0.8,
        };
      }
    }

    // Default to unknown
    return {
      paperId: source.id,
      design: 'unknown',
      confidence: 0.3,
    };
  });
}

/**
 * Calculate average study quality score
 */
function calculateAverageQuality(sources: SearchResult[]): number {
  const designs = identifyStudyDesigns(sources);

  let totalScore = 0;
  for (const { design } of designs) {
    totalScore += STUDY_DESIGN_HIERARCHY[design] || 1;
  }

  const avgScore = totalScore / sources.length;
  const maxScore = 10;

  return avgScore / maxScore;
}

/**
 * Grade evidence quality wrapper
 */
function gradeEvidenceQuality(sources: SearchResult[]): EvidenceGrade {
  return gradeEvidence(sources);
}

/**
 * Visualize consensus as percentage distribution
 */
export function visualizeConsensus(consensus: ConsensusResult): {
  supportPercentage: number;
  disputePercentage: number;
  neutralPercentage: number;
  breakdown: {
    supportStrong: number;
    supportModerate: number;
    supportWeak: number;
    disputeStrong: number;
    disputeModerate: number;
    disputeWeak: number;
  };
} {
  const total = consensus.totalStudies;

  return {
    supportPercentage: total > 0 ? (consensus.distribution.supporting / total) * 100 : 0,
    disputePercentage: total > 0 ? (consensus.distribution.contradicting / total) * 100 : 0,
    neutralPercentage: total > 0 ? (consensus.distribution.neutral / total) * 100 : 0,
    breakdown: {
      supportStrong: 0,
      supportModerate: 0,
      supportWeak: 0,
      disputeStrong: 0,
      disputeModerate: 0,
      disputeWeak: 0,
    },
  };
}

/**
 * Generate consensus summary text
 */
export function generateConsensusSummary(consensus: ConsensusResult): string {
  const viz = visualizeConsensus(consensus);

  let summary = `Based on ${consensus.totalStudies} studies, `;

  if (viz.supportPercentage > 60) {
    summary += `there is strong consensus supporting this claim (${viz.supportPercentage.toFixed(0)}% support)`;
  } else if (viz.supportPercentage > 40) {
    summary += `there is moderate support for this claim (${viz.supportPercentage.toFixed(0)}% support)`;
  } else if (viz.disputePercentage > 60) {
    summary += `there is strong consensus disputing this claim (${viz.disputePercentage.toFixed(0)}% dispute)`;
  } else if (viz.disputePercentage > 40) {
    summary += `there is moderate dispute of this claim (${viz.disputePercentage.toFixed(0)}% dispute)`;
  } else {
    summary += `the evidence is mixed with no clear consensus`;
  }

  summary += `. Confidence level: ${consensus.confidence}.`;

  return summary;
}
