import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { useConfiguration } from '../hooks/useConfiguration';
import { usePageTitle } from '../hooks/usePageTitle';

export function LoginPage() {
  usePageTitle('Instructor login');
  const configuration = useConfiguration();

  return (
    <section aria-labelledby="page-title" className="mx-auto max-w-lg px-5 py-14 sm:py-20">
      <p className="eyebrow">A space for better questions</p>
      <h1 id="page-title" className="page-title mt-3">
        Instructor login
      </h1>
      <p className="mt-4 leading-relaxed text-muted">Your classroom workspace starts here.</p>
      <div className="mt-8 rounded-2xl border border-line bg-white p-6 sm:p-8">
        <div
          id="login-availability"
          role="status"
          className="mb-7 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm leading-relaxed text-brand-900"
        >
          <p className="font-semibold">Instructor sign-in is being prepared</p>
          <p className="mt-1">
            {configuration.status === 'unavailable'
              ? 'Instructor access is not configured yet. Please contact the application owner.'
              : 'Sign-in is not available yet. Please check back when your instructor account is ready.'}
          </p>
        </div>
        <form onSubmit={(event) => event.preventDefault()} aria-describedby="login-availability">
          <fieldset disabled className="space-y-5">
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
              />
            </div>
            <Button type="submit" disabled className="w-full">
              <Icon name="lock" className="size-4" /> Log in
            </Button>
          </fieldset>
        </form>
      </div>
      <p className="mt-6 text-center text-sm leading-relaxed text-muted">
        Joining a class survey? Use the link or QR code shared by your instructor. You won’t need to
        log in.
      </p>
    </section>
  );
}
