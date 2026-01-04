'use client';

/**
 * Flowchart Renderer for Academic Presentations
 * Pure SVG-based flowchart rendering with auto-layout
 */

import React from 'react';
import { FlowchartConfig, FlowNode, FlowEdge, Theme } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const NODE_DIMENSIONS = {
  process: { width: 140, height: 60 },
  decision: { width: 120, height: 120 },
  terminal: { width: 140, height: 50 },
  data: { width: 140, height: 60 },
  connector: { width: 40, height: 40 },
} as const;

const LAYOUT_CONFIG = {
  TB: { nodeSpacing: 80, levelSpacing: 100 },
  LR: { nodeSpacing: 80, levelSpacing: 150 },
  BT: { nodeSpacing: 80, levelSpacing: 100 },
  RL: { nodeSpacing: 80, levelSpacing: 150 },
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface Position {
  x: number;
  y: number;
}

interface NodeProps {
  node: FlowNode;
  position: Position;
  theme: Theme;
}

interface EdgeProps {
  edge: FlowEdge;
  fromPos: Position;
  toPos: Position;
  theme: Theme;
  curved: boolean;
}

export interface FlowchartProps {
  config: FlowchartConfig;
  theme: Theme;
  width?: number;
  height?: number;
  className?: string;
}

export interface PRISMAData {
  identified: number;
  duplicatesRemoved?: number;
  screened: number;
  excludedScreening: number;
  fullTextAssessed: number;
  excludedFullText: number;
  excludedReasons?: string[];
  included: number;
}

// ============================================================================
// LAYOUT ALGORITHM
// ============================================================================

interface NodeLevel {
  level: number;
  nodes: FlowNode[];
}

/**
 * Calculate node levels using topological sort
 */
function calculateNodeLevels(
  nodes: FlowNode[],
  edges: FlowEdge[]
): Map<string, number> {
  const levels = new Map<string, number>();
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  });

  // Build graph
  edges.forEach(edge => {
    const count = inDegree.get(edge.target) || 0;
    inDegree.set(edge.target, count + 1);
    const neighbors = adjacency.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacency.set(edge.source, neighbors);
  });

  // Find root nodes (no incoming edges)
  const queue: Array<{ id: string; level: number }> = [];
  nodes.forEach(node => {
    if (inDegree.get(node.id) === 0) {
      queue.push({ id: node.id, level: 0 });
      levels.set(node.id, 0);
    }
  });

  // BFS to assign levels
  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adjacency.get(current.id) || [];

    neighbors.forEach(neighborId => {
      const newLevel = current.level + 1;
      const existingLevel = levels.get(neighborId);

      if (existingLevel === undefined || newLevel > existingLevel) {
        levels.set(neighborId, newLevel);
      }

      const degree = inDegree.get(neighborId)! - 1;
      inDegree.set(neighborId, degree);

      if (degree === 0) {
        queue.push({ id: neighborId, level: newLevel });
      }
    });
  }

  // Handle disconnected nodes
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  });

  return levels;
}

/**
 * Layout nodes using hierarchical positioning
 */
function layoutNodes(
  nodes: FlowNode[],
  edges: FlowEdge[],
  layout: FlowchartConfig['layout']
): Map<string, Position> {
  const positions = new Map<string, Position>();
  const config = LAYOUT_CONFIG[layout];

  // Calculate levels
  const nodeLevels = calculateNodeLevels(nodes, edges);

  // Group nodes by level
  const levelGroups = new Map<number, FlowNode[]>();
  nodes.forEach(node => {
    const level = nodeLevels.get(node.id) || 0;
    const group = levelGroups.get(level) || [];
    group.push(node);
    levelGroups.set(level, group);
  });

  // Position nodes
  const isHorizontal = layout === 'LR' || layout === 'RL';
  const isReversed = layout === 'BT' || layout === 'RL';

  levelGroups.forEach((levelNodes, level) => {
    const levelPosition = level * config.levelSpacing;

    levelNodes.forEach((node, index) => {
      const nodeCount = levelNodes.length;
      const nodePosition = (index - (nodeCount - 1) / 2) * config.nodeSpacing;

      if (isHorizontal) {
        positions.set(node.id, {
          x: isReversed ? -levelPosition : levelPosition,
          y: nodePosition,
        });
      } else {
        positions.set(node.id, {
          x: nodePosition,
          y: isReversed ? -levelPosition : levelPosition,
        });
      }
    });
  });

  return positions;
}

