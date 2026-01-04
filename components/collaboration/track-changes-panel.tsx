'use client';

import { useState } from 'react';
import { Check, X, Plus, Minus, Clock, User, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TrackedChange, ChangeType } from '@/lib/collaboration/types';

interface TrackChangesPanelProps {
  changes: TrackedChange[];
  loading: boolean;
  onAcceptChange: (changeId: string) => void;
  onRejectChange: (changeId: string) => void;
  onClose?: () => void;
}

type FilterType = 'all' | 'insertions' | 'deletions';
type SortType = 'position' | 'time';

export function TrackChangesPanel({
  changes,
  loading,
  onAcceptChange,
  onRejectChange,
  onClose,
}: TrackChangesPanelProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('position');

  // Filter changes
  const filteredChanges = changes
    .filter((change) => {
      if (change.status !== 'pending') return false;
      if (filter === 'all') return true;
      if (filter === 'insertions') return change.type === 'insertion';
      if (filter === 'deletions') return change.type === 'deletion';
      return true;
    })
    .sort((a, b) => {
      if (sort === 'position') {
        return a.from - b.from;
      } else {
        return b.createdAt - a.createdAt;
      }
    });

  const getChangeIcon = (type: ChangeType) => {
    switch (type) {
      case 'insertion':
        return <Plus className="h-3.5 w-3.5 text-green-500" />;
      case 'deletion':
        return <Minus className="h-3.5 w-3.5 text-red-500" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }

    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }

    // Format as date
    return date.toLocaleDateString();
  };

  const truncateContent = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Track Changes</h3>
          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
            {filteredChanges.length}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted"
            title="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="p-2 border-b border-border space-y-2">
        {/* Type Filter */}
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 text-xs rounded ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('insertions')}
            className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
              filter === 'insertions'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <Plus className="h-3 w-3" />
            Insertions
          </button>
          <button
            onClick={() => setFilter('deletions')}
            className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
              filter === 'deletions'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <Minus className="h-3 w-3" />
            Deletions
          </button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Sort:</span>
          <button
            onClick={() => setSort('position')}
            className={`px-2 py-1 text-xs rounded ${
              sort === 'position'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            Position
          </button>
          <button
            onClick={() => setSort('time')}
            className={`px-2 py-1 text-xs rounded ${
              sort === 'time'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            Time
          </button>
        </div>
      </div>

      {/* Changes List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
            Loading changes...
          </div>
        ) : filteredChanges.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-sm text-muted-foreground mb-2">
              No pending changes
            </div>
            <div className="text-xs text-muted-foreground">
              {filter === 'all'
                ? 'All changes have been reviewed'
                : `No ${filter} to review`}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredChanges.map((change) => (
              <div
                key={change.id}
                className="p-3 hover:bg-muted/50 transition-colors"
              >
                {/* Change Header */}
                <div className="flex items-start gap-2 mb-2">
                  <div className="mt-0.5">{getChangeIcon(change.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium capitalize">
                        {change.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @ {change.from}-{change.to}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{change.userName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(change.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Change Content */}
                <div className="ml-6 mb-3">
                  {change.type === 'insertion' && change.newContent && (
                    <div className="text-sm p-2 rounded bg-green-500/10 border border-green-500/20">
                      <div className="text-xs text-muted-foreground mb-1">
                        Added:
                      </div>
                      <div className="text-green-700 dark:text-green-300">
                        {truncateContent(change.newContent)}
                      </div>
                    </div>
                  )}
                  {change.type === 'deletion' && change.oldContent && (
                    <div className="text-sm p-2 rounded bg-red-500/10 border border-red-500/20">
                      <div className="text-xs text-muted-foreground mb-1">
                        Deleted:
                      </div>
                      <div className="text-red-700 dark:text-red-300 line-through">
                        {truncateContent(change.oldContent)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="ml-6 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRejectChange(change.id)}
                    className="h-7 gap-1 text-xs"
                  >
                    <X className="h-3 w-3" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAcceptChange(change.id)}
                    className="h-7 gap-1 text-xs"
                  >
                    <Check className="h-3 w-3" />
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
