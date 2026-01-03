// Deep Research Engine - Core Types
// Based on spec: specs/001-deep-research/spec.md

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// Research Session
// ============================================================================

export interface ResearchSession {
  id: string;
  userId: string;
  topic: string;
  mode: ResearchMode;
  config: ResearchConfig;

  // Clarification phase
  clarifications: Clarification[];

  // Perspective phase
  perspectives: Perspective[];

  // Exploration phase
  tree: ExplorationTree;

  // Sources and synthesis
  sources: ResearchSource[];
  citationGraph: CitationGraph;
  consensus?: ConsensusData;
  synthesis: SynthesisResult;

  // Status
  status: ResearchStatus;
  progress: number; // 0-100

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;

  // Collaboration
  collaborators: Collaborator[];
  comments: Comment[];
}

export type ResearchMode = 'quick' | 'standard' | 'deep' | 'exhaustive' | 'systematic';

export type ResearchStatus =
  | 'clarifying'
  | 'planning'
  | 'researching'
  | 'reviewing'
  | 'synthesizing'
  | 'complete'
  | 'error';

// ============================================================================
// Research Configuration
// ============================================================================

export interface ResearchConfig {
  depth: number; // 1-6
  breadth: number; // 2-8
  maxSources: number;
  sources: DatabaseSource[];
  dateRange: {
    start: Date;
    end: Date;
  };
  articleTypes: ArticleType[];
  languages: string[];
}

export type DatabaseSource =
  | 'pubmed'
  | 'arxiv'
  | 'semantic_scholar'
  | 'crossref'
  | 'europe_pmc'
  | 'core';

export type ArticleType =
  | 'research_article'
  | 'review'
  | 'meta_analysis'
  | 'systematic_review'
  | 'case_report'
  | 'clinical_trial'
  | 'preprint';

// ============================================================================
// Clarification Phase
// ============================================================================

export interface Clarification {
  id: string;
  question: string;
  answer: string;
  suggestedOptions?: string[];
  answeredAt: Timestamp;
}

// ============================================================================
// Perspectives (STORM-inspired)
// ============================================================================

export interface Perspective {
  id: string;
  name: string;
  role: string; // e.g., "Clinical Researcher", "Methodologist"
  description: string;
  focusAreas: string[];
  questions: PerspectiveQuestion[];
}

export interface PerspectiveQuestion {
  id: string;
  question: string;
  answer?: string;
  sources: string[]; // Source IDs
  confidence: number;
}

// ============================================================================
// Tree Exploration (dzhng-inspired)
// ============================================================================

export interface ExplorationTree {
  root: ExplorationNode;
  totalNodes: number;
  maxDepthReached: number;
}

export interface ExplorationNode {
  id: string;
  query: string;
  parentId: string | null;
  depth: number;

  // Search results
  searchResults: SearchResult[];
  selectedSources: string[];

  // Learning from this node
  findings: string[];
  gaps: string[];
  followUpQueries: string[];

  // Child nodes (breadth)
  children: ExplorationNode[];

  // Status
  status: 'pending' | 'searching' | 'analyzing' | 'complete' | 'pruned';
  exploredAt?: Timestamp;
}

export interface SearchResult {
  id: string;
  source: DatabaseSource;
  paperId: string;
  title: string;
  authors: string[];
  year: number;
  abstract?: string;
  relevanceScore: number;
  selected: boolean;
}

// ============================================================================
// Research Sources
// ============================================================================

export interface ResearchSource {
  id: string;

  // Identity
  paperId: string;
  doi?: string;
  pmid?: string;
  arxivId?: string;

  // Metadata
  title: string;
  authors: Author[];
  year: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  abstract?: string;

  // Source info
  database: DatabaseSource;
  url?: string;
  pdfUrl?: string;
  openAccess: boolean;

  // Content
  fullText?: string;
  extractedContent: ExtractedContent;

  // Classification (Scite-inspired)
  citationType: CitationType;
  citationContext: string;

  // Metrics
  citationCount?: number;
  influenceScore?: number;

  // Processing
  processedAt: Timestamp;
}

export interface Author {
  name: string;
  firstName?: string;
  lastName?: string;
  affiliation?: string;
  orcid?: string;
}

export interface ExtractedContent {
  keyFindings: string[];
  methodology?: string;
  limitations?: string[];
  conclusions?: string;
  dataPoints: DataPoint[];
}

export interface DataPoint {
  type: 'statistic' | 'metric' | 'outcome' | 'sample_size';
  label: string;
  value: string;
  unit?: string;
  context: string;
}

export type CitationType =
  | 'supporting'
  | 'disputing'
  | 'mentioning'
  | 'methodology'
  | 'data_source';

// ============================================================================
// Citation Graph
// ============================================================================

export interface CitationGraph {
  nodes: CitationNode[];
  edges: CitationEdge[];
  clusters: CitationCluster[];
}

export interface CitationNode {
  id: string;
  sourceId: string;
  x: number;
  y: number;
  size: number;
  color: string;
  label: string;
}

