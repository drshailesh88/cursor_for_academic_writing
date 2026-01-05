import { Timestamp } from 'firebase/firestore';

/**
 * Author information
 */
export interface Author {
  id?: string;
  name: string;
  affiliations?: string[];
}

/**
 * Core Paper Discovery Model
 */
export interface DiscoveredPaper {
  id: string;

  // Identity
  doi?: string;
  pmid?: string;
  arxivId?: string;
  semanticScholarId?: string;

  // Metadata
  title: string;
  authors: Author[];
  year: number;
  journal?: string;
  venue?: string;
  abstract?: string;

  // Metrics
  citationCount: number;
  influentialCitationCount?: number;
  referenceCount: number;

  // Discovery metadata
  sources: ('pubmed' | 'arxiv' | 'semanticscholar' | 'crossref' | 'europepmc' | 'core')[];
  openAccess: boolean;
  pdfUrl?: string;

  // Network metrics (computed)
  networkMetrics?: NetworkMetrics;

  // User state
  inLibrary: boolean;
  read: boolean;
  starred: boolean;
}

/**
 * Network metrics for a paper within a citation network
 */
export interface NetworkMetrics {
  centralityScore: number;    // 0-1
  bridgeScore: number;        // 0-1
  influenceScore: number;     // 0-1
  noveltyScore: number;       // 0-1
  momentumScore: number;      // Citation velocity
  clusterIds: string[];       // Which clusters it belongs to
  // Network-level metrics
  density?: number;           // Network density
  avgDegree?: number;         // Average node degree
  avgClustering?: number;     // Average clustering coefficient
  components?: number;        // Number of connected components
  diameter?: number;          // Network diameter
}

/**
 * Citation Network Configuration
 */
export interface NetworkConfig {
  algorithms: ('co_citation' | 'bibliographic_coupling' | 'semantic' | 'direct')[];
  depth: number;       // How many hops from seed
  maxPapers: number;   // Maximum papers to include
  minCitations: number;
  yearRange: { start: number; end: number };
  onlyOpenAccess: boolean;
}

/**
 * Network Layout Configuration
 */
export interface NetworkLayout {
  type: 'force' | 'radial' | 'hierarchical' | 'timeline';
  parameters: Record<string, number>;
}

/**
 * Paper positioned in a citation network
 */
export interface NetworkPaper {
  paperId: string;
  x: number;
  y: number;
  size: number;  // Based on citations
  color: string; // Based on year or cluster

  distanceFromSeed: number;
  connectionStrength: number;
}

/**
 * Edge between papers in a citation network
 */
export interface NetworkEdge {
  source: string;
  target: string;
  type: 'cites' | 'cited_by' | 'co_citation' | 'bibliographic_coupling' | 'semantic';
  weight: number;
}

/**
 * Cluster within a citation network
 */
export interface NetworkCluster {
  id: string;
  label: string;  // AI-generated
  keywords: string[];
  paperIds: string[];
  centerX: number;
  centerY: number;
  color: string;
}

/**
 * Citation Network
 */
export interface CitationNetwork {
  id: string;
  userId: string;
  name: string;

  seedPaperIds: string[];
  papers: NetworkPaper[];
  edges: NetworkEdge[];
  clusters: NetworkCluster[];

  config: NetworkConfig;
  layout: NetworkLayout;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Knowledge Map Configuration
 */
export interface MapConfig {
  clusterCount: number;  // Target number of clusters
  paperLimit: number;    // Max papers to display
  showLabels: boolean;
  showConnections: boolean;
  timeRange: { start: number; end: number };
}

/**
 * Cluster in a knowledge map
 */
export interface MapCluster {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  paperCount: number;
  avgCitations: number;
  growth: number;  // YoY growth rate

  x: number;
  y: number;
  radius: number;
  color: string;
}

/**
 * Paper positioned in a knowledge map
 */
export interface MapPaper {
  paperId: string;
  clusterId: string;
  x: number;
  y: number;
  isUserPaper: boolean;
  isKeyPaper: boolean;
}

/**
 * Connection between clusters in a knowledge map
 */
export interface ClusterConnection {
  sourceClusterId: string;
  targetClusterId: string;
  strength: number;
  type: 'citation_flow' | 'shared_keywords' | 'author_overlap';
}

/**
 * Knowledge Map
 */
export interface KnowledgeMap {
  id: string;
  userId: string;
  name: string;
  query: string;

  clusters: MapCluster[];
  papers: MapPaper[];
  connections: ClusterConnection[];

