import { Link } from 'react-router';
import { Icon } from './Icon';

export function Brand({ linked = true }: { linked?: boolean }) {
  const content = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white">
        <Icon name="book" className="size-5" />
      </span>
      <span className="text-[1.05rem] font-semibold tracking-tight text-ink">Classroom Survey</span>
    </>
  );

  return linked ? (
    <Link
      to="/"
      aria-label="Classroom Survey home"
      className="inline-flex min-h-11 items-center gap-3 rounded-lg"
    >
      {content}
    </Link>
  ) : (
    <span className="inline-flex items-center gap-3">{content}</span>
  );
}
