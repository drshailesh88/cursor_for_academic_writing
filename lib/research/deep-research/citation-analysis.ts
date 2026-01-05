/**
 * Citation Analysis
 *
 * Tools for analyzing citation networks, classifying citation contexts,
 * and building citation graphs for research synthesis.
 */

import type { SearchResult } from '../types';
import { getCitations, getReferences } from '../semantic-scholar';
import type {
  CitationRelation,
  CitationGraph,
  CitationContext,
  CitationNode,
} from './types';

// Re-export types for external use
export type { CitationGraph, CitationNode };

/**
 * Classify how a paper cites another paper
 */
export function classifyCitation(
  context: string,
  citedPaper: SearchResult
): {
  context: CitationContext;
  confidence: number;
} {
  const lowerContext = context.toLowerCase();
  const sentence = context.trim();

  // Supporting citation indicators
  const supportingIndicators = [
    'showed',
    'demonstrated',
    'found',
    'reported',
    'confirmed',
    'validated',
    'consistent with',
    'in agreement with',
    'supports',
    'corroborates',
  ];

  // Disputing citation indicators
  const disputingIndicators = [
    'however',
    'contrary to',
    'in contrast',
    'disputed',
    'challenged',
    'contradicts',
    'refuted',
    'disagreed',
    'conflicts with',
    'opposed',
  ];

  // Methodological citation indicators
  const methodologyIndicators = [
    'method',
    'technique',
    'approach',
    'protocol',
    'procedure',
    'following',
    'adapted from',
    'modified from',
    'as described',
  ];

  // Data citation indicators
  const dataIndicators = [
    'data from',
    'dataset',
    'obtained from',
    'using data',
    'data provided',
  ];

  // Count matches for each category
  const supportingCount = supportingIndicators.filter((ind) =>
    lowerContext.includes(ind)
  ).length;
  const disputingCount = disputingIndicators.filter((ind) =>
    lowerContext.includes(ind)
  ).length;
  const methodologyCount = methodologyIndicators.filter((ind) =>
    lowerContext.includes(ind)
  ).length;
  const dataCount = dataIndicators.filter((ind) => lowerContext.includes(ind)).length;

  // Determine classification
  let citationContext: CitationContext = 'mentioning';
  let confidence = 0.5;

  if (disputingCount > 0) {
    citationContext = 'disputing';
    confidence = 0.7 + Math.min(disputingCount * 0.1, 0.25);
  } else if (methodologyCount > 0) {
    citationContext = 'methodology';
    confidence = 0.7 + Math.min(methodologyCount * 0.1, 0.25);
  } else if (supportingCount > 0) {
    citationContext = 'supporting';
    confidence = 0.7 + Math.min(supportingCount * 0.1, 0.25);
  } else if (dataCount > 0) {
    citationContext = 'data';
    confidence = 0.6 + Math.min(dataCount * 0.1, 0.3);
  }

  return { context: citationContext, confidence };
}

/**
 * Build citation graph from a set of papers
 */
export async function buildCitationGraph(
  sources: SearchResult[],
  maxDepth: number = 1
): Promise<CitationGraph> {
  const nodes = new Map<string, SearchResult>();
  const edges: CitationRelation[] = [];
  const processedPapers = new Set<string>();

  // Add all sources as nodes
  for (const source of sources) {
    nodes.set(source.id, source);
  }

  // Build citation network
  for (const source of sources) {
    if (processedPapers.has(source.id)) continue;

    // Get papers that cite this paper
    const citing = await getCitationsForPaper(source.id);

    for (const citingPaper of citing) {
      // Add citing paper as node if not already present
      if (!nodes.has(citingPaper.id)) {
        nodes.set(citingPaper.id, citingPaper);
      }

      // Add citation edge
      edges.push({
        from: citingPaper.id,
        to: source.id,
        type: 'mentioning', // Default, would need full text to classify
        confidence: 0.5,
      });
    }

    // Get papers this paper cites
    const referenced = await getReferencesForPaper(source.id);

    for (const refPaper of referenced) {
      // Add referenced paper as node if not already present
      if (!nodes.has(refPaper.id)) {
        nodes.set(refPaper.id, refPaper);
      }

      // Add citation edge
      edges.push({
        from: source.id,
        to: refPaper.id,
        type: 'mentioning',
        confidence: 0.5,
      });
    }

    processedPapers.add(source.id);
  }

  // Find citation clusters using simple connected components
  const clusters = findCitationClusters(nodes, edges);

  // Convert Map<string, SearchResult> to CitationNode[]
  const citationNodes: Array<{
    id: string;
    title: string;
    authors: string[];
    year: number;
    citationCount: number;
    source: any;
  }> = [];

  for (const [id, result] of nodes) {
    citationNodes.push({
      id,
      title: result.title,
      authors: result.authors.map((a) => a.name),
      year: result.year,
      citationCount: result.citationCount || 0,
      source: result.source as any,
    });
  }

  // Convert clusters to proper format
  const formattedClusters = clusters.map((nodeIds, index) => ({
    id: `cluster-${index}`,
    label: `Cluster ${index + 1}`,
    nodeIds,
  }));

  return {
    nodes: citationNodes,
    edges,
    clusters: formattedClusters,
  };
}

