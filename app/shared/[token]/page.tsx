'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateShareToken } from '@/lib/collaboration/sharing';
import { useAuth } from '@/lib/firebase/auth';
import { Loader2, AlertCircle, FileText, Eye, MessageSquare, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SharePermission } from '@/lib/collaboration/types';

interface SharePageProps {
  params: {
    token: string;
  };
}

/**
 * Permission icon component
 */
function PermissionIcon({ permission }: { permission: SharePermission }) {
  switch (permission) {
    case 'view':
      return <Eye className="h-5 w-5" />;
    case 'comment':
      return <MessageSquare className="h-5 w-5" />;
    case 'edit':
      return <Edit3 className="h-5 w-5" />;
  }
}

/**
 * Permission label
 */
function getPermissionLabel(permission: SharePermission): string {
  switch (permission) {
    case 'view':
      return 'View Only';
    case 'comment':
      return 'Can Comment';
    case 'edit':
      return 'Can Edit';
  }
}

/**
 * Shared Document Access Page
 *
 * Validates share token and redirects to the document with appropriate permissions.
 */
export default function SharedDocumentPage({ params }: SharePageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [permission, setPermission] = useState<SharePermission | null>(null);

  useEffect(() => {
    async function validateToken() {
      try {
        setValidating(true);
        setError(null);

        // Validate the share token
        const result = await validateShareToken(params.token);

        if (!result) {
          setError('This share link is invalid or has expired.');
          setValidating(false);
          return;
        }

        // Store document ID and permission
        setDocumentId(result.documentId);
        setPermission(result.permission);

        // If user is already authenticated, redirect to document
        if (user) {
          router.push(`/?doc=${result.documentId}`);
        } else {
          // Wait for authentication
          setValidating(false);
        }
      } catch (err) {
        console.error('Error validating share token:', err);
        setError('An error occurred while accessing this document.');
        setValidating(false);
      }
    }

    if (!authLoading) {
      validateToken();
    }
  }, [params.token, user, authLoading, router]);

  // Redirect when user signs in
  useEffect(() => {
    if (user && documentId && !validating) {
      router.push(`/?doc=${documentId}`);
    }
  }, [user, documentId, validating, router]);

  if (authLoading || validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Validating share link...</h2>
            <p className="text-sm text-muted-foreground">
              Please wait while we verify your access
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This link may have been revoked or expired.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact the document owner for a new link.
            </p>
          </div>
          <Button onClick={() => router.push('/')} className="w-full">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user && documentId && permission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Document Shared With You</h2>
              <p className="text-muted-foreground">
                A document has been shared with you
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Access Level</span>
              <div className="flex items-center gap-2 text-sm">
                <PermissionIcon permission={permission} />
                <span className="font-medium">{getPermissionLabel(permission)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              Sign in to view this document
            </p>
            <Button
              onClick={() => router.push('/')}
              className="w-full"
              size="lg"
            >
              Sign In to Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting to document...</p>
      </div>
    </div>
  );
}