  config: MapConfig;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Timeline Configuration
 */
export interface TimelineConfig {
  startYear: number;
  endYear: number;
  groupBy: 'year' | 'quarter' | 'era';
  showMilestones: boolean;
  showTrends: boolean;
}

/**
 * Milestone in research timeline
 */
export interface Milestone {
  id: string;
  year: number;
  paperId?: string;
  label: string;
  description: string;
  type: 'breakthrough' | 'methodology' | 'dataset' | 'application';
}

/**
 * Time period in research timeline
 */
export interface TimePeriod {
  startYear: number;
  endYear: number;
  label: string;
  description: string;
  paperCount: number;
  keyTopics: string[];
}

/**
 * Paper positioned on a timeline
 */
export interface TimelinePaper {
  paperId: string;
  year: number;
  x: number;  // Position on timeline
  importance: number;  // Size/prominence
  isSeminal: boolean;
}

/**
 * Research trend
 */
export interface Trend {
  topic: string;
  direction: 'rising' | 'stable' | 'declining';
  growthRate: number;
  startYear: number;
  papers: string[];
}

/**
 * Research Timeline
 */
export interface ResearchTimeline {
  id: string;
  userId: string;
  topic: string;

  milestones: Milestone[];
  periods: TimePeriod[];
  papers: TimelinePaper[];
  trends: Trend[];

  config: TimelineConfig;

  createdAt: Timestamp;
}

/**
 * Edge in a connection path between papers
 */
export interface PathEdge {
  source: string;
  target: string;
  type: 'cites' | 'cited_by' | 'co_citation' | 'semantic' | 'same_author';
  weight: number;
  explanation: string;
}

/**
 * Connection path between two papers
 */
export interface ConnectionPath {
  id: string;
  papers: string[];  // Paper IDs in order
  edges: PathEdge[];
  totalWeight: number;
  type: 'citation' | 'semantic' | 'author' | 'method';
}

/**
 * Literature connection finding paths between papers
 */
export interface LiteratureConnection {
  id: string;
  userId: string;

  sourcePaperId: string;
  targetPaperId: string;

  paths: ConnectionPath[];
  shortestPath: ConnectionPath;

  createdAt: Timestamp;
}

/**
 * Individual recommendation
 */
export interface Recommendation {
  paperId: string;
  score: number;
  reason: string;
  type: 'hot' | 'missing' | 'new' | 'author' | 'extending' | 'trending';
  relatedPaperIds?: string[];  // Papers from library this relates to
}

/**
 * Recommendations for a user
 */
export interface Recommendations {
  userId: string;
  updatedAt: Timestamp;

  hotNow: Recommendation[];
  missingFromReview: Recommendation[];
  newThisWeek: Recommendation[];
  sameAuthors: Recommendation[];
  extendingWork: Recommendation[];
}

/**
 * Extracted topic from draft
 */
export interface ExtractedTopic {
  topic: string;
  mentions: number;
  citedPaperIds: string[];
  suggestedPaperIds: string[];
  coverage: number;  // 0-1
}

/**
 * Citation gap identified in draft
 */
export interface CitationGap {
  topic: string;
  missingPapers: DiscoveredPaper[];
  severity: 'low' | 'medium' | 'high';
  explanation: string;
}

/**
 * Suggestion for improving draft
 */
export interface DraftSuggestion {
  type: 'add_citation' | 'add_topic' | 'update_citation' | 'balance';
  paperId?: string;
  topic?: string;
  explanation: string;
  priority: number;
}

/**
 * Draft Analysis Results
 */
export interface DraftAnalysis {
  id: string;
  userId: string;
  documentId: string;

  topics: ExtractedTopic[];
  citationGaps: CitationGap[];
  coverageScore: number;

  suggestions: DraftSuggestion[];

  analyzedAt: Timestamp;
}

/**
 * Frontier metrics for emerging topics
 */
export interface FrontierMetrics {
  totalPapers: number;
  timeSpan: { start: number; end: number };
  avgGrowthRate: number;
  diversityScore: number;
  maturityScore: number;
}

/**
 * Research frontier representing an emerging topic domain
 */
export interface ResearchFrontier {
  domain: string;
  frontiers: EmergingTopic[];
  gaps: ResearchOpportunity[];
  opportunities: ResearchOpportunity[];
  metrics: FrontierMetrics;
  generatedAt: Timestamp;
}

/**
 * Learning event for recommendation system
 */
export interface LearningEvent {
  type: 'accepted_recommendation' | 'rejected_recommendation' | 'added_paper' | 'read_paper';
  paperId: string;
  topic?: string;
  timestamp: Timestamp;
}

/**
 * Alert settings for discovery notifications
 */
export interface AlertSettings {
  newPaperInTopic: boolean;
  paperCitesLibrary: boolean;
  authorPublishes: boolean;
  trendingInField: boolean;

  frequency: 'instant' | 'daily' | 'weekly';
  email: boolean;
  inApp: boolean;
}

/**
 * User preferences for discovery features
 */
export interface DiscoveryPreferences {
  userId: string;

  trackedTopics: string[];
  trackedAuthors: string[];
  trackedJournals: string[];

  preferredSources: string[];
  excludedSources: string[];

  alertSettings: AlertSettings;

