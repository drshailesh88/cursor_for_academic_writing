// Graph Visualization Component
// Interactive force-directed graph using react-force-graph-2d

'use client';

import { useRef, useCallback, useEffect, useMemo } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import type {
  CitationGraphData,
  GraphNode,
  GraphEdge,
  ColorScheme,
} from '@/lib/deep-research/citation-graph/types';
import { getNodeColor, getNodeSize, GRAPH_COLORS } from '@/lib/deep-research/citation-graph/types';

interface GraphVisualizationProps {
  graph: CitationGraphData;
  selectedNode: GraphNode | null;
  colorScheme: ColorScheme;
  onNodeClick: (node: GraphNode) => void;
  onNodeHover: (node: GraphNode | null) => void;
  onNodeDoubleClick: (node: GraphNode) => void;
  width: number;
  height: number;
}

export function GraphVisualization({
  graph,
  selectedNode,
  colorScheme,
  onNodeClick,
  onNodeHover,
  onNodeDoubleClick,
  width,
  height,
}: GraphVisualizationProps) {
  const graphRef = useRef<ForceGraphMethods>();

  // Prepare graph data for force-graph
  const graphData = useMemo(() => {
    return {
      nodes: graph.nodes.map(node => ({
        ...node,
        color: getNodeColor(node, colorScheme, graph.clusters),
        size: getNodeSize(node),
      })),
      links: graph.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        type: edge.type,
      })),
    };
  }, [graph, colorScheme]);

  // Center on seed node on mount
  useEffect(() => {
    if (graphRef.current && graph.seed) {
      setTimeout(() => {
        graphRef.current?.centerAt(0, 0, 500);
        graphRef.current?.zoom(1.5, 500);
      }, 500);
    }
  }, [graph.seed]);

  // Handle node click
  const handleNodeClick = useCallback((node: any) => {
    const graphNode = graph.nodes.find(n => n.id === node.id);
    if (graphNode) {
      onNodeClick(graphNode);
    }
  }, [graph.nodes, onNodeClick]);

  // Handle node hover
  const handleNodeHover = useCallback((node: any) => {
    if (!node) {
      onNodeHover(null);
      return;
    }
    const graphNode = graph.nodes.find(n => n.id === node.id);
    onNodeHover(graphNode || null);
  }, [graph.nodes, onNodeHover]);

  // Handle double click for expansion
  const handleNodeDoubleClick = useCallback((node: any) => {
    const graphNode = graph.nodes.find(n => n.id === node.id);
    if (graphNode && !graphNode.isExpanded) {
      onNodeDoubleClick(graphNode);
    }
  }, [graph.nodes, onNodeDoubleClick]);

  // Custom node rendering
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const size = node.size || 6;
    const isSelected = selectedNode?.id === node.id;
    const isSeed = node.isSeed;

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();

    // Draw border for selected/seed nodes
    if (isSelected || isSeed) {
      ctx.strokeStyle = isSelected ? '#6366f1' : GRAPH_COLORS.seed;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();
    }

    // Draw expansion indicator if not expanded
    if (!node.isExpanded && !isSeed) {
      ctx.beginPath();
      ctx.arc(node.x + size * 0.7, node.y - size * 0.7, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
    }

    // Draw label for larger nodes or when zoomed in
    if (globalScale > 1.2 || size > 8 || isSelected) {
      const label = node.label || '';
      const fontSize = Math.max(10, 12 / globalScale);
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#1f2937';
      ctx.fillText(label, node.x, node.y + size + 4);
    }
  }, [selectedNode]);

  // Custom link rendering
  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const start = link.source;
    const end = link.target;

    if (!start.x || !end.x) return;

    // Draw curved line
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const curvature = 0.2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const ctrlX = midX - dy * curvature;
    const ctrlY = midY + dx * curvature;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(ctrlX, ctrlY, end.x, end.y);
    ctx.strokeStyle = GRAPH_COLORS.edge;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Draw arrow
    const arrowLength = 6;
    const angle = Math.atan2(end.y - ctrlY, end.x - ctrlX);
    const endRadius = end.size || 6;

    const arrowX = end.x - Math.cos(angle) * (endRadius + 2);
    const arrowY = end.y - Math.sin(angle) * (endRadius + 2);

    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - arrowLength * Math.cos(angle - Math.PI / 6),
      arrowY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      arrowX - arrowLength * Math.cos(angle + Math.PI / 6),
      arrowY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = GRAPH_COLORS.edge;
    ctx.fill();
  }, []);

  return (
    <ForceGraph2D
      ref={graphRef}
      graphData={graphData}
      width={width}
      height={height}
      nodeId="id"
      nodeLabel={(node: any) => `${node.paper?.title || node.label} (${node.paper?.year || ''})`}
      nodeCanvasObject={nodeCanvasObject}
      nodePointerAreaPaint={(node: any, color, ctx) => {
        const size = node.size || 6;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
        ctx.fill();
      }}
      linkCanvasObject={linkCanvasObject}
      linkDirectionalArrowLength={0} // We draw custom arrows
      onNodeClick={handleNodeClick}
      onNodeHover={handleNodeHover}
      onNodeDragEnd={(node: any) => {
        // Pin node after drag
        node.fx = node.x;
        node.fy = node.y;
      }}
      onBackgroundClick={() => onNodeClick(null as any)}
      cooldownTicks={100}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
      enableZoomInteraction={true}
      enablePanInteraction={true}
      enableNodeDrag={true}
    />
  );
}
