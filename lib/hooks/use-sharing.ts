// Custom hook for document sharing
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth';
import {
  createShareLink as createShareLinkAPI,
  createEmailShare as createEmailShareAPI,
  getDocumentShares,
  getSharedWithMe,
  revokeShare as revokeShareAPI,
  updateSharePermission as updateSharePermissionAPI,
} from '@/lib/collaboration/sharing';
import { DocumentShare, SharedDocument, SharePermission } from '@/lib/collaboration/types';
import { toast } from 'sonner';

interface UseSharingOptions {
  documentId?: string;
}

export function useSharing(options: UseSharingOptions = {}) {
  const { user } = useAuth();
  const { documentId } = options;

  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load shares for current document
  useEffect(() => {
    async function loadShares() {
      if (!documentId || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const documentShares = await getDocumentShares(documentId);
        setShares(documentShares);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error loading shares:', err);
      } finally {
        setLoading(false);
      }
    }

    loadShares();
  }, [documentId, user]);

  // Load documents shared with current user
  useEffect(() => {
    async function loadSharedWithMe() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const shared = await getSharedWithMe(user.uid);
        setSharedWithMe(shared);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error loading shared documents:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSharedWithMe();
  }, [user]);

  // Create a share link
  const createShareLink = useCallback(
    async (
      permission: SharePermission,
      expiresIn?: number
    ): Promise<string | null> => {
      if (!documentId || !user) {
        toast.error('Cannot create share link');
        return null;
      }

      try {
        const token = await createShareLinkAPI(
          documentId,
          user.uid,
          user.displayName || 'Unknown',
          permission,
          expiresIn
        );

        // Refresh shares list
        const updatedShares = await getDocumentShares(documentId);
        setShares(updatedShares);

        return token;
      } catch (err) {
        setError(err as Error);
        toast.error('Failed to create share link');
        console.error('Error creating share link:', err);
        return null;
      }
    },
    [documentId, user]
  );

  // Share with specific email
  const shareWithEmail = useCallback(
    async (email: string, permission: SharePermission): Promise<boolean> => {
      if (!documentId || !user) {
        toast.error('Cannot share document');
        return false;
      }

      try {
        await createEmailShareAPI(
          documentId,
          user.uid,
          user.displayName || 'Unknown',
          email,
          permission
        );

        // Refresh shares list
        const updatedShares = await getDocumentShares(documentId);
        setShares(updatedShares);

        toast.success(`Shared with ${email}`);
        return true;
      } catch (err) {
        setError(err as Error);
        toast.error('Failed to share document');
        console.error('Error sharing with email:', err);
        return false;
      }
    },
    [documentId, user]
  );

  // Revoke a share
  const revokeShare = useCallback(
    async (shareId: string): Promise<boolean> => {
      if (!documentId) {
        toast.error('Cannot revoke share');
        return false;
      }

      try {
        await revokeShareAPI(documentId, shareId);

        // Refresh shares list
        const updatedShares = await getDocumentShares(documentId);
        setShares(updatedShares);

        toast.success('Access revoked');
        return true;
      } catch (err) {
        setError(err as Error);
        toast.error('Failed to revoke access');
        console.error('Error revoking share:', err);
        return false;
      }
    },
    [documentId]
  );

  // Update share permission
  const updatePermission = useCallback(
    async (shareId: string, permission: SharePermission): Promise<boolean> => {
      if (!documentId) {
        toast.error('Cannot update permission');
        return false;
      }

      try {
        await updateSharePermissionAPI(documentId, shareId, permission);

        // Refresh shares list
        const updatedShares = await getDocumentShares(documentId);
        setShares(updatedShares);

        toast.success('Permission updated');
        return true;
      } catch (err) {
        setError(err as Error);
        toast.error('Failed to update permission');
        console.error('Error updating permission:', err);
        return false;
      }
    },
    [documentId]
  );

  // Copy link to clipboard
  const copyShareLink = useCallback(async (token: string): Promise<boolean> => {
    try {
      const url = `${window.location.origin}/shared/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
      return true;
    } catch (err) {
      toast.error('Failed to copy link');
      console.error('Error copying to clipboard:', err);
      return false;
    }
  }, []);

  // Generate shareable URL
  const getShareUrl = useCallback((token: string): string => {
    return `${window.location.origin}/shared/${token}`;
  }, []);

  // Get active link share (if any)
  const activeLinkShare = shares.find(
    (share) => share.type === 'link' && share.active
  );

  // Get email shares
  const emailShares = shares.filter((share) => share.type === 'email');

  return {
    shares,
    sharedWithMe,
    loading,
    error,
    createShareLink,
    shareWithEmail,
    revokeShare,
    updatePermission,
    copyShareLink,
    getShareUrl,
    activeLinkShare,
    emailShares,
  };
}
