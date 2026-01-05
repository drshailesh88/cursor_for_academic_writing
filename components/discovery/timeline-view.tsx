'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import {
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  Minus,
  Star
} from 'lucide-react';

/**
 * Paper positioned on the timeline
 */
export interface TimelinePaper {
  paperId: string;
  title: string;
  authors: string[];
  year: number;
  citationCount: number;
  isSeminal: boolean;
  isSeed?: boolean;
}

/**
 * Milestone marker on the timeline
 */
export interface Milestone {
  id: string;
  year: number;
  paperId?: string;
  label: string;
  description: string;
  type: 'breakthrough' | 'methodology' | 'dataset' | 'application';
}

/**
 * Research trend indicator
 */
export interface Trend {
  topic: string;
  direction: 'rising' | 'stable' | 'declining';
  growthRate: number;
  startYear: number;
  endYear: number;
}

/**
 * Era grouping for the timeline
 */
export interface Era {
  label: string;
  startYear: number;
  endYear: number;
  description: string;
  color: string;
}

export interface TimelineData {
  papers: TimelinePaper[];
  milestones: Milestone[];
  trends: Trend[];
  eras?: Era[];
}

interface TimelineViewProps {
  data: TimelineData;
  onPaperClick?: (paper: TimelinePaper) => void;
  onMilestoneClick?: (milestone: Milestone) => void;
  className?: string;
}

/**
 * Horizontal timeline visualization showing research evolution
 *
 * Features:
 * - Papers plotted by year
 * - Milestone markers
 * - Trend indicators (rising/declining)
 * - Era groupings
 * - Animation controls
 */
