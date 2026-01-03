// Deep Research - Quality Reviewer Agent
// Reviews synthesis for accuracy, completeness, and quality

import {
  BaseAgent,
  RegisterAgent,
  type AgentConfig,
  type AgentContext,
  type AgentResult,
} from './base-agent';
import type {
  ResearchSource,
  SynthesisSection,
  QualityMetrics,
} from '../types';

/**
 * Quality Reviewer Agent Configuration
 */
const QUALITY_REVIEWER_CONFIG: AgentConfig = {
  type: 'quality_reviewer',
  name: 'Quality Reviewer',
  description: 'Reviews synthesis for accuracy, completeness, and quality',
  systemPrompt: `You are a Quality Reviewer Agent specializing in research synthesis review.

Your responsibilities:
1. Verify accuracy of claims against source material
2. Check completeness of coverage
3. Identify potential biases
4. Assess methodology quality
5. Ensure proper attribution
6. Rate overall synthesis quality

Quality dimensions:
- Accuracy: Claims match source evidence
- Completeness: All key sources represented
- Balance: Multiple perspectives included
- Attribution: Sources properly cited
- Clarity: Writing is clear and accessible
- Rigor: Methods are appropriate and applied correctly

Bias detection:
- Selection bias in source inclusion
- Confirmation bias in interpretation
- Publication bias in available literature
- Temporal bias toward recent/old studies`,
  temperature: 0.2,
  maxTokens: 3000,
};

/**
 * Quality issue found during review
 */
interface QualityIssue {
  id: string;
  type: 'accuracy' | 'completeness' | 'bias' | 'attribution' | 'clarity' | 'methodology';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  location?: string;
  suggestion: string;
}

/**
 * Quality score breakdown
 */
interface QualityScore {
  dimension: string;
  score: number; // 0-100
  weight: number;
  notes: string;
}

/**
 * Review result
 */
interface QualityReviewResult {
  overallScore: number;
  scores: QualityScore[];
  issues: QualityIssue[];
  metrics: QualityMetrics;
  recommendations: string[];
  approved: boolean;
}

/**
 * Quality Reviewer Agent
 *
 * Reviews the synthesized research for quality, accuracy, and completeness.
 * Provides actionable feedback for improvement.
 */
@RegisterAgent('quality_reviewer')
export class QualityReviewerAgent extends BaseAgent {
  private issues: QualityIssue[] = [];
  private scores: QualityScore[] = [];

  constructor(sessionId: string) {
    super(QUALITY_REVIEWER_CONFIG, sessionId);
  }

  /**
   * Check accuracy of synthesis against sources
   */
  private checkAccuracy(
    sections: SynthesisSection[],
    sources: ResearchSource[]
  ): QualityScore {
    let accuracyScore = 100;
    const issues: QualityIssue[] = [];

    // Check that each section references actual sources
    for (const section of sections) {
      const invalidSources = section.sourceIds.filter(
        id => !sources.some(s => s.id === id)
      );

      if (invalidSources.length > 0) {
        accuracyScore -= 10 * invalidSources.length;
        issues.push({
          id: `accuracy-${section.id}`,
          type: 'accuracy',
          severity: 'major',
          description: `Section "${section.title}" references ${invalidSources.length} non-existent sources`,
          location: section.id,
          suggestion: 'Verify all source references are valid',
        });
      }

      // Check evidence items have sources
      const unsupportedEvidence = section.evidence.filter(
        e => e.sourceIds.length === 0
      );
      if (unsupportedEvidence.length > 0) {
        accuracyScore -= 5 * unsupportedEvidence.length;
        issues.push({
          id: `accuracy-evidence-${section.id}`,
          type: 'accuracy',
          severity: 'minor',
          description: `${unsupportedEvidence.length} evidence items lack source attribution`,
          location: section.id,
          suggestion: 'Add source references to all evidence claims',
        });
      }
    }

    this.issues.push(...issues);

    return {
      dimension: 'Accuracy',
      score: Math.max(0, accuracyScore),
      weight: 0.25,
      notes: issues.length > 0
        ? `Found ${issues.length} accuracy issues`
        : 'All claims properly attributed to sources',
    };
  }

