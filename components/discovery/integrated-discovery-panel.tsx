'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import {
  Network,
  Map,
  Lightbulb,
  Clock,
  Search,
  Loader2,
  Link2,
  TrendingUp,
  AlertCircle,
  RefreshCcw,
  X,
  Info,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Import discovery components
import { CitationNetwork, type GraphData, type NetworkNode } from './citation-network';
import { KnowledgeMap, type KnowledgeMapData } from './knowledge-map';
import { RecommendationsPanel, type RecommendationsData } from './recommendations-panel';
import { TimelineView, type TimelineData } from './timeline-view';
import { FrontierDashboard, type FrontierDashboardData } from './frontier-dashboard';
import { LiteratureConnector, type LiteratureConnectionData, type PathPaper } from './literature-connector';

// Import discovery context
import { useDiscoveryContext } from '@/lib/contexts/discovery-context';
import type { DiscoveredPaper } from '@/lib/discovery/types';

/**
 * Paper type for the integrated panel
 */
export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  citationCount?: number;
  doi?: string;
  pmid?: string;
}

interface IntegratedDiscoveryPanelProps {
  seedPapers?: Paper[];
  onAddToLibrary?: (paper: Paper) => void;
  onAddCitation?: (citation: { paperId: string; title: string; authors: string[] }) => void;
  className?: string;
}

/**
 * Integrated Discovery Panel
 *
 * Combines all discovery features into a single cohesive interface:
 * - Citation Network: Build and explore citation graphs
 * - Knowledge Map: Visualize research landscapes
 * - Recommendations: Get personalized paper suggestions
 * - Timeline: View research evolution over time
 * - Frontiers: Discover emerging topics and gaps
 * - Connector: Find paths between papers
 *
 * Uses DiscoveryContext for state management
 */
