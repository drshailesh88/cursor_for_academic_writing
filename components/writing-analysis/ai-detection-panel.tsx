'use client';

import { useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, HelpCircle, Shield, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { detectAIContent, getDetectionSummary, type AIDetectionResult } from '@/lib/ai-detection/detector';

interface AIDetectionPanelProps {
  text: string;
  onAnalyze?: () => void;
}

/**
 * AI Detection Panel Component
 * Displays GPTZero-inspired AI content detection results
 */
export function AIDetectionPanel({ text, onAnalyze }: AIDetectionPanelProps) {
  const [result, setResult] = useState<AIDetectionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSentences, setShowSentences] = useState(false);

  const analyze = useCallback(() => {
    if (!text || text.trim().length < 50) {
      return;
    }

    setIsAnalyzing(true);
    onAnalyze?.();

    // Small delay to show loading state
    setTimeout(() => {
      const detectionResult = detectAIContent(text);
      setResult(detectionResult);
      setIsAnalyzing(false);
    }, 300);
  }, [text, onAnalyze]);

  // Get classification icon and color
  const getClassificationDisplay = (classification: AIDetectionResult['classification']) => {
    switch (classification) {
      case 'human':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          label: 'Human Written',
        };
      case 'mixed':
        return {
          icon: HelpCircle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          label: 'Mixed Content',
        };
      case 'ai-generated':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          label: 'AI Generated',
        };
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const hasEnoughText = wordCount >= 50;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Detection</span>
        </div>
        <button
          onClick={analyze}
          disabled={isAnalyzing || !hasEnoughText}
          className="flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          title={!hasEnoughText ? 'Need at least 50 words' : 'Analyze for AI content'}
        >
          <RefreshCw className={`h-3 w-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* Minimum text warning */}
      {!hasEnoughText && (
        <p className="text-xs text-muted-foreground">
          Need at least 50 words for AI detection ({wordCount} words)
        </p>
      )}

      {/* Results */}
      {result && !isAnalyzing && (
        <div className="space-y-3">
          {/* Classification Banner */}
          {(() => {
            const display = getClassificationDisplay(result.classification);
            const Icon = display.icon;
            return (
              <div className={`p-3 rounded-lg border ${display.bgColor} ${display.borderColor}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-5 w-5 ${display.color}`} />
                  <span className={`font-medium ${display.color}`}>{display.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {result.confidence} confidence
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getDetectionSummary(result)}
                </p>
              </div>
            );
          })()}

          {/* Probability Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Human: {result.humanProbability}%</span>
              <span>AI: {result.aiProbability}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${result.humanProbability}%` }}
              />
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${result.aiProbability}%` }}
              />
            </div>
          </div>

          {/* Metrics Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full"
          >
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>

          {showDetails && (
            <div className="space-y-3 pt-2 border-t border-border">
              {/* Burstiness */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">Burstiness</span>
                  <span className={`text-xs font-mono ${getScoreColor(result.metrics.burstiness.score)}`}>
                    {result.metrics.burstiness.score}/100
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      result.metrics.burstiness.score >= 70 ? 'bg-green-500' :
                      result.metrics.burstiness.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${result.metrics.burstiness.score}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {result.metrics.burstiness.description}
                  <span className="ml-1">(Variance: {result.metrics.burstiness.variance}%)</span>
                </p>
              </div>

              {/* Predictability */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">Unpredictability</span>
                  <span className={`text-xs font-mono ${getScoreColor(result.metrics.predictability.score)}`}>
                    {result.metrics.predictability.score}/100
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      result.metrics.predictability.score >= 70 ? 'bg-green-500' :
                      result.metrics.predictability.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${result.metrics.predictability.score}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {result.metrics.predictability.description}
                  {result.metrics.predictability.commonPatterns > 0 && (
                    <span className="ml-1">({result.metrics.predictability.commonPatterns} patterns found)</span>
                  )}
                </p>
              </div>

              {/* Vocabulary */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">Vocabulary Diversity</span>
                  <span className={`text-xs font-mono ${getScoreColor(result.metrics.vocabulary.score)}`}>
                    {result.metrics.vocabulary.score}/100
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      result.metrics.vocabulary.score >= 70 ? 'bg-green-500' :
                      result.metrics.vocabulary.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${result.metrics.vocabulary.score}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {result.metrics.vocabulary.description}
                  <span className="ml-1">(Unique: {Math.round(result.metrics.vocabulary.uniqueRatio * 100)}%)</span>
                </p>
              </div>

              {/* Patterns */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">Pattern Analysis</span>
                  <span className={`text-xs font-mono ${getScoreColor(result.metrics.patterns.score)}`}>
                    {result.metrics.patterns.score}/100
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      result.metrics.patterns.score >= 70 ? 'bg-green-500' :
                      result.metrics.patterns.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${result.metrics.patterns.score}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {result.metrics.patterns.description}
                </p>
              </div>
            </div>
          )}

          {/* Flagged Phrases */}
          {result.flaggedPhrases.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs font-medium text-red-500">
                Flagged Phrases ({result.flaggedPhrases.length})
              </span>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {result.flaggedPhrases.slice(0, 5).map((phrase, i) => (
                  <div key={i} className="text-xs bg-red-500/10 px-2 py-1 rounded">
                    <span className="text-red-400">&quot;{phrase.phrase}&quot;</span>
                    <span className="text-muted-foreground ml-2">- {phrase.reason}</span>
                  </div>
                ))}
                {result.flaggedPhrases.length > 5 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{result.flaggedPhrases.length - 5} more phrases
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Sentence Analysis Toggle */}
          {result.sentenceAnalysis.length > 0 && (
            <div className="pt-2 border-t border-border">
              <button
                onClick={() => setShowSentences(!showSentences)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full"
              >
                {showSentences ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Sentence Analysis ({result.sentenceAnalysis.length} sentences)
              </button>

              {showSentences && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {result.sentenceAnalysis.map((sentence, i) => (
                    <div
                      key={i}
                      className={`text-xs p-2 rounded border ${
                        sentence.aiLikelihood >= 60
                          ? 'bg-red-500/10 border-red-500/30'
                          : sentence.aiLikelihood >= 40
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-green-500/10 border-green-500/30'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-muted-foreground">#{i + 1}</span>
                        <span className={`font-mono ${
                          sentence.aiLikelihood >= 60 ? 'text-red-500' :
                          sentence.aiLikelihood >= 40 ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                          {sentence.aiLikelihood}% AI
                        </span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">
                        {sentence.text.substring(0, 100)}
                        {sentence.text.length > 100 && '...'}
                      </p>
                      {sentence.flags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {sentence.flags.map((flag, j) => (
                            <span key={j} className="text-[10px] bg-red-500/20 px-1 rounded">
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No analysis yet */}
      {!result && !isAnalyzing && hasEnoughText && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Click &quot;Analyze&quot; to check for AI-generated content
        </p>
      )}
    </div>
  );
}

export default AIDetectionPanel;
