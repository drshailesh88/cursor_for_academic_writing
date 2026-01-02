'use client';

import { useState, useEffect } from 'react';
import { X, RotateCcw, Tag, Calendar, User, FileText } from 'lucide-react';
import type { DocumentVersion } from '@/lib/collaboration/types';
import { format } from 'date-fns';

interface VersionPreviewModalProps {
  version: DocumentVersion | null;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (versionId: string) => void;
  currentContent?: string;
}

export function VersionPreviewModal({
  version,
  isOpen,
  onClose,
  onRestore,
  currentContent,
}: VersionPreviewModalProps) {
  const [showDiff, setShowDiff] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !version) {
    return null;
  }

  const handleRestore = () => {
    if (
      confirm(
        'Are you sure you want to restore this version? Your current content will be backed up first.'
      )
    ) {
      onRestore(version.id);
      onClose();
    }
  };

  const wordCountDiff =
    currentContent && version
      ? version.wordCount -
        currentContent.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean)
          .length
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] m-4 bg-background rounded-lg shadow-xl flex flex-col border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-semibold mb-1">
              Version {version.versionNumber}
              {version.label && (
                <span className="ml-3 text-base font-normal text-primary">
                  {version.label}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(version.createdAt, 'PPpp')}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {version.userName}
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {version.wordCount} words
              </div>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  version.type === 'manual'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {version.type === 'manual' ? 'Manual Save' : 'Auto Save'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-muted"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Description */}
        {version.description && (
          <div className="px-6 py-3 bg-muted/50 border-b border-border">
            <p className="text-sm text-muted-foreground">
              {version.description}
            </p>
          </div>
        )}

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{version.title}</h3>
            {currentContent && (
              <button
                onClick={() => setShowDiff(!showDiff)}
                className="px-3 py-1 text-sm rounded hover:bg-muted"
              >
                {showDiff ? 'Hide' : 'Show'} Comparison
              </button>
            )}
          </div>

          {showDiff && currentContent ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Current Version */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Current Version
                </div>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none p-4 border border-border rounded bg-card"
                  dangerouslySetInnerHTML={{ __html: currentContent }}
                />
              </div>

              {/* Version Preview */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Version {version.versionNumber}
                  {wordCountDiff !== 0 && (
                    <span
                      className={`ml-2 ${
                        wordCountDiff > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      ({wordCountDiff > 0 ? '+' : ''}
                      {wordCountDiff} words)
                    </span>
                  )}
                </div>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none p-4 border border-border rounded bg-card"
                  dangerouslySetInnerHTML={{ __html: version.content }}
                />
              </div>
            </div>
          ) : (
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: version.content }}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            This is a read-only preview of the version
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded hover:bg-muted"
            >
              Close
            </button>
            <button
              onClick={handleRestore}
              className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restore This Version
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
