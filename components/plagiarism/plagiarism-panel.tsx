'use client';

import { useState } from 'react';
import {
  Shield,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  Quote,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  AlertCircle,
} from 'lucide-react';
import type { PlagiarismResult, PlagiarismMatch } from '@/lib/plagiarism/types';
import { getClassificationInfo } from '@/lib/plagiarism/types';

interface PlagiarismPanelProps {
  result: PlagiarismResult | null;
  isChecking: boolean;
  onCheck: () => void;
  onExcludeMatch: (matchId: string) => void;
  onIncludeMatch: (matchId: string) => void;
  wordCount: number;
}

/**
 * Originality Score Circle
 */
function ScoreCircle({ score, size = 'lg' }: { score: number; size?: 'sm' | 'lg' }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-green-500';
    if (s >= 60) return 'text-emerald-500';
    if (s >= 40) return 'text-yellow-500';
    if (s >= 20) return 'text-orange-500';
    return 'text-red-500';
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const sizeClasses = size === 'lg' ? 'w-24 h-24 text-2xl' : 'w-12 h-12 text-sm';

  return (
    <div className={`relative ${sizeClasses}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/20"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={getColor(score)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${getColor(score)}`}>{Math.round(score)}%</span>
        {size === 'lg' && <span className="text-xs text-muted-foreground">Original</span>}
      </div>
    </div>
  );
}

/**
 * Match Card Component
 */