export function TimelineView({
  data,
  onPaperClick,
  onMilestoneClick,
  className
}: TimelineViewProps) {
  const [hoveredPaper, setHoveredPaper] = useState<TimelinePaper | null>(null);
  const [hoveredMilestone, setHoveredMilestone] = useState<Milestone | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [showTrends, setShowTrends] = useState(true);

  // Calculate year range
  const { minYear, maxYear } = useMemo(() => {
    const years = data.papers.map(p => p.year);
    return {
      minYear: Math.min(...years),
      maxYear: Math.max(...years)
    };
  }, [data.papers]);

  const yearRange = maxYear - minYear;

  // Convert year to X position (0-100%)
  const yearToX = (year: number) => {
    return ((year - minYear) / yearRange) * 100;
  };

  // Group papers by year
  const papersByYear = useMemo(() => {
    const grouped = new Map<number, TimelinePaper[]>();
    data.papers.forEach(paper => {
      const papers = grouped.get(paper.year) || [];
      papers.push(paper);
      grouped.set(paper.year, papers);
    });
    return grouped;
  }, [data.papers]);

  // Milestone type icons and colors
  const getMilestoneStyle = (type: Milestone['type']) => {
    const styles = {
      breakthrough: { color: 'text-purple-500', bg: 'bg-purple-500/20' },
      methodology: { color: 'text-blue-500', bg: 'bg-blue-500/20' },
      dataset: { color: 'text-green-500', bg: 'bg-green-500/20' },
      application: { color: 'text-amber-500', bg: 'bg-amber-500/20' }
    };
    return styles[type];
  };

  return (
    <div className={cn("relative h-full w-full bg-background rounded-lg border p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Research Timeline</h3>
          <p className="text-sm text-muted-foreground">
            {minYear} - {maxYear} ({yearRange} years)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTrends(!showTrends)}
          >
            {showTrends ? 'Hide' : 'Show'} Trends
          </Button>
        </div>
      </div>

      {/* Trends summary */}
      {showTrends && data.trends.length > 0 && (
        <div className="mb-6 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium">Active Trends</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.trends.map((trend, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs",
                  trend.direction === 'rising' && "bg-green-500/20 text-green-700 dark:text-green-300",
                  trend.direction === 'declining' && "bg-red-500/20 text-red-700 dark:text-red-300",
                  trend.direction === 'stable' && "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                )}
              >
                {trend.direction === 'rising' && <TrendingUp className="w-3 h-3" />}
                {trend.direction === 'declining' && <TrendingDown className="w-3 h-3" />}
                {trend.direction === 'stable' && <Minus className="w-3 h-3" />}
                <span>{trend.topic}</span>
                <span className="font-medium">
                  {trend.growthRate > 0 ? '+' : ''}{trend.growthRate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline container */}
      <div className="relative h-[500px] overflow-y-auto">
        {/* Era backgrounds */}
        {data.eras?.map((era, i) => (
          <div
            key={i}
            className="absolute top-0 h-full opacity-10"
            style={{
              left: `${yearToX(era.startYear)}%`,
              width: `${yearToX(era.endYear) - yearToX(era.startYear)}%`,
              backgroundColor: era.color
            }}
          >
            <div className="absolute top-4 left-2 text-xs font-medium opacity-100">
              {era.label}
            </div>
          </div>
        ))}

        {/* Year markers */}
        <div className="relative h-full">
          {Array.from({ length: yearRange + 1 }, (_, i) => minYear + i).map(year => {
            const papers = papersByYear.get(year) || [];
            const milestones = data.milestones.filter(m => m.year === year);

            return (
              <div
                key={year}
                className="absolute w-full"
                style={{ left: `${yearToX(year)}%` }}
              >
                {/* Year label */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-0.5 h-4 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">{year}</span>
                </div>

                {/* Milestones */}
                {milestones.map(milestone => {
                  const style = getMilestoneStyle(milestone.type);
                  return (
                    <div
                      key={milestone.id}
                      className={cn(
                        "mb-2 p-2 rounded border-l-2 cursor-pointer transition-all hover:shadow-md",
                        style.bg,
                        hoveredMilestone?.id === milestone.id && "shadow-md"
                      )}
                      style={{ borderLeftColor: style.color }}
                      onClick={() => onMilestoneClick?.(milestone)}
                      onMouseEnter={() => setHoveredMilestone(milestone)}
                      onMouseLeave={() => setHoveredMilestone(null)}
                    >
                      <div className="flex items-start gap-2">
                        <Star className={cn("w-3 h-3 mt-0.5", style.color)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium line-clamp-1">{milestone.label}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {milestone.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Papers */}
                {papers.map((paper, i) => (
                  <div
                    key={paper.paperId}
                    className={cn(
                      "mb-1 p-2 rounded text-xs cursor-pointer transition-all hover:bg-accent",
                      paper.isSeminal && "bg-purple-500/10 border border-purple-500/30",
                      paper.isSeed && "bg-amber-500/10 border border-amber-500/30",
                      hoveredPaper?.paperId === paper.paperId && "bg-accent shadow-md"
                    )}
                    onClick={() => onPaperClick?.(paper)}
                    onMouseEnter={() => setHoveredPaper(paper)}
                    onMouseLeave={() => setHoveredPaper(null)}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mt-1 flex-shrink-0",
                          paper.isSeminal && "bg-purple-500",
                          paper.isSeed && "bg-amber-500",
                          !paper.isSeminal && !paper.isSeed && "bg-muted-foreground"
                        )}
                        style={{
                          width: Math.min(8, 4 + Math.log(paper.citationCount + 1)),
                          height: Math.min(8, 4 + Math.log(paper.citationCount + 1))
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-1">{paper.title}</p>
                        <p className="text-muted-foreground line-clamp-1">
                          {paper.authors.slice(0, 2).join(', ')}
                          {paper.authors.length > 2 && ' et al.'}
                        </p>
                        <p className="text-muted-foreground">
                          {paper.citationCount} citations
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Seminal Paper</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Seed Paper</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-3 h-3 text-purple-500" />
            <span>Breakthrough</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-3 h-3 text-blue-500" />
            <span>Methodology</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-3 h-3 text-green-500" />
            <span>Dataset</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-3 h-3 text-amber-500" />
            <span>Application</span>
          </div>
        </div>
      </div>

      {/* Hover details */}
      {hoveredPaper && (
        <div className="absolute top-20 right-6 bg-background/95 backdrop-blur-sm rounded-lg border p-3 shadow-lg max-w-sm z-10">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{hoveredPaper.title}</h3>
          <p className="text-xs text-muted-foreground mb-2">
            {hoveredPaper.authors.join(', ')}
          </p>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Year: {hoveredPaper.year}</span>
            <span className="text-muted-foreground">Citations: {hoveredPaper.citationCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
