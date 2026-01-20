/**
 * Research History Component
 *
 * Displays a list of past research sessions with ability to:
 * - View session details
 * - Continue incomplete sessions
 * - Delete sessions
 * - View synthesis and sources
 */

'use client';

import { useState, useEffect } from 'react';
import { Clock, Trash2, FileText, AlertCircle, CheckCircle2, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/supabase/auth';
import { getUserResearchSessions, deleteResearchSession } from '@/lib/supabase/research-sessions';
import type { ResearchMode, SessionStatus } from '@/lib/research/deep-research/types';

/**
 * Research session item for display
 */
interface SessionItem {
  id: string;
  topic: string;
  mode: ResearchMode;
  status: SessionStatus;
  progress: number;
  sourcesCollected: number;
  qualityScore?: number;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Props for ResearchHistory
 */
interface ResearchHistoryProps {
  /** Callback when user wants to view a session */
  onViewSession?: (sessionId: string) => void;

  /** Callback when user wants to continue a session */
  onContinueSession?: (sessionId: string) => void;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Get status badge color and icon
 */
function getStatusBadge(status: SessionStatus) {
  switch (status) {
    case 'complete':
      return {
        variant: 'default' as const,
        icon: CheckCircle2,
        label: 'Complete',
      };
    case 'failed':
      return {
        variant: 'destructive' as const,
        icon: AlertCircle,
        label: 'Failed',
      };
    case 'researching':
    case 'analyzing':
    case 'synthesizing':
      return {
        variant: 'secondary' as const,
        icon: Loader2,
        label: 'In Progress',
      };
    default:
      return {
        variant: 'outline' as const,
        icon: Clock,
        label: 'Pending',
      };
  }
}

/**
 * Get mode badge color
 */
function getModeBadgeVariant(mode: ResearchMode) {
  switch (mode) {
    case 'quick':
      return 'outline' as const;
    case 'standard':
      return 'secondary' as const;
    case 'deep':
      return 'default' as const;
    case 'exhaustive':
    case 'systematic':
      return 'default' as const;
    default:
      return 'outline' as const;
  }
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Research History Component
 */
export function ResearchHistory({
  onViewSession,
  onContinueSession,
  className,
}: ResearchHistoryProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /**
   * Load research sessions
   */
  useEffect(() => {
    async function loadSessions() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const sessionDocs = await getUserResearchSessions(user.uid);
        const sessionItems: SessionItem[] = sessionDocs.map((doc) => ({
          id: doc.id,
          topic: doc.topic,
          mode: doc.mode,
          status: doc.status,
          progress: doc.progress,
          sourcesCollected: doc.sourcesCollected,
          qualityScore: doc.qualityScore,
          createdAt: doc.createdAt,
          completedAt: doc.completedAt,
        }));
        setSessions(sessionItems);
      } catch (error) {
        console.error('Error loading research sessions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [user]);

  /**
   * Handle delete session
   */
  const handleDeleteSession = async () => {
    if (!deleteSessionId) return;

    setDeleting(true);
    try {
      await deleteResearchSession(deleteSessionId);
      setSessions((prev) => prev.filter((s) => s.id !== deleteSessionId));
      setDeleteSessionId(null);
    } catch (error) {
      console.error('Error deleting session:', error);
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (sessions.length === 0) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No research sessions yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Start a new research session to begin exploring academic literature with AI-powered analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {sessions.map((session) => {
          const statusBadge = getStatusBadge(session.status);
          const StatusIcon = statusBadge.icon;
          const canContinue = session.status !== 'complete' && session.status !== 'failed';

          return (
            <div
              key={session.id}
              className="group p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm mb-1 line-clamp-2">
                    {session.topic}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={statusBadge.variant} className="text-xs">
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusBadge.label}
                    </Badge>
                    <Badge variant={getModeBadgeVariant(session.mode)} className="text-xs">
                      {session.mode}
                    </Badge>
                    {session.qualityScore && (
                      <Badge variant="outline" className="text-xs">
                        Quality: {session.qualityScore}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onViewSession && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewSession(session.id)}
                      title="View session"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteSessionId(session.id)}
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>{session.sourcesCollected} sources</span>
                  {session.status !== 'complete' && (
                    <span>{session.progress}% complete</span>
                  )}
                  <span>{formatDate(session.createdAt)}</span>
                </div>

                {/* Continue button */}
                {canContinue && onContinueSession && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onContinueSession(session.id)}
                    className="text-xs"
                  >
                    Continue
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteSessionId !== null}
        onOpenChange={(open) => !open && setDeleteSessionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Research Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the research session
              and all associated data including sources, synthesis, and analysis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
