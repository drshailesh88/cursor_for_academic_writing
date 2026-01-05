// Discovery Panel - Compact sidebar version
// Citation network exploration and recommendations

'use client';

import { useState } from 'react';
import { Network, TrendingUp, Lightbulb, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCitationExplorer } from './citation-explorer';

interface DiscoveryPanelCompactProps {
  documentContent: string;
  onInsertToEditor?: (content: string) => void;
}

export function DiscoveryPanelCompact({
  documentContent,
  onInsertToEditor,
}: DiscoveryPanelCompactProps) {
  // Mock recommendations - in real implementation, these would come from an API
  const recommendations = [
    {
      title: 'Trending in your field',
      papers: [
        'Recent advances in deep learning for medical imaging',
        'Meta-analysis of AI diagnostic accuracy in radiology',
        'Ethical considerations in clinical AI deployment',
      ],
    },
    {
      title: 'Similar to your document',
      papers: [
        'Systematic review of transformer architectures',
        'Comparative analysis of attention mechanisms',
        'Best practices for model interpretability',
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Network className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold">Discovery</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Explore citation networks and find related papers
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Citation Explorer */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Network className="w-4 h-4" />
            Citation Network
          </h4>
          <p className="text-xs text-muted-foreground">
            Explore how papers are connected through citations
          </p>

          <p className="text-sm text-muted-foreground">
            Explore citation networks by clicking the network icon on any paper in your library
            or from search results.
          </p>

          <Button
            onClick={() => {
              // Open the full citation explorer modal
              // The actual paper will be selected from the library
              alert('Select a paper from your library to explore its citation network');
            }}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Network className="w-4 h-4 mr-2" />
            Learn More
          </Button>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Recommendations
          </h4>

          {recommendations.map((section, i) => (
            <div key={i} className="space-y-2">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                {section.title}
              </h5>
              <div className="space-y-1">
                {section.papers.map((paper, j) => (
                  <button
                    key={j}
                    onClick={() => {
                      // In real implementation, this would open the paper details
                      console.log('Open paper:', paper);
                    }}
                    className="w-full text-left p-2 text-sm bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="line-clamp-2">{paper}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Smart Insights */}
        <div className="p-3 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="w-4 h-4" />
            Smart Insights
          </div>
          <p className="text-xs text-muted-foreground">
            Based on your document, we recommend exploring recent work on:
          </p>
          <div className="flex flex-wrap gap-1">
            {['Transformers', 'Attention Mechanisms', 'Neural Networks'].map((topic) => (
              <span
                key={topic}
                className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Discovery Features:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Visualize citation networks</li>
            <li>Find related papers automatically</li>
            <li>Track trending research topics</li>
            <li>Get personalized recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
