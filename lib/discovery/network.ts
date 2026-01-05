/**
 * Citation Network Engine
 *
 * Build and analyze citation networks using multiple algorithms:
 * - Direct citations
 * - Co-citations
 * - Bibliographic coupling
 * - Semantic similarity
 */

import type { SearchResult } from '@/lib/research/types';
import type {
  CitationNetwork,
  NetworkConfig,
  NetworkPaper,
  NetworkEdge,
  NetworkCluster,
  NetworkMetrics,
  PaginatedNetwork,
  PaginationInfo,
  NetworkQuality,
  NetworkImprovement,
  NetworkLoadingProgress,
} from './types';
import { getCitations, getReferences } from '@/lib/research/semantic-scholar';
import { getSemanticScholarById } from '@/lib/research/semantic-scholar';

// Progress callback type for progressive loading
export type ProgressCallback = (progress: NetworkLoadingProgress) => void;

/**
 * Build citation network from seed papers
 */
export async function buildNetwork(
  seedPaperIds: string[],
  config: Partial<NetworkConfig> = {}
): Promise<CitationNetwork> {
  const fullConfig: NetworkConfig = {
    algorithms: config.algorithms || ['co_citation', 'bibliographic_coupling', 'direct'],
    depth: config.depth ?? 2,
    maxPapers: config.maxPapers ?? 50,
    minCitations: config.minCitations ?? 5,
    yearRange: config.yearRange || { start: 1900, end: new Date().getFullYear() },
    onlyOpenAccess: config.onlyOpenAccess ?? false,
  };

  const papersMap = new Map<string, SearchResult>();
  const edges: NetworkEdge[] = [];

  // Fetch seed papers
  for (const paperId of seedPaperIds) {
    const paper = await getSemanticScholarById(paperId);
    if (paper) {
      papersMap.set(paperId, paper);
    }
  }

  // Build network using selected algorithms
  for (const paperId of seedPaperIds) {
    if (fullConfig.algorithms.includes('direct')) {
      await addDirectCitations(paperId, papersMap, edges, fullConfig);
    }
    if (fullConfig.algorithms.includes('co_citation')) {
      await addCoCitations(paperId, papersMap, edges, fullConfig);
    }
    if (fullConfig.algorithms.includes('bibliographic_coupling')) {
      await addBibliographicCoupling(paperId, papersMap, edges, fullConfig);
    }
  }

  // Filter by config constraints
  const filteredPapers = Array.from(papersMap.values()).filter((p) => {
    if ((p.citationCount || 0) < fullConfig.minCitations) return false;
    if (p.year < fullConfig.yearRange.start || p.year > fullConfig.yearRange.end) return false;
    if (fullConfig.onlyOpenAccess && !p.openAccess) return false;
    return true;
  });

  // Limit to maxPapers
  const topPapers = filteredPapers
    .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
    .slice(0, fullConfig.maxPapers);

  const paperIds = new Set(topPapers.map((p) => p.id));
  const filteredEdges = edges.filter((e) => paperIds.has(e.source) && paperIds.has(e.target));

  // Calculate network metrics
  const metrics = calculateNetworkMetrics({ papers: topPapers, edges: filteredEdges });

  // Cluster the network
  const clusters = clusterNetwork({ papers: topPapers, edges: filteredEdges });

  // Position papers
  const networkPapers = positionPapers(topPapers, filteredEdges, seedPaperIds);

  return {
    id: `network-${Date.now()}`,
    userId: '', // Set by caller
    name: `Network from ${seedPaperIds.length} papers`,
    seedPaperIds,
    papers: networkPapers,
    edges: filteredEdges,
    clusters,
    config: fullConfig,
    layout: { type: 'force', parameters: { strength: 0.5 } },
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  };
}

/**
 * Find papers co-cited with the given paper
 */
