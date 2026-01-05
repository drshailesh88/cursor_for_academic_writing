// Paper Quality Assessment
// Assess study quality, design, and potential biases

import type { Paper, PaperContent, PaperSection } from '@/lib/firebase/schema';

/**
 * Study design types
 */
export type StudyDesign =
  | 'randomized_controlled_trial'
  | 'systematic_review'
  | 'meta_analysis'
  | 'cohort_study'
  | 'case_control_study'
  | 'cross_sectional_study'
  | 'case_report'
  | 'case_series'
  | 'observational_study'
  | 'qualitative_study'
  | 'review_article'
  | 'basic_research'
  | 'unknown';

/**
 * Quality grade
 */
export type QualityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Bias risk levels
 */
export type BiasRisk = 'low' | 'moderate' | 'high' | 'unclear';

/**
 * Quality assessment result
 */
export interface QualityAssessment {
  overallGrade: QualityGrade;
  studyDesign: StudyDesign;
  studyDesignConfidence: number; // 0-1
  sampleSize?: number;
  biasRisk: BiasRisk;
  biasTypes: BiasType[];
  strengths: string[];
  limitations: string[];
  score: number; // 0-100
  components: QualityComponents;
}

/**
 * Quality assessment components
 */
export interface QualityComponents {
  methodologyScore: number; // 0-25
  sampleSizeScore: number; // 0-25
  statisticalRigorScore: number; // 0-25
  reportingQualityScore: number; // 0-25
}

/**
 * Bias types
 */
export interface BiasType {
  type:
    | 'selection_bias'
    | 'publication_bias'
    | 'reporting_bias'
    | 'confounding_bias'
    | 'measurement_bias'
    | 'recall_bias'
    | 'observer_bias'
    | 'funding_bias';
  severity: 'low' | 'moderate' | 'high';
  evidence: string;
}

/**
 * Study population information
 */
export interface StudyPopulation {
  sampleSize?: number;
  populationDescription?: string;
  inclusionCriteria?: string[];
  exclusionCriteria?: string[];
  demographics?: {
    ageRange?: string;
    gender?: string;
    location?: string;
  };
}

/**
 * Assess overall paper quality
 * Returns comprehensive quality assessment
 */
export function assessQuality(paper: Paper, content: PaperContent): QualityAssessment {
  // Detect study design
  const { design, confidence } = detectStudyDesign(content);

  // Extract sample size
  const population = extractSampleSize(content);

  // Assess bias risk
  const { overallRisk, biasTypes } = assessBiasRisk(paper, content, design);

  // Calculate component scores
  const components = calculateComponentScores(paper, content, design, population);

  // Calculate overall score
  const score = Object.values(components).reduce((sum, val) => sum + val, 0);

  // Determine grade
  const grade = scoreToGrade(score);

  // Identify strengths and limitations
  const strengths = identifyStrengths(paper, content, design, components);
  const limitations = identifyLimitations(paper, content, design, components, biasTypes);

  return {
    overallGrade: grade,
    studyDesign: design,
    studyDesignConfidence: confidence,
    sampleSize: population.sampleSize,
    biasRisk: overallRisk,
    biasTypes,
    strengths,
    limitations,
    score,
    components,
  };
}

/**
 * Detect study design from paper content
 */
