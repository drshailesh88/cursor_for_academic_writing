import { createClient } from '@supabase/supabase-js';

function getSupabaseAdminEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin environment variables are missing.');
  }

  return { url, serviceRoleKey };
}

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  if (!adminClient) {
    const { url, serviceRoleKey } = getSupabaseAdminEnv();
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return adminClient;
}