  /**
   * Check completeness of source coverage
   */
  private checkCompleteness(
    sections: SynthesisSection[],
    sources: ResearchSource[]
  ): QualityScore {
    // Collect all referenced sources
    const referencedSourceIds = new Set<string>();
    for (const section of sections) {
      section.sourceIds.forEach(id => referencedSourceIds.add(id));
    }

    const coverageRatio = referencedSourceIds.size / sources.length;
    let completenessScore = coverageRatio * 100;

    // Check for high-impact sources
    const highImpactSources = sources.filter(s => (s.citationCount || 0) > 50);
    const referencedHighImpact = highImpactSources.filter(s =>
      referencedSourceIds.has(s.id)
    );

    if (highImpactSources.length > 0) {
      const highImpactCoverage = referencedHighImpact.length / highImpactSources.length;
      if (highImpactCoverage < 0.8) {
        this.issues.push({
          id: 'completeness-high-impact',
          type: 'completeness',
          severity: 'major',
          description: `Only ${Math.round(highImpactCoverage * 100)}% of high-impact sources are referenced`,
          suggestion: 'Ensure key papers are included in the synthesis',
        });
        completenessScore -= 15;
      }
    }

    // Check for recent sources
    const currentYear = new Date().getFullYear();
    const recentSources = sources.filter(s => s.year >= currentYear - 3);
    const referencedRecent = recentSources.filter(s =>
      referencedSourceIds.has(s.id)
    );

    if (recentSources.length > 0) {
      const recentCoverage = referencedRecent.length / recentSources.length;
      if (recentCoverage < 0.7) {
        this.issues.push({
          id: 'completeness-recent',
          type: 'completeness',
          severity: 'minor',
          description: `Only ${Math.round(recentCoverage * 100)}% of recent sources are referenced`,
          suggestion: 'Include more recent publications',
        });
        completenessScore -= 10;
      }
    }

    return {
      dimension: 'Completeness',
      score: Math.max(0, Math.min(100, completenessScore)),
      weight: 0.2,
      notes: `${referencedSourceIds.size} of ${sources.length} sources referenced`,
    };
  }

  /**
   * Check for potential biases
   */
  private checkBias(sources: ResearchSource[]): QualityScore {
    let biasScore = 100;
    const currentYear = new Date().getFullYear();

    // Check temporal bias
    const recentCount = sources.filter(s => s.year >= currentYear - 3).length;
    const oldCount = sources.filter(s => s.year < currentYear - 10).length;
    const recentRatio = recentCount / sources.length;

    if (recentRatio > 0.8) {
      this.issues.push({
        id: 'bias-temporal-recent',
        type: 'bias',
        severity: 'minor',
        description: 'Strong recency bias - over 80% of sources from last 3 years',
        suggestion: 'Consider including foundational older works',
      });
      biasScore -= 10;
    } else if (oldCount / sources.length > 0.5) {
      this.issues.push({
        id: 'bias-temporal-old',
        type: 'bias',
        severity: 'minor',
        description: 'Many sources are over 10 years old',
        suggestion: 'Update with more recent research',
      });
      biasScore -= 10;
    }

    // Check geographic/author diversity (simplified)
    const uniqueFirstAuthors = new Set(
      sources.map(s => s.authors[0]?.name || 'unknown')
    );
    if (uniqueFirstAuthors.size < sources.length * 0.5) {
      this.issues.push({
        id: 'bias-author',
        type: 'bias',
        severity: 'minor',
        description: 'Limited author diversity in sources',
        suggestion: 'Seek papers from different research groups',
      });
      biasScore -= 10;
    }

    // Check journal diversity
    const journals = sources.map(s => s.journal).filter(Boolean);
    const uniqueJournals = new Set(journals);
    if (uniqueJournals.size < journals.length * 0.4) {
      this.issues.push({
        id: 'bias-journal',
        type: 'bias',
        severity: 'minor',
        description: 'Limited journal diversity',
        suggestion: 'Include sources from varied journals',
      });
      biasScore -= 5;
    }

    return {
      dimension: 'Balance',
      score: Math.max(0, biasScore),
      weight: 0.15,
      notes: this.issues.filter(i => i.type === 'bias').length > 0
        ? 'Potential biases detected'
        : 'Good balance across sources',
    };
  }

  /**
   * Check attribution quality
   */
  private checkAttribution(sections: SynthesisSection[]): QualityScore {
    let attributionScore = 100;
    let totalClaims = 0;
    let attributedClaims = 0;

    for (const section of sections) {
      // Check if content has attributions (simplified check)
      const hasParenthetical = section.content.includes('(') && section.content.includes(')');
      const hasEtAl = section.content.toLowerCase().includes('et al');
      const hasYearRef = /\b20\d{2}\b/.test(section.content);

      if (section.content.length > 100) {
        totalClaims++;
        if (hasParenthetical || hasEtAl || hasYearRef) {
          attributedClaims++;
        } else if (section.sourceIds.length > 0) {
          // Has sources but no inline attribution
          attributedClaims += 0.5;
        }
      }

      // Check evidence attribution
      for (const evidence of section.evidence) {
        totalClaims++;
        if (evidence.sourceIds.length > 0) {
          attributedClaims++;
        } else {
          this.issues.push({
            id: `attribution-${evidence.id}`,
            type: 'attribution',
            severity: 'major',
            description: `Evidence claim lacks attribution: "${evidence.claim.substring(0, 50)}..."`,
            location: section.id,
            suggestion: 'Add source reference for this claim',
          });
          attributionScore -= 5;
        }
      }
    }

    if (totalClaims > 0) {
      const ratio = attributedClaims / totalClaims;
      attributionScore = Math.min(100, ratio * 100);
    }

    return {
      dimension: 'Attribution',
      score: Math.max(0, attributionScore),
      weight: 0.2,
      notes: `${attributedClaims}/${totalClaims} claims attributed`,
    };
  }

