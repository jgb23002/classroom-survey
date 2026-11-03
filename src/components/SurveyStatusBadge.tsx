import type { SurveyStatus } from '../types/survey';

const styles: Record<SurveyStatus, string> = {
  draft: 'border-stone-300 bg-stone-100 text-stone-700',
  active: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  closed: 'border-blue-200 bg-blue-50 text-blue-800',
  archived: 'border-slate-300 bg-slate-100 text-slate-700',
};

export function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}
