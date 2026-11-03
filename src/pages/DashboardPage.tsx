import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, LinkButton } from '../components/Button';
import { SurveyCard } from '../components/SurveyCard';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  activateSurvey,
  archiveSurvey,
  closeSurvey,
  deleteSurvey,
  duplicateSurvey,
  listSurveys,
} from '../services/surveys';
import type { SurveyStatusFilter, SurveySummary } from '../types/survey';
import { filterSurveys } from '../utilities/surveys';

const filters: Array<{ value: SurveyStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

export function DashboardPage() {
  usePageTitle('Dashboard');
  const auth = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<SurveySummary[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SurveyStatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [busySurveyId, setBusySurveyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSurveys(await listSurveys());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Surveys could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void listSurveys()
      .then((data) => {
        if (active) setSurveys(data);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : 'Surveys could not be loaded.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleSurveys = useMemo(
    () => filterSurveys(surveys, search, status),
    [search, status, surveys],
  );

  async function mutate(survey: SurveySummary, operation: () => Promise<void>) {
    setBusySurveyId(survey.id);
    setMutationError('');
    try {
      await operation();
      await load();
    } catch (caught) {
      setMutationError(
        caught instanceof Error ? caught.message : 'The action could not be completed.',
      );
    } finally {
      setBusySurveyId(null);
    }
  }

  function handleClose(survey: SurveySummary) {
    if (
      !window.confirm(
        `Close “${survey.title}”? Students will no longer be able to submit responses.`,
      )
    )
      return;
    void mutate(survey, () => closeSurvey(survey.id));
  }

  function handleArchive(survey: SurveySummary) {
    const responseNote = survey.responseCount
      ? ` It has ${survey.responseCount} response${survey.responseCount === 1 ? '' : 's'}, which will be preserved.`
      : '';
    if (
      !window.confirm(`Archive “${survey.title}”?${responseNote} You can still view its results.`)
    )
      return;
    void mutate(survey, () => archiveSurvey(survey.id));
  }

  function handleDelete(survey: SurveySummary) {
    const archiveNote = survey.responseCount
      ? ' This survey has submissions; archiving is strongly recommended instead.'
      : '';
    if (
      !window.confirm(
        `Permanently delete “${survey.title}”? This permanently deletes its questions, responses, and answers.${archiveNote} This cannot be undone.`,
      )
    )
      return;
    void mutate(survey, () => deleteSurvey(survey.id));
  }

  async function handleDuplicate(survey: SurveySummary) {
    setBusySurveyId(survey.id);
    setMutationError('');
    try {
      const copyId = await duplicateSurvey(survey.id);
      await load();
      navigate(`/surveys/${copyId}/edit`);
    } catch (caught) {
      setMutationError(
        caught instanceof Error ? caught.message : 'The survey could not be duplicated.',
      );
    } finally {
      setBusySurveyId(null);
    }
  }

  async function handleActivate(survey: SurveySummary) {
    setBusySurveyId(survey.id);
    setMutationError('');
    try {
      await activateSurvey(survey.id);
      navigate(`/surveys/${survey.id}/present`);
    } catch (caught) {
      setMutationError(
        caught instanceof Error ? caught.message : 'The survey could not be activated.',
      );
    } finally {
      setBusySurveyId(null);
    }
  }

  const filtered = search.trim() !== '' || status !== 'all';

  return (
    <section aria-labelledby="dashboard-title">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Instructor workspace</p>
          <h1 id="dashboard-title" className="page-title mt-3">
            Dashboard
          </h1>
          <p className="mt-3 text-sm text-muted">Signed in as {auth.user?.email}</p>
        </div>
        <LinkButton to="/surveys/new" className="w-full sm:w-auto">
          New survey
        </LinkButton>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-white p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-end">
          <div>
            <label htmlFor="survey-search" className="form-label">
              Search by title
            </label>
            <input
              id="survey-search"
              type="search"
              className="form-input"
              placeholder="Search surveys"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="status-filter" className="form-label">
              Status
            </label>
            <select
              id="status-filter"
              className="form-input"
              value={status}
              onChange={(event) => setStatus(event.target.value as SurveyStatusFilter)}
            >
              {filters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="secondary"
            disabled={!filtered}
            onClick={() => {
              setSearch('');
              setStatus('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      </div>

      {mutationError && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          {mutationError}
        </p>
      )}

      {loading ? (
        <p role="status" className="mt-10 text-center text-muted">
          Loading surveys…
        </p>
      ) : error ? (
        <div
          role="alert"
          className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900"
        >
          <p className="font-semibold">Dashboard unavailable</p>
          <p className="mt-2 text-sm">{error}</p>
          <Button className="mt-5" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      ) : surveys.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-white p-8 text-center sm:p-12">
          <h2 className="text-xl font-semibold">No surveys yet</h2>
          <p className="mt-3 text-muted">Create your first draft to get ready for class.</p>
          <LinkButton to="/surveys/new" className="mt-6">
            New survey
          </LinkButton>
        </div>
      ) : visibleSurveys.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">No matching surveys</h2>
          <p className="mt-3 text-muted">Try a different title or status.</p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => {
              setSearch('');
              setStatus('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-7 text-sm text-muted" aria-live="polite">
            Showing {visibleSurveys.length} of {surveys.length} survey
            {surveys.length === 1 ? '' : 's'}
          </p>
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            {visibleSurveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                busy={busySurveyId === survey.id}
                onActivate={() => void handleActivate(survey)}
                onClose={() => handleClose(survey)}
                onDuplicate={() => void handleDuplicate(survey)}
                onArchive={() => handleArchive(survey)}
                onDelete={() => handleDelete(survey)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