export async function getCoCitations(paperId: string, limit = 20): Promise<SearchResult[]> {
  // Get papers that cite this paper
  const citingPapers = await getCitations(paperId, 50);

  // Count co-citations
  const coCitationCounts = new Map<string, number>();

  for (const citing of citingPapers.slice(0, 10)) {
    // Limit to prevent API overload
    const refs = await getReferences(citing.id, 100);
    for (const ref of refs) {
      if (ref.id !== paperId) {
        coCitationCounts.set(ref.id, (coCitationCounts.get(ref.id) || 0) + 1);
      }
    }
  }

  // Sort by co-citation count
  const sorted = Array.from(coCitationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  // Fetch full paper details
  const results: SearchResult[] = [];
  for (const [coId] of sorted) {
    const paper = await getSemanticScholarById(coId);
    if (paper) results.push(paper);
  }

  return results;
}

/**
 * Find papers with shared references (bibliographic coupling)
 */
export async function getBibliographicCoupling(
  paperId: string,
  limit = 20
): Promise<SearchResult[]> {
  // Get references of this paper
  const refs = await getReferences(paperId, 100);
  const refIds = new Set(refs.map((r) => r.id));

  // Find papers that cite the same references
  const couplingCounts = new Map<string, number>();

  for (const ref of refs.slice(0, 10)) {
    // Limit to prevent API overload
    const citing = await getCitations(ref.id, 50);
    for (const paper of citing) {
      if (paper.id !== paperId) {
        couplingCounts.set(paper.id, (couplingCounts.get(paper.id) || 0) + 1);
      }
    }
  }

  // Sort by coupling strength
  const sorted = Array.from(couplingCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  // Fetch full paper details
  const results: SearchResult[] = [];
  for (const [coupledId] of sorted) {
    const paper = await getSemanticScholarById(coupledId);
    if (paper) results.push(paper);
  }

  return results;
}

/**
 * Find semantically similar papers
 * Uses Semantic Scholar's recommendations API
 */
export async function getSemanticallySimilar(
  paperId: string,
  limit = 20
): Promise<SearchResult[]> {
  const { getRelatedPapers } = await import('@/lib/research/semantic-scholar');
  return getRelatedPapers(paperId, limit);
}

/**
 * Calculate network metrics
 */
export function calculateNetworkMetrics(network: {
  papers: SearchResult[];
  edges: NetworkEdge[];
}): NetworkMetrics {
  const n = network.papers.length;
  const m = network.edges.length;

  // Build adjacency list
  const adj = new Map<string, Set<string>>();
  for (const paper of network.papers) {
    adj.set(paper.id, new Set());
  }
  for (const edge of network.edges) {
    adj.get(edge.source)?.add(edge.target);
    adj.get(edge.target)?.add(edge.source);
  }

  // Calculate metrics
  const maxEdges = (n * (n - 1)) / 2;
  const density = maxEdges > 0 ? m / maxEdges : 0;

  const degrees = Array.from(adj.values()).map((neighbors) => neighbors.size);
  const avgDegree = degrees.length > 0 ? degrees.reduce((a, b) => a + b, 0) / degrees.length : 0;

  // Clustering coefficient
  let totalClustering = 0;
  for (const [node, neighbors] of Array.from(adj.entries())) {
    if (neighbors.size < 2) continue;
    let triangles = 0;
    const neighborArray = Array.from(neighbors);
    for (let i = 0; i < neighborArray.length; i++) {
      for (let j = i + 1; j < neighborArray.length; j++) {
        if (adj.get(neighborArray[i])?.has(neighborArray[j])) {
          triangles++;
        }
      }
    }
    const possibleTriangles = (neighbors.size * (neighbors.size - 1)) / 2;
    totalClustering += possibleTriangles > 0 ? triangles / possibleTriangles : 0;
  }
  const avgClustering = n > 0 ? totalClustering / n : 0;

  // Connected components (simplified BFS)
  const visited = new Set<string>();
  let components = 0;

  for (const paper of network.papers) {
    if (!visited.has(paper.id)) {
      components++;
      const queue = [paper.id];
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        const neighbors = adj.get(current) || new Set();
        queue.push(...Array.from(neighbors).filter((n) => !visited.has(n)));
      }
    }
  }

  return {
    density,
    avgDegree,
    avgClustering,
    components,
  };
}

/**
 * Cluster network using community detection
 */
export function clusterNetwork(network: {
  papers: SearchResult[];
  edges: NetworkEdge[];
}): NetworkCluster[] {
  // Simple clustering by year ranges for now
  // TODO: Implement proper community detection (Louvain, etc.)
  const yearClusters = new Map<string, SearchResult[]>();

  for (const paper of network.papers) {
    const decade = Math.floor(paper.year / 10) * 10;
    const key = `${decade}s`;
    if (!yearClusters.has(key)) {
      yearClusters.set(key, []);
    }
    yearClusters.get(key)!.push(paper);
  }

  const clusters: NetworkCluster[] = [];
  let clusterId = 0;

  for (const [label, papers] of Array.from(yearClusters.entries())) {
    // Extract keywords from titles
    const keywords = extractKeywords(papers.map((p) => p.title).join(' '));

    clusters.push({
      id: `cluster-${clusterId++}`,
      label,
      keywords: keywords.slice(0, 5),
      paperIds: papers.map((p) => p.id),
      centerX: 0, // Set by layout algorithm
      centerY: 0,
      color: `hsl(${(clusterId * 137) % 360}, 70%, 50%)`,
    });
  }

  return clusters;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function addDirectCitations(
  paperId: string,
  papersMap: Map<string, SearchResult>,
  edges: NetworkEdge[],
  config: NetworkConfig
): Promise<void> {
  const citations = await getCitations(paperId, 20);
  const references = await getReferences(paperId, 20);

  for (const cited of citations) {
    papersMap.set(cited.id, cited);
    edges.push({
      source: cited.id,
      target: paperId,
      type: 'cites',
      weight: 1,
    });
  }

  for (const ref of references) {
    papersMap.set(ref.id, ref);
    edges.push({
      source: paperId,
      target: ref.id,
      type: 'cites',
      weight: 1,
    });
  }
}

async function addCoCitations(
  paperId: string,
  papersMap: Map<string, SearchResult>,
  edges: NetworkEdge[],
  config: NetworkConfig
): Promise<void> {
  const coCited = await getCoCitations(paperId, 10);

  for (const paper of coCited) {
    papersMap.set(paper.id, paper);
    edges.push({
      source: paperId,
      target: paper.id,
      type: 'co_citation',
      weight: 0.5,
    });
  }
}

async function addBibliographicCoupling(
  paperId: string,
  papersMap: Map<string, SearchResult>,
  edges: NetworkEdge[],
  config: NetworkConfig
): Promise<void> {
  const coupled = await getBibliographicCoupling(paperId, 10);

  for (const paper of coupled) {
    papersMap.set(paper.id, paper);
    edges.push({
      source: paperId,
      target: paper.id,
      type: 'bibliographic_coupling',
      weight: 0.5,
    });
  }
}

function positionPapers(
  papers: SearchResult[],
  edges: NetworkEdge[],
  seedIds: string[]
): NetworkPaper[] {
  // Simple force-directed layout simulation
  const positions = new Map<string, { x: number; y: number }>();

  // Initialize positions
  papers.forEach((paper, i) => {
    const angle = (i / papers.length) * 2 * Math.PI;
    positions.set(paper.id, {
      x: Math.cos(angle) * 100,
      y: Math.sin(angle) * 100,
    });
  });

  // Simple force simulation (5 iterations)
  for (let iter = 0; iter < 5; iter++) {
    const forces = new Map(
      Array.from(positions.keys()).map((id) => [id, { x: 0, y: 0 }])
    );

    // Repulsion between all nodes
    papers.forEach((p1) => {
      papers.forEach((p2) => {
        if (p1.id === p2.id) return;
        const pos1 = positions.get(p1.id)!;
        const pos2 = positions.get(p2.id)!;
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 100 / (dist * dist);
        forces.get(p1.id)!.x += (dx / dist) * force;
        forces.get(p1.id)!.y += (dy / dist) * force;
      });
    });

    // Attraction along edges
    edges.forEach((edge) => {
      const pos1 = positions.get(edge.source);
      const pos2 = positions.get(edge.target);
      if (!pos1 || !pos2) return;
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * 0.01;
      forces.get(edge.source)!.x += (dx / dist) * force;
      forces.get(edge.source)!.y += (dy / dist) * force;
      forces.get(edge.target)!.x -= (dx / dist) * force;
      forces.get(edge.target)!.y -= (dy / dist) * force;
    });

    // Apply forces
    positions.forEach((pos, id) => {
      const force = forces.get(id)!;
      pos.x += force.x * 0.1;
      pos.y += force.y * 0.1;
    });
  }

  // Build adjacency for distance calculation
  const adj = new Map<string, Set<string>>();
  papers.forEach((p) => adj.set(p.id, new Set()));
  edges.forEach((e) => {
    adj.get(e.source)?.add(e.target);
    adj.get(e.target)?.add(e.source);
  });

  return papers.map((paper) => {
    const pos = positions.get(paper.id)!;
    const distanceFromSeed = calculateDistance(paper.id, seedIds, adj);
    const connectionStrength = (adj.get(paper.id)?.size || 0) / papers.length;

    return {
      paperId: paper.id,
      x: pos.x,
      y: pos.y,
      size: Math.log((paper.citationCount || 1) + 1) * 5,
      color: seedIds.includes(paper.id)
        ? '#8b5cf6'
        : `hsl(${((paper.year - 1900) / 125) * 240}, 70%, 50%)`,
      distanceFromSeed,
      connectionStrength,
    };
  });
}

function calculateDistance(
  nodeId: string,
  seedIds: string[],
  adj: Map<string, Set<string>>
): number {
  const visited = new Set<string>();
  const queue: [string, number][] = seedIds.map((id) => [id, 0]);
  let minDist = Infinity;

  while (queue.length > 0) {
    const [current, dist] = queue.shift()!;
    if (current === nodeId) {
      minDist = Math.min(minDist, dist);
      continue;
    }
    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = adj.get(current) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push([neighbor, dist + 1]);
      }
    }
  }

  return minDist === Infinity ? -1 : minDist;
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 4);

  const counts = new Map<string, number>();
  words.forEach((w) => counts.set(w, (counts.get(w) || 0) + 1));

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0]);
}

