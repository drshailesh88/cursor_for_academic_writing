'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';
import {
  ArrowRight,
  Plus,
  Network,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

/**
 * Paper in the connection path
 */
export interface PathPaper {
  paperId: string;
  title: string;
  authors: string[];
  year: number;
  citationCount: number;
}

/**
 * Edge in the connection path
 */
export interface PathEdge {
  source: string;
  target: string;
  type: 'cites' | 'cited_by' | 'co_citation' | 'semantic' | 'same_author';
  weight: number;
  explanation: string;
}

/**
 * Complete path between two papers
 */
export interface ConnectionPath {
  id: string;
  papers: PathPaper[];
  edges: PathEdge[];
  totalWeight: number;
  type: 'citation' | 'semantic' | 'author' | 'method';
}

export interface LiteratureConnectionData {
  sourcePaper: PathPaper;
  targetPaper: PathPaper;
  paths: ConnectionPath[];
  shortestPath: ConnectionPath;
}

interface LiteratureConnectorProps {
  availablePapers?: PathPaper[];
  connectionData?: LiteratureConnectionData;
  onConnect?: (sourceId: string, targetId: string) => void;
  onAddIntermediatesToLibrary?: (paperIds: string[]) => void;
  onPaperClick?: (paperId: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Literature connector finding paths between papers
 *
 * Features:
 * - Two paper selectors (from/to)
 * - Path visualization
 * - Step-by-step connection explanation
 * - Add intermediates to library
 */
export function LiteratureConnector({
  availablePapers = [],
  connectionData,
  onConnect,
  onAddIntermediatesToLibrary,
  onPaperClick,
  isLoading = false,
  className
}: LiteratureConnectorProps) {
  const [sourcePaperId, setSourcePaperId] = useState<string>('');
  const [targetPaperId, setTargetPaperId] = useState<string>('');
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const selectedPath = useMemo(() => {
    if (!connectionData || !selectedPathId) {
      return connectionData?.shortestPath;
    }
    return connectionData.paths.find(p => p.id === selectedPathId);
  }, [connectionData, selectedPathId]);

  const handleConnect = () => {
    if (sourcePaperId && targetPaperId && onConnect) {
      onConnect(sourcePaperId, targetPaperId);
    }
  };

  const handleAddIntermediates = () => {
    if (selectedPath && onAddIntermediatesToLibrary) {
      // Add all papers except source and target
      const intermediates = selectedPath.papers
        .slice(1, -1)
        .map(p => p.paperId);
      onAddIntermediatesToLibrary(intermediates);
    }
  };

  const togglePathExpanded = (pathId: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(pathId)) {
        next.delete(pathId);
      } else {
        next.add(pathId);
      }
      return next;
    });
  };

  const getEdgeTypeColor = (type: PathEdge['type']) => {
    const colors = {
      cites: 'text-blue-500',
      cited_by: 'text-green-500',
      co_citation: 'text-purple-500',
      semantic: 'text-pink-500',
      same_author: 'text-amber-500'
    };
    return colors[type];
  };

  const getEdgeTypeLabel = (type: PathEdge['type']) => {
    const labels = {
      cites: 'Cites',
      cited_by: 'Cited by',
      co_citation: 'Co-cited with',
      semantic: 'Semantically similar',
      same_author: 'Same author'
    };
    return labels[type];
  };

  const PathVisualization = ({ path }: { path: ConnectionPath }) => {
    const isExpanded = expandedPaths.has(path.id);

    return (
      <Card className="mb-3">
        <CardHeader className="pb-3 cursor-pointer" onClick={() => togglePathExpanded(path.id)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Path {path.id} ({path.papers.length - 1} steps)
              </CardTitle>
              <CardDescription className="text-xs">
                {path.type.charAt(0).toUpperCase() + path.type.slice(1)} connection
                {' • '}
                Strength: {(path.totalWeight * 100).toFixed(0)}%
              </CardDescription>
            </div>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {path.papers.map((paper, i) => (
                <div key={paper.paperId}>
                  {/* Paper card */}
                  <div
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent",
                      (i === 0 || i === path.papers.length - 1) && "bg-muted/50"
                    )}
                    onClick={() => onPaperClick?.(paper.paperId)}
                  >
                    <h4 className="text-sm font-medium line-clamp-2 mb-1">
                      {i === 0 && '📍 '}
                      {i === path.papers.length - 1 && '🎯 '}
                      {paper.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {paper.authors.slice(0, 2).join(', ')}
                      {paper.authors.length > 2 && ' et al.'}
                      {' • '}
                      {paper.year}
                      {' • '}
                      {paper.citationCount} citations
                    </p>
                  </div>

                  {/* Connection edge */}
                  {i < path.edges.length && (
                    <div className="my-2 ml-6 pl-4 border-l-2 border-muted">
                      <div className="flex items-start gap-2 py-2">
                        <ArrowRight className={cn("w-4 h-4 mt-0.5 flex-shrink-0", getEdgeTypeColor(path.edges[i].type))} />
                        <div className="flex-1">
                          <p className="text-xs font-medium">
                            {getEdgeTypeLabel(path.edges[i].type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {path.edges[i].explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className={cn("h-full flex flex-col bg-background rounded-lg border", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Network className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Literature Connector</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Find connections between any two papers through citations and semantics
        </p>
      </div>

      {/* Selectors */}
      <div className="p-4 border-b space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            From
          </label>
          <select
            value={sourcePaperId}
            onChange={(e) => setSourcePaperId(e.target.value)}
            className="w-full p-2 text-sm border rounded-md bg-background"
            disabled={isLoading}
          >
            <option value="">Select source paper...</option>
            {availablePapers.map(paper => (
              <option key={paper.paperId} value={paper.paperId}>
                {paper.title.slice(0, 80)}
                {paper.title.length > 80 && '...'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            To
          </label>
          <select
            value={targetPaperId}
            onChange={(e) => setTargetPaperId(e.target.value)}
            className="w-full p-2 text-sm border rounded-md bg-background"
            disabled={isLoading}
          >
            <option value="">Select target paper...</option>
            {availablePapers.map(paper => (
              <option key={paper.paperId} value={paper.paperId}>
                {paper.title.slice(0, 80)}
                {paper.title.length > 80 && '...'}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleConnect}
          disabled={!sourcePaperId || !targetPaperId || isLoading}
          className="w-full"
        >
          {isLoading ? 'Finding paths...' : 'Find Connection'}
        </Button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {!connectionData && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Network className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Select two papers to find connections between them
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3" />
            <p className="text-sm text-muted-foreground">Analyzing citation network...</p>
          </div>
        )}

        {connectionData && !isLoading && (
          <div>
            {/* Summary */}
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <Info className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Found {connectionData.paths.length} path{connectionData.paths.length !== 1 && 's'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Shortest path has {connectionData.shortestPath.papers.length - 1} steps
                  </p>
                </div>
              </div>
            </div>

            {/* Path selector */}
            {connectionData.paths.length > 1 && (
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  View path
                </label>
                <select
                  value={selectedPathId || connectionData.shortestPath.id}
                  onChange={(e) => setSelectedPathId(e.target.value)}
                  className="w-full p-2 text-sm border rounded-md bg-background"
                >
                  {connectionData.paths.map((path, i) => (
                    <option key={path.id} value={path.id}>
                      Path {i + 1}: {path.papers.length - 1} steps ({path.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selected path visualization */}
            {selectedPath && (
              <div className="mb-4">
                <PathVisualization path={selectedPath} />
              </div>
            )}

            {/* Actions */}
            {selectedPath && selectedPath.papers.length > 2 && (
              <Button
                onClick={handleAddIntermediates}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add {selectedPath.papers.length - 2} Intermediate Paper
                {selectedPath.papers.length - 2 !== 1 && 's'} to Library
              </Button>
            )}

            {/* All paths (collapsed) */}
            {connectionData.paths.length > 1 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">All Paths</h3>
                {connectionData.paths.map(path => (
                  <PathVisualization key={path.id} path={path} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
