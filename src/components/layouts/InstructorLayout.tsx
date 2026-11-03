import { NavLink, Outlet, useNavigate } from 'react-router';
import { Brand } from '../Brand';
import { Button } from '../Button';
import { SkipLink } from '../SkipLink';
import { useAuth } from '../../hooks/useAuth';

export function InstructorLayout() {
  const auth = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await auth.signOut();
    navigate('/login', { replace: true });
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
            <Button variant="secondary" onClick={handleLogout}>
              Log out
            </Button>
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="page-container py-10 sm:py-16">
        <Outlet />
      </main>
    </div>
  );
}