// ============================================================================
// Edge Case Handling: Large Networks
// ============================================================================

/**
 * Build paginated network for large datasets
 * Limits nodes and provides pagination for exploring full network
 */
export async function buildPaginatedNetwork(
  seedPaperIds: string[],
  config: Partial<NetworkConfig> = {},
  page = 1,
  pageSize = 100,
  onProgress?: ProgressCallback
): Promise<PaginatedNetwork> {
  // Report progress
  const reportProgress = (phase: NetworkLoadingProgress['phase'], progress: number, message: string) => {
    if (onProgress) {
      onProgress({ phase, progress, message });
    }
  };

  reportProgress('initializing', 0, 'Starting network build...');

  // Build full network first (with higher limit)
  const fullConfig: NetworkConfig = {
    ...config,
    algorithms: config.algorithms || ['co_citation', 'bibliographic_coupling', 'direct'],
    depth: config.depth ?? 2,
    maxPapers: 500, // Fetch more initially
    minCitations: config.minCitations ?? 5,
    yearRange: config.yearRange || { start: 1900, end: new Date().getFullYear() },
    onlyOpenAccess: config.onlyOpenAccess ?? false,
  };

  reportProgress('fetching_seeds', 10, 'Fetching seed papers...');

  const papersMap = new Map<string, SearchResult>();
  const edges: NetworkEdge[] = [];

  // Fetch seed papers
  for (const paperId of seedPaperIds) {
    const paper = await getSemanticScholarById(paperId);
    if (paper) {
      papersMap.set(paperId, paper);
    }
  }

  reportProgress('building_edges', 30, 'Building citation edges...');

  // Build network using selected algorithms
  for (let i = 0; i < seedPaperIds.length; i++) {
    const paperId = seedPaperIds[i];

    if (fullConfig.algorithms.includes('direct')) {
      await addDirectCitations(paperId, papersMap, edges, fullConfig);
    }
    if (fullConfig.algorithms.includes('co_citation')) {
      await addCoCitations(paperId, papersMap, edges, fullConfig);
    }
    if (fullConfig.algorithms.includes('bibliographic_coupling')) {
      await addBibliographicCoupling(paperId, papersMap, edges, fullConfig);
    }

    const progress = 30 + ((i + 1) / seedPaperIds.length) * 30;
    reportProgress('building_edges', progress, `Processed ${i + 1} of ${seedPaperIds.length} seed papers`);
  }

  // Filter by config constraints
  const filteredPapers = Array.from(papersMap.values()).filter((p) => {
    if ((p.citationCount || 0) < fullConfig.minCitations) return false;
    if (p.year < fullConfig.yearRange.start || p.year > fullConfig.yearRange.end) return false;
    if (fullConfig.onlyOpenAccess && !p.openAccess) return false;
    return true;
  });

  // Sort by citation count for pagination
  const sortedPapers = filteredPapers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));

  // Calculate pagination
  const totalItems = sortedPapers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  const pagePapers = sortedPapers.slice(startIdx, endIdx);

  reportProgress('clustering', 70, 'Analyzing network structure...');

  const paperIds = new Set(pagePapers.map((p) => p.id));
  const filteredEdges = edges.filter((e) => paperIds.has(e.source) && paperIds.has(e.target));

  // Calculate network metrics
  const metrics = calculateNetworkMetrics({ papers: pagePapers, edges: filteredEdges });

  // Assess network quality
  const quality = assessNetworkQuality(pagePapers, filteredEdges);

  // Cluster the network
  const clusters = clusterNetwork({ papers: pagePapers, edges: filteredEdges });

  reportProgress('positioning', 85, 'Positioning papers...');

  // Position papers
  const networkPapers = positionPapers(pagePapers, filteredEdges, seedPaperIds);

  reportProgress('complete', 100, 'Network build complete');

  const network: CitationNetwork = {
    id: `network-${Date.now()}`,
    userId: '',
    name: `Network from ${seedPaperIds.length} papers (Page ${page})`,
    seedPaperIds,
    papers: networkPapers,
    edges: filteredEdges,
    clusters,
    config: fullConfig,
    layout: { type: 'force', parameters: { strength: 0.5 } },
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  };

  const pagination: PaginationInfo = {
    currentPage: page,
    totalPages,
    pageSize,
    totalItems,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  // Generate improvement suggestions if network is sparse
  const improvements = quality.isSparse || quality.isEmpty ? generateImprovementSuggestions(quality, seedPaperIds) : undefined;

  return {
    network,
    pagination,
    quality,
    improvements,
  };
}

