// Deep Research - Synthesis Preview Component
// Elegant display of synthesized research output

'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  BookOpen,
  Quote,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  Download,
  Star,
  MessageSquare,
} from 'lucide-react';
import type { SynthesisResult, SynthesisSection, ResearchSource, ReviewFeedback } from '@/lib/deep-research/types';
import { SourceCard } from './source-card';

interface SynthesisPreviewProps {
  synthesis: SynthesisResult;
  sources: ResearchSource[];
  onInsertToEditor?: (content: string) => void;
  onExport?: (format: 'markdown' | 'docx') => void;
}

/**
 * Main synthesis preview component
 */
export function SynthesisPreview({
  synthesis,
  sources,
  onInsertToEditor,
  onExport,
}: SynthesisPreviewProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(synthesis.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'sections', label: 'Sections', icon: FileText, count: synthesis.sections.length },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, count: synthesis.reviewFeedback.length },
    { id: 'sources', label: 'Sources', icon: BookOpen, count: sources.length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Research Synthesis</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{synthesis.wordCount.toLocaleString()} words</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" />
                  {synthesis.qualityScore}% quality
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                       text-sm text-muted-foreground hover:text-foreground
                       hover:bg-muted transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>

            {onExport && (
              <button
                onClick={() => onExport('docx')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         text-sm text-muted-foreground hover:text-foreground
                         hover:bg-muted transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}

            {onInsertToEditor && (
              <button
                onClick={() => onInsertToEditor(synthesis.content)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         text-sm font-medium text-primary-foreground bg-primary
                         hover:bg-primary/90 transition-colors"
              >
                Insert
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id ||
                          (activeSection === null && tab.id === 'overview');

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium
                         border-b-2 transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-muted text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div ref={contentRef} className="p-6">
        <AnimatePresence mode="wait">
          {(activeSection === null || activeSection === 'overview') && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SynthesisOverview synthesis={synthesis} sources={sources} />
            </motion.div>
          )}

          {activeSection === 'sections' && (
            <motion.div
              key="sections"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SectionsList sections={synthesis.sections} />
            </motion.div>
          )}

          {activeSection === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <FeedbackList feedback={synthesis.reviewFeedback} />
            </motion.div>
          )}

          {activeSection === 'sources' && (
            <motion.div
              key="sources"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SourcesList sources={sources} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/**
 * Overview section
 */
function SynthesisOverview({
  synthesis,
  sources,
}: {
  synthesis: SynthesisResult;
  sources: ResearchSource[];
}) {
  return (
    <div className="space-y-6">
      {/* Main content preview */}
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <div className="text-base leading-relaxed whitespace-pre-wrap">
          {synthesis.content.length > 1500
            ? synthesis.content.slice(0, 1500) + '...'
            : synthesis.content}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
        <div className="text-center p-4 rounded-xl bg-muted/50">
          <div className="text-2xl font-semibold text-primary">
            {sources.length}
          </div>
          <div className="text-sm text-muted-foreground">Sources</div>
        </div>
        <div className="text-center p-4 rounded-xl bg-muted/50">
          <div className="text-2xl font-semibold text-primary">
            {synthesis.sections.length}
          </div>
          <div className="text-sm text-muted-foreground">Sections</div>
        </div>
        <div className="text-center p-4 rounded-xl bg-muted/50">
          <div className="text-2xl font-semibold text-primary">
            {synthesis.wordCount.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Words</div>
        </div>
        <div className="text-center p-4 rounded-xl bg-muted/50">
          <div className="text-2xl font-semibold text-primary">
            v{synthesis.revisionCount + 1}
          </div>
          <div className="text-sm text-muted-foreground">Revision</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Sections list
 */
function SectionsList({ sections }: { sections: SynthesisSection[] }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (sections.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No sections available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections
        .sort((a, b) => a.order - b.order)
        .map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border border-border rounded-xl overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === section.id ? null : section.id
                )
              }
              className="w-full flex items-center justify-between px-4 py-3
                       bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10
                               flex items-center justify-center text-xs font-medium text-primary">
                  {index + 1}
                </span>
                <span className="font-medium">{section.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {section.sourceIds.length} sources
                </span>
                {expandedSection === section.id ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {expandedSection === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 border-t border-border">
                    <div className="prose prose-neutral dark:prose-invert max-w-none text-sm">
                      {section.content}
                    </div>
                    {section.evidence.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                          Key Evidence
                        </h4>
                        <div className="space-y-2">
                          {section.evidence.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="text-sm p-2 rounded-lg bg-muted/50"
                            >
                              {item.claim}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
    </div>
  );
}

/**
 * Feedback list section
 */
function FeedbackList({ feedback }: { feedback: ReviewFeedback[] }) {
  if (feedback.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No feedback to display</p>
      </div>
    );
  }

  const severityColors = {
    error: 'border-red-500/20 bg-red-50/50 dark:bg-red-900/10',
    warning: 'border-amber-500/20 bg-amber-50/50 dark:bg-amber-900/10',
    suggestion: 'border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10',
  };

  const severityIcons = {
    error: AlertTriangle,
    warning: Lightbulb,
    suggestion: MessageSquare,
  };

  return (
    <div className="space-y-3">
      {feedback.map((item, index) => {
        const Icon = severityIcons[item.severity];
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-start gap-3 p-4 rounded-xl border ${
              severityColors[item.severity]
            } ${item.resolved ? 'opacity-50' : ''}`}
          >
            <Icon
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                item.severity === 'error'
                  ? 'text-red-500'
                  : item.severity === 'warning'
                    ? 'text-amber-500'
                    : 'text-blue-500'
              }`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  {item.type}
                </span>
                {item.resolved && (
                  <span className="text-xs text-green-600">✓ Resolved</span>
                )}
              </div>
              <p className="text-sm leading-relaxed">{item.message}</p>
              {item.location && (
                <p className="text-xs text-muted-foreground mt-1">
                  Location: {item.location}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Sources list section
 */
function SourcesList({ sources }: { sources: ResearchSource[] }) {
  const [groupBy, setGroupBy] = useState<'type' | 'year' | 'none'>('none');

  if (sources.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No sources available</p>
      </div>
    );
  }

  // Group sources if needed
  const groupedSources =
    groupBy === 'none'
      ? { 'All Sources': sources }
      : sources.reduce(
          (acc, source) => {
            const key =
              groupBy === 'type' ? source.citationType : source.year.toString();
            if (!acc[key]) acc[key] = [];
            acc[key].push(source);
            return acc;
          },
          {} as Record<string, ResearchSource[]>
        );

  return (
    <div className="space-y-4">
      {/* Group toggle */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Group by:</span>
        {(['none', 'type', 'year'] as const).map((option) => (
          <button
            key={option}
            onClick={() => setGroupBy(option)}
            className={`px-2 py-1 rounded-md transition-colors ${
              groupBy === option
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            {option === 'none'
              ? 'None'
              : option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>

      {/* Source groups */}
      {Object.entries(groupedSources).map(([group, groupSources]) => (
        <div key={group} className="space-y-2">
          {groupBy !== 'none' && (
            <h3 className="text-sm font-medium text-muted-foreground capitalize">
              {group} ({groupSources.length})
            </h3>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {groupSources.map((source, index) => (
              <SourceCard key={source.id} source={source} index={index} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Compact inline citation reference
 */
interface CitationRefProps {
  source: ResearchSource;
  onClick?: () => void;
}

export function CitationRef({ source, onClick }: CitationRefProps) {
  const formatAuthor = () => {
    if (source.authors.length === 0) return 'Unknown';
    if (source.authors.length === 1) {
      return source.authors[0].lastName || source.authors[0].name;
    }
    return `${source.authors[0].lastName || source.authors[0].name} et al.`;
  };

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded
                 text-primary bg-primary/5 hover:bg-primary/10
                 text-sm transition-colors"
    >
      <Quote className="w-3 h-3" />
      {formatAuthor()}, {source.year}
    </button>
  );
}

/**
 * Expandable section component for structured content
 */
interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function ExpandableSection({
  title,
  children,
  defaultExpanded = true,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3
                   bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium">{title}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
