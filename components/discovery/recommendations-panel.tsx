'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils/cn';
import {
  Flame,
  BookX,
  Sparkles,
  Users,
  Plus,
  Network,
  ExternalLink,
  TrendingUp,
  Info
} from 'lucide-react';

/**
 * Recommendation types
 */
export type RecommendationType = 'hot' | 'missing' | 'new' | 'author' | 'extending' | 'trending';

/**
 * Recommended paper with explanation
 */
export interface Recommendation {
  paperId: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  citationCount: number;
  score: number;
  reason: string;
  type: RecommendationType;
  relatedPaperIds?: string[];
  openAccess?: boolean;
  pdfUrl?: string;
}

/**
 * Grouped recommendations by category
 */
export interface RecommendationsData {
  hotNow: Recommendation[];
  missingFromReview: Recommendation[];
  newThisWeek: Recommendation[];
  sameAuthors: Recommendation[];
  extendingWork: Recommendation[];
  updatedAt: Date;
}

interface RecommendationsPanelProps {
  data: RecommendationsData;
  onAddToLibrary?: (paperId: string) => void;
  onShowNetwork?: (paperId: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

/**
 * Recommendations panel showing AI-powered paper suggestions
 *
 * Features:
 * - Hot/Missing/New/Same Authors tabs
 * - "Why recommended" explanation
 * - Add to library button
 * - Show network button
 * - Score-based sorting
 */
export function RecommendationsPanel({
  data,
  onAddToLibrary,
  onShowNetwork,
  onRefresh,
  isRefreshing = false,
  className
}: RecommendationsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('hot');
  const [addedPapers, setAddedPapers] = useState<Set<string>>(new Set());

  const handleAddToLibrary = (paperId: string) => {
    setAddedPapers(prev => new Set(prev).add(paperId));
    onAddToLibrary?.(paperId);
  };

  const getTypeIcon = (type: RecommendationType) => {
    const icons = {
      hot: Flame,
      missing: BookX,
      new: Sparkles,
      author: Users,
      extending: TrendingUp,
      trending: Flame
    };
    return icons[type];
  };

  const getTypeColor = (type: RecommendationType) => {
    const colors = {
      hot: 'text-orange-500',
      missing: 'text-red-500',
      new: 'text-blue-500',
      author: 'text-purple-500',
      extending: 'text-green-500',
      trending: 'text-amber-500'
    };
    return colors[type];
  };

  const RecommendationCard = ({ rec }: { rec: Recommendation }) => {
    const Icon = getTypeIcon(rec.type);
    const isAdded = addedPapers.has(rec.paperId);

    return (
      <Card className="mb-3">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold line-clamp-2 mb-1">
                {rec.title}
              </CardTitle>
              <CardDescription className="text-xs">
                {rec.authors.slice(0, 3).join(', ')}
                {rec.authors.length > 3 && ' et al.'}
                {' • '}
                {rec.year}
                {rec.journal && ` • ${rec.journal}`}
              </CardDescription>
            </div>
            <Icon className={cn("w-4 h-4 flex-shrink-0", getTypeColor(rec.type))} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Metrics */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span>{rec.citationCount} citations</span>
            <span>Score: {(rec.score * 100).toFixed(0)}%</span>
            {rec.openAccess && (
              <span className="text-green-600 dark:text-green-400">Open Access</span>
            )}
          </div>

          {/* Why recommended */}
          <div className="mb-3 p-2 bg-muted/50 rounded text-xs">
            <div className="flex items-start gap-2">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <p className="text-muted-foreground">{rec.reason}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleAddToLibrary(rec.paperId)}
              disabled={isAdded}
              className="flex-1"
            >
              <Plus className="w-3 h-3 mr-1" />
              {isAdded ? 'Added' : 'Add to Library'}
            </Button>
            {onShowNetwork && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onShowNetwork(rec.paperId)}
              >
                <Network className="w-3 h-3 mr-1" />
                Network
              </Button>
            )}
            {rec.pdfUrl && (
              <Button
                size="sm"
                variant="ghost"
                asChild
              >
                <a href={rec.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("h-full flex flex-col bg-background rounded-lg border", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Smart Recommendations</h2>
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
          Updated {new Date(data.updatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2 border-b">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hot" className="text-xs">
              <Flame className="w-3 h-3 mr-1" />
              Hot ({data.hotNow.length})
            </TabsTrigger>
            <TabsTrigger value="missing" className="text-xs">
              <BookX className="w-3 h-3 mr-1" />
              Missing ({data.missingFromReview.length})
            </TabsTrigger>
            <TabsTrigger value="new" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              New ({data.newThisWeek.length})
            </TabsTrigger>
            <TabsTrigger value="authors" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Authors ({data.sameAuthors.length})
            </TabsTrigger>
            <TabsTrigger value="extending" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Extends ({data.extendingWork.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Hot Right Now */}
          <TabsContent value="hot" className="mt-0">
            {data.hotNow.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No trending papers found. Try adjusting your library or refresh.
              </p>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-3">
                  Papers gaining rapid citations in your research area
                </p>
                {data.hotNow.map(rec => (
                  <RecommendationCard key={rec.paperId} rec={rec} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Missing from Review */}
          <TabsContent value="missing" className="mt-0">
            {data.missingFromReview.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Great! Your review appears comprehensive.
              </p>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-3">
                  Highly-cited papers in your topics that you haven't cited
                </p>
                {data.missingFromReview.map(rec => (
                  <RecommendationCard key={rec.paperId} rec={rec} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* New This Week */}
          <TabsContent value="new" className="mt-0">
            {data.newThisWeek.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No new papers this week. Check back later.
              </p>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-3">
                  Recently published papers matching your interests
                </p>
                {data.newThisWeek.map(rec => (
                  <RecommendationCard key={rec.paperId} rec={rec} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Same Authors */}
          <TabsContent value="authors" className="mt-0">
            {data.sameAuthors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No papers found from authors in your library.
              </p>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-3">
                  Papers by authors already in your library
                </p>
                {data.sameAuthors.map(rec => (
                  <RecommendationCard key={rec.paperId} rec={rec} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Extending Work */}
          <TabsContent value="extending" className="mt-0">
            {data.extendingWork.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No papers extending your library found.
              </p>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-3">
                  Papers that cite and extend papers in your library
                </p>
                {data.extendingWork.map(rec => (
                  <RecommendationCard key={rec.paperId} rec={rec} />
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