/**
 * Assess network quality and detect sparse networks
 */
export function assessNetworkQuality(
  papers: SearchResult[],
  edges: NetworkEdge[]
): NetworkQuality {
  const nodeCount = papers.length;
  const edgeCount = edges.length;

  if (nodeCount === 0) {
    return {
      nodeCount: 0,
      edgeCount: 0,
      density: 0,
      avgDegree: 0,
      largestComponentSize: 0,
      isSparse: false,
      isEmpty: true,
      suggestions: [
        'No papers found. Try different seed papers or relax your filters.',
        'Check that the papers have citation data available.',
      ],
    };
  }

  // Calculate basic metrics
  const maxEdges = (nodeCount * (nodeCount - 1)) / 2;
  const density = maxEdges > 0 ? edgeCount / maxEdges : 0;

  // Build adjacency list
  const adj = new Map<string, Set<string>>();
  papers.forEach((p) => adj.set(p.id, new Set()));
  edges.forEach((e) => {
    adj.get(e.source)?.add(e.target);
    adj.get(e.target)?.add(e.source);
  });

  // Calculate average degree
  const degrees = Array.from(adj.values()).map((neighbors) => neighbors.size);
  const avgDegree = degrees.length > 0 ? degrees.reduce((a, b) => a + b, 0) / degrees.length : 0;

  // Find largest connected component
  const visited = new Set<string>();
  let largestComponentSize = 0;

  for (const paper of papers) {
    if (!visited.has(paper.id)) {
      const componentSize = exploreComponent(paper.id, adj, visited);
      largestComponentSize = Math.max(largestComponentSize, componentSize);
    }
  }

  // Determine if network is sparse
  const isSparse = density < 0.05 || avgDegree < 2 || largestComponentSize < nodeCount * 0.5;

  const suggestions: string[] = [];

  if (isSparse) {
    if (avgDegree < 2) {
      suggestions.push('Network has very few connections. Consider adding more seed papers.');
    }
    if (largestComponentSize < nodeCount * 0.5) {
      suggestions.push('Network is fragmented. Try including papers from related subfields.');
    }
    if (density < 0.02) {
      suggestions.push('Very low connectivity. Try expanding search criteria or using semantic similarity.');
    }
  }

  return {
    nodeCount,
    edgeCount,
    density,
    avgDegree,
    largestComponentSize,
    isSparse,
    isEmpty: false,
    suggestions,
  };
}

