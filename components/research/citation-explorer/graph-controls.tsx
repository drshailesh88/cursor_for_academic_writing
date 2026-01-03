// Graph Controls
// Zoom, layout, and color scheme controls

'use client';

import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Palette,
  LayoutGrid,
} from 'lucide-react';
import type { ColorScheme, LayoutAlgorithm } from '@/lib/deep-research/citation-graph/types';

interface GraphControlsProps {
  colorScheme: ColorScheme;
  onColorSchemeChange: (scheme: ColorScheme) => void;
  layout: LayoutAlgorithm;
  onLayoutChange: (layout: LayoutAlgorithm) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

export function GraphControls({
  colorScheme,
  onColorSchemeChange,
  layout,
  onLayoutChange,
  onZoomIn,
  onZoomOut,
  onFitView,
}: GraphControlsProps) {
  const colorSchemes: { value: ColorScheme; label: string }[] = [
    { value: 'depth', label: 'By Depth' },
    { value: 'year', label: 'By Year' },
    { value: 'citations', label: 'By Citations' },
    { value: 'cluster', label: 'By Cluster' },
  ];

  return (
    <div className="absolute bottom-4 left-4 flex flex-col gap-2">
      {/* Zoom controls */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-card/90 backdrop-blur border border-border shadow-sm">
        <button
          onClick={onZoomIn}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border" />
        <button
          onClick={onFitView}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title="Fit to view"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Color scheme selector */}
      <div className="p-2 rounded-lg bg-card/90 backdrop-blur border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
          <Palette className="w-3 h-3" />
          Color
        </div>
        <div className="flex flex-wrap gap-1">
          {colorSchemes.map((scheme) => (
            <button
              key={scheme.value}
              onClick={() => onColorSchemeChange(scheme.value)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                colorScheme === scheme.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {scheme.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface GraphStatsDisplayProps {
  stats: {
    totalNodes: number;
    totalEdges: number;
    yearRange: [number, number];
    avgCitations: number;
  };
}

export function GraphStatsDisplay({ stats }: GraphStatsDisplayProps) {
  return (
    <div className="absolute top-4 left-4 p-3 rounded-lg bg-card/90 backdrop-blur border border-border shadow-sm">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="text-muted-foreground">Papers</div>
        <div className="font-medium">{stats.totalNodes}</div>

        <div className="text-muted-foreground">Connections</div>
        <div className="font-medium">{stats.totalEdges}</div>

        <div className="text-muted-foreground">Years</div>
        <div className="font-medium">
          {stats.yearRange[0]} - {stats.yearRange[1]}
        </div>

        <div className="text-muted-foreground">Avg Citations</div>
        <div className="font-medium">{stats.avgCitations}</div>
      </div>
    </div>
  );
}

interface ClusterLegendProps {
  clusters: Array<{ id: string; label: string; color: string; nodeIds: string[] }>;
  onClusterClick?: (clusterId: string) => void;
}

export function ClusterLegend({ clusters, onClusterClick }: ClusterLegendProps) {
  if (clusters.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 p-3 rounded-lg bg-card/90 backdrop-blur border border-border shadow-sm max-w-[200px]">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Time Periods
      </div>
      <div className="space-y-1">
        {clusters.slice(0, 6).map((cluster) => (
          <button
            key={cluster.id}
            onClick={() => onClusterClick?.(cluster.id)}
            className="flex items-center gap-2 w-full text-left hover:bg-muted rounded px-1 py-0.5 transition-colors"
          >
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: cluster.color }}
            />
            <span className="text-xs truncate">{cluster.label}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {cluster.nodeIds.length}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
