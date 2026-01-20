'use client';

import { isDevAuthBypass } from '@/lib/supabase/auth';

/**
 * DEV MODE indicator - shows when development auth bypass is active
 * Only visible when NEXT_PUBLIC_DEV_AUTH_BYPASS=true
 */
export function DevModeIndicator() {
  if (!isDevAuthBypass()) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-amber-950 shadow-lg">
      <div className="h-2 w-2 animate-pulse rounded-full bg-amber-950" />
      DEV MODE - Auth Bypass Active
    </div>
  );
}
