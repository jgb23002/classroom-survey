import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Button, LinkButton } from '../components/Button';
import { SurveyStatusBadge } from '../components/SurveyStatusBadge';
import { usePageTitle } from '../hooks/usePageTitle';
import { getSurveyExport, getSurveyResults } from '../services/results';
import type { SurveyResults } from '../types/results';
import { createSurveyCsv, formatResultPercentage, resultsFilename } from '../utilities/results';

const ResultsChart = lazy(() =>
  import('../components/ResultsChart').then((module) => ({ default: module.ResultsChart })),
);

export function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  usePageTitle('Survey results');
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(
    async (refresh = false) => {
      if (!id) return;
      if (refresh) setRefreshing(true);
      setError('');
      try {
        setResults(await getSurveyResults(id));
        if (refresh) setNotice('Results refreshed.');
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Survey results could not be loaded.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (!id) return;
    let current = true;
    void getSurveyResults(id)
      .then((loaded) => {
        if (current) setResults(loaded);
      })
      .catch((caught: unknown) => {
        if (current)
          setError(
            caught instanceof Error ? caught.message : 'Survey results could not be loaded.',
          );
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [id]);

  async function handleExport() {
    if (!id || !results) return;
    setExporting(true);
    setError('');
    setNotice('');
    try {
      const data = await getSurveyExport(id);
      const blob = new Blob([createSurveyCsv(data)], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = resultsFilename(results.survey.title);
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice('CSV export downloaded.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The CSV export could not be prepared.');
    } finally {
      setExporting(false);
    }
  }

  if (loading)
    return (
      <p role="status" className="py-20 text-center text-lg text-muted">
        Loading results…
      </p>
    );

  if (!results)
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
        <h1 className="text-xl font-semibold">Results unavailable</h1>
        <p className="mt-2">{error}</p>
        <Button className="mt-5" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );

  return (
    <section aria-labelledby="results-title">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Instructor results</p>
          <h1 id="results-title" className="page-title mt-3 break-words">
            {results.survey.title}
          </h1>
          {results.survey.description && (
            <p className="mt-3 max-w-3xl text-lg leading-7 text-muted">
              {results.survey.description}
            </p>
          )}
        </div>
        <SurveyStatusBadge status={results.survey.status} />
      </div>

      <div className="mt-7 rounded-2xl border border-brand-100 bg-brand-50 p-6 text-brand-900">
        <p className="text-sm font-semibold tracking-wider uppercase">Total submissions</p>
        <p className="mt-1 text-5xl font-semibold tracking-tight">{results.responseCount}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button disabled={refreshing} onClick={() => void load(true)}>
          {refreshing ? 'Refreshing…' : 'Refresh results'}
        </Button>
        <Button variant="secondary" disabled={exporting} onClick={() => void handleExport()}>
          {exporting ? 'Preparing CSV…' : 'Export CSV'}
        </Button>
        <LinkButton to={`/surveys/${results.survey.id}/present`} variant="secondary">
          Present QR
        </LinkButton>
        <LinkButton to="/dashboard" variant="secondary">
          Back to dashboard
        </LinkButton>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4 text-brand-900"
        >
          {notice}
        </p>
      )}

      {results.responseCount === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">No responses yet</h2>
          <p className="mt-2 text-muted">Choices are shown below with zero counts.</p>
        </div>
      )}

      <div className="mt-8 space-y-7">
        {results.questions.map((question, index) => (
          <article key={question.id} className="rounded-2xl border border-line bg-white p-5 sm:p-7">
            <p className="text-sm font-semibold text-brand-800">Question {index + 1}</p>
            <h2 className="mt-2 text-xl leading-8 font-semibold">{question.text}</h2>
            <p className="mt-2 text-sm text-muted">
              {question.answeredCount} answered
              {question.unansweredCount > 0 && (
                <span className="ml-2 font-semibold text-amber-800">
                  · {question.unansweredCount} unanswered
                </span>
              )}
            </p>

            <Suspense
              fallback={
                <p role="status" className="mt-6 text-sm text-muted">
                  Loading chart…
                </p>
              }
            >
              <ResultsChart question={question} />
            </Suspense>

            <ul
              className="mt-6 divide-y divide-line"
              aria-label={`Exact results for ${question.text}`}
            >
              {question.choices.map((choice) => (
                <li key={choice.id} className="flex items-start justify-between gap-4 py-3">
                  <span className="min-w-0 break-words">{choice.text}</span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {choice.count} · {formatResultPercentage(choice.percentage)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-muted">
              Percentages use the {question.answeredCount} recorded answer
              {question.answeredCount === 1 ? '' : 's'} for this question as the denominator.
            </p>
          </article>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted">
        Results are visible only to authorized instructors. Use Refresh results to load the latest
        submissions.
      </p>
    </section>
  );
}
