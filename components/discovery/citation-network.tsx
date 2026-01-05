'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Filter,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading graph...</div>
});

/**
 * Node data for the citation network
 */
export interface NetworkNode {
  id: string;
  paperId: string;
  title: string;
  authors: string[];
  year: number;
  citationCount: number;
  isSeed?: boolean;
  isUserPaper?: boolean;
  x?: number;
  y?: number;
}

/**
 * Edge types in the citation network
 */
export type EdgeType = 'cites' | 'cited_by' | 'co_citation' | 'bibliographic_coupling' | 'semantic';

/**
 * Edge data for the citation network
 */
export interface NetworkEdge {
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
}

/**
 * Graph data structure
 */
export interface GraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

interface CitationNetworkProps {
  data: GraphData;
  onNodeClick?: (node: NetworkNode) => void;
  onNodeHover?: (node: NetworkNode | null) => void;
  selectedNodeId?: string;
  className?: string;
}

/**
 * Interactive force-directed graph visualization for citation networks
 *
 * Features:
 * - Node sizing by citation count
 * - Node coloring by year
 * - Edge types (co-citation, bibliographic coupling, etc.)
 * - Zoom and pan controls
 * - Click node to see details
 */
export function CitationNetwork({
  data,
  onNodeClick,
  onNodeHover,
  selectedNodeId,
  className
}: CitationNetworkProps) {
  const graphRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [viewFilter, setViewFilter] = useState<'all' | EdgeType>('all');
  const [zoom, setZoom] = useState(1);

  // Color scale for years (darker = newer)
  const getNodeColor = useCallback((node: NetworkNode) => {
    if (node.isSeed) return '#8b5cf6'; // Purple for seed papers
    if (node.isUserPaper) return '#f59e0b'; // Gold for user papers

    const currentYear = new Date().getFullYear();
    const age = currentYear - node.year;
    const maxAge = 15;
    const normalizedAge = Math.min(age / maxAge, 1);

    // Gradient from bright blue (new) to dark gray (old)
    const brightness = 150 + Math.floor((1 - normalizedAge) * 105);
    return `rgb(${brightness - 100}, ${brightness - 50}, ${brightness})`;
  }, []);

  // Node size based on citation count
  const getNodeSize = useCallback((node: NetworkNode) => {
    const baseSize = 4;
    const sizeMultiplier = Math.log(node.citationCount + 1) * 2;
    return baseSize + sizeMultiplier;
  }, []);

  // Filter edges based on selected view
  const filteredData = useMemo(() => {
    if (viewFilter === 'all') return data;

    return {
      nodes: data.nodes,
      edges: data.edges.filter(edge => edge.type === viewFilter)
    };
  }, [data, viewFilter]);

  // Edge color and style based on type
  const getEdgeColor = useCallback((edge: NetworkEdge) => {
    const colors: Record<EdgeType, string> = {
      cites: '#3b82f6',
      cited_by: '#10b981',
      co_citation: '#8b5cf6',
      bibliographic_coupling: '#f59e0b',
      semantic: '#ec4899'
    };
    return colors[edge.type];
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    onNodeClick?.(node);
  }, [onNodeClick]);

  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node);
    onNodeHover?.(node);
  }, [onNodeHover]);

  const handleZoomIn = useCallback(() => {
    graphRef.current?.zoom(zoom * 1.5, 400);
    setZoom(zoom * 1.5);
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    graphRef.current?.zoom(zoom / 1.5, 400);
    setZoom(zoom / 1.5);
  }, [zoom]);

  const handleFitView = useCallback(() => {
    graphRef.current?.zoomToFit(400);
  }, []);

  const handleExport = useCallback(() => {
    const canvas = graphRef.current?.canvas();
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'citation-network.png';
      link.href = url;
      link.click();
    }
  }, []);

  return (
    <div className={cn("relative h-full w-full bg-background rounded-lg border", className)}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg border p-2 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium">View</span>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              variant={viewFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewFilter('all')}
              className="justify-start"
            >
              All
            </Button>
            <Button
              variant={viewFilter === 'cites' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewFilter('cites')}
              className="justify-start"
            >
              Cites
            </Button>
            <Button
              variant={viewFilter === 'cited_by' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewFilter('cited_by')}
              className="justify-start"
            >
              Cited By
            </Button>
            <Button
              variant={viewFilter === 'co_citation' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewFilter('co_citation')}
              className="justify-start"
            >
              Co-Citation
            </Button>
            <Button
              variant={viewFilter === 'bibliographic_coupling' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewFilter('bibliographic_coupling')}
              className="justify-start"
            >
              Bibliographic
            </Button>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="bg-background/95 backdrop-blur-sm rounded-lg border p-2 shadow-lg flex flex-col gap-1">
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleFitView}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Export */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="bg-background/95 backdrop-blur-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-background/95 backdrop-blur-sm rounded-lg border p-3 shadow-lg max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium">Legend</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Seed Paper</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Your Papers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span>Recent Papers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span>Older Papers</span>
          </div>
          <div className="mt-2 pt-2 border-t text-muted-foreground">
            Size = Citation count
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute top-4 right-4 z-10 bg-background/95 backdrop-blur-sm rounded-lg border p-3 shadow-lg max-w-sm">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{hoveredNode.title}</h3>
          <p className="text-xs text-muted-foreground mb-2">
            {hoveredNode.authors.slice(0, 3).join(', ')}
            {hoveredNode.authors.length > 3 && ' et al.'}
          </p>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Year: {hoveredNode.year}</span>
            <span className="text-muted-foreground">Citations: {hoveredNode.citationCount}</span>
          </div>
        </div>
      )}

      {/* Graph */}
      <ForceGraph2D
        ref={graphRef}
        graphData={filteredData}
        nodeId="id"
        nodeLabel="title"
        nodeColor={getNodeColor}
        nodeVal={getNodeSize}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.title;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;

          // Draw node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, getNodeSize(node), 0, 2 * Math.PI, false);
          ctx.fillStyle = getNodeColor(node);
          ctx.fill();

          // Highlight selected node
          if (selectedNodeId === node.id) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          }

          // Draw label for seed papers
          if (node.isSeed && globalScale > 1.5) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(label, node.x, node.y + getNodeSize(node) + fontSize + 2);
          }
        }}
        linkColor={getEdgeColor}
        linkWidth={(edge: any) => edge.weight * 2}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={100}
        onEngineStop={() => graphRef.current?.zoomToFit(400)}
      />
    </div>
  );
}
