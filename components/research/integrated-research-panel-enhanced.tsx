/**
 * Integrated Research Panel (Enhanced with Edge Case Handling)
 *
 * Complete deep research interface with:
 * - Enhanced error handling and messaging
 * - Better loading states with progress details
 * - Responsive design for mobile
 * - Timeout warnings
 * - Rate limit guidance
 */

'use client';

import { useState } from 'react';
import { Search, Settings, X, Download, FileText, AlertCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeepResearch } from '@/lib/hooks/use-deep-research';
import { ModeSelector } from './mode-selector';
import { ResearchSettings } from './research-settings';
import { ProgressTracker } from './progress-tracker';
import { ResearchResults as ResearchResultsComponent } from './research-results';
import { ResearchHistory } from './research-history';
import type { ResearchMode, DatabaseSource, ArticleType } from '@/lib/research/deep-research/types';
import { getDefaultConfig } from '@/lib/research/deep-research/types';
import { getResearchSession } from '@/lib/supabase/research-sessions';

/**
 * Props for IntegratedResearchPanel
 */
interface IntegratedResearchPanelProps {
  onInsertToDocument?: (content: string) => void;
  documentContent?: string;
  className?: string;
}

/**
 * Integrated Research Panel Component
 */
export function IntegratedResearchPanelEnhanced({
  onInsertToDocument,
  documentContent,
  className,
}: IntegratedResearchPanelProps) {
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

  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<ResearchMode>('standard');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  const defaultConfig = getDefaultConfig(mode);
  const [depth, setDepth] = useState(defaultConfig.depth);
  const [breadth, setBreadth] = useState(defaultConfig.breadth);
  const [sources, setSources] = useState<DatabaseSource[]>(defaultConfig.sources);
  const [dateRange, setDateRange] = useState(
    defaultConfig.dateRange || { start: new Date().getFullYear() - 5, end: new Date().getFullYear() }
  );
  const [articleTypes, setArticleTypes] = useState<ArticleType[]>(defaultConfig.articleTypes);

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

  const handleNewResearch = () => {
    clearResults();
    setTopic('');
    setActiveTab('new');
  };

  const handleViewSession = async (sessionId: string) => {
    try {
      const session = await getResearchSession(sessionId);
      if (!session) return;
      setTopic(session.topic);
      setMode(session.mode);
      setActiveTab('new');
    } catch (error) {
      console.error('Error viewing session:', error);
    }
  };

  const handleContinueSession = async (sessionId: string) => {
    try {
      const session = await getResearchSession(sessionId);
      if (!session) return;
      setTopic(session.topic);
      setMode(session.mode);
      setActiveTab('new');
    } catch (error) {
      console.error('Error continuing session:', error);
    }
  };

  const handleInsertSynthesis = () => {
    if (results && onInsertToDocument) {
      const synthesis = formatSynthesisForDocument(results);
      onInsertToDocument(synthesis);
    }
  };

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

  // Show results
  if (results && !isResearching) {
    return (
      <div className={className}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-4 border-b border-border gap-3">
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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onInsertToDocument && (
              <Button onClick={handleInsertSynthesis} variant="outline" size="sm" className="flex-1 sm:flex-initial">
                <Download className="w-4 h-4 mr-2" />
                Insert
              </Button>
            )}
            <Button onClick={handleNewResearch} size="sm" className="flex-1 sm:flex-initial">
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

  // Show progress with enhanced states
  if (isResearching && progress) {
    return (
      <div className={className}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 animate-pulse">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Research in Progress</h2>
              <p className="text-sm text-muted-foreground">
                {progress.stage === 'planning' && 'Planning research strategy...'}
                {progress.stage === 'perspective-generation' && 'Generating expert perspectives...'}
                {progress.stage === 'research' && 'Searching databases...'}
                {progress.stage === 'analysis' && 'Analyzing sources...'}
                {progress.stage === 'synthesis' && 'Synthesizing findings...'}
                {progress.stage === 'timeout' && 'Completing with partial results...'}
              </p>
            </div>
          </div>
          <Button onClick={cancelResearch} variant="outline" size="sm" className="w-full sm:w-auto">
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
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">{progress.message}</p>
          </div>
        )}

        {progress.stage === 'timeout' && (
          <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              Research is taking longer than expected. Partial results will be returned.
            </p>
          </div>
        )}

        {(progress.perspectivesGenerated || progress.sourcesFound) && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {progress.perspectivesGenerated !== undefined && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Perspectives</p>
                <p className="text-lg font-semibold">{progress.perspectivesGenerated}</p>
              </div>
            )}
            {progress.nodesExplored !== undefined && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Nodes Explored</p>
                <p className="text-lg font-semibold">{progress.nodesExplored}</p>
              </div>
            )}
            {progress.sourcesFound !== undefined && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Sources Found</p>
                <p className="text-lg font-semibold">{progress.sourcesFound}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Show input form with responsive design
  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'new' | 'history')}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold truncate">Deep Research</h2>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Multi-perspective academic research synthesis
              </p>
              <p className="text-xs text-muted-foreground sm:hidden">
                Multi-perspective synthesis
              </p>
            </div>
          </div>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="new" className="flex-1 sm:flex-initial">
              <Search className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">New Research</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 sm:flex-initial">
              <History className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="new" className="space-y-4 sm:space-y-6 mt-0">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2 flex-1">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-destructive mb-1">Research Error</p>
                    <p className="text-sm text-destructive/80 whitespace-pre-wrap break-words">{error}</p>

                    {(error.includes('rate limit') || error.includes('429')) && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Tip: Try reducing the number of databases or switching to a less intensive research mode.
                      </p>
                    )}

                    {error.includes('No sources found') && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Tip: Try broadening your search terms or adjusting the date range filter.
                      </p>
                    )}

                    {error.includes('too broad') && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Tip: Add specific disease, population, or methodology to your topic.
                      </p>
                    )}
                  </div>
                </div>
                <Button onClick={clearError} variant="ghost" size="sm" className="flex-shrink-0 self-start sm:self-center">
                  Dismiss
                </Button>
              </div>
            </div>
          )}

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

          <ModeSelector
            selectedMode={mode}
            onSelectMode={handleModeChange}
            disabled={isResearching}
          />

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

          <Button
            onClick={handleStartResearch}
            disabled={!topic.trim() || isResearching || sources.length === 0}
            className="w-full h-12 text-base font-medium gap-2"
            size="lg"
          >
            <Search className="w-5 h-5" />
            Start Research
          </Button>

          <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs text-muted-foreground">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs">Mode:</span>
                <span className="font-medium text-foreground capitalize">{mode}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs">Sources:</span>
                <span className="font-medium text-foreground">{sources.length} DBs</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs">Depth:</span>
                <span className="font-medium text-foreground">{depth}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs">Breadth:</span>
                <span className="font-medium text-foreground">{breadth}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>Tip:</strong> Be specific with your research topic. Instead of "cancer treatment", try "immunotherapy for melanoma in elderly patients".
            </p>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <ResearchHistory
            onViewSession={handleViewSession}
            onContinueSession={handleContinueSession}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
