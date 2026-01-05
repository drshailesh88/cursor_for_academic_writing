'use client';

import { useState, useCallback } from 'react';
import type {
  CitationNetwork,
  KnowledgeMap,
  ResearchTimeline,
  LiteratureConnection,
  Recommendation,
  ResearchFrontier,
  NetworkConfig,
  MapConfig,
  TimelineConfig,
} from '@/lib/discovery/types';

/**
 * Discovery view types
 */
export type DiscoveryView =
  | 'network'
  | 'map'
  | 'recommendations'
  | 'timeline'
  | 'frontiers'
  | 'connector';

/**
 * API Response types
 */
interface NetworkResponse {
  success: boolean;
  network: CitationNetwork;
  metrics: {
    totalPapers: number;
    totalEdges: number;
    avgConnections: number;
    clusterCount: number;
  };
  keyPapers: string[];
  message: string;
}

interface MapResponse {
  success: boolean;
  map: KnowledgeMap;
  gaps: Array<{
    topic: string;
    adjacentClusters: string[];
    explanation: string;
  }>;
  representativePapers: Array<{
    clusterId: string;
    clusterLabel: string;
    papers: string[];
  }>;
  summary: {
    totalClusters: number;
    totalPapers: number;
    totalConnections: number;
    gapsIdentified: number;
  };
  message: string;
}

interface RecommendationsResponse {
  success: boolean;
  recommendations: {
    hotNow: Recommendation[];
    missingFromReview: Recommendation[];
    newThisWeek: Recommendation[];
    sameAuthors: Recommendation[];
    extendingWork: Recommendation[];
  };
  summary: {
    basedOnPapers: number;
    totalRecommendations: number;
    byCategory: {
      trending: number;
      missing: number;
      recent: number;
      sameAuthors: number;
      extending: number;
    };
  };
  message: string;
}

interface TimelineResponse {
  success: boolean;
  timeline: ResearchTimeline;
  evolution: Array<{
    period: string;
    years: string;
    paperCount: number;
    keyTopics: string[];
    description: string;
  }>;
  breakthroughs: Array<{
    year: number;
    paperId?: string;
    label: string;
    description: string;
  }>;
  trendInsights: Array<{
    topic: string;
    direction: 'rising' | 'stable' | 'declining';
    growthRate: number;
    period: string;
    paperCount: number;
  }>;
  summary: {
    totalPapers: number;
    timeSpan: string;
    periods: number;
    milestones: number;
    risingTopics: number;
    decliningTopics: number;
  };
  message: string;
}

interface ConnectionResponse {
  success: boolean;
  connection: {
    sourcePaperId: string;
    targetPaperId: string;
    paths: Array<{
      id: string;
      papers: string[];
      edges: Array<{
        source: string;
        target: string;
        type: 'cites' | 'cited_by' | 'co_citation' | 'semantic' | 'same_author';
        weight: number;
        explanation: string;
      }>;
      totalWeight: number;
      type: 'citation' | 'semantic' | 'author' | 'method';
      explanation: string;
      length: number;
      pathType: string;
    }>;
    shortestPath: any;
    connectionStrength: number;
  };
  intermediatePapers: string[];
  summary: {
    totalPaths: number;
    shortestPathLength: number;
    connectionTypes: string[];
    strongConnection: boolean;
  };
  message: string;
}

interface FrontiersResponse {
  success: boolean;
  frontiers: {
    domain: string;
    emergingTopics: {
      accelerating: any[];
      emerging: any[];
      all: any[];
    };
    gaps: {
      highImpact: any[];
      all: any[];
    };
    opportunities: any[];
    metrics: {
      totalPapers: number;
      timeSpan: { start: number; end: number };
      avgGrowthRate: number;
      diversityScore: number;
      maturityScore: number;
    };
  };
  predictions: Array<{
    topic: string;
    prediction: string;
    confidence: 'high' | 'medium';
  }>;
  growthMetrics: any;
  summary: {
    totalEmergingTopics: number;
    acceleratingTopics: number;
    gapsIdentified: number;
    highImpactGaps: number;
    opportunitiesFound: number;
    timeSpan: string;
    avgGrowthRate: number;
  };
  message: string;
}

/**
 * Hook state for each view
 */
interface ViewState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Discovery hook for managing all discovery features
 */
