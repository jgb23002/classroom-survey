import type { SupabaseClient } from '@supabase/supabase-js';
import { sessionIsInstructor } from '../types/auth';

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class InstructorAuthorizationError extends AuthenticationError {
  constructor() {
    super('This account is not authorized as an instructor.');
    this.name = 'InstructorAuthorizationError';
  }
}

export async function signInInstructor(client: SupabaseClient, email: string, password: string) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new AuthenticationError('The email or password is incorrect.');
  }

  if (!sessionIsInstructor(data.session)) {
    await client.auth.signOut();
    throw new InstructorAuthorizationError();
  }

  return data.session;
}

export async function sendInstructorPasswordReset(client: SupabaseClient, email: string) {
  const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    throw new AuthenticationError('Password reset could not be requested. Please try again.');
  }
}

export async function updateInstructorPassword(client: SupabaseClient, password: string) {
  const { data, error } = await client.auth.updateUser({ password });
  if (error || data.user.app_metadata?.role !== 'instructor') {
    if (!error) await client.auth.signOut();
    throw error
      ? new AuthenticationError('The password could not be updated. Please request a new link.')
      : new InstructorAuthorizationError();
  }
}
