/**
 * Discovery Module
 *
 * Connected Papers-style literature discovery and analysis
 *
 * @module discovery
 */

// Export all types
export * from './types';

// Network analysis
export {
  buildNetwork,
  getCoCitations,
  getBibliographicCoupling,
  getSemanticallySimilar,
  calculateNetworkMetrics,
  clusterNetwork,
} from './network';

// Knowledge mapping
export {
  generateMap,
  clusterPapers,
  labelClusters,
  detectGaps,
  findConnections,
  findMissingFromReview,
} from './knowledge-map';

// Timeline analysis
export {
  generateTimeline,
  identifyMilestones,
  detectTrends,
  groupByEra,
} from './timeline';

// Literature connections
export {
  findPaths,
  findShortestPath,
  explainConnection,
  findMultiPaperConnections,
} from './connector';

// Recommendations
export {
  generateRecommendations,
  findMissingFromReview as findMissingCitations,
  getTrending,
  learnFromFeedback,
} from './recommendations';

// Research frontiers
export {
  detectFrontiers,
  calculateGrowthMetrics,
  findResearchGaps,
} from './frontiers';
