'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth, signInWithGoogle, signOut } from '@/lib/firebase/auth';
import { LogIn, LogOut, User } from 'lucide-react';

export function AuthButton() {
  const { user, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      alert('Failed to sign in. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <User className="w-8 h-8 p-1 rounded-full bg-muted" />
          )}
          <span className="hidden md:inline text-muted-foreground">
            {user.displayName || user.email}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleSignIn}
      disabled={signingIn}
    >
      <LogIn className="w-4 h-4 mr-2" />
      {signingIn ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
}
