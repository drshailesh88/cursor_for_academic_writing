// Deep Research - Source Card Component
// Elegant, minimal paper/source display

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  FileText,
  Quote,
  ChevronDown,
  BookOpen,
  Users,
  Calendar,
  Hash,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import type { ResearchSource, CitationType } from '@/lib/deep-research/types';

interface SourceCardProps {
  source: ResearchSource;
  index?: number;
  compact?: boolean;
  onSelect?: (source: ResearchSource) => void;
}

const citationTypeConfig: Record<CitationType, {
  label: string;
  color: string;
  icon: typeof CheckCircle;
}> = {
  supporting: {
    label: 'Supporting',
    color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    icon: CheckCircle,
  },
  disputing: {
    label: 'Disputing',
    color: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    icon: AlertCircle,
  },
  mentioning: {
    label: 'Mentioning',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    icon: Quote,
  },
  methodology: {
    label: 'Methodology',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    icon: FileText,
  },
  data_source: {
    label: 'Data Source',
    color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
    icon: Hash,
  },
};

export function SourceCard({ source, index = 0, compact = false, onSelect }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeConfig = citationTypeConfig[source.citationType];
  const TypeIcon = typeConfig.icon;

  // Format authors
  const formatAuthors = () => {
    if (source.authors.length === 0) return 'Unknown Author';
    if (source.authors.length === 1) return source.authors[0].name;
    if (source.authors.length === 2) {
      return `${source.authors[0].lastName || source.authors[0].name} & ${source.authors[1].lastName || source.authors[1].name}`;
    }
    return `${source.authors[0].lastName || source.authors[0].name} et al.`;
  };

  if (compact) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => onSelect?.(source)}
        className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/30
                   hover:bg-muted/50 transition-all group"
      >
        <div className="flex items-start gap-3">
          <div className={`p-1.5 rounded-lg ${typeConfig.color}`}>
            <TypeIcon className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
              {source.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatAuthors()} · {source.year}
            </p>
          </div>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-card rounded-2xl border border-border hover:border-primary/20
                 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      {/* Main content */}
      <div className="p-5">
        {/* Header with type badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
            <TypeIcon className="w-3 h-3" />
            {typeConfig.label}
          </div>
          {source.citationCount !== undefined && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Quote className="w-3 h-3" />
              {source.citationCount}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold leading-snug mb-2 group-hover:text-primary transition-colors">
          {source.title}
        </h3>

        {/* Authors */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{formatAuthors()}</span>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {source.journal && (
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{source.journal}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{source.year}</span>
          </div>
          {source.openAccess && (
            <span className="text-green-600 dark:text-green-400 font-medium">
              Open Access
            </span>
          )}
        </div>

        {/* Abstract toggle */}
        {source.abstract && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 mt-4 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            {isExpanded ? 'Hide' : 'Show'} abstract
          </button>
        )}

        {/* Abstract */}
        {isExpanded && source.abstract && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-border"
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              {source.abstract}
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-3 bg-muted/30 border-t border-border rounded-b-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          {source.doi && (
            <span className="text-xs text-muted-foreground font-mono">
              {source.doi}
            </span>
          )}
        </div>
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80
                       font-medium transition-colors"
          >
            View source
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Grid of source cards
 */
interface SourceGridProps {
  sources: ResearchSource[];
  compact?: boolean;
  onSourceSelect?: (source: ResearchSource) => void;
}

export function SourceGrid({ sources, compact = false, onSourceSelect }: SourceGridProps) {
  if (sources.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
          <FileText className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No sources found</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {sources.map((source, index) => (
          <SourceCard
            key={source.id}
            source={source}
            index={index}
            compact
            onSelect={onSourceSelect}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sources.map((source, index) => (
        <SourceCard
          key={source.id}
          source={source}
          index={index}
          onSelect={onSourceSelect}
        />
      ))}
    </div>
  );
}
