'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils/cn';
import {
  TrendingUp,
  Sparkles,
  Lightbulb,
  Flame,
  Users,
  BookOpen,
  ChevronRight,
  Info
} from 'lucide-react';
import type { EmergingTopic, ResearchOpportunity } from '@/lib/discovery/types';

/**
 * Research frontier metrics
 */
export interface FrontierMetrics {
  totalPapers: number;
  timeSpan: { start: number; end: number };
  avgGrowthRate: number;
  diversityScore: number;
  maturityScore: number;
}

/**
 * Frontier dashboard data
 */
export interface FrontierDashboardData {
  emergingTopics: EmergingTopic[];
  researchGaps: ResearchOpportunity[];
  futureDirections: ResearchOpportunity[];
  trendingPapers: Array<{
    paperId: string;
    title: string;
    authors: string[];
    year: number;
    citationCount: number;
    momentumScore: number;
  }>;
  metrics: FrontierMetrics;
  generatedAt: Date;
}

interface FrontierDashboardProps {
  data: FrontierDashboardData;
  onTopicClick?: (topic: EmergingTopic) => void;
  onOpportunityClick?: (opportunity: ResearchOpportunity) => void;
  onPaperClick?: (paperId: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

/**
 * Frontier dashboard showing emerging research areas and opportunities
 *
 * Features:
 * - Emerging topics with momentum indicators
 * - Research gaps and opportunities
 * - Trending papers section
 * - Future direction predictions
 * - Overall frontier metrics
 */
export function FrontierDashboard({
  data,
  onTopicClick,
  onOpportunityClick,
  onPaperClick,
  onRefresh,
  isRefreshing = false,
  className
}: FrontierDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('emerging');

  const getMomentumColor = (momentum: EmergingTopic['momentum']) => {
    const colors = {
      emerging: 'text-blue-500',
      accelerating: 'text-green-500',
      plateau: 'text-amber-500',
      declining: 'text-red-500'
    };
    return colors[momentum];
  };

  const getMomentumBadgeVariant = (momentum: EmergingTopic['momentum']) => {
    const variants = {
      emerging: 'default',
      accelerating: 'default',
      plateau: 'secondary',
      declining: 'outline'
    };
    return variants[momentum] as 'default' | 'secondary' | 'outline';
  };

  const getImpactColor = (impact: ResearchOpportunity['potentialImpact']) => {
    const colors = {
      low: 'text-gray-500',
      medium: 'text-blue-500',
      high: 'text-amber-500',
      transformative: 'text-purple-500'
    };
    return colors[impact];
  };

  const getDifficultyColor = (difficulty: ResearchOpportunity['difficulty']) => {
    const colors = {
      accessible: 'text-green-500',
      moderate: 'text-amber-500',
      challenging: 'text-red-500'
    };
    return colors[difficulty];
  };

  return (
    <div className={cn("h-full flex flex-col bg-background rounded-lg border", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold">Research Frontiers</h2>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Generated {new Date(data.generatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Metrics Summary */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Papers</div>
            <div className="text-lg font-semibold">{data.metrics.totalPapers.toLocaleString()}</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Growth</div>
            <div className="text-lg font-semibold text-green-500">
              +{data.metrics.avgGrowthRate.toFixed(1)}%
            </div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Diversity</div>
            <div className="text-lg font-semibold">{(data.metrics.diversityScore * 100).toFixed(0)}%</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Maturity</div>
            <div className="text-lg font-semibold">{(data.metrics.maturityScore * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2 border-b">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="emerging" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Emerging
            </TabsTrigger>
            <TabsTrigger value="gaps" className="text-xs">
              <Lightbulb className="w-3 h-3 mr-1" />
              Gaps
            </TabsTrigger>
            <TabsTrigger value="trending" className="text-xs">
              <Flame className="w-3 h-3 mr-1" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="future" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Future
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Emerging Topics */}
          <TabsContent value="emerging" className="mt-0">
            {data.emergingTopics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No emerging topics identified yet.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-3">
                  Topics gaining momentum in your research area
                </p>
                {data.emergingTopics.map(topic => (
                  <Card
                    key={topic.id}
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => onTopicClick?.(topic)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-semibold mb-1">
                            {topic.label}
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-2">
                            {topic.description}
                          </CardDescription>
                        </div>
                        <Badge variant={getMomentumBadgeVariant(topic.momentum)}>
                          {topic.momentum}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                        <div>
                          <span className="text-muted-foreground">Papers:</span>
                          <span className="ml-1 font-medium">{topic.papers.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Growth:</span>
                          <span className={cn("ml-1 font-medium", getMomentumColor(topic.momentum))}>
                            +{topic.growthRate.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Citations:</span>
                          <span className="ml-1 font-medium">+{topic.citationGrowth.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Recency:</span>
                          <span className="ml-1 font-medium">{(topic.recency * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      {topic.keyAuthors.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>
                              {topic.keyAuthors.slice(0, 3).join(', ')}
                              {topic.keyAuthors.length > 3 && ` +${topic.keyAuthors.length - 3} more`}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Research Gaps */}
          <TabsContent value="gaps" className="mt-0">
            {data.researchGaps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No research gaps identified.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-3">
                  Unexplored areas with research potential
                </p>
                {data.researchGaps.map(gap => (
                  <Card
                    key={gap.id}
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => onOpportunityClick?.(gap)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {gap.type}
                            </Badge>
                            <Badge variant={gap.potentialImpact === 'transformative' ? 'default' : 'secondary'} className="text-xs">
                              {gap.potentialImpact} impact
                            </Badge>
                          </div>
                          <CardDescription className="text-sm line-clamp-2">
                            {gap.description}
                          </CardDescription>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4 text-xs mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Difficulty:</span>
                          <span className={cn("font-medium", getDifficultyColor(gap.difficulty))}>
                            {gap.difficulty}
                          </span>
                        </div>
                      </div>
                      {gap.relatedTopics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {gap.relatedTopics.slice(0, 3).map(topic => (
                            <Badge key={topic} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Trending Papers */}
          <TabsContent value="trending" className="mt-0">
            {data.trendingPapers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No trending papers found.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-3">
                  Papers with rapidly increasing citations
                </p>
                {data.trendingPapers.map(paper => (
                  <Card
                    key={paper.paperId}
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => onPaperClick?.(paper.paperId)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-semibold line-clamp-2 mb-1">
                            {paper.title}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {paper.authors.slice(0, 3).join(', ')}
                            {paper.authors.length > 3 && ' et al.'}
                            {' • '}
                            {paper.year}
                          </CardDescription>
                        </div>
                        <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground">
                          {paper.citationCount} citations
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Momentum:</span>
                          <span className="font-medium text-orange-500">
                            {(paper.momentumScore * 100).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Future Directions */}
          <TabsContent value="future" className="mt-0">
            {data.futureDirections.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No future directions identified.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-3">
                  Predicted high-impact research opportunities
                </p>
                {data.futureDirections.map(direction => (
                  <Card
                    key={direction.id}
                    className="cursor-pointer transition-all hover:shadow-md border-l-4"
                    style={{
                      borderLeftColor:
                        direction.potentialImpact === 'transformative'
                          ? '#8b5cf6'
                          : direction.potentialImpact === 'high'
                          ? '#f59e0b'
                          : '#3b82f6'
                    }}
                    onClick={() => onOpportunityClick?.(direction)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {direction.type}
                            </Badge>
                            <Badge
                              variant={direction.potentialImpact === 'transformative' ? 'default' : 'secondary'}
                              className={cn(
                                "text-xs",
                                direction.potentialImpact === 'transformative' && "bg-purple-500"
                              )}
                            >
                              {direction.potentialImpact}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm">
                            {direction.description}
                          </CardDescription>
                        </div>
                        <TrendingUp className={cn("w-4 h-4 flex-shrink-0", getImpactColor(direction.potentialImpact))} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="mb-2">
                        <span className="text-xs text-muted-foreground">Difficulty: </span>
                        <span className={cn("text-xs font-medium", getDifficultyColor(direction.difficulty))}>
                          {direction.difficulty}
                        </span>
                      </div>
                      {direction.relatedTopics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {direction.relatedTopics.map(topic => (
                            <Badge key={topic} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {direction.resources.length > 0 && (
                        <div className="flex items-start gap-2 text-xs">
                          <BookOpen className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-muted-foreground">Resources: </span>
                            <span>{direction.resources.slice(0, 2).join(', ')}</span>
                            {direction.resources.length > 2 && ` +${direction.resources.length - 2} more`}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