  /**
   * Check clarity of writing
   */
  private checkClarity(sections: SynthesisSection[]): QualityScore {
    let clarityScore = 100;

    for (const section of sections) {
      // Check for very long sentences (proxy for clarity)
      const sentences = section.content.split(/[.!?]+/).filter(s => s.trim());
      const longSentences = sentences.filter(s => s.split(/\s+/).length > 40);

      if (longSentences.length > sentences.length * 0.3) {
        this.issues.push({
          id: `clarity-long-${section.id}`,
          type: 'clarity',
          severity: 'minor',
          description: `Section "${section.title}" has many long sentences`,
          location: section.id,
          suggestion: 'Break up long sentences for better readability',
        });
        clarityScore -= 5;
      }

      // Check for jargon without explanation (simplified)
      const jargonPatterns = [
        /\b(meta-analysis|heterogeneity|confounding|stratified)\b/i,
        /\b(multivariate|univariate|regression|correlation)\b/i,
      ];

      for (const pattern of jargonPatterns) {
        if (pattern.test(section.content)) {
          // Jargon present - minor deduction if not explained
          if (!section.content.includes('(') || !section.content.includes('defined as')) {
            clarityScore -= 2;
          }
        }
      }

      // Check section length
      if (section.content.length < 50 && section.title !== 'Introduction') {
        this.issues.push({
          id: `clarity-short-${section.id}`,
          type: 'clarity',
          severity: 'minor',
          description: `Section "${section.title}" is very brief`,
          location: section.id,
          suggestion: 'Expand section with more detail',
        });
        clarityScore -= 5;
      }
    }

    return {
      dimension: 'Clarity',
      score: Math.max(0, clarityScore),
      weight: 0.1,
      notes: clarityScore >= 80 ? 'Writing is clear and accessible' : 'Some clarity improvements needed',
    };
  }

  /**
   * Check methodology rigor
   */
  private checkMethodology(sources: ResearchSource[]): QualityScore {
    let methodologyScore = 100;

    // Check for methodology documentation
    const sourcesWithMethodology = sources.filter(s =>
      s.extractedContent?.methodology
    );
    const methodologyCoverage = sourcesWithMethodology.length / sources.length;

    if (methodologyCoverage < 0.5) {
      this.issues.push({
        id: 'methodology-coverage',
        type: 'methodology',
        severity: 'minor',
        description: 'Many sources lack methodology documentation',
        suggestion: 'Extract and document methodology from more sources',
      });
      methodologyScore -= 15;
    }

    // Check for study design diversity
    const abstracts = sources
      .map(s => s.abstract || '')
      .filter(a => a.length > 0);

    const hasRCT = abstracts.some(a =>
      a.toLowerCase().includes('randomized') ||
      a.toLowerCase().includes('randomised')
    );
    const hasCohort = abstracts.some(a =>
      a.toLowerCase().includes('cohort')
    );
    const hasReview = abstracts.some(a =>
      a.toLowerCase().includes('systematic review') ||
      a.toLowerCase().includes('meta-analysis')
    );

    const designTypes = [hasRCT, hasCohort, hasReview].filter(Boolean).length;
    if (designTypes < 2 && sources.length > 10) {
      this.issues.push({
        id: 'methodology-diversity',
        type: 'methodology',
        severity: 'minor',
        description: 'Limited study design diversity',
        suggestion: 'Include diverse study types (RCTs, cohorts, reviews)',
      });
      methodologyScore -= 10;
    }

    return {
      dimension: 'Methodology',
      score: Math.max(0, methodologyScore),
      weight: 0.1,
      notes: `${sourcesWithMethodology.length}/${sources.length} sources with documented methodology`,
    };
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Group issues by type
    const issuesByType = new Map<string, QualityIssue[]>();
    for (const issue of this.issues) {
      const existing = issuesByType.get(issue.type) || [];
      existing.push(issue);
      issuesByType.set(issue.type, existing);
    }

    // Generate recommendations
    if (issuesByType.get('accuracy')?.some(i => i.severity === 'major')) {
      recommendations.push('Verify all source references and ensure claims match source content');
    }

    if (issuesByType.get('completeness')?.length) {
      recommendations.push('Expand coverage to include more sources, especially high-impact papers');
    }

    if (issuesByType.get('bias')?.length) {
      recommendations.push('Address potential biases by diversifying source selection');
    }

    if (issuesByType.get('attribution')?.length) {
      recommendations.push('Add proper citations for all claims and evidence');
    }

    if (issuesByType.get('clarity')?.length) {
      recommendations.push('Improve readability by simplifying complex sentences');
    }

    if (issuesByType.get('methodology')?.length) {
      recommendations.push('Document methodology from additional sources');
    }

    // Add general recommendations if few issues
    if (recommendations.length === 0) {
      recommendations.push('Synthesis meets quality standards');
      recommendations.push('Consider adding visual summaries for key findings');
    }

    return recommendations;
  }

