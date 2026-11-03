import { NavLink, Outlet } from 'react-router';
import { Brand } from '../Brand';
import { LinkButton } from '../Button';
import { SkipLink } from '../SkipLink';

export function InstructorLayout() {
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
            <LinkButton to="/login" variant="secondary">
              Instructor login
            </LinkButton>
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="page-container py-10 sm:py-16">
        <Outlet />
      </main>
    </div>
  );
}
