import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';

function safeNext(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

export function AuthCallbackPage() {
  usePageTitle('Completing sign-in');
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (auth.status === 'authorized') {
      navigate(auth.recoveryMode ? '/reset-password' : safeNext(searchParams.get('next')), {
        replace: true,
      });
    } else if (auth.status === 'unauthorized' || auth.status === 'signed-out') {
      navigate('/login?error=callback', { replace: true });
    }
  }, [auth.recoveryMode, auth.status, navigate, searchParams]);

  return (
    <section className="mx-auto max-w-lg px-5 py-16 text-center">
      <h1 className="page-title">Completing sign-in</h1>
      <p role="status" className="mt-4 text-muted">
        Verifying your instructor account…
      </p>
    </section>
  );
}
