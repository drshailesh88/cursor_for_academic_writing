/**
 * Deep Research Engine Types
 *
 * Type definitions for the multi-agent deep research system
 * supporting multi-perspective analysis, iterative learning,
 * citation classification, and consensus visualization.
 *
 * NOTE: Function re-exports have been moved to ./index.ts to avoid
 * circular dependencies. This file should only contain types.
 *
 * @see specs/001-deep-research/spec.md
 */

import type { SearchResult } from '../types';

// ============================================================================
// RESEARCH MODES & CONFIGURATION
// ============================================================================

/**
 * Research depth modes with predefined parameters
 */
export type ResearchMode = 'quick' | 'standard' | 'deep' | 'exhaustive' | 'systematic';

/**
 * Database sources for research
 */
export type DatabaseSource =
  | 'pubmed'
  | 'arxiv'
  | 'semantic-scholar'
  | 'crossref'
  | 'europe-pmc'
  | 'core';

/**
 * Article types for filtering
 */
export type ArticleType =
  | 'all'
  | 'rct'
  | 'systematic-review'
  | 'meta-analysis'
  | 'cohort'
  | 'case-control'
  | 'case-report'
  | 'review';

/**
 * Study design types for evidence quality assessment
 */
export type StudyDesign =
  | 'rct'
  | 'cohort'
  | 'case-control'
  | 'cross-sectional'
  | 'case-series'
  | 'case-report'
  | 'systematic-review'
  | 'meta-analysis'
  | 'narrative-review'
  | 'other';

/**
 * Research configuration parameters
 */
export interface ResearchConfig {
  /** Tree depth (1-6) */
  depth: number;

  /** Parallel paths per level (2-8) */
  breadth: number;

  /** Maximum number of sources to collect */
  maxSources: number;

  /** Refinement cycles per branch (1-5) */
  iterationLimit: number;

  /** Database sources to search */
  sources: DatabaseSource[];

  /** Date range filter */
  dateRange?: {
    start: number; // Year
    end: number; // Year
  };

  /** Article type filters */
  articleTypes: ArticleType[];

  /** Quality threshold for completion (0-100) */
  qualityThreshold: number;

  /** LLM model to use for research agents (default: deepseek) */
  model?: 'deepseek' | 'claude' | 'openai' | 'gemini';
}

/**
 * Get default configuration for a research mode
 */
export function getDefaultConfig(mode: ResearchMode): ResearchConfig {
  const configs: Record<ResearchMode, ResearchConfig> = {
    quick: {
      depth: 1,
      breadth: 2,
      maxSources: 10,
      iterationLimit: 1,
      sources: ['pubmed', 'semantic-scholar'],
      articleTypes: ['all'],
      qualityThreshold: 70,
    },
    standard: {
      depth: 2,
      breadth: 3,
      maxSources: 25,
      iterationLimit: 2,
      sources: ['pubmed', 'arxiv', 'semantic-scholar'],
      articleTypes: ['all'],
      qualityThreshold: 80,
    },
    deep: {
      depth: 3,
      breadth: 4,
      maxSources: 50,
      iterationLimit: 3,
      sources: ['pubmed', 'arxiv', 'semantic-scholar', 'crossref'],
      articleTypes: ['all'],
      qualityThreshold: 85,
    },
    exhaustive: {
      depth: 4,
      breadth: 5,
      maxSources: 100,
      iterationLimit: 4,
      sources: ['pubmed', 'arxiv', 'semantic-scholar', 'crossref', 'europe-pmc'],
      articleTypes: ['all'],
      qualityThreshold: 90,
    },
    systematic: {
      depth: 5,
      breadth: 6,
      maxSources: 200,
      iterationLimit: 5,
      sources: ['pubmed', 'arxiv', 'semantic-scholar', 'crossref', 'europe-pmc', 'core'],
      articleTypes: ['all'],
      qualityThreshold: 95,
    },
  };

  return configs[mode];
}

// ============================================================================
// PERSPECTIVES & EXPLORATION
// ============================================================================

/**
 * Expert perspective for multi-viewpoint research
 */
export interface Perspective {
  id: string;
  name: string;
  description: string;
  icon?: string;
  questions: string[];
  searchStrategies: string[];
}

/**
 * Node in the exploration tree
 */
