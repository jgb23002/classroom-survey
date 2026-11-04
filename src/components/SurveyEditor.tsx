import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from './Button';
import { activateSurvey, loadSurveyEditor, saveSurveyDraft } from '../services/surveys';
import type {
  EditorQuestion,
  QuestionType,
  SurveyEditorErrors,
  SurveyEditorValue,
} from '../types/surveyEditor';
import {
  choicesForType,
  createChoice,
  createQuestion,
  moveItem,
  normalizeEditorValue,
  serializeEditor,
  validateSurveyEditor,
} from '../utilities/surveyEditor';

const emptyValue: SurveyEditorValue = { title: '', description: '', questions: [] };

export function SurveyEditor({ initialSurveyId = null }: { initialSurveyId?: string | null }) {
  const navigate = useNavigate();
  const [surveyId, setSurveyId] = useState<string | null>(initialSurveyId);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | null>(null);
  const [value, setValue] = useState<SurveyEditorValue>(emptyValue);
  const [savedSnapshot, setSavedSnapshot] = useState(serializeEditor(emptyValue));
  const [errors, setErrors] = useState<SurveyEditorErrors>({});
  const [loading, setLoading] = useState(Boolean(initialSurveyId));
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [success, setSuccess] = useState('');
  const [lockedReason, setLockedReason] = useState('');
  const allowNavigation = useRef(false);
  const dirty = useMemo(() => serializeEditor(value) !== savedSnapshot, [savedSnapshot, value]);

  useEffect(() => {
    if (!initialSurveyId) return;
    let active = true;
    void loadSurveyEditor(initialSurveyId)
      .then((loaded) => {
        if (!active) return;
        setValue(loaded.value);
        setSavedSnapshot(serializeEditor(loaded.value));
        setExpectedUpdatedAt(loaded.updatedAt);
        if (loaded.status === 'active')
          setLockedReason('Close this active survey before editing it.');
        else if (loaded.status === 'archived')
          setLockedReason(
            'Archived surveys cannot be edited. Duplicate this survey from the dashboard instead.',
          );
        else if (loaded.status === 'closed' && loaded.responseCount > 0)
          setLockedReason(
            'This closed survey has responses, so its content is locked to preserve history. Duplicate it to make changes.',
          );
      })
      .catch((caught: unknown) => {
        if (active)
          setPageError(
            caught instanceof Error ? caught.message : 'The survey could not be loaded.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialSurveyId]);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty || allowNavigation.current) return;
      event.preventDefault();
      event.returnValue = '';
    }
    function captureLink(event: MouseEvent) {
      if (!dirty || allowNavigation.current || event.defaultPrevented) return;
      const target = event.target as Element | null;
      if (!target?.closest('a[href]')) return;
      if (!window.confirm('Discard your unsaved survey changes?')) event.preventDefault();
      else allowNavigation.current = true;
    }
    function handleHistoryNavigation() {
      if (!dirty || allowNavigation.current) return;
      if (window.confirm('Discard your unsaved survey changes?')) allowNavigation.current = true;
      else window.history.forward();
    }
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('popstate', handleHistoryNavigation);
    document.addEventListener('click', captureLink, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('popstate', handleHistoryNavigation);
      document.removeEventListener('click', captureLink, true);
    };
  }, [dirty]);

  function updateQuestion(id: string, update: (question: EditorQuestion) => EditorQuestion) {
    setValue((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === id ? update(question) : question,
      ),
    }));
    setSuccess('');
  }

  function removeQuestion(id: string) {
    if (!window.confirm('Delete this question and its choices from the draft?')) return;
    setValue((current) => ({
      ...current,
      questions: current.questions.filter((question) => question.id !== id),
    }));
  }

  function handleCancel() {
    if (dirty && !window.confirm('Discard your unsaved survey changes?')) return;
    allowNavigation.current = true;
    navigate('/dashboard');
  }

  async function persist(mode: 'draft' | 'activate') {
    const nextErrors = validateSurveyEditor(value, mode);
    setErrors(nextErrors);
    setPageError('');
    setSuccess('');
    if (Object.keys(nextErrors).length) return;

    const normalized = normalizeEditorValue(value);
    setSaving(true);
    try {
      const saved = await saveSurveyDraft(surveyId, expectedUpdatedAt, normalized);
      setSurveyId(saved.id);
      setExpectedUpdatedAt(saved.updatedAt);
      setValue(normalized);
      setSavedSnapshot(serializeEditor(normalized));
      if (mode === 'activate') {
        await activateSurvey(saved.id);
        allowNavigation.current = true;
        navigate(`/surveys/${saved.id}/present`);
      } else {
        setSuccess('Draft saved.');
        if (!surveyId) navigate(`/surveys/${saved.id}/edit`, { replace: true });
      }
    } catch (caught) {
      setPageError(caught instanceof Error ? caught.message : 'The survey could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void persist('draft');
  }

  if (loading) return <p role="status">Loading survey editor…</p>;
  if (pageError && initialSurveyId && !expectedUpdatedAt) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
        <h1 className="text-xl font-semibold">Survey unavailable</h1>
        <p className="mt-2">{pageError}</p>
        <Link to="/dashboard" className="text-link mt-4">
          Back to dashboard
        </Link>
      </div>
    );
  }
  if (lockedReason) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h1 className="page-title">Survey editing is locked</h1>
        <p className="mt-4 leading-7">{lockedReason}</p>
        <Link to="/dashboard" className="text-link mt-5">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Survey editor</p>
          <h1 className="page-title mt-3">{surveyId ? 'Edit survey' : 'New survey'}</h1>
          <p className="mt-3 text-sm text-muted">
            Drafts may be incomplete. Activation requires at least one complete question.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>

      {pageError && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          {pageError}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900"
        >
          {success}
        </p>
      )}

      <div className="mt-8 space-y-5 rounded-2xl border border-line bg-white p-5 sm:p-7">
        <div>
          <label htmlFor="survey-title" className="form-label">
            Survey title <span aria-hidden="true">*</span>
          </label>
          <input
            id="survey-title"
            className="form-input"
            value={value.title}
            onChange={(event) => setValue((current) => ({ ...current, title: event.target.value }))}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'survey-title-error' : undefined}
          />
          {errors.title && (
            <p id="survey-title-error" className="mt-2 text-sm text-red-700">
              {errors.title}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="survey-description" className="form-label">
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="survey-description"
            className="form-input min-h-24"
            value={value.description}
            onChange={(event) =>
              setValue((current) => ({ ...current, description: event.target.value }))
            }
          />
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {value.questions.map((question, questionIndex) => (
          <fieldset
            key={question.id}
            className="rounded-2xl border border-line bg-white p-5 sm:p-7"
          >
            <legend className="px-2 font-semibold">Question {questionIndex + 1}</legend>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={questionIndex === 0}
                onClick={() =>
                  setValue((current) => ({
                    ...current,
                    questions: moveItem(current.questions, questionIndex, -1),
                  }))
                }
              >
                Move up
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={questionIndex === value.questions.length - 1}
                onClick={() =>
                  setValue((current) => ({
                    ...current,
                    questions: moveItem(current.questions, questionIndex, 1),
                  }))
                }
              >
                Move down
              </Button>
              <Button type="button" variant="secondary" onClick={() => removeQuestion(question.id)}>
                Delete question
              </Button>
            </div>
            <div className="mt-5">
              <label htmlFor={`question-${question.id}`} className="form-label">
                Question text <span aria-hidden="true">*</span>
              </label>
              <input
                id={`question-${question.id}`}
                className="form-input"
                value={question.text}
                onChange={(event) =>
                  updateQuestion(question.id, (current) => ({
                    ...current,
                    text: event.target.value,
                  }))
                }
                aria-invalid={Boolean(errors[`question:${question.id}`])}
                aria-describedby={
                  errors[`question:${question.id}`] ? `question-${question.id}-error` : undefined
                }
              />
              {errors[`question:${question.id}`] && (
                <p id={`question-${question.id}-error`} className="mt-2 text-sm text-red-700">
                  {errors[`question:${question.id}`]}
                </p>
              )}
            </div>
            <div className="mt-5">
              <label htmlFor={`type-${question.id}`} className="form-label">
                Question type
              </label>
              <select
                id={`type-${question.id}`}
                className="form-input"
                value={question.type}
                onChange={(event) => {
                  const type = event.target.value as QuestionType;
                  updateQuestion(question.id, (current) => ({
                    ...current,
                    type,
                    choices: choicesForType(current, type),
                  }));
                }}
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True / False</option>
              </select>
            </div>
            <fieldset className="mt-6">
              <legend className="form-label">Choices</legend>
              {errors[`choices:${question.id}`] && (
                <p className="mb-3 text-sm text-red-700">{errors[`choices:${question.id}`]}</p>
              )}
              <div className="space-y-3">
                {question.choices.map((choice, choiceIndex) => (
                  <div key={choice.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div>
                      <label htmlFor={`choice-${choice.id}`} className="sr-only">
                        Choice {choiceIndex + 1}
                      </label>
                      <input
                        id={`choice-${choice.id}`}
                        className="form-input"
                        value={choice.text}
                        readOnly={question.type === 'true_false'}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            choices: current.choices.map((item) =>
                              item.id === choice.id ? { ...item, text: event.target.value } : item,
                            ),
                          }))
                        }
                        aria-invalid={Boolean(errors[`choice:${choice.id}`])}
                        aria-describedby={
                          errors[`choice:${choice.id}`] ? `choice-${choice.id}-error` : undefined
                        }
                      />
                      {errors[`choice:${choice.id}`] && (
                        <p id={`choice-${choice.id}-error`} className="mt-2 text-sm text-red-700">
                          {errors[`choice:${choice.id}`]}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={choiceIndex === 0}
                        onClick={() =>
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            choices: moveItem(current.choices, choiceIndex, -1),
                          }))
                        }
                      >
                        Up
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={choiceIndex === question.choices.length - 1}
                        onClick={() =>
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            choices: moveItem(current.choices, choiceIndex, 1),
                          }))
                        }
                      >
                        Down
                      </Button>
                      {question.type === 'multiple_choice' && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            updateQuestion(question.id, (current) => ({
                              ...current,
                              choices: current.choices.filter((item) => item.id !== choice.id),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {question.type === 'multiple_choice' && (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-4"
                  onClick={() =>
                    updateQuestion(question.id, (current) => ({
                      ...current,
                      choices: [...current.choices, createChoice()],
                    }))
                  }
                >
                  Add choice
                </Button>
              )}
            </fieldset>
          </fieldset>
        ))}
      </div>

      {errors.questions && <p className="mt-5 text-sm text-red-700">{errors.questions}</p>}
      <Button
        type="button"
        variant="secondary"
        className="mt-6"
        onClick={() =>
          setValue((current) => ({
            ...current,
            questions: [...current.questions, createQuestion()],
          }))
        }
      >
        Add question
      </Button>
      <div className="sticky bottom-0 mt-8 flex flex-col gap-3 border-t border-line bg-paper/95 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save draft'}
        </Button>
        <Button type="button" disabled={saving} onClick={() => void persist('activate')}>
          Save and activate
        </Button>
      </div>
    </form>
  );
}