export function detectStudyDesign(content: PaperContent): {
  design: StudyDesign;
  confidence: number;
} {
  const fullText = content.fullText.toLowerCase();
  const abstract = content.sections.find((s) => s.type === 'abstract')?.content.toLowerCase() || '';
  const methods = content.sections.find((s) => s.type === 'methods')?.content.toLowerCase() || '';

  // Define patterns for each study type with confidence weights
  const patterns: Array<{
    design: StudyDesign;
    patterns: RegExp[];
    minMatches: number;
    weight: number;
  }> = [
    {
      design: 'randomized_controlled_trial',
      patterns: [
        /randomized controlled trial/i,
        /\brct\b/i,
        /random\w*\s+allocat/i,
        /double\s*-?\s*blind/i,
        /placebo\s+controlled/i,
      ],
      minMatches: 2,
      weight: 1.0,
    },
    {
      design: 'systematic_review',
      patterns: [
        /systematic review/i,
        /prisma/i,
        /literature search/i,
        /inclusion criteria/i,
        /quality assessment/i,
      ],
      minMatches: 3,
      weight: 0.95,
    },
    {
      design: 'meta_analysis',
      patterns: [
        /meta-analysis/i,
        /meta analysis/i,
        /forest plot/i,
        /pooled estimate/i,
        /heterogeneity/i,
        /fixed.?effect/i,
        /random.?effect/i,
      ],
      minMatches: 2,
      weight: 0.95,
    },
    {
      design: 'cohort_study',
      patterns: [/cohort study/i, /prospective/i, /follow-up/i, /longitudinal/i, /incidence/i],
      minMatches: 2,
      weight: 0.85,
    },
    {
      design: 'case_control_study',
      patterns: [
        /case-control/i,
        /case control/i,
        /retrospective/i,
        /odds ratio/i,
        /matched controls/i,
      ],
      minMatches: 2,
      weight: 0.80,
    },
    {
      design: 'cross_sectional_study',
      patterns: [/cross-sectional/i, /cross sectional/i, /prevalence/i, /survey/i],
      minMatches: 2,
      weight: 0.75,
    },
    {
      design: 'case_report',
      patterns: [/case report/i, /we report/i, /we present a case/i, /patient presented/i],
      minMatches: 1,
      weight: 0.70,
    },
    {
      design: 'case_series',
      patterns: [/case series/i, /\d+\s+cases/i, /consecutive patients/i],
      minMatches: 1,
      weight: 0.70,
    },
  ];

  let bestMatch: { design: StudyDesign; confidence: number } = {
    design: 'unknown',
    confidence: 0,
  };

  for (const { design, patterns: regexPatterns, minMatches, weight } of patterns) {
    let matches = 0;
    for (const pattern of regexPatterns) {
      if (pattern.test(abstract) || pattern.test(methods)) {
        matches++;
      }
    }

    if (matches >= minMatches) {
      const confidence = Math.min(1.0, (matches / regexPatterns.length) * weight);
      if (confidence > bestMatch.confidence) {
        bestMatch = { design, confidence };
      }
    }
  }

  // If no specific design detected, check for review or basic research
  if (bestMatch.confidence < 0.5) {
    if (/\breview\b/i.test(abstract)) {
      return { design: 'review_article', confidence: 0.6 };
    }
    if (/in vitro|cell culture|molecular|protein/i.test(fullText)) {
      return { design: 'basic_research', confidence: 0.5 };
    }
  }

  return bestMatch;
}

/**
 * Extract sample size information
 */
export function extractSampleSize(content: PaperContent): StudyPopulation {
  const methods = content.sections.find((s) => s.type === 'methods')?.content || '';
  const results = content.sections.find((s) => s.type === 'results')?.content || '';
  const abstract = content.sections.find((s) => s.type === 'abstract')?.content || '';

  const searchText = `${abstract} ${methods} ${results}`;

  // Common patterns for sample size
  const patterns = [
    /(\d+)\s+patients/i,
    /(\d+)\s+participants/i,
    /(\d+)\s+subjects/i,
    /n\s*=\s*(\d+)/i,
    /sample\s+size\s+of\s+(\d+)/i,
    /total\s+of\s+(\d+)\s+(?:patients|participants|subjects)/i,
  ];

  let sampleSize: number | undefined;

  for (const pattern of patterns) {
    const match = searchText.match(pattern);
    if (match) {
      const size = parseInt(match[1], 10);
      // Sanity check: sample size should be reasonable (not a year, not too large)
      if (size >= 1 && size <= 1000000 && size !== 2023 && size !== 2024) {
        sampleSize = size;
        break;
      }
    }
  }

  // Extract population description
  const populationMatch = searchText.match(
    /(?:patients?|participants?|subjects?)\s+(?:were|was|included)\s+([^.]+)\./i
  );
  const populationDescription = populationMatch?.[1];

  return {
    sampleSize,
    populationDescription,
  };
}

/**
 * Assess bias risk
 */
