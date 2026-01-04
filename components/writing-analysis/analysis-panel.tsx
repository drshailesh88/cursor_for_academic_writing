'use client';

import { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Zap,
  Eye,
  MessageSquare,
  Target,
  RefreshCw,
  Shield,
} from 'lucide-react';
import type { WritingAnalysis, WritingIssue, IssueCategory } from '@/lib/writing-analysis/types';
import { getScoreRating, getReadabilityLevel } from '@/lib/writing-analysis/types';
import { AIDetectionPanel } from './ai-detection-panel';

interface AnalysisPanelProps {
  analysis: WritingAnalysis | null;
  isAnalyzing: boolean;
  onRefresh: () => void;
  text?: string;
}

/**
 * Score circle component
 */
function ScoreCircle({
  score,
  label,
  size = 'md',
}: {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const { rating, color } = getScoreRating(score);
  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-20 h-20 text-xl',
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${sizeClasses[size]}`}>
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
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-bold">
          {score}
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}

/**
 * Stat item component
 */
function StatItem({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'text-foreground',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className={`h-4 w-4 ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {subtext && <div className="text-xs text-muted-foreground">{subtext}</div>}
      </div>
      <div className={`text-sm font-semibold ${color}`}>{value}</div>
    </div>
  );
}

/**
 * Issue category display
 */
const CATEGORY_INFO: Record<IssueCategory, { label: string; icon: React.ElementType; color: string }> = {
  'grammar': { label: 'Grammar', icon: AlertTriangle, color: 'text-red-500' },
  'spelling': { label: 'Spelling', icon: AlertTriangle, color: 'text-red-500' },
  'punctuation': { label: 'Punctuation', icon: AlertTriangle, color: 'text-orange-500' },
  'style': { label: 'Style', icon: Zap, color: 'text-blue-500' },
  'clarity': { label: 'Clarity', icon: Eye, color: 'text-purple-500' },
  'readability': { label: 'Readability', icon: BookOpen, color: 'text-green-500' },
  'passive-voice': { label: 'Passive Voice', icon: MessageSquare, color: 'text-yellow-500' },
  'adverb-overuse': { label: 'Adverb Overuse', icon: Zap, color: 'text-orange-400' },
  'repeated-words': { label: 'Repeated Words', icon: RefreshCw, color: 'text-blue-400' },
  'sentence-length': { label: 'Sentence Length', icon: BarChart3, color: 'text-purple-400' },
  'sticky-sentences': { label: 'Sticky Sentences', icon: Target, color: 'text-pink-500' },
  'cliches': { label: 'Clichés', icon: MessageSquare, color: 'text-amber-500' },
  'hedging': { label: 'Hedging', icon: AlertTriangle, color: 'text-cyan-500' },
  'wordiness': { label: 'Wordiness', icon: Zap, color: 'text-indigo-500' },
  'transitions': { label: 'Transitions', icon: ChevronRight, color: 'text-teal-500' },
  'academic': { label: 'Academic Style', icon: BookOpen, color: 'text-violet-500' },
};

/**
 * Collapsible issue section
 */