/**
 * Find citation statements for a paper
 */
export async function findCitationStatements(
  paperId: string,
  citingPapers?: SearchResult[]
): Promise<
  Array<{
    citingPaperId: string;
    statement: string;
    context: CitationContext;
  }>
> {
  // This would require full-text access to extract citation sentences
  // For now, return empty array as a placeholder
  // In a real implementation, this would:
  // 1. Fetch full text of citing papers
  // 2. Extract sentences that cite the target paper
  // 3. Classify each citation context
  return [];
}

/**
 * Get citations for a paper (papers that cite this paper)
 */
async function getCitationsForPaper(
  paperId: string,
  limit: number = 20
): Promise<SearchResult[]> {
  try {
    return await getCitations(paperId, limit);
  } catch (error) {
    console.error(`Error fetching citations for ${paperId}:`, error);
    return [];
  }
}

/**
 * Get references for a paper (papers this paper cites)
 */
async function getReferencesForPaper(
  paperId: string,
  limit: number = 20
): Promise<SearchResult[]> {
  try {
    return await getReferences(paperId, limit);
  } catch (error) {
    console.error(`Error fetching references for ${paperId}:`, error);
    return [];
  }
}

/**
 * Find clusters of related papers in citation network
 */
function findCitationClusters(
  nodes: Map<string, SearchResult>,
  edges: CitationRelation[]
): string[][] {
  const clusters: string[][] = [];
  const visited = new Set<string>();

  // Build adjacency list
  const adjacency = new Map<string, Set<string>>();
  for (const [nodeId] of nodes) {
    adjacency.set(nodeId, new Set());
  }

  for (const edge of edges) {
    adjacency.get(edge.from)?.add(edge.to);
    adjacency.get(edge.to)?.add(edge.from);
  }

  // DFS to find connected components
  function dfs(nodeId: string, cluster: string[]): void {
    visited.add(nodeId);
    cluster.push(nodeId);

    const neighbors = adjacency.get(nodeId);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, cluster);
        }
      }
    }
  }

  // Find all clusters
  for (const [nodeId] of nodes) {
    if (!visited.has(nodeId)) {
      const cluster: string[] = [];
      dfs(nodeId, cluster);
      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    }
  }

  return clusters;
}

/**
 * Calculate citation impact metrics for papers
 */
export function calculateCitationMetrics(graph: CitationGraph): Map<
  string,
  {
    inDegree: number;
    outDegree: number;
    betweenness: number;
    isHub: boolean;
  }
> {
  const metrics = new Map();

  // Calculate in-degree and out-degree for each node
  for (const node of graph.nodes) {
    const inDegree = graph.edges.filter((e) => e.to === node.id).length;
    const outDegree = graph.edges.filter((e) => e.from === node.id).length;

    metrics.set(node.id, {
      inDegree,
      outDegree,
      betweenness: 0, // Would require full betweenness centrality calculation
      isHub: inDegree > 5, // Simple threshold for hub detection
    });
  }

  return metrics;
}

/**
 * Identify highly cited papers in the graph
 */
export function identifyKeyCitations(
  graph: CitationGraph,
  threshold: number = 5
): Array<{ id: string; title: string; citationCount: number }> {
  const citationCounts = new Map<string, number>();

  // Count citations for each paper
  for (const edge of graph.edges) {
    const count = citationCounts.get(edge.to) || 0;
    citationCounts.set(edge.to, count + 1);
  }

  // Find papers above threshold
  const keyCitations: Array<{ id: string; title: string; citationCount: number }> = [];
  for (const [paperId, count] of citationCounts) {
    if (count >= threshold) {
      const paper = graph.nodes.find((n) => n.id === paperId);
      if (paper) {
        keyCitations.push({
          id: paper.id,
          title: paper.title,
          citationCount: count,
        });
      }
    }
  }

  // Sort by citation count (descending)
  return keyCitations.sort((a, b) => b.citationCount - a.citationCount);
}

/**
 * Analyze citation context distribution for a set of papers
 */
export function analyzeCitationContexts(
  edges: CitationRelation[]
): Record<CitationContext, number> {
  const distribution: Record<CitationContext, number> = {
    supporting: 0,
    disputing: 0,
    mentioning: 0,
    methodology: 0,
    data: 0,
  };

  for (const edge of edges) {
    distribution[edge.type]++;
  }

  return distribution;
}
