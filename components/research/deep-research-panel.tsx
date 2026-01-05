'use client';

import { useState } from 'react';
import { Search, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

type ResearchMode = 'quick' | 'standard' | 'deep' | 'exhaustive' | 'systematic';
type DatabaseSource = 'pubmed' | 'arxiv' | 'semantic-scholar' | 'crossref' | 'europe-pmc' | 'core';
type ArticleType = 'all' | 'rct' | 'review' | 'meta-analysis';

interface DeepResearchPanelProps {
  onStartResearch?: (config: ResearchConfig) => void;
  disabled?: boolean;
}

interface ResearchConfig {
  question: string;
  mode: ResearchMode;
  depth: number;
  breadth: number;
  sources: DatabaseSource[];
  dateRange: { start: number; end: number };
  articleTypes: ArticleType[];
}

const modeConfigs = {
  quick: { label: 'Quick Scan', duration: '1-2 min', sources: '5-10', depth: 1, breadth: 2 },
  standard: { label: 'Standard', duration: '5 min', sources: '15-25', depth: 2, breadth: 3 },
  deep: { label: 'Deep Dive', duration: '10-15 min', sources: '30-50', depth: 3, breadth: 4 },
  exhaustive: { label: 'Exhaustive', duration: '20-30 min', sources: '75-100', depth: 4, breadth: 5 },
  systematic: { label: 'Systematic Review', duration: '1-2 hours', sources: '200+', depth: 5, breadth: 6 },
};

const databaseSources: { id: DatabaseSource; label: string; description: string }[] = [
  { id: 'pubmed', label: 'PubMed', description: 'Biomedical & life sciences' },
  { id: 'arxiv', label: 'arXiv', description: 'Physics, CS, math' },
  { id: 'semantic-scholar', label: 'Semantic Scholar', description: 'All disciplines' },
  { id: 'crossref', label: 'CrossRef', description: 'DOI metadata' },
  { id: 'europe-pmc', label: 'Europe PMC', description: 'European research' },
  { id: 'core', label: 'CORE', description: 'Open access aggregator' },
];

export function DeepResearchPanel({ onStartResearch, disabled = false }: DeepResearchPanelProps) {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState<ResearchMode>('standard');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced settings
  const [depth, setDepth] = useState(3);
  const [breadth, setBreadth] = useState(3);
  const [selectedSources, setSelectedSources] = useState<DatabaseSource[]>([
    'pubmed',
    'arxiv',
    'semantic-scholar',
    'crossref',
  ]);
  const [startYear, setStartYear] = useState(2019);
  const [endYear, setEndYear] = useState(2024);
  const [articleTypes, setArticleTypes] = useState<ArticleType[]>(['all']);

  const currentModeConfig = modeConfigs[mode];

  const handleModeChange = (newMode: ResearchMode) => {
    setMode(newMode);
    const config = modeConfigs[newMode];
    setDepth(config.depth);
    setBreadth(config.breadth);
  };

  const toggleSource = (source: DatabaseSource) => {
    setSelectedSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    );
  };

  const toggleArticleType = (type: ArticleType) => {
    setArticleTypes((prev) => {
      if (type === 'all') {
        return ['all'];
      }
      const filtered = prev.filter((t) => t !== 'all');
      return filtered.includes(type)
        ? filtered.filter((t) => t !== type)
        : [...filtered, type];
    });
  };

  const handleStartResearch = () => {
    if (!question.trim() || disabled) return;

    onStartResearch?.({
      question: question.trim(),
      mode,
      depth,
      breadth,
      sources: selectedSources,
      dateRange: { start: startYear, end: endYear },
      articleTypes,
    });
  };

  return (
    <div className="w-full space-y-6 p-6 bg-card rounded-lg border border-border">
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

      {/* Research Question Input */}
      <div className="space-y-2">
        <Label htmlFor="research-question">Research Question</Label>
        <div className="relative">
          <Input
            id="research-question"
            placeholder="Enter your research question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="pr-10"
            disabled={disabled}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Research Mode Selector */}
      <div className="space-y-2">
        <Label>Research Mode</Label>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(modeConfigs) as ResearchMode[]).map((modeKey) => {
            const config = modeConfigs[modeKey];
            const isSelected = mode === modeKey;
            return (
              <button
                key={modeKey}
                onClick={() => handleModeChange(modeKey)}
                disabled={disabled}
                className={`
                  px-3 py-2 rounded-lg border text-sm font-medium transition-all
                  ${isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {config.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
        <div className="text-xs text-muted-foreground">
          {currentModeConfig.label}: {currentModeConfig.sources} sources · {currentModeConfig.duration}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        disabled={disabled}
      >
        <Settings className="w-4 h-4" />
        Advanced Settings
        {showAdvanced ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Advanced Settings Panel */}
      {showAdvanced && (
        <div className="space-y-6 p-4 bg-muted/30 rounded-lg border border-border">
          {/* Depth and Breadth */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Depth: {depth}</Label>
                <span className="text-xs text-muted-foreground">Recursion levels</span>
              </div>
              <Slider
                value={[depth]}
                onValueChange={([value]) => setDepth(value)}
                min={1}
                max={6}
                step={1}
                disabled={disabled}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Breadth: {breadth}</Label>
                <span className="text-xs text-muted-foreground">Parallel paths</span>
              </div>
              <Slider
                value={[breadth]}
                onValueChange={([value]) => setBreadth(value)}
                min={2}
                max={8}
                step={1}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Database Sources */}
          <div className="space-y-3">
            <Label>Sources</Label>
            <div className="grid grid-cols-2 gap-3">
              {databaseSources.map((source) => (
                <div key={source.id} className="flex items-start gap-2">
                  <Checkbox
                    id={source.id}
                    checked={selectedSources.includes(source.id)}
                    onCheckedChange={() => toggleSource(source.id)}
                    disabled={disabled}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={source.id}
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
            <Label>Date Range</Label>
            <div className="flex items-center gap-3">
              <Select
                value={startYear.toString()}
                onValueChange={(value) => setStartYear(parseInt(value))}
                disabled={disabled}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 25 }, (_, i) => 2024 - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">to</span>
              <Select
                value={endYear.toString()}
                onValueChange={(value) => setEndYear(parseInt(value))}
                disabled={disabled}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 25 }, (_, i) => 2024 - i).map((year) => (
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
            <Label>Article Types</Label>
            <div className="flex flex-wrap gap-3">
              {(['all', 'rct', 'review', 'meta-analysis'] as ArticleType[]).map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={articleTypes.includes(type)}
                    onCheckedChange={() => toggleArticleType(type)}
                    disabled={disabled}
                  />
                  <label
                    htmlFor={`type-${type}`}
                    className="text-sm font-medium cursor-pointer capitalize"
                  >
                    {type === 'rct' ? 'RCT' : type.replace('-', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Start Research Button */}
      <Button
        onClick={handleStartResearch}
        disabled={!question.trim() || disabled || selectedSources.length === 0}
        className="w-full h-12 text-base font-medium gap-2"
        size="lg"
      >
        <Search className="w-5 h-5" />
        Start Research
      </Button>
    </div>
  );
}
