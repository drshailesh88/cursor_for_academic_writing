'use client';

import { useAuth } from '@/lib/supabase/auth';
import { AuthButton } from './auth-button';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="max-w-md w-full mx-auto p-8 space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary">
              Academic Writing Platform
            </h1>
            <p className="text-muted-foreground">
              AI-powered writing assistant with PubMed integration
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in to save your work, access your documents, and sync across devices.
            </p>
            <AuthButton />
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>✓ Save and sync documents</p>
            <p>✓ Access from any device</p>
            <p>✓ PubMed research integration</p>
            <p>✓ Export to DOCX/PDF</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
