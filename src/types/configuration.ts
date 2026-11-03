export interface SupabaseEnvironment {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

export interface SupabaseConfiguration {
  url: string;
  publishableKey: string;
}

export type ConfigurationState =
  | { status: 'ready'; configuration: SupabaseConfiguration }
  | { status: 'unavailable'; message: string };
