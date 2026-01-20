'use client';

import { useEffect, useState } from 'react';
import type { User as SupabaseUser, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from './client';
import type { UserProfile } from './schema';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

const DEV_MOCK_USER: AuthUser = {
  uid: 'dev-test-user',
  email: 'dev@test.local',
  displayName: 'Dev Test User',
  photoURL: null,
};

function mapUser(user: SupabaseUser): AuthUser {
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email ||
    null;

  return {
    uid: user.id,
    email: user.email ?? null,
    displayName,
    photoURL: (user.user_metadata?.avatar_url as string | undefined) || null,
  };
}

export function isDevAuthBypass(): boolean {
  return DEV_AUTH_BYPASS;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(DEV_AUTH_BYPASS ? DEV_MOCK_USER : null);
  const [loading, setLoading] = useState(!DEV_AUTH_BYPASS);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      setUser(DEV_MOCK_USER);
      setLoading(false);
      void upsertDevProfile();
      return;
    }

    const supabase = getSupabaseBrowserClient();

    supabase.auth
      .getSession()
      .then(async ({ data, error: sessionError }: { data: { session: Session | null }; error: AuthError | null }) => {
        if (sessionError) {
          setError(sessionError);
        }
        setUser(data.session?.user ? mapUser(data.session.user) : null);
        setLoading(false);
        if (data.session?.user) {
          await upsertProfile(data.session.user);
        }
      })
      .catch((err: Error) => {
        setError(err);
        setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      const nextUser = session?.user ? mapUser(session.user) : null;
      setUser(nextUser);
      setLoading(false);

      if (session?.user) {
        await upsertProfile(session.user);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    error,
    isDevMode: DEV_AUTH_BYPASS,
  };
}

async function upsertProfile(user: SupabaseUser): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
    display_name:
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      null,
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) || null,
  });
}

async function upsertDevProfile(): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    await supabase.from('profiles').upsert({
      id: DEV_MOCK_USER.uid,
      email: DEV_MOCK_USER.email,
      display_name: DEV_MOCK_USER.displayName,
      avatar_url: DEV_MOCK_USER.photoURL,
    });
  } catch (error) {
    console.error('Error upserting dev profile:', error);
  }
}

export async function signInWithGoogle() {
  if (DEV_AUTH_BYPASS) return;
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
}

export async function signInWithEmail(email: string, password: string) {
  if (DEV_AUTH_BYPASS) return;
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  if (DEV_AUTH_BYPASS) return;
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: displayName },
    },
  });

  if (error) throw error;
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (DEV_AUTH_BYPASS) return;
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) throw error;
}

export async function updateUserProfile(displayName?: string, photoURL?: string): Promise<void> {
  if (DEV_AUTH_BYPASS) return;
  const supabase = getSupabaseBrowserClient();
  const updates: Record<string, unknown> = {};

  if (displayName !== undefined) {
    updates.full_name = displayName;
  }
  if (photoURL !== undefined) {
    updates.avatar_url = photoURL;
  }

  const { error } = await supabase.auth.updateUser({ data: updates });
  if (error) throw error;
}

export async function signOut() {
  if (DEV_AUTH_BYPASS) return;
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    if (DEV_AUTH_BYPASS && uid === DEV_MOCK_USER.uid) {
      return {
        uid: DEV_MOCK_USER.uid,
        email: DEV_MOCK_USER.email ?? '',
        displayName: DEV_MOCK_USER.displayName,
        photoURL: DEV_MOCK_USER.photoURL,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {},
      };
    }

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user || data.user.id !== uid) {
      return null;
    }

    const user = data.user;
    const displayName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      null;

    return {
      uid: user.id,
      email: user.email ?? '',
      displayName,
      photoURL: (user.user_metadata?.avatar_url as string | undefined) || null,
      createdAt: user.created_at ? new Date(user.created_at) : new Date(),
      lastLoginAt: new Date(),
      preferences: {},
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message: string }).message);
    if (message.includes('Invalid login credentials')) {
      return 'Incorrect email or password';
    }
    if (message.includes('User already registered')) {
      return 'Email already registered';
    }
    if (message.includes('Password should be')) {
      return 'Password is too weak';
    }
    if (message.includes('Email not confirmed')) {
      return 'Please confirm your email address';
    }
    return message;
  }

  return 'An unexpected error occurred';
}
