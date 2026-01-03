// Citation Graph Service
// Builds and manages citation networks from seed papers

import { searchService } from '../sources/search-service';
import { providerRegistry } from '../sources/base-provider';
import type { SearchPaper } from '../sources/types';
import type { DatabaseSource } from '../types';
import {
  type GraphNode,
  type GraphEdge,
  type GraphCluster,
  type CitationGraphData,
  type GraphStats,
  type GraphBuildOptions,
  DEFAULT_BUILD_OPTIONS,
  GRAPH_COLORS,
  getNodeSize,
} from './types';

/**
 * Citation Graph Service
 *
 * Builds citation networks by traversing citing and referenced papers
 * from a seed paper using available database providers.
 */
export class CitationGraphService {
  private visited: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];

  /**
   * Build a citation graph from a seed paper
   */
  async buildGraph(
    seedPaper: SearchPaper,
    options: Partial<GraphBuildOptions> = {}
  ): Promise<CitationGraphData> {
    const opts: GraphBuildOptions = { ...DEFAULT_BUILD_OPTIONS, ...options };

    // Reset state
    this.visited.clear();
    this.edges = [];

    // Create seed node
    const seedNode = this.createNode(seedPaper, 0, true);
    this.visited.set(seedNode.id, seedNode);

    // BFS traversal
    const queue: Array<{ node: GraphNode; depth: number }> = [
      { node: seedNode, depth: 0 }
    ];

    while (queue.length > 0 && this.visited.size < opts.maxNodes) {
      const { node, depth } = queue.shift()!;

      if (depth >= opts.maxDepth) continue;

      // Fetch citing and referenced papers
      const [citing, referenced] = await Promise.all([
        this.fetchCitingPapers(node.paper, opts.citingLimit, opts.providers),
        this.fetchReferencedPapers(node.paper, opts.referencedLimit, opts.providers),
      ]);

      // Process citing papers (papers that cite this one)
      for (const paper of citing) {
        if (this.visited.size >= opts.maxNodes) break;

        const existingNode = this.findExistingNode(paper);
        if (existingNode) {
          // Add edge if not exists
          this.addEdge(existingNode.id, node.id, 'cites');
        } else {
          const newNode = this.createNode(paper, depth + 1, false);
          this.visited.set(newNode.id, newNode);
          this.addEdge(newNode.id, node.id, 'cites');
          queue.push({ node: newNode, depth: depth + 1 });
        }
      }

      // Process referenced papers (papers cited by this one)
      for (const paper of referenced) {
        if (this.visited.size >= opts.maxNodes) break;

        const existingNode = this.findExistingNode(paper);
        if (existingNode) {
          this.addEdge(node.id, existingNode.id, 'cites');
        } else {
          const newNode = this.createNode(paper, depth + 1, false);
          this.visited.set(newNode.id, newNode);
          this.addEdge(node.id, newNode.id, 'cites');
          queue.push({ node: newNode, depth: depth + 1 });
        }
      }

      // Mark as expanded
      node.isExpanded = true;
    }

    const nodes = Array.from(this.visited.values());
    const clusters = this.detectClusters(nodes, this.edges);
    const stats = this.calculateStats(nodes, this.edges, opts.providers);

    return {
      nodes,
      edges: this.edges,
      clusters,
      seed: seedNode,
      stats,
    };
  }

  /**
   * Expand a node to fetch more connections
   */
  async expandNode(
    graph: CitationGraphData,
    nodeId: string,
    options: Partial<GraphBuildOptions> = {}
  ): Promise<CitationGraphData> {
    const opts: GraphBuildOptions = { ...DEFAULT_BUILD_OPTIONS, ...options };
    const node = graph.nodes.find(n => n.id === nodeId);

    if (!node || node.isExpanded) {
      return graph;
    }

    // Restore state from existing graph
    this.visited.clear();
    this.edges = [...graph.edges];
    graph.nodes.forEach(n => this.visited.set(n.id, n));

    // Fetch connections
    const [citing, referenced] = await Promise.all([
      this.fetchCitingPapers(node.paper, opts.citingLimit, opts.providers),
      this.fetchReferencedPapers(node.paper, opts.referencedLimit, opts.providers),
    ]);

    const newDepth = node.depth + 1;

    // Add citing papers
    for (const paper of citing) {
      if (this.visited.size >= opts.maxNodes) break;

      const existingNode = this.findExistingNode(paper);
      if (existingNode) {
        this.addEdge(existingNode.id, node.id, 'cites');
      } else {
        const newNode = this.createNode(paper, newDepth, false);
        this.visited.set(newNode.id, newNode);
        this.addEdge(newNode.id, node.id, 'cites');
      }
    }

    // Add referenced papers
    for (const paper of referenced) {
      if (this.visited.size >= opts.maxNodes) break;

      const existingNode = this.findExistingNode(paper);
      if (existingNode) {
        this.addEdge(node.id, existingNode.id, 'cites');
      } else {
        const newNode = this.createNode(paper, newDepth, false);
        this.visited.set(newNode.id, newNode);
        this.addEdge(node.id, newNode.id, 'cites');
      }
    }

    node.isExpanded = true;

    const nodes = Array.from(this.visited.values());
    const clusters = this.detectClusters(nodes, this.edges);
    const stats = this.calculateStats(nodes, this.edges, opts.providers);

    return {
      nodes,
      edges: this.edges,
      clusters,
      seed: graph.seed,
      stats,
    };
  }

  /**
   * Fetch papers that cite the given paper
   */
  private async fetchCitingPapers(
    paper: SearchPaper,
    limit: number,
    providers: DatabaseSource[]
  ): Promise<SearchPaper[]> {
    const results: SearchPaper[] = [];

    for (const source of providers) {
      if (results.length >= limit) break;

      try {
        const provider = providerRegistry.get(source);
        if (!provider) continue;

        const citing = await provider.getCitingPapers(paper.externalId, limit - results.length);
        results.push(...citing);
      } catch (error) {
        console.warn(`Failed to fetch citing papers from ${source}:`, error);
      }
    }

    return results.slice(0, limit);
  }

  /**
   * Fetch papers referenced by the given paper
   */
  private async fetchReferencedPapers(
    paper: SearchPaper,
    limit: number,
    providers: DatabaseSource[]
  ): Promise<SearchPaper[]> {
    const results: SearchPaper[] = [];

    for (const source of providers) {
      if (results.length >= limit) break;

      try {
        const provider = providerRegistry.get(source);
        if (!provider) continue;

        const referenced = await provider.getReferencedPapers(paper.externalId, limit - results.length);
        results.push(...referenced);
      } catch (error) {
        console.warn(`Failed to fetch referenced papers from ${source}:`, error);
      }
    }

    return results.slice(0, limit);
  }

  /**
   * Create a graph node from a paper
   */
  private createNode(paper: SearchPaper, depth: number, isSeed: boolean): GraphNode {
    const node: GraphNode = {
      id: this.getPaperId(paper),
      paper,
      depth,
      isExpanded: false,
      isPinned: false,
      isSeed,
      size: 0,
      color: '',
      label: this.truncateTitle(paper.title, 40),
    };

    node.size = getNodeSize(node);
    node.color = isSeed ? GRAPH_COLORS.seed : GRAPH_COLORS.depth1;

    return node;
  }

  /**
   * Find existing node by DOI or title+year
   */
  private findExistingNode(paper: SearchPaper): GraphNode | null {
    // Check by DOI first
    if (paper.doi) {
      for (const node of this.visited.values()) {
        if (node.paper.doi === paper.doi) return node;
      }
    }

    // Check by title+year
    const key = `${paper.title.toLowerCase()}-${paper.year}`;
    for (const node of this.visited.values()) {
      const nodeKey = `${node.paper.title.toLowerCase()}-${node.paper.year}`;
      if (nodeKey === key) return node;
    }

    return null;
  }

  /**
   * Add an edge to the graph
   */
  private addEdge(source: string, target: string, type: 'cites' | 'cited_by'): void {
    // Check for duplicate
    const exists = this.edges.some(
      e => e.source === source && e.target === target
    );
    if (!exists) {
      this.edges.push({ source, target, type, weight: 1 });
    }
  }

  /**
   * Get unique paper ID
   */
  private getPaperId(paper: SearchPaper): string {
    return paper.doi || `${paper.source}-${paper.externalId}`;
  }

  /**
   * Truncate title for display
   */
  private truncateTitle(title: string, maxLength: number): string {
    if (title.length <= maxLength) return title;
    return title.slice(0, maxLength - 3) + '...';
  }

  /**
   * Detect clusters using simple connected component analysis
   */
  private detectClusters(nodes: GraphNode[], edges: GraphEdge[]): GraphCluster[] {
    // Simple clustering by year range
    const yearGroups = new Map<string, string[]>();

    for (const node of nodes) {
      if (node.isSeed) continue;

      const year = node.paper.year;
      const decade = Math.floor(year / 5) * 5; // 5-year groups
      const key = `${decade}-${decade + 4}`;

      if (!yearGroups.has(key)) {
        yearGroups.set(key, []);
      }
      yearGroups.get(key)!.push(node.id);
    }

    const clusters: GraphCluster[] = [];
    let colorIndex = 0;

    for (const [label, nodeIds] of yearGroups) {
      if (nodeIds.length >= 2) {
        clusters.push({
          id: `cluster-${label}`,
          label,
          nodeIds,
          color: GRAPH_COLORS.cluster[colorIndex % GRAPH_COLORS.cluster.length],
        });
        colorIndex++;
      }
    }

    return clusters;
  }

  /**
   * Calculate graph statistics
   */
  private calculateStats(
    nodes: GraphNode[],
    edges: GraphEdge[],
    providers: DatabaseSource[]
  ): GraphStats {
    const years = nodes.map(n => n.paper.year).filter(y => y > 0);
    const citations = nodes.map(n => n.paper.citationCount || 0);
    const depths = nodes.map(n => n.depth);

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      maxDepth: Math.max(...depths),
      yearRange: years.length > 0
        ? [Math.min(...years), Math.max(...years)]
        : [0, 0],
      avgCitations: citations.length > 0
        ? Math.round(citations.reduce((a, b) => a + b, 0) / citations.length)
        : 0,
      providers,
    };
  }
}

// Singleton instance
export const citationGraphService = new CitationGraphService();
