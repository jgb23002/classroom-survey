import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';

export function RequireInstructor() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === 'loading') {
    return <p role="status">Checking instructor access…</p>;
  }

  if (auth.status !== 'authorized') {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <Outlet />;
}