export function useDiscovery() {
  // Active view
  const [activeView, setActiveView] = useState<DiscoveryView>('network');

  // View states
  const [networkState, setNetworkState] = useState<ViewState<CitationNetwork>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const [mapState, setMapState] = useState<ViewState<KnowledgeMap>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const [recommendationsState, setRecommendationsState] = useState<ViewState<{
    hotNow: Recommendation[];
    missingFromReview: Recommendation[];
    newThisWeek: Recommendation[];
    sameAuthors: Recommendation[];
    extendingWork: Recommendation[];
  }>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const [timelineState, setTimelineState] = useState<ViewState<ResearchTimeline>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const [frontiersState, setFrontiersState] = useState<ViewState<ResearchFrontier>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const [connectionState, setConnectionState] = useState<ViewState<LiteratureConnection>>({
    data: null,
    isLoading: false,
    error: null,
  });

  /**
   * Build citation network from seed papers
   */
  const buildNetwork = useCallback(
    async (
      seedPaperIds: string[],
      config?: Partial<NetworkConfig>
    ) => {
      setNetworkState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch('/api/discovery/network', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seedPaperIds,
            depth: config?.depth || 2,
            maxPapers: config?.maxPapers || 50,
            minCitations: config?.minCitations || 5,
            algorithms: config?.algorithms || ['co_citation', 'bibliographic_coupling', 'direct'],
            yearRange: config?.yearRange,
            onlyOpenAccess: config?.onlyOpenAccess || false,
          }),
        });

        if (!response.ok) {
          throw new Error(`Network request failed: ${response.statusText}`);
        }

        const result: NetworkResponse = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Failed to build network');
        }

        setNetworkState({
          data: result.network,
          isLoading: false,
          error: null,
        });

        return result.network;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to build citation network';
        setNetworkState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  /**
   * Generate knowledge map for a topic
   */
  const generateMap = useCallback(
    async (topic: string, config?: Partial<MapConfig>) => {
      setMapState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch('/api/discovery/map', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            clusterCount: config?.clusterCount || 5,
            paperLimit: config?.paperLimit || 100,
            timeRange: config?.timeRange,
            showLabels: config?.showLabels !== false,
            showConnections: config?.showConnections !== false,
          }),
        });

        if (!response.ok) {
          throw new Error(`Map request failed: ${response.statusText}`);
        }

        const result: MapResponse = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Failed to generate map');
        }

        setMapState({
          data: result.map,
          isLoading: false,
          error: null,
        });

        return result.map;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate knowledge map';
        setMapState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  /**
   * Get personalized recommendations
   */
  const getRecommendations = useCallback(
    async (
      paperIds: string[],
      userId?: string,
      limit: number = 10,
      categories?: string[]
    ) => {
      setRecommendationsState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch('/api/discovery/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paperIds,
            userId,
            limit,
            categories,
          }),
        });

        if (!response.ok) {
          throw new Error(`Recommendations request failed: ${response.statusText}`);
        }

        const result: RecommendationsResponse = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Failed to get recommendations');
        }

        setRecommendationsState({
          data: result.recommendations,
          isLoading: false,
          error: null,
        });

        return result.recommendations;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get recommendations';
        setRecommendationsState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  /**
   * Find connection path between two papers
   */
  const findConnection = useCallback(
    async (
      sourcePaperId: string,
      targetPaperId: string,
      maxDepth: number = 3
    ) => {
      setConnectionState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch('/api/discovery/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourcePaperId,
            targetPaperId,
            maxDepth,
          }),
        });

        if (!response.ok) {
          throw new Error(`Connection request failed: ${response.statusText}`);
        }

        const result: ConnectionResponse = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Failed to find connection');
        }

        // Transform to LiteratureConnection format
        const connectionData: LiteratureConnection = {
          id: `${sourcePaperId}-${targetPaperId}`,
          userId: 'anonymous', // TODO: Get from auth context
          sourcePaperId,
          targetPaperId,
          paths: result.connection.paths.map(path => ({
            id: path.id,
            papers: path.papers,
            edges: path.edges,
            totalWeight: path.totalWeight,
            type: path.type,
          })),
          shortestPath: result.connection.shortestPath,
          createdAt: new Date() as any, // Firestore Timestamp
        };

        setConnectionState({
          data: connectionData,
          isLoading: false,
          error: null,
        });

        return connectionData;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to find connection';
        setConnectionState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  /**
   * Get research timeline for a topic
   */
  const getTimeline = useCallback(
    async (
      topic: string,
      config?: Partial<TimelineConfig>
    ) => {
      setTimelineState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const currentYear = new Date().getFullYear();
        const response = await fetch('/api/discovery/timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            startYear: config?.startYear || currentYear - 20,
            endYear: config?.endYear || currentYear,
            groupBy: config?.groupBy || 'era',
            showMilestones: config?.showMilestones !== false,
            showTrends: config?.showTrends !== false,
          }),
        });

        if (!response.ok) {
          throw new Error(`Timeline request failed: ${response.statusText}`);
        }

        const result: TimelineResponse = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Failed to get timeline');
        }

        setTimelineState({
          data: result.timeline,
          isLoading: false,
          error: null,
        });

        return result.timeline;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get research timeline';
        setTimelineState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  /**
   * Detect research frontiers for a topic
   */
  const detectFrontiers = useCallback(
    async (
      topic: string,
      yearRange: number = 5,
      includeGrowthMetrics: boolean = false
    ) => {
      setFrontiersState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch('/api/discovery/frontiers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            yearRange,
            includeGrowthMetrics,
          }),
        });

        if (!response.ok) {
          throw new Error(`Frontiers request failed: ${response.statusText}`);
        }

        const result: FrontiersResponse = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Failed to detect frontiers');
        }

        // Transform to ResearchFrontier format
        const frontiersData: ResearchFrontier = {
          domain: result.frontiers.domain,
          frontiers: result.frontiers.emergingTopics.all,
          gaps: result.frontiers.gaps.all,
          opportunities: result.frontiers.opportunities,
          metrics: result.frontiers.metrics,
          generatedAt: new Date() as any, // Firestore Timestamp
        };

        setFrontiersState({
          data: frontiersData,
          isLoading: false,
          error: null,
        });

        return frontiersData;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to detect research frontiers';
        setFrontiersState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  /**
   * Clear all data (useful for starting fresh)
   */
  const clearData = useCallback(() => {
    setNetworkState({ data: null, isLoading: false, error: null });
    setMapState({ data: null, isLoading: false, error: null });
    setRecommendationsState({ data: null, isLoading: false, error: null });
    setTimelineState({ data: null, isLoading: false, error: null });
    setFrontiersState({ data: null, isLoading: false, error: null });
    setConnectionState({ data: null, isLoading: false, error: null });
  }, []);

  /**
   * Clear error for a specific view
   */
  const clearError = useCallback((view: DiscoveryView) => {
    switch (view) {
      case 'network':
        setNetworkState((prev) => ({ ...prev, error: null }));
        break;
      case 'map':
        setMapState((prev) => ({ ...prev, error: null }));
        break;
      case 'recommendations':
        setRecommendationsState((prev) => ({ ...prev, error: null }));
        break;
      case 'timeline':
        setTimelineState((prev) => ({ ...prev, error: null }));
        break;
      case 'frontiers':
        setFrontiersState((prev) => ({ ...prev, error: null }));
        break;
      case 'connector':
        setConnectionState((prev) => ({ ...prev, error: null }));
        break;
    }
  }, []);

  // Aggregate loading state
  const isLoading =
    networkState.isLoading ||
    mapState.isLoading ||
    recommendationsState.isLoading ||
    timelineState.isLoading ||
    frontiersState.isLoading ||
    connectionState.isLoading;

  // Get current view's loading state
  const getCurrentViewLoading = useCallback(() => {
    switch (activeView) {
      case 'network':
        return networkState.isLoading;
      case 'map':
        return mapState.isLoading;
      case 'recommendations':
        return recommendationsState.isLoading;
      case 'timeline':
        return timelineState.isLoading;
      case 'frontiers':
        return frontiersState.isLoading;
      case 'connector':
        return connectionState.isLoading;
      default:
        return false;
    }
  }, [activeView, networkState, mapState, recommendationsState, timelineState, frontiersState, connectionState]);

  // Get current view's error
  const getCurrentViewError = useCallback(() => {
    switch (activeView) {
      case 'network':
        return networkState.error;
      case 'map':
        return mapState.error;
      case 'recommendations':
        return recommendationsState.error;
      case 'timeline':
        return timelineState.error;
      case 'frontiers':
        return frontiersState.error;
      case 'connector':
        return connectionState.error;
      default:
        return null;
    }
  }, [activeView, networkState, mapState, recommendationsState, timelineState, frontiersState, connectionState]);

  return {
    // Active view
    activeView,
    setActiveView,

    // State for each view
    networkData: networkState.data,
    mapData: mapState.data,
    recommendations: recommendationsState.data,
    timelineData: timelineState.data,
    frontiersData: frontiersState.data,
    connectionPath: connectionState.data,

    // Loading states
    isLoading,
    isLoadingNetwork: networkState.isLoading,
    isLoadingMap: mapState.isLoading,
    isLoadingRecommendations: recommendationsState.isLoading,
    isLoadingTimeline: timelineState.isLoading,
    isLoadingFrontiers: frontiersState.isLoading,
    isLoadingConnection: connectionState.isLoading,
    getCurrentViewLoading,

    // Errors
    error: getCurrentViewError(),
    networkError: networkState.error,
    mapError: mapState.error,
    recommendationsError: recommendationsState.error,
    timelineError: timelineState.error,
    frontiersError: frontiersState.error,
    connectionError: connectionState.error,
    getCurrentViewError,

    // Methods
    buildNetwork,
    generateMap,
    getRecommendations,
    findConnection,
    getTimeline,
    detectFrontiers,
    clearData,
    clearError,
  };
}