export function IntegratedDiscoveryPanel({
  seedPapers = [],
  onAddToLibrary,
  onAddCitation,
  className,
}: IntegratedDiscoveryPanelProps) {
  const {
    activeView,
    setActiveView,
    networkData,
    mapData,
    recommendations,
    timelineData,
    frontiersData,
    connectionPath,
    getCurrentViewLoading,
    getCurrentViewError,
    buildNetwork,
    generateMap,
    getRecommendations,
    findConnection,
    getTimeline,
    detectFrontiers,
    clearError,
  } = useDiscoveryContext();

  // Local state for input controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Get current view's loading and error state
  const isLoading = getCurrentViewLoading();
  const error = getCurrentViewError();

  /**
   * Keyboard shortcuts handler
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Tab navigation: 1-6 keys for quick tab switching
      if (e.key >= '1' && e.key <= '6' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const tabs = ['network', 'map', 'recommendations', 'timeline', 'frontiers', 'connector'];
        const index = parseInt(e.key) - 1;
        if (index < tabs.length) {
          setActiveView(tabs[index] as any);
        }
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const tabs = ['network', 'map', 'recommendations', 'timeline', 'frontiers', 'connector'];
        const currentIndex = tabs.indexOf(activeView);
        if (currentIndex > 0) {
          setActiveView(tabs[currentIndex - 1] as any);
        }
      }

      if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const tabs = ['network', 'map', 'recommendations', 'timeline', 'frontiers', 'connector'];
        const currentIndex = tabs.indexOf(activeView);
        if (currentIndex < tabs.length - 1) {
          setActiveView(tabs[currentIndex + 1] as any);
        }
      }

      // R key to refresh
      if (e.key === 'r' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        handleRefresh();
      }

      // Escape to clear error
      if (e.key === 'Escape' && error) {
        e.preventDefault();
        clearError(activeView);
      }

      // / or Ctrl+K to focus search
      if ((e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) && activeView !== 'connector') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, error, clearError, handleRefresh, setActiveView]);

  /**
   * Handle search/discover action
   */
  const handleDiscover = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;

    try {
      clearError(activeView);

      switch (activeView) {
        case 'network':
          // Use selected papers or seed papers for network
          const paperIds = selectedPaperIds.length > 0
            ? selectedPaperIds
            : seedPapers.slice(0, 5).map(p => p.id);

          if (paperIds.length === 0) {
            throw new Error('Please select papers or add papers to your library first');
          }

          await buildNetwork(paperIds);
          break;

        case 'map':
          await generateMap(query);
          break;

        case 'recommendations':
          // Use user's library papers
          const libraryIds = seedPapers.map(p => p.id);
          if (libraryIds.length === 0) {
            throw new Error('Please add papers to your library first to get recommendations');
          }
          await getRecommendations(libraryIds);
          break;

        case 'timeline':
          await getTimeline(query);
          break;

        case 'frontiers':
          await detectFrontiers(query);
          break;

        case 'connector':
          // Connector has its own UI for selecting papers
          break;
      }
    } catch (error) {
      console.error('Discovery error:', error);
    }
  }, [
    searchQuery,
    activeView,
    selectedPaperIds,
    seedPapers,
    buildNetwork,
    generateMap,
    getRecommendations,
    getTimeline,
    detectFrontiers,
    clearError,
  ]);

  /**
   * Handle view refresh
   */
  const handleRefresh = useCallback(() => {
    handleDiscover();
  }, [handleDiscover]);

  /**
   * Handle key press in search input
   */
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading) {
        handleDiscover();
      }
    },
    [handleDiscover, isLoading]
  );

  /**
   * Get placeholder text for search input based on active view
   */
  const getSearchPlaceholder = useCallback(() => {
    switch (activeView) {
      case 'network':
        return 'Search papers or use your library papers...';
      case 'map':
        return 'Enter research topic to map (e.g., "deep learning in healthcare")';
      case 'recommendations':
        return 'Get recommendations based on your library';
      case 'timeline':
        return 'Enter research topic for timeline (e.g., "CRISPR gene editing")';
      case 'frontiers':
        return 'Enter research domain to analyze (e.g., "artificial intelligence")';
      case 'connector':
        return 'Select two papers to find connections';
      default:
        return 'Search papers, topics, or enter queries...';
    }
  }, [activeView]);

  /**
   * Transform network data for CitationNetwork component
   */
  const graphData: GraphData | undefined = useMemo(() => {
    if (!networkData) return undefined;

    const nodes: NetworkNode[] = networkData.papers.map(paper => ({
      id: paper.paperId,
      paperId: paper.paperId,
      title: '', // Would need to fetch from paper details
      authors: [],
      year: 2024, // Would need from paper details
      citationCount: 0,
      isSeed: networkData.seedPaperIds.includes(paper.paperId),
      x: paper.x,
      y: paper.y,
    }));

    return {
      nodes,
      edges: networkData.edges,
    };
  }, [networkData]);

  /**
   * Transform map data for KnowledgeMap component
   */
  const knowledgeMapData: KnowledgeMapData | undefined = useMemo(() => {
    if (!mapData) return undefined;

    return {
      clusters: mapData.clusters.map(cluster => ({
        id: cluster.id,
        label: cluster.label,
        description: cluster.description,
        x: cluster.x,
        y: cluster.y,
        radius: cluster.radius,
        color: cluster.color,
        paperCount: cluster.paperCount,
      })),
      papers: mapData.papers.map(paper => ({
        paperId: paper.paperId,
        clusterId: paper.clusterId,
        x: paper.x,
        y: paper.y,
        isUserPaper: paper.isUserPaper,
        isKeyPaper: paper.isKeyPaper,
      })),
      connections: mapData.connections,
    };
  }, [mapData]);

  /**
   * Transform recommendations for RecommendationsPanel
   */
  const recommendationsData: RecommendationsData | undefined = useMemo(() => {
    if (!recommendations) return undefined;

    return {
      trending: recommendations.hotNow,
      missing: recommendations.missingFromReview,
      recent: recommendations.newThisWeek,
      sameAuthors: recommendations.sameAuthors,
      extending: recommendations.extendingWork,
    };
  }, [recommendations]);

  /**
   * Transform timeline data for TimelineView
   */
  const timelineViewData: TimelineData | undefined = useMemo(() => {
    if (!timelineData) return undefined;

    return {
      periods: timelineData.periods,
      milestones: timelineData.milestones,
      papers: timelineData.papers,
      trends: timelineData.trends,
    };
  }, [timelineData]);

  /**
   * Transform frontiers data for FrontierDashboard
   */
  const frontierData: FrontierDashboardData | undefined = useMemo(() => {
    if (!frontiersData) return undefined;

    return {
      emergingTopics: frontiersData.frontiers,
      gaps: frontiersData.gaps,
      opportunities: frontiersData.opportunities,
      metrics: frontiersData.metrics,
    };
  }, [frontiersData]);

  /**
   * Transform connection data for LiteratureConnector
   */
  const connectionData: LiteratureConnectionData | undefined = useMemo(() => {
    if (!connectionPath) return undefined;

    // This would require fetching paper details for the paper IDs
    // For now, return undefined and let LiteratureConnector handle it
    return undefined;
  }, [connectionPath]);

  /**
   * Handle paper connection request
   */
  const handleConnect = useCallback(
    async (sourceId: string, targetId: string) => {
      try {
        clearError('connector');
        await findConnection(sourceId, targetId);
      } catch (error) {
        console.error('Connection error:', error);
      }
    },
    [findConnection, clearError]
  );

  /**
   * Get available papers for connector (from seed papers)
   */
  const availablePapersForConnector: PathPaper[] = useMemo(() => {
    return seedPapers.map(paper => ({
      paperId: paper.id,
      title: paper.title,
      authors: paper.authors,
      year: paper.year,
      citationCount: paper.citationCount || 0,
    }));
  }, [seedPapers]);

  return (
    <div className={cn('h-full flex flex-col bg-background rounded-lg border', className)}>
      {/* Header */}
      <div className="p-3 md:p-4 border-b space-y-3">
        <div className="flex items-start md:items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-base md:text-lg font-semibold truncate">Discovery</h2>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Explore research landscapes, connections, and emerging topics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <KeyboardShortcutsHint />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 md:mr-2 animate-spin" />
                  <span className="hidden md:inline">Loading...</span>
                </>
              ) : (
                <>
                  <RefreshCcw className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Refresh</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search/Action Bar */}
        {activeView !== 'connector' && (
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleDiscover}
              disabled={(!searchQuery.trim() && activeView !== 'recommendations') || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Discover'
              )}
            </Button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearError(activeView)}
                className="h-auto p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeView}
        onValueChange={(value) => setActiveView(value as any)}
        className="flex-1 flex flex-col"
      >
        <div className="px-2 md:px-4 pt-2 border-b overflow-x-auto">
          <TabsList className="inline-flex w-auto md:grid md:w-full md:grid-cols-6 h-auto">
            <TabsTrigger value="network" className="text-xs whitespace-nowrap px-2 md:px-3">
              <Network className="w-3 h-3 md:mr-1" />
              <span className="hidden sm:inline ml-1">Network</span>
              <span className="sm:hidden ml-1">1</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="text-xs whitespace-nowrap px-2 md:px-3">
              <Map className="w-3 h-3 md:mr-1" />
              <span className="hidden sm:inline ml-1">Map</span>
              <span className="sm:hidden ml-1">2</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs whitespace-nowrap px-2 md:px-3">
              <Lightbulb className="w-3 h-3 md:mr-1" />
              <span className="hidden sm:inline ml-1">Recommend</span>
              <span className="sm:hidden ml-1">3</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs whitespace-nowrap px-2 md:px-3">
              <Clock className="w-3 h-3 md:mr-1" />
              <span className="hidden sm:inline ml-1">Timeline</span>
              <span className="sm:hidden ml-1">4</span>
            </TabsTrigger>
            <TabsTrigger value="frontiers" className="text-xs whitespace-nowrap px-2 md:px-3">
              <TrendingUp className="w-3 h-3 md:mr-1" />
              <span className="hidden sm:inline ml-1">Frontiers</span>
              <span className="sm:hidden ml-1">5</span>
            </TabsTrigger>
            <TabsTrigger value="connector" className="text-xs whitespace-nowrap px-2 md:px-3">
              <Link2 className="w-3 h-3 md:mr-1" />
              <span className="hidden sm:inline ml-1">Connect</span>
              <span className="sm:hidden ml-1">6</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Citation Network */}
          <TabsContent value="network" className="h-full m-0 p-4">
            {isLoading ? (
              <LoadingState message="Building citation network..." />
            ) : graphData ? (
              <CitationNetwork data={graphData} />
            ) : (
              <EmptyState
                icon={Network}
                message="No network data available"
                description="Select papers from your library or search for papers to generate a citation network"
              />
            )}
          </TabsContent>

          {/* Knowledge Map */}
          <TabsContent value="map" className="h-full m-0 p-4">
            {isLoading ? (
              <LoadingState message="Generating knowledge map..." />
            ) : knowledgeMapData ? (
              <KnowledgeMap data={knowledgeMapData} />
            ) : (
              <EmptyState
                icon={Map}
                message="No map data available"
                description="Enter a research topic to visualize the research landscape and identify clusters"
              />
            )}
          </TabsContent>

          {/* Recommendations */}
          <TabsContent value="recommendations" className="h-full m-0 p-0">
            {isLoading ? (
              <div className="p-4 h-full">
                <LoadingState message="Finding recommendations..." />
              </div>
            ) : recommendationsData ? (
              <RecommendationsPanel
                data={recommendationsData}
                onRefresh={handleRefresh}
                isRefreshing={isLoading}
              />
            ) : (
              <div className="p-4 h-full">
                <EmptyState
                  icon={Lightbulb}
                  message="No recommendations available"
                  description="Add papers to your library to receive personalized paper recommendations"
                />
              </div>
            )}
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline" className="h-full m-0 p-4">
            {isLoading ? (
              <LoadingState message="Building timeline..." />
            ) : timelineViewData ? (
              <TimelineView data={timelineViewData} />
            ) : (
              <EmptyState
                icon={Clock}
                message="No timeline data available"
                description="Enter a research topic to see its evolution over time with key milestones and trends"
              />
            )}
          </TabsContent>

          {/* Research Frontiers */}
          <TabsContent value="frontiers" className="h-full m-0 p-0">
            {isLoading ? (
              <div className="p-4 h-full">
                <LoadingState message="Analyzing research frontiers..." />
              </div>
            ) : frontierData ? (
              <FrontierDashboard
                data={frontierData}
                onRefresh={handleRefresh}
                isRefreshing={isLoading}
              />
            ) : (
              <div className="p-4 h-full">
                <EmptyState
                  icon={TrendingUp}
                  message="No frontier data available"
                  description="Enter a research domain to discover emerging topics, gaps, and opportunities"
                />
              </div>
            )}
          </TabsContent>

          {/* Literature Connector */}
          <TabsContent value="connector" className="h-full m-0 p-4">
            <LiteratureConnector
              availablePapers={availablePapersForConnector}
              connectionData={connectionData}
              onConnect={handleConnect}
              onAddIntermediatesToLibrary={(paperIds) => {
                // TODO: Implement adding intermediates to library
                console.log('Add intermediates:', paperIds);
              }}
              onPaperClick={(paperId) => {
                // TODO: Implement paper details view
                console.log('Paper clicked:', paperId);
              }}
              isLoading={isLoading}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