export function assessBiasRisk(
  paper: Paper,
  content: PaperContent,
  studyDesign: StudyDesign
): {
  overallRisk: BiasRisk;
  biasTypes: BiasType[];
} {
  const biasTypes: BiasType[] = [];
  const fullText = content.fullText.toLowerCase();
  const methods = content.sections.find((s) => s.type === 'methods')?.content.toLowerCase() || '';

  // Selection bias
  if (!methods.includes('random') && !methods.includes('consecutive')) {
    biasTypes.push({
      type: 'selection_bias',
      severity: 'moderate',
      evidence: 'No mention of randomization or consecutive enrollment',
    });
  }

  // Funding bias
  if (paper.abstract?.toLowerCase().includes('funded by') || fullText.includes('conflict of interest')) {
    const hasCOI = fullText.includes('conflict of interest');
    biasTypes.push({
      type: 'funding_bias',
      severity: hasCOI ? 'low' : 'moderate',
      evidence: hasCOI ? 'Conflicts of interest disclosed' : 'Funding mentioned',
    });
  }

  // Measurement bias
  if (!methods.includes('validated') && !methods.includes('standardized')) {
    biasTypes.push({
      type: 'measurement_bias',
      severity: 'moderate',
      evidence: 'No mention of validated/standardized measurement tools',
    });
  }

  // Observer bias (relevant for non-blinded studies)
  if (
    studyDesign === 'randomized_controlled_trial' &&
    !methods.includes('blind') &&
    !methods.includes('masked')
  ) {
    biasTypes.push({
      type: 'observer_bias',
      severity: 'high',
      evidence: 'RCT without blinding',
    });
  }

  // Calculate overall risk
  const highRiskCount = biasTypes.filter((b) => b.severity === 'high').length;
  const moderateRiskCount = biasTypes.filter((b) => b.severity === 'moderate').length;

  let overallRisk: BiasRisk;
  if (highRiskCount >= 2) {
    overallRisk = 'high';
  } else if (highRiskCount === 1 || moderateRiskCount >= 3) {
    overallRisk = 'moderate';
  } else if (biasTypes.length === 0) {
    overallRisk = 'unclear';
  } else {
    overallRisk = 'low';
  }

  return { overallRisk, biasTypes };
}

/**
 * Calculate component scores
 */
function calculateComponentScores(
  paper: Paper,
  content: PaperContent,
  studyDesign: StudyDesign,
  population: StudyPopulation
): QualityComponents {
  // Methodology score (based on study design)
  const designScores: Record<StudyDesign, number> = {
    randomized_controlled_trial: 25,
    systematic_review: 24,
    meta_analysis: 24,
    cohort_study: 20,
    case_control_study: 18,
    cross_sectional_study: 15,
    observational_study: 15,
    case_series: 10,
    case_report: 8,
    qualitative_study: 12,
    review_article: 12,
    basic_research: 18,
    unknown: 10,
  };
  const methodologyScore = designScores[studyDesign];

  // Sample size score
  let sampleSizeScore = 0;
  if (population.sampleSize) {
    if (population.sampleSize >= 1000) sampleSizeScore = 25;
    else if (population.sampleSize >= 500) sampleSizeScore = 22;
    else if (population.sampleSize >= 200) sampleSizeScore = 19;
    else if (population.sampleSize >= 100) sampleSizeScore = 16;
    else if (population.sampleSize >= 50) sampleSizeScore = 13;
    else if (population.sampleSize >= 20) sampleSizeScore = 10;
    else sampleSizeScore = 5;
  } else {
    sampleSizeScore = 10; // Unknown
  }

  // Statistical rigor score
  const methods = content.sections.find((s) => s.type === 'methods')?.content.toLowerCase() || '';
  const results = content.sections.find((s) => s.type === 'results')?.content.toLowerCase() || '';

  let statisticalRigorScore = 0;
  if (methods.includes('statistical') || results.includes('statistical')) statisticalRigorScore += 5;
  if (methods.includes('p-value') || results.includes('p <') || results.includes('p='))
    statisticalRigorScore += 5;
  if (methods.includes('confidence interval') || results.includes('95% ci'))
    statisticalRigorScore += 5;
  if (methods.includes('power analysis') || methods.includes('sample size calculation'))
    statisticalRigorScore += 5;
  if (
    methods.includes('multivariate') ||
    methods.includes('regression') ||
    methods.includes('anova')
  )
    statisticalRigorScore += 5;

  // Reporting quality score
  let reportingQualityScore = 0;
  if (content.sections.find((s) => s.type === 'abstract')) reportingQualityScore += 5;
  if (content.sections.find((s) => s.type === 'methods')) reportingQualityScore += 5;
  if (content.sections.find((s) => s.type === 'results')) reportingQualityScore += 5;
  if (content.sections.find((s) => s.type === 'discussion')) reportingQualityScore += 5;
  if (content.references.length > 10) reportingQualityScore += 5;

  return {
    methodologyScore,
    sampleSizeScore,
    statisticalRigorScore,
    reportingQualityScore,
  };
}

