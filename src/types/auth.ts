import type { Session, User } from '@supabase/supabase-js';

export type AuthStatus =
  'config-unavailable' | 'loading' | 'signed-out' | 'authorized' | 'unauthorized';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  configurationError?: string;
  recoveryMode: boolean;
}

export interface AuthContextValue extends AuthState {
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
}

export function sessionIsInstructor(session: Session | null): boolean {
  return session?.user.app_metadata?.role === 'instructor';
}
