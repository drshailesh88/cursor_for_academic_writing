'use client';

import { Zap, Target, Layers, FileSearch, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import type { ResearchMode } from '@/lib/research/deep-research/types';

interface ModeConfig {
  label: string;
  description: string;
  icon: typeof Zap;
  sources: number;
  time: string;
  depth: number;
  breadth: number;
  color: string;
  bgColor: string;
}

const modeConfigs: Record<ResearchMode, ModeConfig> = {
  quick: {
    label: 'Quick',
    description: 'Fast overview with essential findings and key papers',
    icon: Zap,
    sources: 10,
    time: '~2 min',
    depth: 1,
    breadth: 2,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
  },
  standard: {
    label: 'Standard',
    description: 'Balanced depth and coverage for most research questions',
    icon: Target,
    sources: 25,
    time: '~5 min',
    depth: 2,
    breadth: 3,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  deep: {
    label: 'Deep',
    description: 'Comprehensive multi-perspective analysis with citations',
    icon: Layers,
    sources: 50,
    time: '~10 min',
    depth: 3,
    breadth: 4,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
  },
  exhaustive: {
    label: 'Exhaustive',
    description: 'Leave no stone unturned - thorough systematic search',
    icon: FileSearch,
    sources: 100,
    time: '~20 min',
    depth: 4,
    breadth: 5,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
  },
  systematic: {
    label: 'Systematic Review',
    description: 'Full PRISMA-style systematic review protocol',
    icon: BookOpen,
    sources: 200,
    time: '~30 min',
    depth: 5,
    breadth: 6,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
};

interface ModeSelectorProps {
  selectedMode: ResearchMode;
  onSelectMode: (mode: ResearchMode) => void;
  disabled?: boolean;
  className?: string;
}

export function ModeSelector({
  selectedMode,
  onSelectMode,
  disabled = false,
  className,
}: ModeSelectorProps) {
  const modes = Object.entries(modeConfigs) as [ResearchMode, ModeConfig][];

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-sm font-semibold mb-1">Research Mode</h3>
        <p className="text-xs text-muted-foreground">
          Choose the depth and breadth of your research synthesis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {modes.map(([modeKey, config]) => {
          const Icon = config.icon;
          const isSelected = selectedMode === modeKey;

          return (
            <Card
              key={modeKey}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-primary shadow-md',
                disabled && 'opacity-50 cursor-not-allowed',
                !isSelected && !disabled && 'hover:border-primary/50'
              )}
              onClick={() => !disabled && onSelectMode(modeKey)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className={cn('p-2 rounded-lg', config.bgColor)}>
                    <Icon className={cn('w-5 h-5', config.color)} />
                  </div>
                  {isSelected && (
                    <div className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      Selected
                    </div>
                  )}
                </div>
                <CardTitle className="text-base mt-3">{config.label}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {config.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Sources</span>
                  <span className="font-semibold">{config.sources}+</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-semibold">{config.time}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Depth</span>
                  <span className="font-semibold">{config.depth} levels</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Breadth</span>
                  <span className="font-semibold">{config.breadth} paths</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected mode summary */}
      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', modeConfigs[selectedMode].bgColor)}>
            {(() => {
              const Icon = modeConfigs[selectedMode].icon;
              return <Icon className={cn('w-4 h-4', modeConfigs[selectedMode].color)} />;
            })()}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{modeConfigs[selectedMode].label}</div>
            <div className="text-xs text-muted-foreground">
              {modeConfigs[selectedMode].sources}+ sources · {modeConfigs[selectedMode].time} ·
              Depth {modeConfigs[selectedMode].depth} · Breadth {modeConfigs[selectedMode].breadth}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