function IssueSection({
  category,
  issues,
}: {
  category: IssueCategory;
  issues: WritingIssue[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const info = CATEGORY_INFO[category] || { label: category, icon: AlertTriangle, color: 'text-muted-foreground' };
  const Icon = info.icon;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 py-2 px-1 hover:bg-muted/50 transition-colors"
      >
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Icon className={`h-4 w-4 ${info.color}`} />
        <span className="flex-1 text-left text-sm">{info.label}</span>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full bg-muted ${info.color}`}>
          {issues.length}
        </span>
      </button>

      {isOpen && (
        <div className="pl-7 pr-2 pb-2 space-y-2">
          {issues.slice(0, 5).map((issue) => (
            <div
              key={issue.id}
              className="text-xs p-2 rounded bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="font-medium text-foreground">{issue.message}</div>
              {issue.text && (
                <div className="text-muted-foreground mt-1 truncate">
                  "{issue.text.substring(0, 50)}{issue.text.length > 50 ? '...' : ''}"
                </div>
              )}
            </div>
          ))}
          {issues.length > 5 && (
            <div className="text-xs text-muted-foreground text-center py-1">
              +{issues.length - 5} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Main Analysis Panel Component
 */
export function AnalysisPanel({ analysis, isAnalyzing, onRefresh, text = '' }: AnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'stats' | 'ai-check'>('overview');

  if (!analysis) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
        <BookOpen className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">Start writing to see analysis</p>
        <p className="text-xs mt-1">Minimum 50 characters needed</p>
      </div>
    );
  }

  const readabilityInfo = getReadabilityLevel(analysis.readability.fleschReadingEase);

  // Group issues by category
  const issuesByCategory: Record<string, WritingIssue[]> = {};
  for (const issue of analysis.issues) {
    if (!issuesByCategory[issue.category]) {
      issuesByCategory[issue.category] = [];
    }
    issuesByCategory[issue.category].push(issue);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Writing Analysis
        </h3>
        <button
          onClick={onRefresh}
          disabled={isAnalyzing}
          className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
          title="Refresh analysis"
        >
          <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['overview', 'issues', 'stats', 'ai-check'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'ai-check' ? (
              <span className="flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" />
                AI
              </span>
            ) : (
              tab.charAt(0).toUpperCase() + tab.slice(1)
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="flex justify-center">
              <ScoreCircle score={analysis.scores.overall} label="Overall" size="lg" />
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 gap-4">
              <ScoreCircle score={analysis.scores.grammar} label="Grammar" size="sm" />
              <ScoreCircle score={analysis.scores.clarity} label="Clarity" size="sm" />
              <ScoreCircle score={analysis.scores.engagement} label="Engagement" size="sm" />
              <ScoreCircle score={analysis.scores.delivery} label="Delivery" size="sm" />
            </div>

            {/* Readability */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Readability</span>
                <span className="text-sm font-bold">{readabilityInfo.level}</span>
              </div>
              <div className="text-xs text-muted-foreground">{readabilityInfo.description}</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs">Flesch Score:</span>
                <span className="text-xs font-medium">{analysis.readability.fleschReadingEase}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-1">
              <StatItem
                icon={BookOpen}
                label="Words"
                value={analysis.readability.totalWords.toLocaleString()}
              />
              <StatItem
                icon={MessageSquare}
                label="Sentences"
                value={analysis.readability.totalSentences}
                subtext={`Avg ${analysis.readability.avgSentenceLength} words`}
              />
              <StatItem
                icon={AlertTriangle}
                label="Issues Found"
                value={analysis.issues.length}
                color={analysis.issues.length > 10 ? 'text-orange-500' : 'text-green-500'}
              />
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div>
            {analysis.issues.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-sm font-medium">No issues found!</p>
                <p className="text-xs text-muted-foreground mt-1">Your writing looks great</p>
              </div>
            ) : (
              <div className="space-y-1">
                {Object.entries(issuesByCategory)
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([category, issues]) => (
                    <IssueSection
                      key={category}
                      category={category as IssueCategory}
                      issues={issues}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Readability Stats */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Readability
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Flesch Reading Ease</span>
                  <span className="font-medium">{analysis.readability.fleschReadingEase}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grade Level</span>
                  <span className="font-medium">{analysis.readability.fleschGradeLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gunning Fog Index</span>
                  <span className="font-medium">{analysis.readability.gunningFog}</span>
                </div>
                <div className="flex justify-between">
                  <span>Complex Words</span>
                  <span className="font-medium">{analysis.readability.complexWordPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Style Stats */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Style
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Passive Voice</span>
                  <span className={`font-medium ${
                    analysis.style.passiveVoicePercentage > 15 ? 'text-orange-500' : ''
                  }`}>
                    {analysis.style.passiveVoicePercentage}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Adverbs</span>
                  <span className={`font-medium ${
                    analysis.style.adverbPercentage > 5 ? 'text-orange-500' : ''
                  }`}>
                    {analysis.style.adverbPercentage}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Long Sentences</span>
                  <span className="font-medium">{analysis.style.longSentences}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sticky Sentences</span>
                  <span className="font-medium">{analysis.style.stickySentenceCount}</span>
                </div>
              </div>
            </div>

            {/* Vocabulary Stats */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Vocabulary
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Unique Words</span>
                  <span className="font-medium">{analysis.vocabulary.uniqueWords}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vocabulary Richness</span>
                  <span className="font-medium">
                    {(analysis.vocabulary.vocabularyRichness * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Clichés Found</span>
                  <span className={`font-medium ${
                    analysis.vocabulary.cliches.length > 0 ? 'text-orange-500' : ''
                  }`}>
                    {analysis.vocabulary.cliches.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Academic Stats */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Academic
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>First Person Usage</span>
                  <span className={`font-medium ${
                    analysis.academic.firstPersonCount > 0 ? 'text-orange-500' : ''
                  }`}>
                    {analysis.academic.firstPersonCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Formality Score</span>
                  <span className="font-medium">{analysis.academic.formalityScore}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hedging Balance</span>
                  <span className="font-medium">{analysis.academic.hedgingScore}</span>
                </div>
              </div>
            </div>

            {/* Repeated Words */}
            {analysis.vocabulary.repeatedWords.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Repeated Words
                </h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.vocabulary.repeatedWords.slice(0, 8).map((item) => (
                    <span
                      key={item.word}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted"
                    >
                      {item.word} ({item.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai-check' && (
          <AIDetectionPanel text={text} />
        )}
      </div>
    </div>
  );
}

export default AnalysisPanel;