/**
 * Convert score to letter grade
 */
function scoreToGrade(score: number): QualityGrade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Identify study strengths
 */
function identifyStrengths(
  paper: Paper,
  content: PaperContent,
  studyDesign: StudyDesign,
  components: QualityComponents
): string[] {
  const strengths: string[] = [];

  // Study design strengths
  if (studyDesign === 'randomized_controlled_trial') {
    strengths.push('Randomized controlled trial design (gold standard)');
  } else if (studyDesign === 'systematic_review' || studyDesign === 'meta_analysis') {
    strengths.push('Systematic approach to evidence synthesis');
  }

  // Large sample size
  if (components.sampleSizeScore >= 20) {
    strengths.push('Large sample size increases statistical power');
  }

  // Good statistical methods
  if (components.statisticalRigorScore >= 20) {
    strengths.push('Rigorous statistical analysis');
  }

  // Well-structured paper
  if (components.reportingQualityScore >= 20) {
    strengths.push('Well-structured and comprehensive reporting');
  }

  // High citation count
  if (paper.citationCount && paper.citationCount > 100) {
    strengths.push(`Highly cited (${paper.citationCount} citations) indicating impact`);
  }

  // Recent publication
  if (paper.year && paper.year >= new Date().getFullYear() - 2) {
    strengths.push('Recent publication with current evidence');
  }

  return strengths;
}

/**
 * Identify study limitations
 */
function identifyLimitations(
  paper: Paper,
  content: PaperContent,
  studyDesign: StudyDesign,
  components: QualityComponents,
  biasTypes: BiasType[]
): string[] {
  const limitations: string[] = [];

  // Study design limitations
  if (studyDesign === 'case_report' || studyDesign === 'case_series') {
    limitations.push('Case report/series has limited generalizability');
  } else if (studyDesign === 'cross_sectional_study') {
    limitations.push('Cross-sectional design cannot establish causation');
  }

  // Small sample size
  if (components.sampleSizeScore < 15) {
    limitations.push('Small sample size may limit statistical power');
  }

  // Weak statistical methods
  if (components.statisticalRigorScore < 15) {
    limitations.push('Limited statistical analysis');
  }

  // Bias risks
  for (const bias of biasTypes) {
    if (bias.severity === 'high') {
      limitations.push(`High risk of ${bias.type.replace('_', ' ')}`);
    }
  }

  // Poor reporting
  if (components.reportingQualityScore < 15) {
    limitations.push('Incomplete reporting of methods or results');
  }

  // Old publication
  if (paper.year && paper.year < new Date().getFullYear() - 10) {
    limitations.push(`Published ${new Date().getFullYear() - paper.year} years ago, may not reflect current evidence`);
  }

  return limitations;
}

/**
 * Compare quality across multiple papers
 */
export function compareQuality(
  assessments: Array<{ paper: Paper; assessment: QualityAssessment }>
): {
  ranked: Array<{ paper: Paper; assessment: QualityAssessment; rank: number }>;
  summary: string;
} {
  // Sort by score (descending)
  const sorted = [...assessments].sort((a, b) => b.assessment.score - a.assessment.score);

  const ranked = sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  // Generate summary
  const avgScore = assessments.reduce((sum, a) => sum + a.assessment.score, 0) / assessments.length;
  const designCounts = assessments.reduce((counts, a) => {
    counts[a.assessment.studyDesign] = (counts[a.assessment.studyDesign] || 0) + 1;
    return counts;
  }, {} as Record<StudyDesign, number>);

  const summary = `Analyzed ${assessments.length} papers. Average quality score: ${avgScore.toFixed(1)}/100. Most common design: ${Object.entries(designCounts).sort((a, b) => b[1] - a[1])[0][0]}.`;

  return { ranked, summary };
}
