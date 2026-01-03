// Citation Graph Types
// Extended types for graph visualization

import type { SearchPaper } from '../sources/types';
import type { DatabaseSource } from '../types';

/**
 * Graph node representing a paper
 */
export interface GraphNode {
  id: string;
  paper: SearchPaper;
  depth: number;
  isExpanded: boolean;
  isPinned: boolean;
  isSeed: boolean;

  // Force graph properties
  x?: number;
  y?: number;
  fx?: number | null; // Fixed X (for pinning)
  fy?: number | null; // Fixed Y

  // Visual properties
  size: number;
  color: string;
  label: string;
}

/**
 * Graph edge representing citation relationship
 */
export interface GraphEdge {
  source: string;
  target: string;
  type: 'cites' | 'cited_by';
  weight: number;
}

/**
 * Cluster of related papers
 */
export interface GraphCluster {
  id: string;
  label: string;
  nodeIds: string[];
  color: string;
  centroid?: { x: number; y: number };
}

/**
 * Complete graph data structure
 */
export interface CitationGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
  seed: GraphNode;
  stats: GraphStats;
}

/**
 * Graph statistics
 */
export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  maxDepth: number;
  yearRange: [number, number];
  avgCitations: number;
  providers: DatabaseSource[];
}

/**
 * Options for building the graph
 */
export interface GraphBuildOptions {
  maxDepth: number;
  maxNodes: number;
  citingLimit: number;
  referencedLimit: number;
  providers: DatabaseSource[];
}

/**
 * Default build options
 */
export const DEFAULT_BUILD_OPTIONS: GraphBuildOptions = {
  maxDepth: 2,
  maxNodes: 100,
  citingLimit: 10,
  referencedLimit: 10,
  providers: ['semantic_scholar', 'pubmed', 'crossref'],
};

/**
 * Layout algorithms
 */
export type LayoutAlgorithm = 'force' | 'radial' | 'temporal';

/**
 * Color schemes for nodes
 */
export type ColorScheme = 'year' | 'citations' | 'depth' | 'cluster';

/**
 * Color palette for visualization
 */
export const GRAPH_COLORS = {
  seed: '#f59e0b',        // Amber for seed paper
  depth0: '#6366f1',      // Indigo
  depth1: '#8b5cf6',      // Violet
  depth2: '#a855f7',      // Purple
  depth3: '#d946ef',      // Fuchsia
  edge: '#94a3b8',        // Slate
  edgeHover: '#6366f1',   // Indigo
  cluster: [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6',
  ],
};

/**
 * Get node color based on scheme
 */
export function getNodeColor(
  node: GraphNode,
  scheme: ColorScheme,
  clusters?: GraphCluster[]
): string {
  if (node.isSeed) return GRAPH_COLORS.seed;

  switch (scheme) {
    case 'depth':
      return GRAPH_COLORS[`depth${Math.min(node.depth, 3)}` as keyof typeof GRAPH_COLORS] as string;

    case 'year': {
      const year = node.paper.year;
      const currentYear = new Date().getFullYear();
      const age = currentYear - year;
      // Recent papers are more vibrant
      if (age <= 2) return '#22c55e';  // Green
      if (age <= 5) return '#3b82f6';  // Blue
      if (age <= 10) return '#8b5cf6'; // Violet
      return '#6b7280'; // Gray
    }

    case 'citations': {
      const citations = node.paper.citationCount || 0;
      if (citations >= 100) return '#ef4444'; // Red (highly cited)
      if (citations >= 50) return '#f97316';  // Orange
      if (citations >= 20) return '#eab308';  // Yellow
      if (citations >= 10) return '#22c55e';  // Green
      return '#6b7280'; // Gray
    }

    case 'cluster': {
      if (!clusters) return GRAPH_COLORS.depth1;
      const cluster = clusters.find(c => c.nodeIds.includes(node.id));
      return cluster?.color || GRAPH_COLORS.depth1;
    }

    default:
      return GRAPH_COLORS.depth1;
  }
}

/**
 * Calculate node size based on citations
 */
export function getNodeSize(node: GraphNode): number {
  if (node.isSeed) return 12;

  const citations = node.paper.citationCount || 0;
  // Logarithmic scale: min 4, max 20
  return Math.max(4, Math.min(20, Math.log10(citations + 1) * 6 + 4));
}
