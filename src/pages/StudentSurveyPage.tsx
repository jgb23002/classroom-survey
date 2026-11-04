import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams } from 'react-router';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  loadPublicSurvey,
  StudentSurveyError,
  submitPublicSurvey,
} from '../services/studentSurvey';
import type { ActivePublicSurvey } from '../types/studentSurvey';
import {
  getAnonymousSurveyToken,
  markSurveySubmitted,
  surveyWasSubmitted,
} from '../utilities/anonymousToken';

type PageState = 'loading' | 'form' | 'success' | 'duplicate' | 'closed' | 'not-found' | 'error';

export function StudentSurveyPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  usePageTitle('Student survey');
  const [state, setState] = useState<PageState>('loading');
  const [survey, setSurvey] = useState<ActivePublicSurvey | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [missing, setMissing] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [storageWarning, setStorageWarning] = useState('');
  const submissionLock = useRef(false);

  const applyLoaded = useCallback(
    (loaded: Awaited<ReturnType<typeof loadPublicSurvey>>) => {
      if (loaded.state === 'closed') {
        setState('closed');
        return;
      }
      if (loaded.state === 'not_found') {
        setState('not-found');
        return;
      }
      setSurvey(loaded);
      setState(surveyWasSubmitted(slug) ? 'duplicate' : 'form');
    },
    [slug],
  );

  const load = useCallback(async () => {
    setState('loading');
    setMessage('');
    try {
      applyLoaded(await loadPublicSurvey(slug));
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : 'The survey could not be loaded. Check your connection and try again.',
      );
      setState('error');
    }
  }, [applyLoaded, slug]);

  useEffect(() => {
    let current = true;
    void loadPublicSurvey(slug)
      .then((loaded) => {
        if (current) applyLoaded(loaded);
      })
      .catch((caught: unknown) => {
        if (!current) return;
        setMessage(
          caught instanceof Error
            ? caught.message
            : 'The survey could not be loaded. Check your connection and try again.',
        );
        setState('error');
      });
    return () => {
      current = false;
    };
  }, [applyLoaded, slug]);

  function selectAnswer(questionId: string, choiceId: string) {
    setAnswers((current) => ({ ...current, [questionId]: choiceId }));
    setMissing((current) => {
      if (!current.has(questionId)) return current;
      const next = new Set(current);
      next.delete(questionId);
      return next;
    });
    setMessage('');
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!survey || submissionLock.current) return;
    const unanswered = new Set(
      survey.questions.filter((question) => !answers[question.id]).map((question) => question.id),
    );
    setMissing(unanswered);
    setMessage('');
    if (unanswered.size) {
      setMessage('Answer every question before submitting.');
      document.getElementById(`question-${[...unanswered][0]}`)?.focus();
      return;
    }
    if (!navigator.onLine) {
      setMessage('You appear to be offline. Reconnect and try submitting again.');
      return;
    }

    const anonymous = getAnonymousSurveyToken(slug);
    if (!anonymous.persistent) {
      setStorageWarning(
        'This browser could not save your anonymous submission token. Keep this page open while submitting.',
      );
    }
    submissionLock.current = true;
    setSubmitting(true);
    try {
      await submitPublicSurvey(
        survey.survey.id,
        anonymous.token,
        survey.questions.map((question) => ({
          question_id: question.id,
          choice_id: answers[question.id] as string,
        })),
      );
      markSurveySubmitted(slug);
      setState('success');
    } catch (caught) {
      if (caught instanceof StudentSurveyError && caught.kind === 'duplicate') {
        setState('duplicate');
      } else if (caught instanceof StudentSurveyError && caught.kind === 'closed') {
        setState('closed');
      } else {
        setMessage(
          caught instanceof Error
            ? caught.message
            : 'Your response could not be submitted. Please try again.',
        );
      }
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  if (state === 'loading')
    return (
      <p role="status" className="py-20 text-center text-lg text-muted">
        Loading survey…
      </p>
    );

  if (state === 'success')
    return <PublicMessage title="Thank you!" message="Your response has been recorded." />;

  if (state === 'duplicate')
    return (
      <PublicMessage
        title="Already submitted"
        message="You have already submitted a response to this survey."
      />
    );

  if (state === 'closed')
    return (
      <PublicMessage
        title="Survey closed"
        message="This survey is no longer accepting responses."
      />
    );

  if (state === 'not-found')
    return <PublicMessage title="Survey not found" message="Check the link and try again." />;

  if (state === 'error' || !survey)
    return (
      <PublicMessage title="Survey unavailable" message={message}>
        <button
          type="button"
          className="mt-6 min-h-12 rounded-xl bg-brand-800 px-6 py-3 font-semibold text-white"
          onClick={() => void load()}
        >
          Try again
        </button>
      </PublicMessage>
    );

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate aria-labelledby="page-title">
      <header className="border-b border-line pb-7">
        <p className="eyebrow">Class survey</p>
        <h1
          id="page-title"
          className="mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
        >
          {survey.survey.title}
        </h1>
        {survey.survey.description && (
          <p className="mt-4 text-lg leading-7 text-muted">{survey.survey.description}</p>
        )}
      </header>

      {message && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900"
        >
          {message}
        </p>
      )}
      {storageWarning && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
        >
          {storageWarning}
        </p>
      )}

      <div className="mt-8 space-y-8">
        {survey.questions.map((question, index) => {
          const errorId = `question-${question.id}-error`;
          return (
            <fieldset
              id={`question-${question.id}`}
              key={question.id}
              tabIndex={-1}
              aria-describedby={missing.has(question.id) ? errorId : undefined}
              className={`rounded-2xl border bg-white p-5 sm:p-7 ${
                missing.has(question.id) ? 'border-red-300' : 'border-line'
              }`}
            >
              <legend className="max-w-full px-2 text-lg leading-7 font-semibold">
                <span className="text-brand-800">{index + 1}.</span> {question.text}
              </legend>
              <div className="mt-4 space-y-3">
                {question.choices.map((choice) => (
                  <label
                    key={choice.id}
                    className="flex min-h-12 cursor-pointer items-center gap-4 rounded-xl border border-line px-4 py-3 text-base leading-6 transition-colors has-checked:border-brand-700 has-checked:bg-brand-50 has-focus-visible:ring-3 has-focus-visible:ring-brand-700 has-focus-visible:ring-offset-2"
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={choice.id}
                      checked={answers[question.id] === choice.id}
                      onChange={() => selectAnswer(question.id, choice.id)}
                      className="size-5 shrink-0 accent-brand-800"
                    />
                    <span>{choice.text}</span>
                  </label>
                ))}
              </div>
              {missing.has(question.id) && (
                <p id={errorId} role="alert" className="mt-3 text-sm font-medium text-red-700">
                  Choose one answer for this question.
                </p>
              )}
            </fieldset>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-8 min-h-14 w-full rounded-xl bg-brand-800 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-brand-900 disabled:cursor-wait disabled:opacity-70"
      >
        {submitting ? 'Submitting…' : 'Submit response'}
      </button>
      <p className="mt-4 text-center text-sm leading-6 text-muted">
        No login is required. Submit once when you are ready.
      </p>
    </form>
  );
}

function PublicMessage({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="py-12 text-center" aria-labelledby="public-message-title">
      <div
        className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50 text-2xl text-brand-900"
        aria-hidden="true"
      >
        ✓
      </div>
      <h1 id="public-message-title" className="mt-6 text-3xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-lg leading-7 text-muted">{message}</p>
      {children}
    </section>
  );
}
