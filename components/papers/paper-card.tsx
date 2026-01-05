// Paper Card Component
// Display individual paper with actions

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Star,
  MoreVertical,
  Trash2,
  Edit2,
  MessageSquare,
  ExternalLink,
  Calendar,
  Users,
  BookOpen,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { Paper, PaperMetadata, PaperProcessingStatus } from '@/lib/firebase/schema';
import { DeletePaperDialog } from './delete-paper-dialog';

interface PaperCardProps {
  paper: Paper | PaperMetadata;
  onSelect?: (paper: Paper | PaperMetadata) => void;
  onDelete?: (paperId: string) => void;
  onFavorite?: (paperId: string) => void;
  onChat?: (paper: Paper | PaperMetadata) => void;
  compact?: boolean;
  selected?: boolean;
}

const statusConfig: Record<
  PaperProcessingStatus,
  { label: string; color: string; icon: typeof Loader2 }
> = {
  uploading: {
    label: 'Uploading',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    icon: Loader2,
  },
  processing: {
    label: 'Processing',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    icon: Loader2,
  },
  extracting_text: {
    label: 'Extracting text',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    icon: Loader2,
  },
  extracting_figures: {
    label: 'Extracting figures',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    icon: Loader2,
  },
  extracting_tables: {
    label: 'Extracting tables',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    icon: Loader2,
  },
  parsing_references: {
    label: 'Parsing references',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    icon: Loader2,
  },
  generating_embeddings: {
    label: 'Generating embeddings',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    icon: Loader2,
  },
  ready: {
    label: 'Ready',
    color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    icon: CheckCircle,
  },
  error: {
    label: 'Error',
    color: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    icon: AlertCircle,
  },
};

export function PaperCard({
  paper,
  onSelect,
  onDelete,
  onFavorite,
  onChat,
  compact = false,
  selected = false,
}: PaperCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const status = statusConfig[paper.processingStatus];
  const StatusIcon = status.icon;
  const isProcessing = ['uploading', 'processing', 'extracting_text', 'extracting_figures', 'extracting_tables', 'parsing_references', 'generating_embeddings'].includes(paper.processingStatus);

  // Format authors
  const formatAuthors = () => {
    if (!paper.authors || paper.authors.length === 0) return 'Unknown Author';
    if (paper.authors.length === 1) return paper.authors[0].name;
    if (paper.authors.length === 2) {
      return `${paper.authors[0].lastName || paper.authors[0].name} & ${paper.authors[1].lastName || paper.authors[1].name}`;
    }
    return `${paper.authors[0].lastName || paper.authors[0].name} et al.`;
  };

  const handleDelete = async (paperId: string) => {
    if (!onDelete) return;
    await onDelete(paperId);
    setShowMenu(false);
  };

  if (compact) {
    return (
      <motion.button
        onClick={() => onSelect?.(paper)}
        className={`
          w-full text-left p-3 rounded-xl border transition-all
          ${
            selected
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/30 hover:bg-muted/50'
          }
        `}
      >
        <div className="flex items-start gap-3">
          <div className={`p-1.5 rounded-lg ${status.color}`}>
            <StatusIcon className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium line-clamp-1">{paper.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatAuthors()} {paper.year && `· ${paper.year}`}
            </p>
          </div>
          {paper.isFavorite && (
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
          )}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        group bg-card rounded-2xl border transition-all
        ${
          selected
            ? 'border-primary shadow-lg shadow-primary/10'
            : 'border-border hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5'
        }
      `}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            <StatusIcon className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
            {status.label}
          </div>

          <div className="flex items-center gap-1">
            {paper.isFavorite && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            )}

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg py-1 z-10">
                  {onFavorite && (
                    <button
                      onClick={() => {
                        onFavorite(paper.id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Star className="w-4 h-4" />
                      {paper.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    </button>
                  )}
                  {onChat && paper.processingStatus === 'ready' && (
                    <button
                      onClick={() => {
                        onChat(paper);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat with paper
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setShowDeleteDialog(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete paper
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect?.(paper)}
          className="text-base font-semibold leading-snug mb-2 cursor-pointer hover:text-primary transition-colors line-clamp-2"
        >
          {paper.title}
        </h3>

        {/* Authors */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{formatAuthors()}</span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {'journal' in paper && paper.journal && (
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{paper.journal}</span>
            </div>
          )}
          {paper.year && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{paper.year}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {paper.tags && paper.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {paper.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {paper.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-muted-foreground">
                +{paper.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions Footer */}
      {paper.processingStatus === 'ready' && (
        <div className="px-5 py-3 bg-muted/30 border-t border-border rounded-b-2xl flex items-center justify-between">
          <button
            onClick={() => onSelect?.(paper)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <FileText className="w-3 h-3" />
            View paper
          </button>

          {onChat && (
            <button
              onClick={() => onChat(paper)}
              className="flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary/80 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              Chat
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {'id' in paper && (
        <DeletePaperDialog
          paper={paper as Paper}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirmDelete={handleDelete}
        />
      )}
    </motion.div>
  );
}

/**
 * Grid of paper cards
 */
interface PaperGridProps {
  papers: (Paper | PaperMetadata)[];
  onSelect?: (paper: Paper | PaperMetadata) => void;
  onDelete?: (paperId: string) => void;
  onFavorite?: (paperId: string) => void;
  onChat?: (paper: Paper | PaperMetadata) => void;
  compact?: boolean;
  selectedId?: string;
}

export function PaperGrid({
  papers,
  onSelect,
  onDelete,
  onFavorite,
  onChat,
  compact = false,
  selectedId,
}: PaperGridProps) {
  if (papers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
          <FileText className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No papers yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Upload PDFs to get started
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {papers.map((paper) => (
          <PaperCard
            key={paper.id}
            paper={paper}
            onSelect={onSelect}
            onDelete={onDelete}
            onFavorite={onFavorite}
            onChat={onChat}
            compact
            selected={paper.id === selectedId}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {papers.map((paper) => (
        <PaperCard
          key={paper.id}
          paper={paper}
          onSelect={onSelect}
          onDelete={onDelete}
          onFavorite={onFavorite}
          onChat={onChat}
          selected={paper.id === selectedId}
        />
      ))}
    </div>
  );
}