  /**
   * Calculate overall quality metrics
   */
  private calculateMetrics(
    sources: ResearchSource[],
    sections: SynthesisSection[]
  ): QualityMetrics {
    const referencedSources = new Set<string>();
    sections.forEach(s => s.sourceIds.forEach(id => referencedSources.add(id)));

    return {
      sourceCoverage: referencedSources.size / sources.length,
      citationAccuracy: this.scores.find(s => s.dimension === 'Accuracy')?.score || 0 / 100,
      narrativeCoherence: this.scores.find(s => s.dimension === 'Clarity')?.score || 0 / 100,
      evidenceStrength: sources.reduce((sum, s) => sum + (s.influenceScore || 0.5), 0) / sources.length,
      overallQuality: this.scores.reduce((sum, s) => sum + s.score * s.weight, 0) / 100,
    };
  }

  /**
   * Execute the quality reviewer agent
   */
  async execute(context: AgentContext): Promise<AgentResult<QualityReviewResult>> {
    this.updateStatus('working', 'Beginning quality review', 0);
    this.issues = [];
    this.scores = [];

    try {
      // Get sources from researcher
      const researcherOutput = context.previousAgentOutputs.get('researcher') as
        { selectedSources: ResearchSource[] } | undefined;

      // Get synthesis sections
      const synthesizerOutput = context.previousAgentOutputs.get('synthesizer') as
        { sections: SynthesisSection[] } | undefined;

      const sources = researcherOutput?.selectedSources || context.session.sources;
      const sections = synthesizerOutput?.sections || [];

      if (!sources || sources.length === 0) {
        throw new Error('No sources available for quality review');
      }

      if (sections.length === 0) {
        throw new Error('No synthesis sections available for review');
      }

      this.addMessage('system', this.config.systemPrompt);
      this.addMessage('user', `Review synthesis quality for ${sections.length} sections using ${sources.length} sources`);

      // Run quality checks
      this.updateStatus('working', 'Checking accuracy', 15);
      this.scores.push(this.checkAccuracy(sections, sources));

      this.updateStatus('working', 'Checking completeness', 30);
      this.scores.push(this.checkCompleteness(sections, sources));

      this.updateStatus('working', 'Checking for biases', 45);
      this.scores.push(this.checkBias(sources));

      this.updateStatus('working', 'Checking attribution', 60);
      this.scores.push(this.checkAttribution(sections));

      this.updateStatus('working', 'Checking clarity', 75);
      this.scores.push(this.checkClarity(sections));

      this.updateStatus('working', 'Checking methodology', 85);
      this.scores.push(this.checkMethodology(sources));

      // Calculate overall score
      const overallScore = this.scores.reduce(
        (sum, s) => sum + s.score * s.weight,
        0
      );

      // Generate recommendations
      this.updateStatus('working', 'Generating recommendations', 95);
      const recommendations = this.generateRecommendations();

      // Calculate metrics
      const metrics = this.calculateMetrics(sources, sections);

      // Determine approval
      const criticalIssues = this.issues.filter(i => i.severity === 'critical');
      const majorIssues = this.issues.filter(i => i.severity === 'major');
      const approved = criticalIssues.length === 0 && majorIssues.length < 3 && overallScore >= 60;

      this.updateStatus('complete', 'Quality review complete', 100);

      this.addMessage('assistant',
        `Quality review complete. Score: ${overallScore.toFixed(1)}/100. ` +
        `Found ${this.issues.length} issues. Approved: ${approved}`
      );

      const result: QualityReviewResult = {
        overallScore,
        scores: this.scores,
        issues: this.issues,
        metrics,
        recommendations,
        approved,
      };

      return {
        success: true,
        data: result,
        messages: this.messages,
        tokensUsed: 0,
      };
    } catch (error) {
      this.updateStatus('error', `Quality review failed: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messages: this.messages,
        tokensUsed: 0,
      };
    }
  }

  /**
   * Get quality issues
   */
  getIssues(): QualityIssue[] {
    return [...this.issues];
  }

  /**
   * Get quality scores
   */
  getScores(): QualityScore[] {
    return [...this.scores];
  }
}
