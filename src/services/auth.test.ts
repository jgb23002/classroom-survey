import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { AuthenticationError, InstructorAuthorizationError, signInInstructor } from './auth';
import { sessionIsInstructor } from '../types/auth';

function session(role?: string): Session {
  return {
    access_token: 'synthetic-access-token',
    refresh_token: 'synthetic-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: '90000000-0000-4000-8000-000000000001',
      app_metadata: role ? { role } : {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2026-11-03T00:00:00.000Z',
    },
  };
}

function clientWithSignIn(result: object) {
  const signOut = vi.fn().mockResolvedValue({ error: null });
  return {
    client: {
      auth: { signInWithPassword: vi.fn().mockResolvedValue(result), signOut },
    } as unknown as SupabaseClient,
    signOut,
  };
}

describe('instructor authentication', () => {
  it('trusts only app_metadata.role=instructor', () => {
    expect(sessionIsInstructor(session('instructor'))).toBe(true);
    expect(sessionIsInstructor(session('student'))).toBe(false);
    expect(sessionIsInstructor(session())).toBe(false);
    expect(sessionIsInstructor(null)).toBe(false);
  });

  it('returns an authorized instructor session', async () => {
    const instructorSession = session('instructor');
    const { client, signOut } = clientWithSignIn({
      data: { session: instructorSession, user: instructorSession.user },
      error: null,
    });

    await expect(signInInstructor(client, 'instructor@example.test', 'password')).resolves.toBe(
      instructorSession,
    );
    expect(signOut).not.toHaveBeenCalled();
  });

  it('signs out and rejects an ordinary authenticated user', async () => {
    const ordinarySession = session('student');
    const { client, signOut } = clientWithSignIn({
      data: { session: ordinarySession, user: ordinarySession.user },
      error: null,
    });

    await expect(
      signInInstructor(client, 'student@example.test', 'password'),
    ).rejects.toBeInstanceOf(InstructorAuthorizationError);
    expect(signOut).toHaveBeenCalledOnce();
  });

  it('does not expose provider details for invalid credentials', async () => {
    const { client } = clientWithSignIn({
      data: { session: null, user: null },
      error: new Error('provider-specific private detail'),
    });

    await expect(signInInstructor(client, 'unknown@example.test', 'wrong')).rejects.toEqual(
      new AuthenticationError('The email or password is incorrect.'),
    );
  });
});
