// Citation Explorer Context
// State management for citation graph exploration

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { citationGraphService } from '@/lib/deep-research/citation-graph';
import type {
  CitationGraphData,
  GraphNode,
  GraphBuildOptions,
  ColorScheme,
  LayoutAlgorithm,
} from '@/lib/deep-research/citation-graph/types';
import type { SearchPaper } from '@/lib/deep-research/sources/types';
import type { ResearchSource } from '@/lib/deep-research/types';

interface CitationExplorerContextValue {
  // State
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Graph data
  graph: CitationGraphData | null;
  selectedNode: GraphNode | null;
  hoveredNode: GraphNode | null;

  // Display options
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  layout: LayoutAlgorithm;
  setLayout: (layout: LayoutAlgorithm) => void;

  // Actions
  openExplorer: (paper: SearchPaper | ResearchSource) => Promise<void>;
  closeExplorer: () => void;
  selectNode: (node: GraphNode | null) => void;
  hoverNode: (node: GraphNode | null) => void;
  expandNode: (nodeId: string) => Promise<void>;
  pinNode: (nodeId: string) => void;

  // Integration
  addToResearch: (node: GraphNode) => void;
}

const CitationExplorerContext = createContext<CitationExplorerContextValue | null>(null);

interface CitationExplorerProviderProps {
  children: ReactNode;
  onAddToResearch?: (paper: SearchPaper) => void;
}

export function CitationExplorerProvider({
  children,
  onAddToResearch,
}: CitationExplorerProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [graph, setGraph] = useState<CitationGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const [colorScheme, setColorScheme] = useState<ColorScheme>('depth');
  const [layout, setLayout] = useState<LayoutAlgorithm>('force');

  /**
   * Convert ResearchSource to SearchPaper format
   */
  const toSearchPaper = (source: ResearchSource | SearchPaper): SearchPaper => {
    if ('externalId' in source) {
      return source as SearchPaper;
    }

    // Convert ResearchSource to SearchPaper
    const rs = source as ResearchSource;
    return {
      id: rs.id,
      source: rs.database,
      externalId: rs.paperId,
      title: rs.title,
      authors: rs.authors,
      year: rs.year,
      abstract: rs.abstract,
      journal: rs.journal,
      volume: rs.volume,
      issue: rs.issue,
      pages: rs.pages,
      doi: rs.doi,
      url: rs.url,
      pdfUrl: rs.pdfUrl,
      openAccess: rs.openAccess,
      citationCount: rs.citationCount,
    };
  };

  /**
   * Open explorer with a seed paper
   */
  const openExplorer = useCallback(async (paper: SearchPaper | ResearchSource) => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setSelectedNode(null);
    setGraph(null);

    try {
      const searchPaper = toSearchPaper(paper);
      const options: Partial<GraphBuildOptions> = {
        maxDepth: 2,
        maxNodes: 50,
        citingLimit: 8,
        referencedLimit: 8,
      };

      const graphData = await citationGraphService.buildGraph(searchPaper, options);
      setGraph(graphData);
      setSelectedNode(graphData.seed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to build citation graph';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Close explorer
   */
  const closeExplorer = useCallback(() => {
    setIsOpen(false);
    setGraph(null);
    setSelectedNode(null);
    setHoveredNode(null);
    setError(null);
  }, []);

  /**
   * Select a node
   */
  const selectNode = useCallback((node: GraphNode | null) => {
    setSelectedNode(node);
  }, []);

  /**
   * Hover a node
   */
  const hoverNode = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
  }, []);

  /**
   * Expand a node to fetch more connections
   */
  const expandNode = useCallback(async (nodeId: string) => {
    if (!graph) return;

    setIsLoading(true);
    setError(null);

    try {
      const expandedGraph = await citationGraphService.expandNode(graph, nodeId);
      setGraph(expandedGraph);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to expand node';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [graph]);

  /**
   * Pin a node position
   */
  const pinNode = useCallback((nodeId: string) => {
    if (!graph) return;

    setGraph({
      ...graph,
      nodes: graph.nodes.map(n =>
        n.id === nodeId ? { ...n, isPinned: !n.isPinned } : n
      ),
    });
  }, [graph]);

  /**
   * Add paper to research session
   */
  const addToResearch = useCallback((node: GraphNode) => {
    if (onAddToResearch) {
      onAddToResearch(node.paper);
    }
  }, [onAddToResearch]);

  const value: CitationExplorerContextValue = {
    isOpen,
    isLoading,
    error,
    graph,
    selectedNode,
    hoveredNode,
    colorScheme,
    setColorScheme,
    layout,
    setLayout,
    openExplorer,
    closeExplorer,
    selectNode,
    hoverNode,
    expandNode,
    pinNode,
    addToResearch,
  };

  return (
    <CitationExplorerContext.Provider value={value}>
      {children}
    </CitationExplorerContext.Provider>
  );
}

export function useCitationExplorer() {
  const context = useContext(CitationExplorerContext);
  if (!context) {
    throw new Error('useCitationExplorer must be used within CitationExplorerProvider');
  }
  return context;
}
