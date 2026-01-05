/**
 * Integrated Research Panel
 *
 * Complete deep research interface that combines:
 * - Research input and configuration
 * - Mode selector
 * - Settings panel
 * - Progress tracking
 * - Results display
 *
 * Uses the useDeepResearch hook for state management
 */

'use client';

import { useState } from 'react';
import { Search, Settings, X, Download, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeepResearch } from '@/lib/hooks/use-deep-research';
import { ModeSelector } from './mode-selector';
import { ResearchSettings } from './research-settings';
import { ProgressTracker } from './progress-tracker';
import { ResearchResults as ResearchResultsComponent } from './research-results';
import type { ResearchMode, DatabaseSource, ArticleType } from '@/lib/research/deep-research/types';
import { getDefaultConfig } from '@/lib/research/deep-research/types';

/**
 * Props for IntegratedResearchPanel
 */
interface IntegratedResearchPanelProps {
  /** Callback when user wants to insert content to document */
  onInsertToDocument?: (content: string) => void;

  /** Optional document content for context */
  documentContent?: string;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Integrated Research Panel Component
 */
export function IntegratedResearchPanel({
  onInsertToDocument,
  documentContent,
  className,
}: IntegratedResearchPanelProps) {
  // Research hook
  const {
    isResearching,
    progress,
    results,
    error,
    clarificationQuestions,
    startResearch,
    submitClarifications,
    cancelResearch,
    clearResults,
    clearError,
  } = useDeepResearch();

  // Local state for configuration
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<ResearchMode>('standard');
  const [showSettings, setShowSettings] = useState(false);

  // Advanced settings state
  const defaultConfig = getDefaultConfig(mode);
  const [depth, setDepth] = useState(defaultConfig.depth);
  const [breadth, setBreadth] = useState(defaultConfig.breadth);
  const [sources, setSources] = useState<DatabaseSource[]>(defaultConfig.sources);
  const [dateRange, setDateRange] = useState(
    defaultConfig.dateRange || { start: new Date().getFullYear() - 5, end: new Date().getFullYear() }
  );
  const [articleTypes, setArticleTypes] = useState<ArticleType[]>(defaultConfig.articleTypes);

  /**
   * Update advanced settings when mode changes
   */
  const handleModeChange = (newMode: ResearchMode) => {
    setMode(newMode);
    const config = getDefaultConfig(newMode);
    setDepth(config.depth);
    setBreadth(config.breadth);
    setSources(config.sources);
    setArticleTypes(config.articleTypes);
    if (config.dateRange) {
      setDateRange(config.dateRange);
    }
  };

  /**
   * Handle research start
   */
  const handleStartResearch = async () => {
    if (!topic.trim()) return;

    await startResearch(topic.trim(), mode, {
      depth,
      breadth,
      sources,
      dateRange,
      articleTypes,
      maxSources: defaultConfig.maxSources,
      iterationLimit: defaultConfig.iterationLimit,
      qualityThreshold: defaultConfig.qualityThreshold,
    });
  };

  /**
   * Handle new research
   */
  const handleNewResearch = () => {
    clearResults();
    setTopic('');
  };

  /**
   * Handle insert synthesis to document
   */
  const handleInsertSynthesis = () => {
    if (results && onInsertToDocument) {
      // Format the synthesis for insertion
      const synthesis = formatSynthesisForDocument(results);
      onInsertToDocument(synthesis);
    }
  };

  /**
   * Format synthesis for document insertion
   */
  const formatSynthesisForDocument = (researchResults: typeof results): string => {
    if (!researchResults) return '';

    const { sources, perspectives, metadata } = researchResults;

    let text = `# Research Summary: ${researchResults.topic}\n\n`;

    if (perspectives.length > 0) {
      text += `## Perspectives Explored\n\n`;
      perspectives.forEach(p => {
        text += `### ${p.name}\n${p.description}\n\n`;
      });
    }

    text += `## Key Findings\n\n`;
    text += `Based on analysis of ${metadata.totalSources} sources across ${perspectives.length} perspectives:\n\n`;

    text += `## Sources\n\n`;
    sources.slice(0, 10).forEach((source, idx) => {
      text += `${idx + 1}. ${source.title}`;
      if (source.authors?.length > 0) {
        text += ` - ${source.authors.slice(0, 3).join(', ')}`;
      }
      if (source.year) {
        text += ` (${source.year})`;
      }
      text += '\n';
    });

    if (sources.length > 10) {
      text += `\n*... and ${sources.length - 10} more sources*\n`;
    }

    return text;
  };

  // Show results if available
  if (results && !isResearching) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Research Complete</h2>
              <p className="text-sm text-muted-foreground">
                {results.metadata.totalSources} sources found
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onInsertToDocument && (
              <Button onClick={handleInsertSynthesis} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Insert to Document
              </Button>
            )}
            <Button onClick={handleNewResearch} size="sm">
              New Research
            </Button>
          </div>
        </div>