/**
 * Generate improvement suggestions for sparse or problematic networks
 */
export function generateImprovementSuggestions(
  quality: NetworkQuality,
  seedPaperIds: string[]
): NetworkImprovement[] {
  const improvements: NetworkImprovement[] = [];

  if (quality.isEmpty) {
    improvements.push({
      type: 'add_seed_papers',
      title: 'Add Seed Papers',
      description: 'No papers found. Start by adding well-cited papers in your field.',
      actionable: true,
    });
    return improvements;
  }

  if (quality.nodeCount < 10) {
    improvements.push({
      type: 'add_seed_papers',
      title: 'Add More Seed Papers',
      description: `Only ${quality.nodeCount} papers found. Adding more seed papers will expand the network.`,
      actionable: true,
    });
  }

  if (quality.avgDegree < 2) {
    improvements.push({
      type: 'expand_criteria',
      title: 'Expand Search Criteria',
      description: 'Low connectivity detected. Try reducing minimum citation requirements or expanding year range.',
      actionable: true,
    });
  }

  if (quality.density < 0.02) {
    improvements.push({
      type: 'try_different_algorithms',
      title: 'Use Additional Algorithms',
      description: 'Try enabling semantic similarity to find related papers without direct citations.',
      actionable: true,
    });

    improvements.push({
      type: 'use_semantic_search',
      title: 'Use Semantic Search',
      description: 'Enable semantic search to find conceptually similar papers.',
      actionable: true,
    });
  }

  if (quality.largestComponentSize < quality.nodeCount * 0.5) {
    improvements.push({
      type: 'add_seed_papers',
      title: 'Bridge Disconnected Clusters',
      description: 'Network is fragmented. Add papers that connect different research areas.',
      actionable: true,
    });
  }

  return improvements;
}

/**
 * Explore connected component size using BFS
 */
function exploreComponent(
  startId: string,
  adj: Map<string, Set<string>>,
  visited: Set<string>
): number {
  const queue = [startId];
  let size = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;

    visited.add(current);
    size++;

    const neighbors = adj.get(current) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return size;
}

/**
 * Get key papers from network (most central/cited)
 * Useful for showing subset of large network
 */
export function getKeyPapers(
  network: CitationNetwork,
  limit = 20
): NetworkPaper[] {
  // Sort papers by combination of citation count and centrality
  const papersWithScore = network.papers.map((paper) => {
    const centrality = 1 - (paper.distanceFromSeed / 10); // Closer to seed = higher score
    const citationScore = paper.size / 100; // Size is based on log(citations)
    const connectionScore = paper.connectionStrength;

    const totalScore = centrality * 0.4 + citationScore * 0.4 + connectionScore * 0.2;

    return { paper, score: totalScore };
  });

  papersWithScore.sort((a, b) => b.score - a.score);

  return papersWithScore.slice(0, limit).map((item) => item.paper);
}
