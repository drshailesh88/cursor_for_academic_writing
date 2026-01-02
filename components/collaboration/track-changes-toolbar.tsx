'use client';

import { Check, X, Eye, EyeOff, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrackChangesToolbarProps {
  trackingEnabled: boolean;
  showChanges: boolean;
  pendingCount: number;
  onToggleTracking: () => void;
  onToggleShowChanges: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  disabled?: boolean;
}

export function TrackChangesToolbar({
  trackingEnabled,
  showChanges,
  pendingCount,
  onToggleTracking,
  onToggleShowChanges,
  onAcceptAll,
  onRejectAll,
  disabled = false,
}: TrackChangesToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 border-b border-border">
      {/* Track Changes Toggle */}
      <button
        onClick={onToggleTracking}
        disabled={disabled}
        className={`px-3 py-1 text-sm rounded flex items-center gap-1.5 transition-colors ${
          trackingEnabled
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={trackingEnabled ? 'Stop tracking changes' : 'Start tracking changes'}
      >
        <FileEdit className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Track Changes</span>
        {trackingEnabled && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-white/20">
            ON
          </span>
        )}
      </button>

      {/* Show/Hide Changes Toggle */}
      <button
        onClick={onToggleShowChanges}
        disabled={disabled || !trackingEnabled}
        className="px-3 py-1 text-sm rounded hover:bg-muted flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        title={showChanges ? 'Hide changes' : 'Show changes'}
      >
        {showChanges ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">{showChanges ? 'Hide' : 'Show'}</span>
      </button>

      {/* Pending changes count */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Pending:</span>
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
            {pendingCount}
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* Accept/Reject All Buttons */}
      {pendingCount > 0 && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={onRejectAll}
            disabled={disabled}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reject All</span>
          </Button>

          <Button
            size="sm"
            onClick={onAcceptAll}
            disabled={disabled}
            className="gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Accept All</span>
          </Button>
        </>
      )}
    </div>
  );
}
