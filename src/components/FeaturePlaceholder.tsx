import { LinkButton } from './Button';
import { Icon } from './Icon';

interface FeaturePlaceholderProps {
  title: string;
  description: string;
}

export function FeaturePlaceholder({ title, description }: FeaturePlaceholderProps) {
  return (
    <section aria-labelledby="page-title" className="max-w-3xl">
      <p className="eyebrow">Instructor workspace</p>
      <h1 id="page-title" className="page-title mt-3">
        {title}
      </h1>
      <div className="mt-8 rounded-2xl border border-line bg-white p-6 sm:p-10">
        <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
          <Icon name="clock" />
        </span>
        <h2 className="text-xl font-semibold tracking-tight">This workspace is being prepared</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-muted">{description}</p>
        <p className="mt-4 text-sm text-muted">Survey actions are not available yet.</p>
        <div className="mt-7">
          <LinkButton to="/login">
            Go to instructor login <Icon name="arrow" className="size-4" />
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
