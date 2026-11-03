import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { AuthContext } from './AuthContext';
import { useConfiguration } from '../hooks/useConfiguration';
import { getSupabaseClient } from '../lib/supabase';
import {
  sendInstructorPasswordReset,
  signInInstructor,
  updateInstructorPassword,
} from '../services/auth';
import { sessionIsInstructor, type AuthState } from '../types/auth';

function stateFromSession(session: Session | null, recoveryMode = false): AuthState {
  if (!session) return { status: 'signed-out', user: null, recoveryMode: false };
  return {
    status: sessionIsInstructor(session) ? 'authorized' : 'unauthorized',
    user: session.user,
    recoveryMode,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configuration = useConfiguration();
  const [state, setState] = useState<AuthState>(() =>
    configuration.status === 'ready'
      ? { status: 'loading', user: null, recoveryMode: false }
      : {
          status: 'config-unavailable',
          user: null,
          recoveryMode: false,
          configurationError: configuration.message,
        },
  );

  useEffect(() => {
    if (configuration.status !== 'ready') return;

    const client = getSupabaseClient();
    let active = true;

    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setState({ status: 'signed-out', user: null, recoveryMode: false });
        return;
      }
      setState(stateFromSession(data.session));
    });

    const { data } = client.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (!active) return;
        setState(stateFromSession(session, event === 'PASSWORD_RECOVERY'));
      },
    );

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [configuration.status]);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await signInInstructor(getSupabaseClient(), email, password);
    setState(stateFromSession(session));
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw new Error('Sign out failed. Please try again.');
    setState({ status: 'signed-out', user: null, recoveryMode: false });
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendInstructorPasswordReset(getSupabaseClient(), email);
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    await updateInstructorPassword(getSupabaseClient(), password);
    setState((current) => ({ ...current, recoveryMode: false }));
  }, []);

  const value = useMemo(
    () => ({ ...state, signIn, signOut, sendPasswordReset, updatePassword }),
    [sendPasswordReset, signIn, signOut, state, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