/**
 * Calculate viewBox to fit all nodes
 */
function calculateViewBox(
  positions: Map<string, Position>,
  nodes: FlowNode[],
  padding: number = 50
): { x: number; y: number; width: number; height: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach(node => {
    const pos = positions.get(node.id);
    if (!pos) return;

    const dim = NODE_DIMENSIONS[node.type];
    minX = Math.min(minX, pos.x - dim.width / 2);
    maxX = Math.max(maxX, pos.x + dim.width / 2);
    minY = Math.min(minY, pos.y - dim.height / 2);
    maxY = Math.max(maxY, pos.y + dim.height / 2);
  });

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

// ============================================================================
// EDGE RENDERING
// ============================================================================

/**
 * Generate SVG path between two points
 */
function generateEdgePath(
  from: Position,
  to: Position,
  curved: boolean
): string {
  if (!curved) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }

  // Curved path with control points
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Determine curve direction based on relative positions
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal flow - use horizontal control points
    const midX = from.x + dx / 2;
    return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
  } else {
    // Vertical flow - use vertical control points
    const midY = from.y + dy / 2;
    return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
  }
}

/**
 * Arrow marker definition
 */
function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      markerWidth="10"
      markerHeight="10"
      refX="9"
      refY="3"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <path d="M0,0 L0,6 L9,3 z" fill={color} />
    </marker>
  );
}

/**
 * Edge component
 */
function Edge({ edge, fromPos, toPos, theme, curved }: EdgeProps) {
  const path = generateEdgePath(fromPos, toPos, curved);
  const markerId = `arrow-${edge.id}`;

  // Calculate label position (midpoint)
  const labelX = (fromPos.x + toPos.x) / 2;
  const labelY = (fromPos.y + toPos.y) / 2;

  return (
    <g className="edge">
      <path
        d={path}
        stroke={theme.colors.textMuted}
        strokeWidth="2"
        fill="none"
        markerEnd={`url(#${markerId})`}
        opacity={0.8}
      />
      {edge.label && (
        <g>
          <rect
            x={labelX - 30}
            y={labelY - 10}
            width="60"
            height="20"
            fill={theme.colors.background}
            stroke={theme.colors.border}
            strokeWidth="1"
            rx="4"
          />
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={theme.colors.text}
            fontSize="11"
            fontFamily={theme.fonts.body}
          >
            {edge.label}
          </text>
        </g>
      )}
      <ArrowMarker id={markerId} color={theme.colors.textMuted} />
    </g>
  );
}

// ============================================================================
// NODE RENDERING
// ============================================================================

/**
 * Process Node (Rectangle with rounded corners)
 */