export interface CitationEdge {
  source: string;
  target: string;
  type: 'cites' | 'cited_by' | 'co_citation';
  weight: number;
}

export interface CitationCluster {
  id: string;
  label: string;
  nodeIds: string[];
  color: string;
}

// ============================================================================
// Consensus (Consensus.app-inspired)
// ============================================================================

export interface ConsensusData {
  question: string;
  isYesNoQuestion: boolean;

  yesPercentage: number;
  noPercentage: number;
  unclearPercentage: number;

  totalStudies: number;

  breakdown: ConsensusBreakdown[];

  confidenceLevel: 'high' | 'moderate' | 'low';
  explanation: string;
}

export interface ConsensusBreakdown {
  position: 'yes' | 'no' | 'unclear';
  sourceIds: string[];
  summary: string;
}

// ============================================================================
// Synthesis
// ============================================================================

export interface SynthesisResult {
  content: string; // Markdown
  wordCount: number;

  sections: SynthesisSection[];

  qualityScore: number; // 0-100
  reviewFeedback: ReviewFeedback[];
  revisionCount: number;

  generatedAt: Timestamp;
}

export interface SynthesisSection {
  id: string;
  title: string;
  content: string;
  sources: string[]; // Source IDs
}

export interface ReviewFeedback {
  id: string;
  type: 'accuracy' | 'coverage' | 'balance' | 'clarity' | 'citation';
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  location?: string;
  resolved: boolean;
}

// ============================================================================
// Collaboration
// ============================================================================

export interface Collaborator {
  userId: string;
  email: string;
  displayName: string;
  role: 'viewer' | 'commenter' | 'editor' | 'owner';
  addedAt: Timestamp;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  sectionId?: string;
  parentId?: string; // For threaded comments
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  resolved: boolean;
}

// ============================================================================
// Agent System
// ============================================================================

export type AgentType =
  | 'orchestrator'
  | 'clarifier'
  | 'perspective_analyst'
  | 'search_strategist'
  | 'researcher'
  | 'citation_analyst'
  | 'synthesizer'
  | 'quality_reviewer'
  | 'writer';

export interface AgentMessage {
  id: string;
  agentType: AgentType;
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: Timestamp;
}

export interface AgentState {
  sessionId: string;
  agentType: AgentType;
  status: 'idle' | 'working' | 'waiting' | 'complete' | 'error';
  currentTask?: string;
  progress: number;
  messages: AgentMessage[];
  lastUpdated: Timestamp;
}

// ============================================================================
// Research Mode Configurations
// ============================================================================

export const RESEARCH_MODE_CONFIGS: Record<ResearchMode, ResearchConfig> = {
  quick: {
    depth: 1,
    breadth: 3,
    maxSources: 10,
    sources: ['pubmed', 'semantic_scholar'],
    dateRange: { start: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000), end: new Date() },
    articleTypes: ['research_article', 'review'],
    languages: ['en'],
  },
  standard: {
    depth: 2,
    breadth: 4,
    maxSources: 25,
    sources: ['pubmed', 'semantic_scholar', 'arxiv'],
    dateRange: { start: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000), end: new Date() },
    articleTypes: ['research_article', 'review', 'meta_analysis'],
    languages: ['en'],
  },
  deep: {
    depth: 4,
    breadth: 5,
    maxSources: 50,
    sources: ['pubmed', 'semantic_scholar', 'arxiv', 'crossref'],
    dateRange: { start: new Date(Date.now() - 15 * 365 * 24 * 60 * 60 * 1000), end: new Date() },
    articleTypes: ['research_article', 'review', 'meta_analysis', 'systematic_review', 'clinical_trial'],
    languages: ['en'],
  },
  exhaustive: {
    depth: 5,
    breadth: 6,
    maxSources: 100,
    sources: ['pubmed', 'semantic_scholar', 'arxiv', 'crossref', 'europe_pmc'],
    dateRange: { start: new Date(Date.now() - 20 * 365 * 24 * 60 * 60 * 1000), end: new Date() },
    articleTypes: ['research_article', 'review', 'meta_analysis', 'systematic_review', 'clinical_trial', 'case_report'],
    languages: ['en'],
  },
  systematic: {
    depth: 6,
    breadth: 8,
    maxSources: 200,
    sources: ['pubmed', 'semantic_scholar', 'arxiv', 'crossref', 'europe_pmc', 'core'],
    dateRange: { start: new Date(1990, 0, 1), end: new Date() },
    articleTypes: ['research_article', 'review', 'meta_analysis', 'systematic_review', 'clinical_trial', 'case_report', 'preprint'],
    languages: ['en'],
  },
};

// ============================================================================
// API Types
// ============================================================================

export interface CreateResearchRequest {
  topic: string;
  mode: ResearchMode;
  configOverrides?: Partial<ResearchConfig>;
}

export interface ResearchProgressUpdate {
  sessionId: string;
  status: ResearchStatus;
  progress: number;
  currentStep: string;
  agentStates: AgentState[];
}

export interface ResearchError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
}
