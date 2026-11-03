import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';

function safeReturnTo(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

export function LoginPage() {
  usePageTitle('Instructor login');
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(
    searchParams.get('error') === 'callback'
      ? 'The sign-in link is invalid, expired, or does not belong to an instructor.'
      : '',
  );
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const configured = auth.status !== 'config-unavailable';

  if (auth.status === 'authorized') {
    return <Navigate to={safeReturnTo(searchParams.get('returnTo'))} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await auth.signIn(email.trim(), password);
      navigate(safeReturnTo(searchParams.get('returnTo')), { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    if (!email.trim()) {
      setError('Enter your email address before requesting a password reset.');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await auth.sendPasswordReset(email.trim());
      setMessage('If that instructor account exists, a password reset link has been sent.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Password reset could not be requested.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="page-title" className="mx-auto max-w-lg px-5 py-14 sm:py-20">
      <p className="eyebrow">A space for better questions</p>
      <h1 id="page-title" className="page-title mt-3">
        Instructor login
      </h1>
      <p className="mt-4 leading-relaxed text-muted">Your classroom workspace starts here.</p>
      <div className="mt-8 rounded-2xl border border-line bg-white p-6 sm:p-8">
        {!configured && (
          <div
            id="login-availability"
            role="alert"
            className="mb-7 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-900"
          >
            <p className="font-semibold">Instructor access is not configured</p>
            <p className="mt-1">{auth.configurationError}</p>
          </div>
        )}
        {auth.status === 'unauthorized' && !error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          >
            This account is signed in but is not authorized as an instructor.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          >
            {error}
          </p>
        )}
        {message && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900"
          >
            {message}
          </p>
        )}
        <form
          onSubmit={handleSubmit}
          aria-describedby={!configured ? 'login-availability' : undefined}
        >
          <fieldset
            disabled={!configured || submitting || auth.status === 'loading'}
            className="space-y-5"
          >
            <legend className="sr-only">Instructor credentials</legend>
            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                className="form-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="form-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              <Icon name="lock" className="size-4" /> {submitting ? 'Logging in…' : 'Log in'}
            </Button>
          </fieldset>
        </form>
        <button
          type="button"
          disabled={!configured || submitting}
          onClick={handlePasswordReset}
          className="text-link mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
        >
          Forgot your password?
        </button>
      </div>
      <p className="mt-6 text-center text-sm leading-relaxed text-muted">
        Joining a class survey? Use the link or QR code shared by your instructor. You won’t need an
        account to log in.
      </p>
    </section>
  );
}
