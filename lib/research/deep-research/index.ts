/**
 * Deep Research Engine
 *
 * Multi-agent deep research system with:
 * - Multi-perspective exploration
 * - Parallel database searches
 * - Citation network analysis
 * - Consensus visualization
 * - Quality-driven synthesis
 *
 * @example
 * ```ts
 * import { startResearch, generatePerspectives, executeResearch } from '@/lib/research/deep-research';
 *
 * // Start a research session
 * const session = await startResearch('AI in medical diagnosis', 'comprehensive');
 *
 * // Generate perspectives
 * const perspectives = await generatePerspectives(session.topic, session.config);
 *
 * // Build exploration tree
 * const tree = buildExplorationTree(session.topic, perspectives);
 *
 * // Execute research
 * const sources = await executeResearch(tree, session.config);
 * ```
 */

// Core orchestration
export {
  startResearch,
  generatePerspectives,
  buildExplorationTree,
  executeResearch,
  deduplicateSources,
  type ResearchMode,
  type ResearchProgress,
} from './engine';

// Agent system
export {
  OrchestratorAgent,
  ClarifierAgent,
  PerspectiveAnalystAgent,
  SearchStrategistAgent,
  ResearcherAgent,
  CitationAnalystAgent,
  SynthesizerAgent,
  QualityReviewerAgent,
  WriterAgent,
  generatePerspectivesWithAgent,
  reviewSynthesisQuality,
} from './agents';

// Citation analysis
export {
  classifyCitation,
  buildCitationGraph,
  findCitationStatements,
  calculateCitationMetrics,
  identifyKeyCitations,
  analyzeCitationContexts,
} from './citation-analysis';

// Consensus analysis
export {
  calculateConsensus,
  assessConfidence,
  gradeEvidence,
  visualizeConsensus,
  generateConsensusSummary,
} from './consensus';

// Synthesis and reporting
export {
  synthesizeFindings,
  synthesizeFindings as generateSynthesis, // Alias for backwards compatibility
  generateReport,
  qualityReview,
} from './synthesis';

// Utilities
export {
  deduplicateAcrossSources,
  scoreRelevance,
  rankSources,
  filterByQuality,
  groupByYear,
  calculateStats,
} from './utils';

// Type exports
export type {
  Perspective,
  ExplorationTree,
  ResearchNode,
  ResearchConfig,
  ResearchSession,
  CitationRelation,
  CitationGraph,
  CitationContext,
  ConsensusResult,
  EvidenceGrade,
  ResearchSynthesis,
  Finding,
  Contradiction,
  ReportFormat,
  QualityReview,
  QualityIssue,
  AgentMessage,
  AgentResponse,
} from './types';
