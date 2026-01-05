'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  // Get current view's loading and error state
  const isLoading = getCurrentViewLoading();
  const error = getCurrentViewError();

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
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Discovery</h2>
            <p className="text-xs text-muted-foreground">
              Explore research landscapes, connections, and emerging topics
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
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
        <div className="px-4 pt-2 border-b">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="network" className="text-xs">
              <Network className="w-3 h-3 mr-1" />
              Network
            </TabsTrigger>
            <TabsTrigger value="map" className="text-xs">
              <Map className="w-3 h-3 mr-1" />
              Map
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs">
              <Lightbulb className="w-3 h-3 mr-1" />
              Recommend
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="frontiers" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Frontiers
            </TabsTrigger>
            <TabsTrigger value="connector" className="text-xs">
              <Link2 className="w-3 h-3 mr-1" />
              Connect
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
 * Loading state component
 */
function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
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
}: {
  icon: React.ElementType;
  message: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <Icon className="w-12 h-12 text-muted-foreground mb-3" />
      <p className="text-sm font-medium mb-1">{message}</p>
      <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
