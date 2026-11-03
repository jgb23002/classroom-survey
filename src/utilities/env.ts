import type { SupabaseConfiguration, SupabaseEnvironment } from '../types/configuration';

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/** Validate public configuration without logging or returning credential values in errors. */
export function readSupabaseConfiguration(environment: SupabaseEnvironment): SupabaseConfiguration {
  const url = environment.VITE_SUPABASE_URL?.trim();
  const publishableKey = environment.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const missing = [
    !url && 'VITE_SUPABASE_URL',
    !publishableKey && 'VITE_SUPABASE_PUBLISHABLE_KEY',
  ].filter(Boolean);

  if (missing.length) {
    throw new ConfigurationError(
      `Missing Supabase configuration: ${missing.join(', ')}. Set these values in .env.local and restart Vite.`,
    );
  }

  // The explicit checks also narrow the optional environment values for TypeScript.
  if (!url || !publishableKey) {
    throw new ConfigurationError('Supabase configuration is incomplete.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ConfigurationError('VITE_SUPABASE_URL must be a valid HTTPS project URL.');
  }

  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsedUrl.hostname);
  if (
    (parsedUrl.protocol !== 'https:' && !(local && parsedUrl.protocol === 'http:')) ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.search ||
    parsedUrl.hash ||
    parsedUrl.pathname !== '/'
  ) {
    throw new ConfigurationError(
      'VITE_SUPABASE_URL must be an HTTPS project origin, or HTTP localhost for local Supabase.',
    );
  }

  if (
    parsedUrl.hostname === 'your-project.supabase.co' ||
    /replace|your[_-]|example|placeholder/i.test(publishableKey)
  ) {
    throw new ConfigurationError(
      'Replace the Supabase placeholders in .env.local and restart Vite.',
    );
  }

  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) {
    throw new ConfigurationError(
      'VITE_SUPABASE_PUBLISHABLE_KEY must be a public sb_publishable_ key. Secret, service-role and legacy JWT keys are not accepted in the frontend.',
    );
  }

  return { url: parsedUrl.origin, publishableKey };
}
