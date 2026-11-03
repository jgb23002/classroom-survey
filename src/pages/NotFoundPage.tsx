import { LinkButton } from '../components/Button';
import { usePageTitle } from '../hooks/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <section aria-labelledby="page-title" className="page-container py-20">
      <p className="eyebrow">404 · Page not found</p>
      <h1 id="page-title" className="page-title mt-4">
        This page isn’t here.
      </h1>
      <p className="mt-5 max-w-md leading-relaxed text-muted">
        Check the link and try again. If you’re joining a survey, ask your instructor for the latest
        survey link.
      </p>
      <div className="mt-8">
        <LinkButton to="/">Back to home</LinkButton>
      </div>
    </section>
  );
}