  learningHistory: LearningEvent[];
}

/**
 * Reference manager sync configuration
 */
export interface RefManagerSync {
  userId: string;
  provider: 'zotero' | 'mendeley' | 'endnote' | 'papers';

  connected: boolean;
  lastSync: Timestamp;
  syncedPaperCount: number;

  settings: {
    autoSync: boolean;
    syncInterval: number;  // minutes
    twoWaySync: boolean;
    defaultCollection: string;
  };
}

// ============================================================================
// Additional Discovery Types
// ============================================================================

/**
 * Common ground between multiple papers
 */
export interface CommonGround {
  sharedCitations: DiscoveredPaper[];
  sharedTopics: string[];
  sharedAuthors: string[];
  timeOverlap: { start: number; end: number } | null;
}

/**
 * Relationship between two papers
 */
export interface PaperRelationship {
  paper1Id: string;
  paper2Id: string;
  relationshipType: 'cites' | 'cited-by' | 'co-cited' | 'coupled' | 'similar';
  strength: number;
  description: string;
}

/**
 * Multi-paper connection analysis
 */
export interface MultiPaperConnection {
  papers: DiscoveredPaper[];
  commonGround: CommonGround;
  relationships: PaperRelationship[];
  synthesisOpportunities: string[];
}

/**
 * Emerging research topic
 */
export interface EmergingTopic {
  id: string;
  label: string;
  description: string;
  papers: DiscoveredPaper[];
  growthRate: number;
  citationGrowth: number;
  recency: number;
  momentum: 'emerging' | 'accelerating' | 'plateau' | 'declining';
  keyAuthors: string[];
  relatedEstablished: string[];
}

/**
 * Research opportunity
 */
export interface ResearchOpportunity {
  id: string;
  type: 'gap' | 'intersection' | 'application' | 'methodology';
  description: string;
  relatedTopics: string[];
  potentialImpact: 'low' | 'medium' | 'high' | 'transformative';
  difficulty: 'accessible' | 'moderate' | 'challenging';
  resources: string[];
}

/**
 * Growth metrics for a topic over time
 */
export interface GrowthMetrics {
  topic: string;
  yearlyPublications: { year: number; count: number }[];
  yearlyCitations: { year: number; count: number }[];
  compoundGrowthRate: number;
  accelerationPhase: 'early' | 'growth' | 'mature' | 'decline';
  projectedGrowth: number;
}

/**
 * Basis for recommendation
 */
export interface RecommendationBasis {
  type: 'user-papers' | 'draft-content' | 'search-history' | 'citations';
  weight: number;
  description: string;
}

// ============================================================================
// Edge Case Handling Types
// ============================================================================

/**
 * Pagination information for large datasets
 */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Progressive loading state for network
 */
export interface NetworkLoadingProgress {
  phase: 'initializing' | 'fetching_seeds' | 'building_edges' | 'clustering' | 'positioning' | 'complete';
  progress: number; // 0-100
  message: string;
  itemsProcessed?: number;
  totalItems?: number;
}

/**
 * Network quality metrics for sparse network detection
 */
export interface NetworkQuality {
  nodeCount: number;
  edgeCount: number;
  density: number;
  avgDegree: number;
  largestComponentSize: number;
  isSparse: boolean;
  isEmpty: boolean;
  suggestions: string[];
}

/**
 * Suggestions for improving sparse networks
 */
export interface NetworkImprovement {
  type: 'add_seed_papers' | 'expand_criteria' | 'try_different_algorithms' | 'use_semantic_search';
  title: string;
  description: string;
  actionable: boolean;
  suggestedPaperIds?: string[];
}

/**
 * Disconnection explanation when papers can't be connected
 */
export interface DisconnectionReason {
  type: 'no_citation_path' | 'different_fields' | 'temporal_gap' | 'sparse_data' | 'disconnected_components';
  explanation: string;
  suggestions: string[];
  intermediateTopics?: string[];
  bridgePapers?: DiscoveredPaper[];
}

/**
 * Empty result explanation
 */
export interface EmptyResultInfo {
  reason: 'no_papers_found' | 'no_connections' | 'insufficient_data' | 'filters_too_strict';
  explanation: string;
  suggestions: string[];
  relaxedCriteria?: string[];
}

/**
 * Paginated network result for large networks
 */
export interface PaginatedNetwork {
  network: CitationNetwork;
  pagination: PaginationInfo;
  quality: NetworkQuality;
  improvements?: NetworkImprovement[];
}

/**
 * Enhanced connection result with disconnection info
 */
export interface EnhancedLiteratureConnection extends LiteratureConnection {
  disconnectionReason?: DisconnectionReason;
  quality: {
    pathCount: number;
    avgPathLength: number;
    strongestConnection: number;
  };
}

/**
 * Enhanced recommendations with empty handling
 */
export interface EnhancedRecommendations extends Recommendations {
  isEmpty: boolean;
  emptyReason?: EmptyResultInfo;
  suggestedActions?: string[];
}