/**
 * Enhanced loading state component with progress
 */
function LoadingState({
  message,
  progress,
  showProgress = false
}: {
  message: string;
  progress?: number;
  showProgress?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-sm font-medium text-foreground mb-2">{message}</p>
      {showProgress && progress !== undefined && (
        <div className="w-full max-w-sm">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center mt-2">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}
      <div className="mt-6 text-xs text-muted-foreground space-y-1 text-center">
        <p>This may take a moment...</p>
        <p className="flex items-center justify-center gap-2">
          <kbd className="px-2 py-1 text-xs bg-muted rounded">Esc</kbd>
          <span>to cancel</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({
  icon: Icon,
  message,
  description,
  suggestions,
}: {
  icon: React.ElementType;
  message: string;
  description: string;
  suggestions?: string[];
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <Icon className="w-12 h-12 text-muted-foreground mb-3" />
      <p className="text-sm font-medium mb-1">{message}</p>
      <p className="text-xs text-muted-foreground max-w-sm mb-4">{description}</p>

      {suggestions && suggestions.length > 0 && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-medium">Suggestions:</p>
          </div>
          <ul className="text-xs text-left space-y-1 text-muted-foreground">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Enhanced error state with retry
 */
function ErrorState({
  error,
  onRetry,
  onDismiss,
}: {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="mt-2">{error}</AlertDescription>
        </Alert>

        <div className="flex gap-2 justify-center">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button onClick={onDismiss} variant="ghost" size="sm">
              Dismiss
            </Button>
          )}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-medium">Troubleshooting:</p>
          </div>
          <ul className="text-xs text-left space-y-1 text-muted-foreground">
            <li>• Check your internet connection</li>
            <li>• Try refreshing the page</li>
            <li>• Verify your search parameters</li>
            <li>• Try a different discovery mode</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Keyboard shortcuts helper
 */
function KeyboardShortcutsHint() {
  return (
    <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">1-6</kbd>
        <span>Switch tabs</span>
      </div>
      <div className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">⌘/Ctrl+R</kbd>
        <span>Refresh</span>
      </div>
      <div className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">/</kbd>
        <span>Search</span>
      </div>
    </div>
  );
}
