import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readSupabaseConfiguration } from '../utilities/env';

let instructorClient: SupabaseClient | undefined;
let publicClient: SupabaseClient | undefined;

/** Lazy initialization lets public route shells render before backend configuration. */
export function getSupabaseClient(): SupabaseClient {
  if (!instructorClient) {
    const { url, publishableKey } = readSupabaseConfiguration(import.meta.env);
    instructorClient = createClient(url, publishableKey);
  }
  return instructorClient;
}

/** Public participation must never restore a stored instructor Auth session. */
export function getPublicSupabaseClient(): SupabaseClient {
  if (!publicClient) {
    const { url, publishableKey } = readSupabaseConfiguration(import.meta.env);
    publicClient = createClient(url, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'classroom-survey-public',
      },
    });
  }
  return publicClient;
}
