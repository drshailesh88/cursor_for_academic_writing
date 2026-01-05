'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import {
  ExternalLink,
  Plus,
  Network,
  FileText,
  Quote
} from 'lucide-react';

/**
 * Paper card data for network/discovery views
 */
export interface PaperNetworkCardData {
  paperId: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  citationCount: number;
  relevanceScore?: number;
  connectionStrength?: number;
  openAccess?: boolean;
  pdfUrl?: string;
  doi?: string;
  abstract?: string;
  inLibrary?: boolean;
}

interface PaperNetworkCardProps {
  paper: PaperNetworkCardData;
  onAddToLibrary?: (paperId: string) => void;
  onAddCitation?: (paperId: string) => void;
  onShowNetwork?: (paperId: string) => void;
  onViewDetails?: (paperId: string) => void;
  showRelevanceScore?: boolean;
  showConnectionStrength?: boolean;
  className?: string;
}

/**
 * Paper card component for network and discovery views
 *
 * Features:
 * - Compact paper information display
 * - Relevance/connection scores
 * - Quick actions (Add to Library, Add Citation, Explore Network)
 * - Open access badge
 * - External link support
 */
export function PaperNetworkCard({
  paper,
  onAddToLibrary,
  onAddCitation,
  onShowNetwork,
  onViewDetails,
  showRelevanceScore = false,
  showConnectionStrength = false,
  className
}: PaperNetworkCardProps) {
  const handleAddToLibrary = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToLibrary?.(paper.paperId);
  };

  const handleAddCitation = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddCitation?.(paper.paperId);
  };

  const handleShowNetwork = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowNetwork?.(paper.paperId);
  };

  const handleCardClick = () => {
    onViewDetails?.(paper.paperId);
  };

  // Format authors for display
  const authorText = paper.authors.length > 0
    ? `${paper.authors.slice(0, 3).join(', ')}${paper.authors.length > 3 ? ' et al.' : ''}`
    : 'Unknown authors';

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md cursor-pointer",
        paper.inLibrary && "border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20",
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold line-clamp-2 mb-1">
              {paper.title}
            </CardTitle>
            <CardDescription className="text-xs line-clamp-1">
              {authorText}
              {' • '}
              {paper.year}
              {paper.journal && ` • ${paper.journal}`}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1">
            {showRelevanceScore && paper.relevanceScore !== undefined && (
              <Badge variant="secondary" className="text-xs font-semibold">
                {(paper.relevanceScore * 100).toFixed(0)}%
              </Badge>
            )}
            {showConnectionStrength && paper.connectionStrength !== undefined && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  paper.connectionStrength > 0.7 && "border-green-500 text-green-700 dark:text-green-300",
                  paper.connectionStrength > 0.4 && paper.connectionStrength <= 0.7 && "border-amber-500 text-amber-700 dark:text-amber-300",
                  paper.connectionStrength <= 0.4 && "border-gray-500 text-gray-700 dark:text-gray-300"
                )}
              >
                {(paper.connectionStrength * 100).toFixed(0)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Abstract preview */}
        {paper.abstract && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {paper.abstract}
          </p>
        )}

        {/* Metrics and badges */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-xs text-muted-foreground">
            {paper.citationCount.toLocaleString()} citations
          </span>
          {paper.openAccess && (
            <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-500">
              Open Access
            </Badge>
          )}
          {paper.inLibrary && (
            <Badge variant="outline" className="text-xs text-purple-600 dark:text-purple-400 border-purple-500">
              In Library
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onAddToLibrary && !paper.inLibrary && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddToLibrary}
              className="flex-1 text-xs h-8"
            >
              <Plus className="w-3 h-3 mr-1" />
              Library
            </Button>
          )}
          {onAddCitation && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddCitation}
              className="flex-1 text-xs h-8"
            >
              <Quote className="w-3 h-3 mr-1" />
              Cite
            </Button>
          )}
          {onShowNetwork && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleShowNetwork}
              className="text-xs h-8"
            >
              <Network className="w-3 h-3" />
            </Button>
          )}
          {paper.pdfUrl && (
            <Button
              size="sm"
              variant="ghost"
              asChild
              className="text-xs h-8"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="w-3 h-3" />
              </a>
            </Button>
          )}
          {paper.doi && (
            <Button
              size="sm"
              variant="ghost"
              asChild
              className="text-xs h-8"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