export interface ExplorationNode {
  id: string;
  topic: string;
  perspectiveId?: string;
  parentId?: string;
  depth: number;
  status: 'pending' | 'searching' | 'complete' | 'failed';
  iterations: IterationResult[];
  sourceIds: string[]; // IDs of ResearchSource
  children: string[]; // IDs of child nodes
}

/**
 * Result of a single search iteration
 */
export interface IterationResult {
  iteration: number;
  query: string;
  database: DatabaseSource;
  sourcesFound: number;
  learnings: string[];
  newDirections: string[];
  timestamp: Date;
}

/**
 * Tree structure for exploration
 */
export interface ExplorationTree {
  rootId: string;
  nodes: Record<string, ExplorationNode>;
  totalNodes: number;
  completedNodes: number;
}

// ============================================================================
// SOURCES & CITATIONS
// ============================================================================

/**
 * Extended research source with analysis
 */
export interface ResearchSource extends SearchResult {
  /** Unique ID in this research session */
  sessionId: string;

  /** Node ID that found this source */
  discoveredBy: string;

  /** Iteration when discovered */
  discoveredAt: number;

  /** Quality assessment */
  quality?: {
    studyDesign: StudyDesign;
    sampleSize?: number;
    hasConflictOfInterest?: boolean;
    peerReviewed?: boolean;
  };

  /** Extracted key findings */
  keyFindings?: string[];

  /** Relevance to research question (0-1) */
  relevanceScore: number;
}

/**
 * Citation relationship types
 */
export type CitationType = 'supporting' | 'disputing' | 'mentioning' | 'methodology' | 'data';

/**
 * Citation edge representing relationship between papers
 */
export interface CitationEdge {
  from: string; // Source paper ID
  to: string; // Cited paper ID
  type: CitationType;
  statement?: string; // The citing sentence
  confidence: number; // 0-1
  context?: string; // Surrounding text
}

/**
 * Citation node representing a paper
 */
export interface CitationNode {
  id: string; // PMID, DOI, or arXiv ID
  title: string;
  authors: string[];
  year: number;
  citationCount: number;
  source: DatabaseSource;
}

/**
 * Citation graph structure
 */
export interface CitationGraph {
  nodes: CitationNode[];
  edges: CitationEdge[];
  clusters?: {
    id: string;
    label: string;
    nodeIds: string[];
  }[];
}

// ============================================================================
// CONSENSUS & EVIDENCE
// ============================================================================

/**
 * Question types for consensus analysis
 */
export type QuestionType = 'yes_no' | 'comparative' | 'descriptive';

/**
 * Confidence levels for consensus
 */
export type ConfidenceLevel = 'high' | 'moderate' | 'low' | 'very_low';

/**
 * Evidence position
 */
export type EvidencePosition = 'supporting' | 'neutral' | 'contradicting';

/**
 * Breakdown by study type
 */
export interface EvidenceBreakdown {
  studyType: StudyDesign;
  supporting: number;
  neutral: number;
  contradicting: number;
}

/**
 * Consensus data for yes/no questions
 */
export interface ConsensusData {
  question: string;
  questionType: QuestionType;

  /** Distribution of evidence */
  distribution: {
    supporting: number;
    neutral: number;
    contradicting: number;
  };

  /** Breakdown by study design */
  breakdown: EvidenceBreakdown[];

  /** Overall confidence level */
  confidence: ConfidenceLevel;
  confidenceReason: string;

  /** Key supporting and contradicting studies */
  keyStudies: {
    supporting: ResearchSource[];
    contradicting: ResearchSource[];
  };

  /** Total number of studies analyzed */
  totalStudies: number;

  /** Quality metrics */
  metrics: {
    averageStudyQuality: number;
    hasRCTs: boolean;
    hasMetaAnalyses: boolean;
    totalSampleSize?: number;
    recentStudiesCount: number; // Last 5 years
  };
}

// ============================================================================
// QUALITY REVIEW
// ============================================================================

/**
 * Types of issues found during review
 */
export type ReviewIssueType =
  | 'missing_coverage'
  | 'unsupported_claim'
  | 'contradiction'
  | 'bias'
  | 'insufficient_evidence'
  | 'outdated_sources';

/**
 * Issue severity
 */
