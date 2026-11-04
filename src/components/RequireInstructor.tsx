import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';

export function RequireInstructor() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'loading') {
    return (
      <main className="page-container py-20 text-center" id="main-content" tabIndex={-1}>
        <p role="status" className="text-lg text-muted">
          Checking instructor access…
        </p>
      </main>
    );
  }

  if (auth.status !== 'authorized') {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <Outlet />;
}
