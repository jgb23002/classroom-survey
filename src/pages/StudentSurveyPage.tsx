import { Icon } from '../components/Icon';
import { usePageTitle } from '../hooks/usePageTitle';

export function StudentSurveyPage() {
  usePageTitle('Student survey');
  return (
    <section aria-labelledby="page-title">
      <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
        <Icon name="clock" />
      </span>
      <h1 id="page-title" className="mt-6 text-3xl leading-tight font-semibold tracking-tight">
        Survey access is being prepared
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted">
        Your instructor will let you know when the survey is ready. You won’t need an account to
        take part.
      </p>
    </section>
  );
}
