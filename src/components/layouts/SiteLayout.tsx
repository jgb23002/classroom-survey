import { Outlet } from 'react-router';
import { Brand } from '../Brand';
import { LinkButton } from '../Button';
import { SkipLink } from '../SkipLink';

export function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <header className="border-b border-line">
        <div className="page-container flex flex-wrap items-center justify-between gap-3 py-5">
          <Brand />
          <nav aria-label="Main navigation">
            <LinkButton to="/login" variant="secondary">
              Instructor login
            </LinkButton>
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-line">
        <div className="page-container flex flex-col justify-between gap-3 py-6 text-sm text-muted sm:flex-row">
          <p>Classroom Survey</p>
          <p>A little understanding goes a long way.</p>
        </div>
      </footer>
    </div>
  );
}
