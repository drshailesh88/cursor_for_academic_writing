'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Loader2,
  CheckCircle2,
  Circle,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type NodeStatus = 'pending' | 'active' | 'complete';

interface TreeNode {
  id: string;
  label: string;
  status: NodeStatus;
  sourceCount: number;
  children?: TreeNode[];
  findings?: string[];
}

interface ExplorationTreeProps {
  data: TreeNode[];
  onNodeClick?: (node: TreeNode) => void;
  className?: string;
}

const statusConfig: Record<NodeStatus, {
  color: string;
  bgColor: string;
  icon: typeof Circle;
  label: string;
}> = {
  pending: {
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    icon: Circle,
    label: 'Pending',
  },
  active: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    icon: Loader2,
    label: 'Active',
  },
  complete: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
    icon: CheckCircle2,
    label: 'Complete',
  },
};

function TreeNodeComponent({
  node,
  depth = 0,
  onNodeClick,
}: {
  node: TreeNode;
  depth?: number;
  onNodeClick?: (node: TreeNode) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  const hasChildren = node.children && node.children.length > 0;

  const config = statusConfig[node.status];
  const StatusIcon = config.icon;
  const isActive = node.status === 'active';

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onNodeClick?.(node);
  };

  return (
    <div className="select-none">
      {/* Node */}
      <div
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
          'hover:bg-muted/50',
          config.bgColor,
          depth > 0 && 'ml-6 border-l-2 border-border/40'
        )}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        ) : (
          <div className="w-4" />
        )}

        {/* Folder Icon */}
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className={cn('w-4 h-4', config.color)} />
          ) : (
            <Folder className={cn('w-4 h-4', config.color)} />
          )
        ) : (
          <FileText className={cn('w-4 h-4', config.color)} />
        )}

        {/* Status Icon */}
        <StatusIcon
          className={cn('w-4 h-4', config.color, isActive && 'animate-spin')}
        />

        {/* Label */}
        <span className={cn('flex-1 text-sm font-medium', config.color)}>
          {node.label}
        </span>

        {/* Source Count Badge */}
        {node.sourceCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-background/60 rounded-full">
            <FileText className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {node.sourceCount}
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className={cn('px-2 py-0.5 rounded-full text-xs font-medium', config.color)}>
          {config.label}
        </div>
      </div>

      {/* Findings (when expanded) */}
      {isExpanded && node.findings && node.findings.length > 0 && (
        <div className="ml-12 mt-2 space-y-1">
          {node.findings.map((finding, index) => (
            <div
              key={index}
              className="text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-md"
            >
              • {finding}
            </div>
          ))}
        </div>
      )}

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ExplorationTree({ data, onNodeClick, className }: ExplorationTreeProps) {
  const [expandAll, setExpandAll] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className={cn('p-8 text-center', className)}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Folder className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          No exploration tree yet
        </h3>
        <p className="text-xs text-muted-foreground">
          Start a research session to see the exploration tree
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Exploration Tree</h3>
          <p className="text-xs text-muted-foreground">
            Research perspectives and branches
          </p>
        </div>
        <button
          onClick={() => setExpandAll(!expandAll)}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {expandAll ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-3 py-2 bg-muted/30 rounded-lg text-xs">
        <span className="text-muted-foreground">Status:</span>
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', config.color.replace('text-', 'bg-'))} />
            <span className={config.color}>{config.label}</span>
          </div>
        ))}
      </div>

      {/* Tree */}
      <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
        {data.map((node) => (
          <TreeNodeComponent key={node.id} node={node} onNodeClick={onNodeClick} />
        ))}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center gap-6 px-3 py-2 bg-muted/30 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Total Branches:</span>
          <span className="font-medium">
            {data.reduce((sum, node) => {
              const countNodes = (n: TreeNode): number =>
                1 + (n.children?.reduce((s, c) => s + countNodes(c), 0) || 0);
              return sum + countNodes(node);
            }, 0)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Total Sources:</span>
          <span className="font-medium">
            {data.reduce((sum, node) => {
              const countSources = (n: TreeNode): number =>
                n.sourceCount + (n.children?.reduce((s, c) => s + countSources(c), 0) || 0);
              return sum + countSources(node);
            }, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