function MatchCard({
  match,
  onExclude,
  onInclude,
}: {
  match: PlagiarismMatch;
  onExclude: () => void;
  onInclude: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const getMatchTypeColor = (type: PlagiarismMatch['type']) => {
    switch (type) {
      case 'exact':
        return 'bg-red-500/10 border-red-500/30 text-red-500';
      case 'near-exact':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-500';
      case 'paraphrase':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500';
      case 'mosaic':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-500';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  const getMatchTypeLabel = (type: PlagiarismMatch['type']) => {
    switch (type) {
      case 'exact':
        return 'Exact Match';
      case 'near-exact':
        return 'Near Exact';
      case 'paraphrase':
        return 'Paraphrase';
      case 'mosaic':
        return 'Mosaic';
      default:
        return 'Structural';
    }
  };

  return (
    <div
      className={`border rounded-lg p-3 ${match.excluded ? 'opacity-50' : ''} ${getMatchTypeColor(match.type)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-background/50">
              {getMatchTypeLabel(match.type)}
            </span>
            <span className="text-xs text-muted-foreground">
              {match.similarity}% similar • {match.wordCount} words
            </span>
          </div>
          <p className="text-sm line-clamp-2">{match.text}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-background/50 rounded"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-current/20 space-y-2">
          {/* Source info */}
          {match.source.title && (
            <div className="flex items-center gap-2 text-xs">
              <FileText className="h-3 w-3" />
              <span className="font-medium">{match.source.title}</span>
            </div>
          )}
          {match.source.url && (
            <a
              href={match.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View Source
            </a>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {match.excluded ? (
              <button
                onClick={onInclude}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-background/50 hover:bg-background"
              >
                <Eye className="h-3 w-3" />
                Include in Score
              </button>
            ) : (
              <button
                onClick={onExclude}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-background/50 hover:bg-background"
              >
                <EyeOff className="h-3 w-3" />
                Exclude from Score
              </button>
            )}
            <button
              onClick={() => navigator.clipboard.writeText(match.text)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-background/50 hover:bg-background"
            >
              <Copy className="h-3 w-3" />
              Copy
            </button>
          </div>

          {match.excluded && match.exclusionReason && (
            <p className="text-xs text-muted-foreground">
              Excluded: {match.exclusionReason.replace('-', ' ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Main Plagiarism Panel
 */
export function PlagiarismPanel({
  result,
  isChecking,
  onCheck,
  onExcludeMatch,
  onIncludeMatch,
  wordCount,
}: PlagiarismPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'quotes' | 'patterns'>(
    'overview'
  );

  const hasEnoughText = wordCount >= 50;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Plagiarism Check</span>
        </div>
        <button
          onClick={onCheck}
          disabled={isChecking || !hasEnoughText}
          className="flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          title={!hasEnoughText ? 'Need at least 50 words' : 'Run plagiarism check'}
        >
          <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking...' : 'Check'}
        </button>
      </div>

      {/* Content */}
      {!hasEnoughText ? (
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div>
            <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Need at least 50 words for plagiarism check
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Current: {wordCount} words
            </p>
          </div>
        </div>
      ) : !result ? (
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div>
            <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Click &quot;Check&quot; to scan for plagiarism
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(['overview', 'matches', 'quotes', 'patterns'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'matches' && result.matches.length > 0 && (
                  <span className="ml-1 px-1 py-0.5 text-[10px] rounded-full bg-muted">
                    {result.matches.filter(m => !m.excluded).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Score */}
                <div className="flex flex-col items-center py-4">
                  <ScoreCircle score={result.originalityScore} size="lg" />
                  <div className="mt-3 text-center">
                    {(() => {
                      const info = getClassificationInfo(result.classification);
                      return (
                        <div className={`px-3 py-1 rounded-full ${info.bgColor}`}>
                          <span className={`text-sm font-medium ${info.color}`}>
                            {info.label}
                          </span>
                        </div>
                      );
                    })()}
                    <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">
                      {getClassificationInfo(result.classification).description}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{result.stats.totalWords}</div>
                    <div className="text-xs text-muted-foreground">Total Words</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-orange-500">
                      {result.stats.matchedWords}
                    </div>
                    <div className="text-xs text-muted-foreground">Matched Words</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{result.stats.uniqueSources}</div>
                    <div className="text-xs text-muted-foreground">Sources</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-green-500">
                      {result.stats.excludedWords}
                    </div>
                    <div className="text-xs text-muted-foreground">Excluded</div>
                  </div>
                </div>

                {/* Self-Plagiarism Warning */}
                {result.selfPlagiarism.length > 0 && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-500">
                        Self-Plagiarism Detected
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Found {result.selfPlagiarism.length} match(es) with your other documents
                    </p>
                  </div>
                )}

                {/* Processing Time */}
                <div className="text-xs text-muted-foreground text-center">
                  Processed in {result.stats.processingTime}ms • {result.confidence} confidence
                </div>
              </div>
            )}

            {activeTab === 'matches' && (
              <div className="space-y-3">
                {result.matches.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-medium">No Matches Found</p>
                    <p className="text-xs text-muted-foreground">
                      Your content appears to be original
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {result.matches.filter(m => !m.excluded).length} active matches •{' '}
                      {result.matches.filter(m => m.excluded).length} excluded
                    </p>
                    {result.matches.map(match => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onExclude={() => onExcludeMatch(match.id)}
                        onInclude={() => onIncludeMatch(match.id)}
                      />
                    ))}
                  </>
                )}

                {/* Self-Plagiarism Matches */}
                {result.selfPlagiarism.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Self-Plagiarism ({result.selfPlagiarism.length})
                    </h4>
                    {result.selfPlagiarism.map(match => (
                      <div
                        key={match.id}
                        className="border rounded-lg p-3 bg-yellow-500/10 border-yellow-500/30 mb-2"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-yellow-500">
                            From: {match.sourceDocument.title}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2">{match.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {match.similarity}% similar • {match.wordCount} words
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'quotes' && (
              <div className="space-y-3">
                {result.uncitedQuotes.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-medium">All Quotes Cited</p>
                    <p className="text-xs text-muted-foreground">
                      No uncited quotations found
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 mb-3">
                      <div className="flex items-center gap-2">
                        <Quote className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-orange-500">
                          {result.uncitedQuotes.length} Uncited Quote(s)
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        These quotations need citations to be properly attributed
                      </p>
                    </div>
                    {result.uncitedQuotes.map(quote => (
                      <div
                        key={quote.id}
                        className="border rounded-lg p-3 border-border"
                      >
                        <p className="text-sm italic">&quot;{quote.text}&quot;</p>
                        <p className="text-xs text-orange-500 mt-2">{quote.suggestion}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {activeTab === 'patterns' && (
              <div className="space-y-3">
                {result.suspiciousPatterns.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-medium">No Suspicious Patterns</p>
                    <p className="text-xs text-muted-foreground">
                      No text manipulation detected
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-500">
                          {result.suspiciousPatterns.length} Pattern(s) Detected
                        </span>
                      </div>
                    </div>
                    {result.suspiciousPatterns.map((pattern, i) => (
                      <div
                        key={i}
                        className="border rounded-lg p-3 border-red-500/30 bg-red-500/10"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">
                            {pattern.type.replace(/-/g, ' ')}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20">
                            Severity: {pattern.severity}/5
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {pattern.description}
                        </p>
                        {pattern.positions.length > 0 && (
                          <p className="text-xs text-red-500 mt-1">
                            Found at {pattern.positions.length} location(s)
                          </p>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PlagiarismPanel;
