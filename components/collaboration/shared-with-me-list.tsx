'use client';

import { useAuth } from '@/lib/firebase/auth';
import { useSharing } from '@/lib/hooks/use-sharing';
import { FileText, Users, Eye, MessageSquare, Edit3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SharePermission } from '@/lib/collaboration/types';

interface SharedWithMeListProps {
  currentDocumentId?: string;
  onDocumentSelect: (documentId: string) => void;
}

/**
 * Permission badge component
 */
function PermissionBadge({ permission }: { permission: SharePermission }) {
  const getConfig = (perm: SharePermission) => {
    switch (perm) {
      case 'view':
        return {
          icon: Eye,
          label: 'View',
          className: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
        };
      case 'comment':
        return {
          icon: MessageSquare,
          label: 'Comment',
          className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
        };
      case 'edit':
        return {
          icon: Edit3,
          label: 'Edit',
          className: 'bg-green-500/10 text-green-500 border-green-500/30',
        };
    }
  };

  const config = getConfig(permission);
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </div>
  );
}

/**
 * Shared With Me List Component
 *
 * Displays documents that have been shared with the current user.
 */
export function SharedWithMeList({
  currentDocumentId,
  onDocumentSelect,
}: SharedWithMeListProps) {
  const { user } = useAuth();
  const { sharedWithMe, loading } = useSharing();

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-1">
      {sharedWithMe.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground text-sm">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No shared documents yet</p>
          <p className="text-[10px] mt-1 opacity-75">
            Documents others share with you will appear here
          </p>
        </div>
      ) : (
        sharedWithMe.map((doc) => (
          <div
            key={doc.documentId}
            className={`group relative w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${
              currentDocumentId === doc.documentId
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => onDocumentSelect(doc.documentId)}
          >
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">{doc.title}</p>
                <div className="flex items-center gap-1.5 mt-1 text-xs opacity-75">
                  <span className="truncate">by {doc.ownerName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs opacity-75 mt-1">
                  {doc.wordCount && (
                    <>
                      <span>{doc.wordCount} words</span>
                      <span>•</span>
                    </>
                  )}
                  <span>
                    {formatDistanceToNow(doc.sharedAt, {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Permission badge */}
            <div className="mt-2">
              <PermissionBadge permission={doc.permission} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
