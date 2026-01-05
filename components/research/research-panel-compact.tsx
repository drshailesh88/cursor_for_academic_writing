// Research Panel - Compact sidebar version
// Provides quick access to deep research features

'use client';

import { useState } from 'react';
import { Sparkles, Search, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResearch } from './research-context';
import type { ResearchMode } from '@/lib/deep-research/types';

interface ResearchPanelCompactProps {
  documentContent: string;
  onInsertToEditor?: (content: string) => void;
}

const quickModes: { mode: ResearchMode; label: string; icon: typeof Layers }[] = [
  { mode: 'quick', label: 'Quick (10 sources)', icon: Sparkles },
  { mode: 'standard', label: 'Standard (25 sources)', icon: Search },
  { mode: 'deep', label: 'Deep (50 sources)', icon: Layers },
];

export function ResearchPanelCompact({
  documentContent,
  onInsertToEditor,
}: ResearchPanelCompactProps) {
  const { enterResearchMode, setMode, setTopic, status } = useResearch();
  const [quickTopic, setQuickTopic] = useState('');

  const handleQuickResearch = (mode: ResearchMode) => {
    if (!quickTopic.trim()) return;
    setTopic(quickTopic);
    setMode(mode);
    enterResearchMode();
  };

  const handleOpenFull = () => {
    enterResearchMode();
  };

  const isResearching = status !== 'idle' && status !== 'complete';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold">Deep Research</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Multi-perspective AI research synthesis
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick Research Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Research Topic</label>
          <textarea
            value={quickTopic}
            onChange={(e) => setQuickTopic(e.target.value)}
            placeholder="What would you like to research?"
            className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={3}
            disabled={isResearching}
          />

          {/* Quick Mode Buttons */}
          <div className="space-y-2">
            {quickModes.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => handleQuickResearch(mode)}
                disabled={!quickTopic.trim() || isResearching}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-primary/5 hover:bg-primary/10 text-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Full Research Button */}
          <Button
            onClick={handleOpenFull}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Search className="w-4 h-4 mr-2" />
            Open Full Research Panel
          </Button>
        </div>

        {/* Status */}
        {isResearching && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Research in progress...</span>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
          <p className="font-medium">How it works:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Searches multiple academic databases</li>
            <li>Analyzes and synthesizes findings</li>
            <li>Provides citations and references</li>
            <li>Generates comprehensive summaries</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
