// Deep Research - Research Mode Trigger
// Elegant button to enter research mode

'use client';

import { Sparkles } from 'lucide-react';
import { useResearch } from './research-context';

export function ResearchTrigger() {
  const { isResearchMode, enterResearchMode, status } = useResearch();

  // Don't show trigger when already in research mode
  if (isResearchMode) return null;

  return (
    <button
      onClick={enterResearchMode}
      className="group flex items-center gap-2 px-3 py-1.5 rounded-lg
                 bg-primary/5 hover:bg-primary/10
                 border border-primary/10 hover:border-primary/20
                 transition-all duration-200"
    >
      <Sparkles className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium text-primary">Deep Research</span>
    </button>
  );
}