export type IssueSeverity = 'critical' | 'major' | 'minor';

/**
 * Quality review feedback
 */
export interface ReviewFeedback {
  type: ReviewIssueType;
  severity: IssueSeverity;
  description: string;
  location?: string; // Section or topic
  suggestions: string[];
  resolved: boolean;
}

/**
 * Quality assessment scores
 */
export interface QualityScores {
  overall: number; // 0-100
  coverage: number; // 0-100
  evidenceQuality: number; // 0-100
  balance: number; // 0-100
  recency: number; // 0-100
  citationAccuracy: number; // 0-100
}

// ============================================================================
// SYNTHESIS & OUTPUT
// ============================================================================

/**
 * Synthesis section
 */
export interface SynthesisSection {
  id: string;
  title: string;
  content: string;
  sourceIds: string[];
  perspectiveIds: string[];
}

/**
 * Complete synthesis
 */
export interface Synthesis {
  content: string;
  sections: SynthesisSection[];
  qualityScore: number;
  reviewFeedback: ReviewFeedback[];
  revisionCount: number;
  wordCount: number;
  citationCount: number;
}

// ============================================================================
// RESEARCH SESSION
// ============================================================================

/**
 * Session status
 */
export type SessionStatus =
  | 'clarifying'
  | 'planning'
  | 'researching'
  | 'analyzing'
  | 'reviewing'
  | 'synthesizing'
  | 'complete'
  | 'failed'
  | 'error';

/**
 * Clarification Q&A
 */
export interface Clarification {
  question: string;
  answer: string;
  timestamp: Date;
}

/**
 * Collaborator info
 */
export interface Collaborator {
  userId: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: Date;
}

/**
 * Comment on research
 */
export interface Comment {
  id: string;
  userId: string;
  content: string;
  targetId?: string; // Source or section ID
  createdAt: Date;
  resolved: boolean;
}

/**
 * Progress metrics
 */
export interface Progress {
  percentage: number; // 0-100
  stage: SessionStatus;
  currentBranch?: string;
  currentIteration?: number;
  sourcesCollected: number;
  sourcesTarget: number;
  nodesComplete: number;
  nodesTotal: number;
}

/**
 * Main research session
 */
export interface ResearchSession {
  // Identity
  id: string;
  userId: string;

  // Configuration
  topic: string;
  mode: ResearchMode;
  config: ResearchConfig;

  // Clarification phase
  clarifications: Clarification[];

  // Multi-perspective research
  perspectives: Perspective[];

  // Exploration tree
  tree: ExplorationTree;

  // All discovered sources (deduplicated)
  sources: ResearchSource[];

  // Citation relationships
  citationGraph: CitationGraph;

  // Consensus analysis (if applicable)
  consensus?: ConsensusData;

  // Synthesis and quality
  synthesis: Synthesis;

  // Status and progress
  status: SessionStatus;
  progress: Progress;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;

  // Collaboration
  collaborators: Collaborator[];
  comments: Comment[];