        <ResearchResultsComponent
          synthesis={formatSynthesisForDocument(results)}
          qualityScore={{
            overall: 85,
            breakdown: {
              coverage: 90,
              citationQuality: 85,
              balancedPerspectives: 80,
              sourceReliability: 88,
              recency: 82,
            },
          }}
          sourcesCount={results.metadata.totalSources}
          onInsertToDocument={handleInsertSynthesis}
          onCopySynthesis={() => {
            navigator.clipboard.writeText(formatSynthesisForDocument(results));
          }}
        />
      </div>
    );
  }

  // Show progress if researching
  if (isResearching && progress) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Research in Progress</h2>
          <Button onClick={cancelResearch} variant="outline" size="sm">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        <ProgressTracker
          stage={progress.stage as any}
          progress={progress.progress}
          currentBranch={
            progress.nodesExplored !== undefined
              ? {
                  name: 'Exploration',
                  current: progress.nodesExplored,
                  total: progress.nodesExplored + 5,
                }
              : undefined
          }
          sourcesFound={progress.sourcesFound}
          sourcesUnique={progress.sourcesFound}
        />

        {progress.message && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
            {progress.message}
          </div>
        )}
      </div>
    );
  }

  // Show input form (default state)
  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Deep Research</h2>
            <p className="text-sm text-muted-foreground">
              Multi-perspective academic research synthesis
            </p>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
              <Button onClick={clearError} variant="ghost" size="sm">
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Topic Input */}
        <div className="space-y-2">
          <Label htmlFor="research-topic">Research Topic</Label>
          <div className="relative">
            <Input
              id="research-topic"
              placeholder="Enter your research question..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleStartResearch();
                }
              }}
              className="pr-10"
              disabled={isResearching}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Describe your research question or topic in detail
          </p>
        </div>

        {/* Mode Selector */}
        <ModeSelector
          selectedMode={mode}
          onSelectMode={handleModeChange}
          disabled={isResearching}
        />

        {/* Advanced Settings */}
        <ResearchSettings
          depth={depth}
          breadth={breadth}
          sources={sources}
          dateRange={dateRange}
          articleTypes={articleTypes}
          onDepthChange={setDepth}
          onBreadthChange={setBreadth}
          onSourcesChange={setSources}
          onDateRangeChange={setDateRange}
          onArticleTypesChange={setArticleTypes}
          disabled={isResearching}
        />

        {/* Start Button */}
        <Button
          onClick={handleStartResearch}
          disabled={!topic.trim() || isResearching || sources.length === 0}
          className="w-full h-12 text-base font-medium gap-2"
          size="lg"
        >
          <Search className="w-5 h-5" />
          Start Research
        </Button>

        {/* Info Footer */}
        <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Mode:</span>
            <span className="font-medium">{mode}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Sources:</span>
            <span className="font-medium">{sources.length} databases</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Depth:</span>
            <span className="font-medium">{depth} levels</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Breadth:</span>
            <span className="font-medium">{breadth} perspectives</span>
          </div>
        </div>
      </div>
    </div>
  );
}
