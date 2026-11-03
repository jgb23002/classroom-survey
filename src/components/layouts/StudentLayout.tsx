import { Outlet } from 'react-router';
import { Brand } from '../Brand';
import { SkipLink } from '../SkipLink';

export function StudentLayout() {
  return (
    <div className="min-h-dvh bg-white">
      <SkipLink />
      <header className="mx-auto max-w-2xl px-5 py-6 sm:px-8">
        <Brand linked={false} />
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-2xl px-5 pb-12 pt-8 sm:px-8 sm:pt-16"
      >
        <Outlet />
      </main>
    </div>
  );
}
