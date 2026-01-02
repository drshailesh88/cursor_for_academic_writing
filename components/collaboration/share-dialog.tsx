'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Share2,
  X,
  Link2,
  Mail,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Globe,
  Eye,
  MessageSquare,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/firebase/auth';
import { useSharing } from '@/lib/hooks/use-sharing';
import { SharePermission } from '@/lib/collaboration/types';
import { getDocument } from '@/lib/firebase/documents';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

/**
 * Permission level selector
 */
function PermissionSelect({
  value,
  onChange,
  disabled,
}: {
  value: SharePermission;
  onChange: (value: SharePermission) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SharePermission)}
      disabled={disabled}
      className="px-3 py-1.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="view">View only</option>
      <option value="comment">Can comment</option>
      <option value="edit">Can edit</option>
    </select>
  );
}

/**
 * Permission icon
 */
function PermissionIcon({ permission }: { permission: SharePermission }) {
  switch (permission) {
    case 'view':
      return <Eye className="h-4 w-4" />;
    case 'comment':
      return <MessageSquare className="h-4 w-4" />;
    case 'edit':
      return <Edit3 className="h-4 w-4" />;
  }
}

/**
 * Share Dialog Component
 */
export function ShareDialog({ isOpen, onClose, documentId }: ShareDialogProps) {
  const { user } = useAuth();
  const {
    shares,
    loading,
    createShareLink,
    shareWithEmail,
    revokeShare,
    updatePermission,
    copyShareLink,
    getShareUrl,
    activeLinkShare,
    emailShares,
  } = useSharing({ documentId });

  const [activeTab, setActiveTab] = useState<'link' | 'people'>('link');
  const [linkPermission, setLinkPermission] = useState<SharePermission>('view');
  const [linkExpiration, setLinkExpiration] = useState<number | undefined>(undefined);
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailPermission, setEmailPermission] = useState<SharePermission>('view');
  const [ownerName, setOwnerName] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Load document details
  useEffect(() => {
    if (isOpen && documentId) {
      getDocument(documentId).then((doc) => {
        if (doc) {
          setDocumentTitle(doc.title);
          // Load owner name
          if (user?.displayName) {
            setOwnerName(user.displayName);
          }
        }
      });
    }
  }, [isOpen, documentId, user]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (linkCopied) {
      const timeout = setTimeout(() => setLinkCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [linkCopied]);

  // Focus email input when switching to people tab
  useEffect(() => {
    if (activeTab === 'people' && emailInputRef.current) {
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [activeTab]);

  const handleCreateLink = async () => {
    const token = await createShareLink(linkPermission, linkExpiration);
    if (token) {
      await copyShareLink(token);
      setLinkCopied(true);
    }
  };

  const handleCopyLink = async () => {
    if (activeLinkShare?.shareToken) {
      await copyShareLink(activeLinkShare.shareToken);
      setLinkCopied(true);
    }
  };

  const handleRevokeLink = async () => {
    if (activeLinkShare) {
      await revokeShare(activeLinkShare.id);
    }
  };

  const handleUpdateLinkPermission = async (permission: SharePermission) => {
    if (activeLinkShare) {
      await updatePermission(activeLinkShare.id, permission);
    }
  };

  const handleShareWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    const success = await shareWithEmail(emailInput.trim(), emailPermission);
    if (success) {
      setEmailInput('');
    }
  };

  const handleRevokeEmailShare = async (shareId: string) => {
    await revokeShare(shareId);
  };

  const handleUpdateEmailPermission = async (shareId: string, permission: SharePermission) => {
    await updatePermission(shareId, permission);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-border">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Share2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Share Document</h2>
              </div>
              <p className="text-sm text-muted-foreground truncate">{documentTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Owner Info */}
        {ownerName && (
          <div className="px-4 py-3 bg-muted/30 border-b border-border">
            <p className="text-xs text-muted-foreground">
              Owner: <span className="font-medium text-foreground">{ownerName}</span>
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'link'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Link2 className="h-4 w-4" />
            Link
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'people'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            People
          </button>
        </div>

        {/* Content */}
        <div className="p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
          {activeTab === 'link' ? (
            /* Link Sharing Tab */
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">Share with link</p>
                  <p className="text-xs text-muted-foreground">
                    Anyone with the link can access this document
                  </p>
                </div>
              </div>

              {activeLinkShare ? (
                /* Active Link */
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <PermissionSelect
                      value={activeLinkShare.permission}
                      onChange={handleUpdateLinkPermission}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="flex items-center gap-2"
                    >
                      {linkCopied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-3 rounded-md bg-muted/50 text-xs font-mono truncate">
                    {getShareUrl(activeLinkShare.shareToken || '')}
                  </div>

                  {activeLinkShare.expiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Expires:{' '}
                      {new Date(activeLinkShare.expiresAt).toLocaleDateString()}
                    </p>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRevokeLink}
                    className="w-full text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revoke Link
                  </Button>
                </div>
              ) : (
                /* Create Link */
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-2 block">
                      Permission Level
                    </label>
                    <PermissionSelect
                      value={linkPermission}
                      onChange={setLinkPermission}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-2 block">
                      Link Expiration (Optional)
                    </label>
                    <select
                      value={linkExpiration || ''}
                      onChange={(e) =>
                        setLinkExpiration(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Never</option>
                      <option value={24 * 60 * 60 * 1000}>1 day</option>
                      <option value={7 * 24 * 60 * 60 * 1000}>7 days</option>
                      <option value={30 * 24 * 60 * 60 * 1000}>30 days</option>
                    </select>
                  </div>

                  <Button onClick={handleCreateLink} className="w-full" disabled={loading}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Create Share Link
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* People Sharing Tab */
            <div className="space-y-4">
              {/* Add People Form */}
              <form onSubmit={handleShareWithEmail} className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">Invite people</p>
                    <p className="text-xs text-muted-foreground">
                      Share with specific users by email
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <PermissionSelect
                    value={emailPermission}
                    onChange={setEmailPermission}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={!emailInput.trim() || loading}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </form>

              {/* People List */}
              {emailShares.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase">
                    People with access ({emailShares.length})
                  </h3>
                  <div className="space-y-2">
                    {emailShares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-primary">
                              {share.sharedWithEmail?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {share.sharedWithEmail}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Shared {new Date(share.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <PermissionSelect
                            value={share.permission}
                            onChange={(permission) =>
                              handleUpdateEmailPermission(share.id, permission)
                            }
                          />
                          <button
                            onClick={() => handleRevokeEmailShare(share.id)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                            title="Remove access"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {emailShares.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No one has been invited yet</p>
                  <p className="text-xs mt-1">Enter an email address to share this document</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage share dialog
 */
export function useShareDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const open = (docId: string) => {
    setDocumentId(docId);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setDocumentId(null);
  };

  return { isOpen, documentId, open, close };
}
