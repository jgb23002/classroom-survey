import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { Brand } from '../Brand';
import { Button } from '../Button';
import { SkipLink } from '../SkipLink';
import { useAuth } from '../../hooks/useAuth';

export function InstructorLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError('');
    try {
      await auth.signOut();
      navigate('/login', { replace: true });
    } catch (caught) {
      setLogoutError(
        caught instanceof Error ? caught.message : 'Sign out failed. Please try again.',
      );
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <SkipLink />
      <header className="border-b border-line bg-white">
        <div className="page-container flex flex-wrap items-center justify-between gap-4 py-5">
          <Brand />
          <nav aria-label="Instructor navigation" className="flex items-center gap-4">
            <NavLink to="/dashboard" className="text-link">
              Dashboard
            </NavLink>
            <span className="hidden text-sm text-muted sm:inline">{auth.user?.email}</span>
            <Button variant="secondary" disabled={loggingOut} onClick={() => void handleLogout()}>
              {loggingOut ? 'Logging out…' : 'Log out'}
            </Button>
          </nav>
        </div>
      </header>
      {logoutError && (
        <div className="page-container pt-5">
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
            {logoutError}
          </p>
        </div>
      )}
      <main id="main-content" tabIndex={-1} className="page-container py-10 sm:py-16">
        <Outlet />
      </main>
    </div>
  );
}
