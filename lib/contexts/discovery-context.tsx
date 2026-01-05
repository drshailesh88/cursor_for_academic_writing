'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useDiscovery } from '@/lib/hooks/use-discovery';
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
import type { DiscoveryView } from '@/lib/hooks/use-discovery';

/**
 * Discovery context type
 */
interface DiscoveryContextType {
  // Active view
  activeView: DiscoveryView;
  setActiveView: (view: DiscoveryView) => void;

  // State for each view
  networkData: CitationNetwork | null;
  mapData: KnowledgeMap | null;
  recommendations: {
    hotNow: Recommendation[];
    missingFromReview: Recommendation[];
    newThisWeek: Recommendation[];
    sameAuthors: Recommendation[];
    extendingWork: Recommendation[];
  } | null;
  timelineData: ResearchTimeline | null;
  frontiersData: ResearchFrontier | null;
  connectionPath: LiteratureConnection | null;

  // Loading states
  isLoading: boolean;
  isLoadingNetwork: boolean;
  isLoadingMap: boolean;
  isLoadingRecommendations: boolean;
  isLoadingTimeline: boolean;
  isLoadingFrontiers: boolean;
  isLoadingConnection: boolean;
  getCurrentViewLoading: () => boolean;

  // Errors
  error: string | null;
  networkError: string | null;
  mapError: string | null;
  recommendationsError: string | null;
  timelineError: string | null;
  frontiersError: string | null;
  connectionError: string | null;
  getCurrentViewError: () => string | null;

  // Methods
  buildNetwork: (seedPaperIds: string[], config?: Partial<NetworkConfig>) => Promise<CitationNetwork>;
  generateMap: (topic: string, config?: Partial<MapConfig>) => Promise<KnowledgeMap>;
  getRecommendations: (
    paperIds: string[],
    userId?: string,
    limit?: number,
    categories?: string[]
  ) => Promise<{
    hotNow: Recommendation[];
    missingFromReview: Recommendation[];
    newThisWeek: Recommendation[];
    sameAuthors: Recommendation[];
    extendingWork: Recommendation[];
  }>;
  findConnection: (
    sourcePaperId: string,
    targetPaperId: string,
    maxDepth?: number
  ) => Promise<LiteratureConnection>;
  getTimeline: (topic: string, config?: Partial<TimelineConfig>) => Promise<ResearchTimeline>;
  detectFrontiers: (
    topic: string,
    yearRange?: number,
    includeGrowthMetrics?: boolean
  ) => Promise<ResearchFrontier>;
  clearData: () => void;
  clearError: (view: DiscoveryView) => void;
}

/**
 * Discovery Context
 */
const DiscoveryContext = createContext<DiscoveryContextType | undefined>(undefined);

/**
 * Discovery Provider Props
 */
interface DiscoveryProviderProps {
  children: ReactNode;
}

/**
 * Discovery Provider
 *
 * Wraps the discovery panel and provides discovery state to all child components
 *
 * Usage:
 * ```tsx
 * <DiscoveryProvider>
 *   <IntegratedDiscoveryPanel />
 * </DiscoveryProvider>
 * ```
 */
export function DiscoveryProvider({ children }: DiscoveryProviderProps) {
  const discovery = useDiscovery();

  return (
    <DiscoveryContext.Provider value={discovery}>
      {children}
    </DiscoveryContext.Provider>
  );
}

/**
 * Hook to access discovery context
 *
 * Must be used within a DiscoveryProvider
 *
 * @throws {Error} If used outside DiscoveryProvider
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { buildNetwork, networkData, isLoadingNetwork } = useDiscoveryContext();
 *
 *   const handleBuildNetwork = async () => {
 *     await buildNetwork(['paperId1', 'paperId2']);
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useDiscoveryContext(): DiscoveryContextType {
  const context = useContext(DiscoveryContext);

  if (context === undefined) {
    throw new Error('useDiscoveryContext must be used within a DiscoveryProvider');
  }

  return context;
}

/**
 * Optional hook for conditional discovery context access
 *
 * Returns undefined if used outside DiscoveryProvider (doesn't throw)
 *
 * Useful for components that may or may not be wrapped in a provider
 *
 * Usage:
 * ```tsx
 * function MyOptionalComponent() {
 *   const discovery = useDiscoveryContextOptional();
 *
 *   if (!discovery) {
 *     return <div>Discovery not available</div>;
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useDiscoveryContextOptional(): DiscoveryContextType | undefined {
  return useContext(DiscoveryContext);
}
