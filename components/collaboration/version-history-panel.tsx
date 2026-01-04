'use client';

import { useState } from 'react';
import { Clock, Tag, Trash2, RotateCcw, RefreshCw, X } from 'lucide-react';
import type { DocumentVersion } from '@/lib/collaboration/types';
import { formatDistanceToNow } from 'date-fns';

interface VersionHistoryPanelProps {
  versions: DocumentVersion[];
  loading: boolean;
  onRestore: (versionId: string) => void;
  onDelete: (versionId: string) => void;
  onUpdateLabel: (versionId: string, label: string) => void;
  onPreview: (version: DocumentVersion) => void;
  onRefresh: () => void;
  onClose?: () => void;
}

export function VersionHistoryPanel({
  versions,
  loading,
  onRestore,
  onDelete,
  onUpdateLabel,
  onPreview,
  onRefresh,
  onClose,
}: VersionHistoryPanelProps) {
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState('');

  const handleLabelEdit = (version: DocumentVersion) => {
    setEditingLabel(version.id);
    setLabelInput(version.label || '');
  };

  const handleLabelSave = (versionId: string) => {
    if (labelInput.trim()) {
      onUpdateLabel(versionId, labelInput.trim());
    }
    setEditingLabel(null);
    setLabelInput('');
  };

  const handleLabelCancel = () => {
    setEditingLabel(null);
    setLabelInput('');
  };

  const getWordCountChange = (index: number): number | null => {
    if (index >= versions.length - 1) return null;
    const current = versions[index];
    const previous = versions[index + 1];
    return current.wordCount - previous.wordCount;
  };

  const formatWordCountChange = (change: number | null): string => {
    if (change === null) return '';
    if (change === 0) return '(no change)';
    const sign = change > 0 ? '+' : '';
    return `(${sign}${change} words)`;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Version History</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded hover:bg-muted disabled:opacity-50"
            title="Refresh versions"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-muted"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Versions List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && versions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Loading versions...
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No versions yet</p>
            <p className="text-sm mt-1">
              Versions are automatically saved every 5 minutes
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version, index) => {
              const wordCountChange = getWordCountChange(index);
              const isEditing = editingLabel === version.id;

              return (
                <div
                  key={version.id}
                  className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => !isEditing && onPreview(version)}
                >
                  {/* Version Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          Version {version.versionNumber}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                            version.type === 'manual'
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {version.type === 'manual' ? 'Manual' : 'Auto'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(version.createdAt, {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Label */}
                  {isEditing ? (
                    <div
                      className="mb-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleLabelSave(version.id);
                          } else if (e.key === 'Escape') {
                            handleLabelCancel();
                          }
                        }}
                        className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
                        placeholder="Add label..."
                        autoFocus
                      />
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => handleLabelSave(version.id)}
                          className="px-2 py-1 text-[10px] rounded bg-primary text-primary-foreground"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleLabelCancel}
                          className="px-2 py-1 text-[10px] rounded hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : version.label ? (
                    <div
                      className="flex items-center gap-1 mb-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLabelEdit(version);
                      }}
                    >
                      <Tag className="h-3 w-3 text-primary" />
                      <span className="text-primary font-medium">
                        {version.label}
                      </span>
                    </div>
                  ) : null}

                  {/* Description */}
                  {version.description && (
                    <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {version.description}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span>{version.wordCount} words</span>
                    {wordCountChange !== null && (
                      <span
                        className={
                          wordCountChange > 0
                            ? 'text-green-600 dark:text-green-400'
                            : wordCountChange < 0
                            ? 'text-red-600 dark:text-red-400'
                            : ''
                        }
                      >
                        {formatWordCountChange(wordCountChange)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onRestore(version.id)}
                      className="px-2 py-1 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1"
                      title="Restore this version"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </button>
                    {!version.label && (
                      <button
                        onClick={() => handleLabelEdit(version)}
                        className="px-2 py-1 text-xs rounded hover:bg-muted flex items-center gap-1"
                        title="Add label"
                      >
                        <Tag className="h-3 w-3" />
                        Label
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            'Are you sure you want to delete this version?'
                          )
                        ) {
                          onDelete(version.id);
                        }
                      }}
                      className="px-2 py-1 text-xs rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-1"
                      title="Delete version"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
