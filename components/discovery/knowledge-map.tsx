'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils/cn';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Filter
} from 'lucide-react';

/**
 * Research cluster in the knowledge map
 */
export interface MapCluster {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  paperCount: number;
  avgCitations: number;
  growth: number;
  x: number;
  y: number;
  radius: number;
  color: string;
}

/**
 * Paper positioned within a cluster
 */
export interface MapPaper {
  paperId: string;
  clusterId: string;
  title: string;
  year: number;
  x: number;
  y: number;
  isUserPaper: boolean;
  isKeyPaper: boolean;
}

/**
 * Connection between clusters
 */
export interface ClusterConnection {
  sourceClusterId: string;
  targetClusterId: string;
  strength: number;
  type: 'citation_flow' | 'shared_keywords' | 'author_overlap';
}

export interface KnowledgeMapData {
  clusters: MapCluster[];
  papers: MapPaper[];
  connections: ClusterConnection[];
}

interface KnowledgeMapProps {
  data: KnowledgeMapData;
  onClusterClick?: (cluster: MapCluster) => void;
  onPaperClick?: (paper: MapPaper) => void;
  selectedClusterId?: string;
  className?: string;
}

/**
 * Interactive knowledge map visualization showing research landscape
 *
 * Features:
 * - Cluster visualization with topic labels
 * - Paper dots within clusters
 * - Highlight user's papers
 * - Connection lines between clusters
 * - Zoom and pan controls
 */
export function KnowledgeMap({
  data,
  onClusterClick,
  onPaperClick,
  selectedClusterId,
  className
}: KnowledgeMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showConnections, setShowConnections] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredCluster, setHoveredCluster] = useState<MapCluster | null>(null);
  const [hoveredPaper, setHoveredPaper] = useState<MapPaper | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // SVG viewBox dimensions
  const viewBoxWidth = 1000;
  const viewBoxHeight = 800;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(5, prev * 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(0.1, prev / 1.5));
  const handleFitView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className={cn("relative h-full w-full bg-background rounded-lg border overflow-hidden", className)}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* View options */}
        <div className="bg-background/95 backdrop-blur-sm rounded-lg border p-2 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium">Display</span>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              variant={showConnections ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowConnections(!showConnections)}
              className="justify-start text-xs"
            >
              Connections
            </Button>
            <Button
              variant={showLabels ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowLabels(!showLabels)}
              className="justify-start text-xs"
            >
              Labels
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
      </div>

      {/* Cluster info tooltip */}
      {hoveredCluster && (
        <div className="absolute top-4 right-4 z-10 bg-background/95 backdrop-blur-sm rounded-lg border p-3 shadow-lg max-w-sm">
          <h3 className="font-semibold text-sm mb-1">{hoveredCluster.label}</h3>
          <p className="text-xs text-muted-foreground mb-2">{hoveredCluster.description}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {hoveredCluster.keywords.slice(0, 5).map(keyword => (
              <span key={keyword} className="text-xs bg-muted px-2 py-0.5 rounded">
                {keyword}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Papers:</span>
              <span className="ml-1 font-medium">{hoveredCluster.paperCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Citations:</span>
              <span className="ml-1 font-medium">{hoveredCluster.avgCitations}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Growth:</span>
              <span className={cn(
                "ml-1 font-medium",
                hoveredCluster.growth > 0 ? "text-green-500" : "text-red-500"
              )}>
                {hoveredCluster.growth > 0 ? '+' : ''}{hoveredCluster.growth}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Paper info tooltip */}
      {hoveredPaper && (
        <div className="absolute top-4 right-4 z-10 bg-background/95 backdrop-blur-sm rounded-lg border p-3 shadow-lg max-w-sm">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{hoveredPaper.title}</h3>
          <p className="text-xs text-muted-foreground">Year: {hoveredPaper.year}</p>
          {hoveredPaper.isUserPaper && (
            <span className="inline-block mt-1 text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
              Your Paper
            </span>
          )}
          {hoveredPaper.isKeyPaper && (
            <span className="inline-block mt-1 ml-1 text-xs bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
              Key Paper
            </span>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-background/95 backdrop-blur-sm rounded-lg border p-3 shadow-lg">
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white" />
            <span>Your Papers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Key Papers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span>Related Papers</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        width="100%"
        height="100%"
        viewBox={`${-viewBoxWidth / 2 + pan.x / zoom} ${-viewBoxHeight / 2 + pan.y / zoom} ${viewBoxWidth / zoom} ${viewBoxHeight / zoom}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* Connections between clusters */}
        {showConnections && data.connections.map((conn, i) => {
          const source = data.clusters.find(c => c.id === conn.sourceClusterId);
          const target = data.clusters.find(c => c.id === conn.targetClusterId);
          if (!source || !target) return null;

          return (
            <line
              key={i}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="currentColor"
              strokeWidth={conn.strength * 3}
              strokeOpacity={0.2}
              className="text-muted-foreground"
            />
          );
        })}

        {/* Clusters */}
        {data.clusters.map(cluster => (
          <g key={cluster.id}>
            {/* Cluster circle */}
            <circle
              cx={cluster.x}
              cy={cluster.y}
              r={cluster.radius}
              fill={cluster.color}
              fillOpacity={selectedClusterId === cluster.id ? 0.3 : 0.15}
              stroke={cluster.color}
              strokeWidth={selectedClusterId === cluster.id ? 3 : 1.5}
              className="cursor-pointer transition-all"
              onClick={() => onClusterClick?.(cluster)}
              onMouseEnter={() => setHoveredCluster(cluster)}
              onMouseLeave={() => setHoveredCluster(null)}
            />

            {/* Cluster label */}
            {showLabels && (
              <text
                x={cluster.x}
                y={cluster.y - cluster.radius - 10}
                textAnchor="middle"
                className="text-sm font-semibold fill-current"
                style={{ fontSize: 14 }}
              >
                {cluster.label}
              </text>
            )}

            {/* Paper count */}
            {showLabels && (
              <text
                x={cluster.x}
                y={cluster.y - cluster.radius - 25}
                textAnchor="middle"
                className="text-xs fill-current text-muted-foreground"
                style={{ fontSize: 10 }}
              >
                ({cluster.paperCount} papers)
              </text>
            )}
          </g>
        ))}

        {/* Papers within clusters */}
        {data.papers.map(paper => (
          <circle
            key={paper.paperId}
            cx={paper.x}
            cy={paper.y}
            r={paper.isUserPaper ? 6 : paper.isKeyPaper ? 5 : 3}
            fill={paper.isUserPaper ? '#f59e0b' : paper.isKeyPaper ? '#8b5cf6' : 'currentColor'}
            stroke={paper.isUserPaper ? '#fff' : 'none'}
            strokeWidth={2}
            className="cursor-pointer text-muted-foreground transition-all hover:scale-125"
            onClick={() => onPaperClick?.(paper)}
            onMouseEnter={() => setHoveredPaper(paper)}
            onMouseLeave={() => setHoveredPaper(null)}
          />
        ))}
      </svg>
    </div>
  );
}