function ProcessNode({ node, position, theme }: NodeProps) {
  const { width, height } = NODE_DIMENSIONS.process;
  const x = position.x - width / 2;
  const y = position.y - height / 2;
  const color = node.metadata?.color || theme.colors.primary;

  return (
    <g className="node-process">
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={theme.colors.surface}
        stroke={color}
        strokeWidth="2"
        rx={theme.styles.borderRadius}
      />
      <text
        x={position.x}
        y={position.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={theme.colors.text}
        fontSize="13"
        fontFamily={theme.fonts.body}
        fontWeight="500"
      >
        {node.label.split('\n').map((line, i) => (
          <tspan key={i} x={position.x} dy={i === 0 ? 0 : 16}>
            {line}
          </tspan>
        ))}
      </text>
      {node.metadata?.count !== undefined && (
        <text
          x={position.x}
          y={position.y + 20}
          textAnchor="middle"
          fill={color}
          fontSize="12"
          fontFamily={theme.fonts.body}
          fontWeight="600"
        >
          n = {node.metadata.count}
        </text>
      )}
    </g>
  );
}

/**
 * Decision Node (Diamond shape)
 */
function DecisionNode({ node, position, theme }: NodeProps) {
  const { width, height } = NODE_DIMENSIONS.decision;
  const halfW = width / 2;
  const halfH = height / 2;
  const color = node.metadata?.color || theme.colors.accent;

  const points = `
    ${position.x},${position.y - halfH}
    ${position.x + halfW},${position.y}
    ${position.x},${position.y + halfH}
    ${position.x - halfW},${position.y}
  `;

  return (
    <g className="node-decision">
      <polygon
        points={points}
        fill={theme.colors.surface}
        stroke={color}
        strokeWidth="2"
      />
      <text
        x={position.x}
        y={position.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={theme.colors.text}
        fontSize="12"
        fontFamily={theme.fonts.body}
        fontWeight="500"
      >
        {node.label.split('\n').map((line, i) => (
          <tspan key={i} x={position.x} dy={i === 0 ? -8 : 16}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

/**
 * Terminal Node (Stadium/pill shape for start/end)
 */
function TerminalNode({ node, position, theme }: NodeProps) {
  const { width, height } = NODE_DIMENSIONS.terminal;
  const x = position.x - width / 2;
  const y = position.y - height / 2;
  const color = node.metadata?.color || theme.colors.secondary;

  return (
    <g className="node-terminal">
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={theme.colors.surface}
        stroke={color}
        strokeWidth="2"
        rx={height / 2}
      />
      <text
        x={position.x}
        y={position.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={theme.colors.text}
        fontSize="13"
        fontFamily={theme.fonts.body}
        fontWeight="600"
      >
        {node.label}
      </text>
      {node.metadata?.count !== undefined && (
        <text
          x={position.x}
          y={position.y + 20}
          textAnchor="middle"
          fill={color}
          fontSize="12"
          fontFamily={theme.fonts.body}
          fontWeight="600"
        >
          n = {node.metadata.count}
        </text>
      )}
    </g>
  );
}

/**
 * Data Node (Parallelogram)
 */
function DataNode({ node, position, theme }: NodeProps) {
  const { width, height } = NODE_DIMENSIONS.data;
  const halfH = height / 2;
  const skew = 15;
  const color = node.metadata?.color || theme.colors.primary;

  const points = `
    ${position.x - width / 2 + skew},${position.y - halfH}
    ${position.x + width / 2 + skew},${position.y - halfH}
    ${position.x + width / 2 - skew},${position.y + halfH}
    ${position.x - width / 2 - skew},${position.y + halfH}
  `;

  return (
    <g className="node-data">
      <polygon
        points={points}
        fill={theme.colors.surface}
        stroke={color}
        strokeWidth="2"
      />
      <text
        x={position.x}
        y={position.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={theme.colors.text}
        fontSize="13"
        fontFamily={theme.fonts.body}
        fontWeight="500"
      >
        {node.label}
      </text>
      {node.metadata?.count !== undefined && (
        <text
          x={position.x}
          y={position.y + 18}
          textAnchor="middle"
          fill={color}
          fontSize="11"
          fontFamily={theme.fonts.body}
          fontWeight="600"
        >
          n = {node.metadata.count}
        </text>
      )}
    </g>
  );
}

/**
 * Connector Node (Circle)
 */
function ConnectorNode({ node, position, theme }: NodeProps) {
  const { width } = NODE_DIMENSIONS.connector;
  const radius = width / 2;
  const color = node.metadata?.color || theme.colors.textMuted;

  return (
    <g className="node-connector">
      <circle
        cx={position.x}
        cy={position.y}
        r={radius}
        fill={theme.colors.surface}
        stroke={color}
        strokeWidth="2"
      />
      <text
        x={position.x}
        y={position.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={theme.colors.text}
        fontSize="12"
        fontFamily={theme.fonts.body}
        fontWeight="600"
      >
        {node.label}
      </text>
    </g>
  );
}

/**
 * Render node based on type
 */
function NodeRenderer({ node, position, theme }: NodeProps) {
  switch (node.type) {
    case 'process':
      return <ProcessNode node={node} position={position} theme={theme} />;
    case 'decision':
      return <DecisionNode node={node} position={position} theme={theme} />;
    case 'terminal':
      return <TerminalNode node={node} position={position} theme={theme} />;
    case 'data':
      return <DataNode node={node} position={position} theme={theme} />;
    case 'connector':
      return <ConnectorNode node={node} position={position} theme={theme} />;
    default:
      return <ProcessNode node={node} position={position} theme={theme} />;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Flowchart({
  config,
  theme,
  width = 800,
  height = 500,
  className = '',
}: FlowchartProps) {
  // Calculate layout
  const positions = React.useMemo(
    () => layoutNodes(config.nodes, config.edges, config.layout),
    [config.nodes, config.edges, config.layout]
  );

  // Calculate viewBox
  const viewBox = React.useMemo(
    () => calculateViewBox(positions, config.nodes),
    [positions, config.nodes]
  );

  // Determine if edges should be curved
  const curved = config.edges.some(e => e.type === 'smoothstep');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      className={className}
      style={{ background: theme.colors.background }}
    >
      {/* Render edges first (behind nodes) */}
      <g className="edges">
        {config.edges.map(edge => {
          const fromPos = positions.get(edge.source);
          const toPos = positions.get(edge.target);
          if (!fromPos || !toPos) return null;

          return (
            <Edge
              key={edge.id}
              edge={edge}
              fromPos={fromPos}
              toPos={toPos}
              theme={theme}
              curved={curved}
            />
          );
        })}
      </g>

      {/* Render nodes */}
      <g className="nodes">
        {config.nodes.map(node => {
          const position = positions.get(node.id);
          if (!position) return null;

          return (
            <NodeRenderer
              key={node.id}
              node={node}
              position={position}
              theme={theme}
            />
          );
        })}
      </g>
    </svg>
  );
}

// ============================================================================
// PRISMA FLOW GENERATOR
// ============================================================================

/**
 * Generate PRISMA flow diagram for systematic reviews
 */
export function generatePRISMAFlow(data: PRISMAData): FlowchartConfig {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // Identification
  nodes.push({
    id: 'identified',
    type: 'data',
    label: 'Records identified',
    metadata: { count: data.identified },
  });

  // Duplicate removal (if applicable)
  let screeningSource = 'identified';
  if (data.duplicatesRemoved) {
    nodes.push({
      id: 'duplicates',
      type: 'process',
      label: 'Duplicates removed',
      metadata: { count: data.duplicatesRemoved },
    });

    nodes.push({
      id: 'unique',
      type: 'data',
      label: 'Unique records',
      metadata: { count: data.identified - data.duplicatesRemoved },
    });

    edges.push({
      id: 'e1',
      source: 'identified',
      target: 'duplicates',
    });

    edges.push({
      id: 'e2',
      source: 'duplicates',
      target: 'unique',
    });

    screeningSource = 'unique';
  }

  // Screening
  nodes.push({
    id: 'screened',
    type: 'process',
    label: 'Records screened',
    metadata: { count: data.screened },
  });

  nodes.push({
    id: 'excluded-screening',
    type: 'data',
    label: 'Records excluded',
    metadata: { count: data.excludedScreening },
  });

  edges.push({
    id: 'e3',
    source: screeningSource,
    target: 'screened',
  });

  edges.push({
    id: 'e4',
    source: 'screened',
    target: 'excluded-screening',
    label: 'Excluded',
  });

  // Full-text assessment
  nodes.push({
    id: 'full-text',
    type: 'process',
    label: 'Full-text assessed',
    metadata: { count: data.fullTextAssessed },
  });

  nodes.push({
    id: 'excluded-full-text',
    type: 'data',
    label: 'Full-text excluded',
    metadata: { count: data.excludedFullText },
  });

  edges.push({
    id: 'e5',
    source: 'screened',
    target: 'full-text',
    label: 'Eligible',
  });

  edges.push({
    id: 'e6',
    source: 'full-text',
    target: 'excluded-full-text',
    label: 'Excluded',
  });

  // Included
  nodes.push({
    id: 'included',
    type: 'terminal',
    label: 'Studies included',
    metadata: { count: data.included },
  });

  edges.push({
    id: 'e7',
    source: 'full-text',
    target: 'included',
    label: 'Included',
  });

  return {
    nodes,
    edges,
    layout: 'TB',
  };
}

// ============================================================================
// GENERIC PROCESS FLOW GENERATOR
// ============================================================================

/**
 * Generate a simple linear process flow from steps
 */
export function generateProcessFlow(steps: string[]): FlowchartConfig {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  steps.forEach((step, index) => {
    const isFirst = index === 0;
    const isLast = index === steps.length - 1;

    nodes.push({
      id: `step-${index}`,
      type: isFirst || isLast ? 'terminal' : 'process',
      label: step,
    });

    if (index > 0) {
      edges.push({
        id: `e-${index - 1}-${index}`,
        source: `step-${index - 1}`,
        target: `step-${index}`,
      });
    }
  });

  return {
    nodes,
    edges,
    layout: 'TB',
  };
}
