'use client';

import { useState } from 'react';
import { Settings, ChevronDown, ChevronUp, Database, Calendar, FileType } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import type { DatabaseSource, ArticleType } from '@/lib/research/deep-research/types';

interface ResearchSettingsProps {
  depth: number;
  breadth: number;
  sources: DatabaseSource[];
  dateRange: { start: number; end: number };
  articleTypes: ArticleType[];
  onDepthChange: (depth: number) => void;
  onBreadthChange: (breadth: number) => void;
  onSourcesChange: (sources: DatabaseSource[]) => void;
  onDateRangeChange: (range: { start: number; end: number }) => void;
  onArticleTypesChange: (types: ArticleType[]) => void;
  disabled?: boolean;
  className?: string;
}

const databaseSources: { id: DatabaseSource; label: string; description: string }[] = [
  { id: 'pubmed', label: 'PubMed', description: 'Biomedical & life sciences' },
  { id: 'arxiv', label: 'arXiv', description: 'Physics, CS, math' },
  { id: 'semantic-scholar', label: 'Semantic Scholar', description: 'All disciplines' },
  { id: 'crossref', label: 'CrossRef', description: 'DOI metadata' },
  { id: 'europe-pmc', label: 'Europe PMC', description: 'European research' },
  { id: 'core', label: 'CORE', description: 'Open access aggregator' },
];

const articleTypeOptions: { id: ArticleType; label: string; description: string }[] = [
  { id: 'all', label: 'All Types', description: 'Include all article types' },
  { id: 'rct', label: 'RCT', description: 'Randomized controlled trials' },
  { id: 'systematic-review', label: 'Systematic Review', description: 'Systematic reviews' },
  { id: 'meta-analysis', label: 'Meta-Analysis', description: 'Meta-analyses' },
  { id: 'cohort', label: 'Cohort Study', description: 'Cohort studies' },
  { id: 'case-control', label: 'Case-Control', description: 'Case-control studies' },
  { id: 'case-report', label: 'Case Report', description: 'Case reports' },
  { id: 'review', label: 'Review', description: 'General reviews' },
];

export function ResearchSettings({
  depth,
  breadth,
  sources,
  dateRange,
  articleTypes,
  onDepthChange,
  onBreadthChange,
  onSourcesChange,
  onDateRangeChange,
  onArticleTypesChange,
  disabled = false,
  className,
}: ResearchSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSource = (source: DatabaseSource) => {
    if (disabled) return;

    const newSources = sources.includes(source)
      ? sources.filter((s) => s !== source)
      : [...sources, source];

    // Ensure at least one source is selected
    if (newSources.length > 0) {
      onSourcesChange(newSources);
    }
  };

  const toggleArticleType = (type: ArticleType) => {
    if (disabled) return;

    if (type === 'all') {
      onArticleTypesChange(['all']);
    } else {
      const filtered = articleTypes.filter((t) => t !== 'all');
      const newTypes = filtered.includes(type)
        ? filtered.filter((t) => t !== type)
        : [...filtered, type];

      // If no types selected, default to 'all'
      onArticleTypesChange(newTypes.length > 0 ? newTypes : ['all']);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => !disabled && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base">Advanced Settings</CardTitle>
              <CardDescription className="text-xs">
                Customize research parameters and filters
              </CardDescription>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Depth and Breadth Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Settings className="w-4 h-4 text-primary" />
              <span>Search Parameters</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Depth Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="depth-slider" className="text-sm font-medium">
                    Depth: {depth}
                  </Label>
                  <span className="text-xs text-muted-foreground">Recursion levels</span>
                </div>
                <Slider
                  id="depth-slider"
                  value={[depth]}
                  onValueChange={([value]) => onDepthChange(value)}
                  min={1}
                  max={6}
                  step={1}
                  disabled={disabled}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  How many levels deep to explore topics (1 = shallow, 6 = very deep)
                </p>
              </div>

              {/* Breadth Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="breadth-slider" className="text-sm font-medium">
                    Breadth: {breadth}
                  </Label>
                  <span className="text-xs text-muted-foreground">Parallel paths</span>
                </div>
                <Slider
                  id="breadth-slider"
                  value={[breadth]}
                  onValueChange={([value]) => onBreadthChange(value)}
                  min={2}
                  max={8}
                  step={1}
                  disabled={disabled}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  How many parallel perspectives to explore (2 = focused, 8 = comprehensive)
                </p>
              </div>
            </div>
          </div>

          {/* Database Sources */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Database className="w-4 h-4 text-primary" />
              <span>Database Sources</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Select which academic databases to search
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {databaseSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <Checkbox
                    id={`source-${source.id}`}
                    checked={sources.includes(source.id)}
                    onCheckedChange={() => toggleSource(source.id)}
                    disabled={disabled || (sources.includes(source.id) && sources.length === 1)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`source-${source.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {source.label}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {source.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Publication Date Range</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Filter papers by publication year
            </p>
            <div className="flex items-center gap-3">
              <Select
                value={dateRange.start.toString()}
                onValueChange={(value) =>
                  onDateRangeChange({ ...dateRange, start: parseInt(value) })
                }
                disabled={disabled}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">to</span>
              <Select
                value={dateRange.end.toString()}
                onValueChange={(value) =>
                  onDateRangeChange({ ...dateRange, end: parseInt(value) })
                }
                disabled={disabled}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Article Types */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileType className="w-4 h-4 text-primary" />
              <span>Article Types</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Filter by study design and publication type
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {articleTypeOptions.map((type) => (
                <div
                  key={type.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <Checkbox
                    id={`type-${type.id}`}
                    checked={articleTypes.includes(type.id)}
                    onCheckedChange={() => toggleArticleType(type.id)}
                    disabled={disabled}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`type-${type.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {type.label}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Summary */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Configuration:</span>
                <span className="font-medium">
                  Depth {depth} × Breadth {breadth}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sources:</span>
                <span className="font-medium">{sources.length} databases</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Years:</span>
                <span className="font-medium">
                  {dateRange.start} - {dateRange.end}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Article types:</span>
                <span className="font-medium">
                  {articleTypes.includes('all') ? 'All' : `${articleTypes.length} selected`}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
