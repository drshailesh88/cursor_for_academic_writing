'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils/cn';
import {
  Network,
  Map,
  Lightbulb,
  Clock,
  Search,
  Loader2
} from 'lucide-react';

// Import discovery components
import { CitationNetwork, type GraphData } from './citation-network';
import { KnowledgeMap, type KnowledgeMapData } from './knowledge-map';
import { RecommendationsPanel, type RecommendationsData } from './recommendations-panel';
import { TimelineView, type TimelineData } from './timeline-view';
import { FrontierDashboard, type FrontierDashboardData } from './frontier-dashboard';

/**
 * Discovery panel view types
 */
export type DiscoveryView = 'network' | 'map' | 'recommendations' | 'timeline' | 'frontiers';

/**
 * Discovery data aggregated from all views
 */
export interface DiscoveryData {
  network?: GraphData;
  map?: KnowledgeMapData;
  recommendations?: RecommendationsData;
  timeline?: TimelineData;
  frontiers?: FrontierDashboardData;
}

interface DiscoveryPanelProps {
  initialView?: DiscoveryView;
  data?: DiscoveryData;
  onSearch?: (query: string, seedPaperIds?: string[]) => void;
  onRefresh?: (view: DiscoveryView) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Main Discovery Panel - container for all discovery features
 *
 * Features:
 * - Tab navigation between Network, Map, Recommendations, Timeline, Frontiers
 * - Search/seed paper input
 * - Loading states
 * - Refresh capability per view
 */
export function DiscoveryPanel({
  initialView = 'network',
  data,
  onSearch,
  onRefresh,
  isLoading = false,
  className
}: DiscoveryPanelProps) {
  const [activeView, setActiveView] = useState<DiscoveryView>(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [seedPaperIds, setSeedPaperIds] = useState<string[]>([]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim(), seedPaperIds);
    }
  }, [searchQuery, seedPaperIds, onSearch]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleRefresh = useCallback(() => {
    onRefresh?.(activeView);
  }, [activeView, onRefresh]);

  return (
    <div className={cn("h-full flex flex-col bg-background rounded-lg border", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
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
              'Refresh'
            )}
          </Button>
        </div>

        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search papers, topics, or enter seed paper IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="pl-9"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isLoading}
          >
            Discover
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeView}
        onValueChange={(value) => setActiveView(value as DiscoveryView)}
        className="flex-1 flex flex-col"
      >
        <div className="px-4 pt-2 border-b">
          <TabsList className="grid w-full grid-cols-5">
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
              <Search className="w-3 h-3 mr-1" />
              Frontiers
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Citation Network */}
          <TabsContent value="network" className="h-full m-0 p-4">
            {isLoading ? (
              <LoadingState message="Building citation network..." />
            ) : data?.network ? (
              <CitationNetwork data={data.network} />
            ) : (
              <EmptyState
                icon={Network}
                message="No network data available"
                description="Enter a search query or seed papers to generate a citation network"
              />
            )}
          </TabsContent>

          {/* Knowledge Map */}
          <TabsContent value="map" className="h-full m-0 p-4">
            {isLoading ? (
              <LoadingState message="Generating knowledge map..." />
            ) : data?.map ? (
              <KnowledgeMap data={data.map} />
            ) : (
              <EmptyState
                icon={Map}
                message="No map data available"
                description="Search a topic to visualize the research landscape"
              />
            )}
          </TabsContent>

          {/* Recommendations */}
          <TabsContent value="recommendations" className="h-full m-0 p-0">
            {isLoading ? (
              <div className="p-4 h-full">
                <LoadingState message="Finding recommendations..." />
              </div>
            ) : data?.recommendations ? (
              <RecommendationsPanel
                data={data.recommendations}
                onRefresh={handleRefresh}
                isRefreshing={isLoading}
              />
            ) : (
              <div className="p-4 h-full">
                <EmptyState
                  icon={Lightbulb}
                  message="No recommendations available"
                  description="Build your library to receive personalized paper recommendations"
                />
              </div>
            )}
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline" className="h-full m-0 p-4">
            {isLoading ? (
              <LoadingState message="Building timeline..." />
            ) : data?.timeline ? (
              <TimelineView data={data.timeline} />
            ) : (
              <EmptyState
                icon={Clock}
                message="No timeline data available"
                description="Search a topic to see its research evolution over time"
              />
            )}
          </TabsContent>

          {/* Research Frontiers */}
          <TabsContent value="frontiers" className="h-full m-0 p-0">
            {isLoading ? (
              <div className="p-4 h-full">
                <LoadingState message="Analyzing research frontiers..." />
              </div>
            ) : data?.frontiers ? (
              <FrontierDashboard
                data={data.frontiers}
                onRefresh={handleRefresh}
                isRefreshing={isLoading}
              />
            ) : (
              <div className="p-4 h-full">
                <EmptyState
                  icon={Search}
                  message="No frontier data available"
                  description="Explore emerging topics and research opportunities"
                />
              </div>
            )}
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
  description
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
