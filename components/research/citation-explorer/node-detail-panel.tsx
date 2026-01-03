// Node Detail Panel
// Shows paper details when a node is selected

'use client';

import { motion } from 'framer-motion';
import {
  X,
  ExternalLink,
  Quote,
  Users,
  Calendar,
  BookOpen,
  Network,
  Plus,
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import type { GraphNode } from '@/lib/deep-research/citation-graph/types';

interface NodeDetailPanelProps {
  node: GraphNode;
  onClose: () => void;
  onExpand: () => void;
  onPin: () => void;
  onAddToResearch: () => void;
}

export function NodeDetailPanel({
  node,
  onClose,
  onExpand,
  onPin,
  onAddToResearch,
}: NodeDetailPanelProps) {
  const [showAbstract, setShowAbstract] = useState(false);
  const { paper } = node;

  const formatAuthors = () => {
    if (paper.authors.length === 0) return 'Unknown authors';
    if (paper.authors.length === 1) {
      return paper.authors[0].name || `${paper.authors[0].firstName} ${paper.authors[0].lastName}`;
    }
    const first = paper.authors[0].lastName || paper.authors[0].name;
    return `${first} et al.`;
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-80 h-full border-l border-border bg-card flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          {node.isSeed && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Seed
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            Depth {node.depth}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <h3 className="font-semibold leading-tight">{paper.title}</h3>

        {/* Meta info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>{formatAuthors()}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{paper.year}</span>
          </div>

          {paper.journal && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{paper.journal}</span>
            </div>
          )}

          {paper.citationCount !== undefined && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Quote className="w-4 h-4 flex-shrink-0" />
              <span>{paper.citationCount.toLocaleString()} citations</span>
            </div>
          )}
        </div>

        {/* DOI / Links */}
        {(paper.doi || paper.url) && (
          <div className="flex flex-wrap gap-2">
            {paper.doi && (
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs
                         rounded-md bg-muted hover:bg-muted/80 transition-colors"
              >
                DOI
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {paper.url && (
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs
                         rounded-md bg-muted hover:bg-muted/80 transition-colors"
              >
                View
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {paper.pdfUrl && (
              <a
                href={paper.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs
                         rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                PDF
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Abstract */}
        {paper.abstract && (
          <div>
            <button
              onClick={() => setShowAbstract(!showAbstract)}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground
                       hover:text-foreground transition-colors"
            >
              Abstract
              {showAbstract ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showAbstract && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-2 text-sm text-muted-foreground leading-relaxed"
              >
                {paper.abstract}
              </motion.p>
            )}
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`w-2 h-2 rounded-full ${
              node.isExpanded ? 'bg-green-500' : 'bg-amber-500'
            }`}
          />
          {node.isExpanded ? 'Connections loaded' : 'Double-click to expand'}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        {!node.isExpanded && !node.isSeed && (
          <button
            onClick={onExpand}
            className="w-full flex items-center justify-center gap-2 px-4 py-2
                     text-sm font-medium rounded-lg bg-primary text-primary-foreground
                     hover:bg-primary/90 transition-colors"
          >
            <Network className="w-4 h-4" />
            Expand Network
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={onAddToResearch}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                     text-sm rounded-lg border border-border
                     hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add to Research
          </button>

          <button
            onClick={onPin}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              node.isPinned
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:bg-muted'
            }`}
            title={node.isPinned ? 'Unpin' : 'Pin position'}
          >
            {node.isPinned ? (
              <PinOff className="w-4 h-4" />
            ) : (
              <Pin className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