  // Errors encountered
  errors: {
    stage: string;
    message: string;
    timestamp: Date;
  }[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a new research session with defaults
 */
export function createResearchSession(
  userId: string,
  topic: string,
  mode: ResearchMode,
  config?: Partial<ResearchConfig>
): Omit<ResearchSession, 'id' | 'createdAt' | 'updatedAt'> {
  const defaultConfig = getDefaultConfig(mode);

  return {
    userId,
    topic,
    mode,
    config: { ...defaultConfig, ...config },
    clarifications: [],
    perspectives: [],
    tree: {
      rootId: '',
      nodes: {},
      totalNodes: 0,
      completedNodes: 0,
    },
    sources: [],
    citationGraph: {
      nodes: [],
      edges: [],
    },
    synthesis: {
      content: '',
      sections: [],
      qualityScore: 0,
      reviewFeedback: [],
      revisionCount: 0,
      wordCount: 0,
      citationCount: 0,
    },
    status: 'planning',
    progress: {
      percentage: 0,
      stage: 'planning',
      sourcesCollected: 0,
      sourcesTarget: defaultConfig.maxSources,
      nodesComplete: 0,
      nodesTotal: 0,
    },
    collaborators: [],
    comments: [],
    errors: [],
  };
}

/**
 * Calculate consensus percentage
 */
export function calculateConsensusPercentage(
  distribution: ConsensusData['distribution']
): { supporting: number; neutral: number; contradicting: number } {
  const total = distribution.supporting + distribution.neutral + distribution.contradicting;

  if (total === 0) {
    return { supporting: 0, neutral: 0, contradicting: 0 };
  }

  return {
    supporting: Math.round((distribution.supporting / total) * 100),
    neutral: Math.round((distribution.neutral / total) * 100),
    contradicting: Math.round((distribution.contradicting / total) * 100),
  };
}

/**
 * Determine confidence level based on evidence
 */
export function determineConfidence(
  breakdown: EvidenceBreakdown[],
  totalStudies: number
): ConfidenceLevel {
  const hasRCTs = breakdown.some((b) => b.studyType === 'rct');
  const hasMetaAnalyses = breakdown.some((b) => b.studyType === 'meta-analysis');
  const hasSystematicReviews = breakdown.some((b) => b.studyType === 'systematic-review');

  // Check if only low-quality studies (case-report, case-series)
  const hasOnlyLowQualityStudies = breakdown.every(
    (b) => b.studyType === 'case-report' || b.studyType === 'case-series'
  );

  // Very low confidence conditions
  if (totalStudies < 5) return 'very_low';
  if (totalStudies < 10 && hasOnlyLowQualityStudies) return 'very_low';

  // High confidence: multiple high-quality studies
  if (hasMetaAnalyses && hasRCTs && totalStudies >= 20) return 'high';
  if (hasSystematicReviews && hasRCTs && totalStudies >= 15) return 'high';

  // Moderate confidence: some high-quality studies
  if ((hasMetaAnalyses || hasRCTs) && totalStudies >= 10) return 'moderate';

  // Low confidence: enough studies but lower quality
  if (totalStudies < 10) return 'low';

  return 'low';
}

// ============================================================================
// COMPATIBILITY ALIASES
// ============================================================================

/**
 * Alias for backward compatibility with engine.ts
 */
export type ResearchNode = ExplorationNode;

/**
 * Alias for citation relationships
 */
export type CitationRelation = CitationEdge;

/**
 * Alias for citation context types
 */
export type CitationContext = CitationType;

/**
 * Consensus result (alias for ConsensusData)
 */
export type ConsensusResult = ConsensusData;

/**
 * Evidence grade structure
 */
export interface EvidenceGrade {
  grade: 'A' | 'B' | 'C' | 'D';
  criteria: string[];
  strengths: string[];
  limitations: string[];
}

/**
 * Research synthesis structure
 */
export interface ResearchSynthesis {
  topic: string;
  perspectives: Perspective[];
  keyFindings: Finding[];
  consensus: ConsensusData[];
  gaps: string[];
  contradictions: Contradiction[];
  recommendations: string[];
  sources: SearchResult[];
  citationGraph?: CitationGraph;
  metadata: {
    totalSources: number;
    dateRange: { start: number; end: number };
    databases: string[];
    generatedAt: number;
  };
}

/**
 * Key finding from research
 */
export interface Finding {
  statement: string;
  support: SearchResult[];
  confidence: 'high' | 'medium' | 'low';
  evidenceGrade: 'A' | 'B' | 'C' | 'D';
  perspective?: string;
}

/**
 * Contradiction in literature
 */
export interface Contradiction {
  claim1: string;
  claim2: string;
  sources1: SearchResult[];
  sources2: SearchResult[];
  explanation?: string;
  resolved: boolean;
}

/**
 * Report format options
 */
export type ReportFormat = 'markdown' | 'json' | 'html' | 'academic';

/**
 * Quality review result
 */
export interface QualityReview {
  passed: boolean;
  score: number;
  issues: QualityIssue[];
  suggestions: string[];
}

/**
 * Quality issue
 */
export interface QualityIssue {
  type: 'gap' | 'contradiction' | 'bias' | 'insufficient-evidence' | 'methodology';
  severity: 'high' | 'medium' | 'low';
  description: string;
  affectedPerspectives?: string[];
}

/**
 * Agent message for LLM communication
 */
export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Agent response wrapper
 */
export interface AgentResponse<T = unknown> {
  data: T;
  reasoning?: string;
  confidence: number;
}
