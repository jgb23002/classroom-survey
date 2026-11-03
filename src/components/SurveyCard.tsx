import { LinkButton, Button } from './Button';
import { SurveyStatusBadge } from './SurveyStatusBadge';
import type { SurveySummary } from '../types/survey';
import { formatSurveyDate } from '../utilities/surveys';

interface SurveyCardProps {
  survey: SurveySummary;
  busy: boolean;
  onActivate(): void;
  onClose(): void;
  onDuplicate(): void;
  onArchive(): void;
  onDelete(): void;
}

export function SurveyCard({
  survey,
  busy,
  onActivate,
  onClose,
  onDuplicate,
  onArchive,
  onDelete,
}: SurveyCardProps) {
  const editable =
    survey.status === 'draft' || (survey.status === 'closed' && survey.responseCount === 0);
  const canActivate = survey.status === 'draft' || survey.status === 'closed';
  const canArchive = survey.status === 'draft' || survey.status === 'closed';
  const canDelete = survey.status !== 'active';
  const hasResults = survey.status !== 'draft';

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-xl font-semibold tracking-tight">{survey.title}</h2>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted">
            {survey.description?.trim() || 'No description'}
          </p>
        </div>
        <SurveyStatusBadge status={survey.status} />
      </div>
      <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted">Created</dt>
          <dd className="font-medium">{formatSurveyDate(survey.createdAt)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted">Responses</dt>
          <dd className="font-medium">{survey.responseCount}</dd>
        </div>
      </dl>
      <div className="mt-auto flex flex-wrap gap-2 pt-6" aria-label={`Actions for ${survey.title}`}>
        {editable && (
          <LinkButton to={`/surveys/${survey.id}/edit`} variant="secondary">
            Edit
          </LinkButton>
        )}
        {canActivate && (
          <Button onClick={onActivate} disabled={busy}>
            Activate
          </Button>
        )}
        {survey.status === 'active' && (
          <>
            <Button onClick={onClose} disabled={busy} variant="secondary">
              Close
            </Button>
            <LinkButton to={`/surveys/${survey.id}/present`}>Present QR</LinkButton>
          </>
        )}
        {hasResults && (
          <LinkButton to={`/surveys/${survey.id}/results`} variant="secondary">
            View results
          </LinkButton>
        )}
        <Button onClick={onDuplicate} disabled={busy} variant="secondary">
          Duplicate
        </Button>
        {canArchive && (
          <Button onClick={onArchive} disabled={busy} variant="secondary">
            Archive
          </Button>
        )}
        {canDelete && (
          <Button onClick={onDelete} disabled={busy} variant="secondary">
            Delete
          </Button>
        )}
      </div>
      {survey.status === 'closed' && survey.responseCount > 0 && (
        <p className="mt-4 text-xs leading-5 text-muted">
          This survey has responses, so its content is locked. Duplicate it to make changes.
        </p>
      )}
    </article>
  );
}
