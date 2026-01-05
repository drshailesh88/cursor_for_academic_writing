'use client';

import { useEffect, useState } from 'react';
import {
  Loader2,
  CheckCircle2,
  Search,
  FileText,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type ResearchStage =
  | 'clarifying'
  | 'planning'
  | 'researching'
  | 'analyzing'
  | 'reviewing'
  | 'synthesizing'
  | 'complete';

interface ProgressTrackerProps {
  stage: ResearchStage;
  progress: number; // 0-100
  currentBranch?: {
    name: string;
    current: number;
    total: number;
  };
  iteration?: {
    current: number;
    total: number;
  };
  sourcesFound?: number;
  sourcesUnique?: number;
  learnings?: string[];
  className?: string;
}

const stageConfig: Record<ResearchStage, {
  label: string;
  description: string;
  icon: typeof Search;
  color: string;
}> = {
  clarifying: {
    label: 'Clarifying',
    description: 'Understanding research scope',
    icon: Lightbulb,
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  planning: {
    label: 'Planning',
    description: 'Identifying perspectives and search strategies',
    icon: TrendingUp,
    color: 'text-blue-600 dark:text-blue-400',
  },
  researching: {
    label: 'Researching',
    description: 'Searching databases and collecting sources',
    icon: Search,
    color: 'text-purple-600 dark:text-purple-400',
  },
  analyzing: {
    label: 'Analyzing',
    description: 'Processing and classifying citations',
    icon: FileText,
    color: 'text-indigo-600 dark:text-indigo-400',
  },
  reviewing: {
    label: 'Reviewing',
    description: 'Checking quality and gaps',
    icon: CheckCircle2,
    color: 'text-orange-600 dark:text-orange-400',
  },
  synthesizing: {
    label: 'Synthesizing',
    description: 'Creating research report',
    icon: FileText,
    color: 'text-cyan-600 dark:text-cyan-400',
  },
  complete: {
    label: 'Complete',
    description: 'Research finished',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
  },
};

export function ProgressTracker({
  stage,
  progress,
  currentBranch,
  iteration,
  sourcesFound = 0,
  sourcesUnique = 0,
  learnings = [],
  className,
}: ProgressTrackerProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const config = stageConfig[stage];
  const StageIcon = config.icon;
  const isComplete = stage === 'complete';

  return (
    <div className={cn('space-y-4 p-6 bg-card rounded-lg border border-border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', isComplete ? 'bg-green-100 dark:bg-green-950' : 'bg-primary/10')}>
            <StageIcon className={cn('w-5 h-5', isComplete ? 'text-green-600 dark:text-green-400' : config.color, !isComplete && 'animate-pulse')} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{config.label}</h3>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{Math.round(progress)}%</div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out',
              isComplete
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : 'bg-gradient-to-r from-primary to-primary/80'
            )}
            style={{ width: `${animatedProgress}%` }}
          />
        </div>

        {/* Stage Progress */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>
            {animatedProgress < 100 ? 'In progress...' : 'Complete'}
          </span>
        </div>
      </div>

      {/* Current Branch & Iteration */}
      {currentBranch && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Current Branch</div>
            <div className="text-sm font-semibold">
              {currentBranch.name}
            </div>
            <div className="text-xs text-muted-foreground">
              Branch {currentBranch.current} of {currentBranch.total}
            </div>
          </div>
          {iteration && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Iteration</div>
              <div className="text-sm font-semibold">
                {iteration.current} of {iteration.total}
              </div>
              <div className="text-xs text-muted-foreground">
                Refining search
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sources Stats */}
      {sourcesFound > 0 && (
        <div className="flex items-center gap-6 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Sources Found</div>
              <div className="text-lg font-bold">{sourcesFound}</div>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-xs text-muted-foreground">Unique</div>
              <div className="text-lg font-bold">{sourcesUnique}</div>
            </div>
          </div>
          {sourcesUnique < sourcesFound && (
            <div className="ml-auto text-xs text-muted-foreground">
              {Math.round((sourcesUnique / sourcesFound) * 100)}% after dedup
            </div>
          )}
        </div>
      )}

      {/* Latest Learnings */}
      {learnings.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <h4 className="text-sm font-semibold">Latest Learnings</h4>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {learnings.map((learning, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg text-sm animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">{learning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Indicator */}
      {!isComplete && (
        <div className="flex items-center gap-2 justify-center pt-2 border-t border-border">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">
            Research in progress...
          </span>
        </div>
      )}
    </div>
  );
}
