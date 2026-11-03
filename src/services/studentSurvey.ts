import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicSupabaseClient } from '../lib/supabase';
import type {
  ActivePublicSurvey,
  PublicChoice,
  PublicQuestion,
  PublicSurveyResult,
  SubmissionErrorKind,
} from '../types/studentSurvey';

export class StudentSurveyError extends Error {
  constructor(
    public readonly kind: SubmissionErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'StudentSurveyError';
  }
}

function publicClient() {
  return getPublicSupabaseClient();
}

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseChoice(value: unknown): PublicChoice {
  const row = object(value);
  if (
    !row ||
    typeof row.id !== 'string' ||
    typeof row.choice_text !== 'string' ||
    typeof row.position !== 'number'
  )
    throw new StudentSurveyError('invalid', 'The survey contains invalid answer choices.');
  return { id: row.id, text: row.choice_text, position: row.position };
}

function parseQuestion(value: unknown): PublicQuestion {
  const row = object(value);
  if (
    !row ||
    typeof row.id !== 'string' ||
    typeof row.question_text !== 'string' ||
    (row.question_type !== 'multiple_choice' && row.question_type !== 'true_false') ||
    typeof row.position !== 'number' ||
    !Array.isArray(row.choices)
  )
    throw new StudentSurveyError('invalid', 'The survey contains an invalid question.');
  return {
    id: row.id,
    text: row.question_text,
    type: row.question_type,
    position: row.position,
    choices: row.choices.map(parseChoice).sort((a, b) => a.position - b.position),
  };
}

export async function loadPublicSurvey(
  slug: string,
  supabase: SupabaseClient = publicClient(),
): Promise<PublicSurveyResult> {
  const { data, error } = await supabase.rpc('get_public_survey', { p_slug: slug });
  if (error)
    throw new StudentSurveyError(
      'network',
      'The survey could not be loaded. Check your connection and try again.',
    );
  const result = object(data);
  if (
    !result ||
    (result.state !== 'active' && result.state !== 'closed' && result.state !== 'not_found')
  )
    throw new StudentSurveyError('invalid', 'The survey returned an invalid response.');
  if (result.state !== 'active') return { state: result.state };

  const survey = object(result.survey);
  if (
    !survey ||
    typeof survey.id !== 'string' ||
    typeof survey.title !== 'string' ||
    (survey.description !== null && typeof survey.description !== 'string') ||
    !Array.isArray(result.questions)
  )
    throw new StudentSurveyError('invalid', 'The survey returned invalid content.');

  const active: ActivePublicSurvey = {
    state: 'active',
    survey: {
      id: survey.id,
      title: survey.title,
      description: survey.description,
    },
    questions: result.questions.map(parseQuestion).sort((a, b) => a.position - b.position),
  };
  return active;
}

function submissionErrorKind(error: { code?: string; message?: string }): SubmissionErrorKind {
  const message = error.message ?? '';
  if (error.code === '23505' || message.includes('DUPLICATE_RESPONSE')) return 'duplicate';
  if (message.includes('SURVEY_NOT_ACTIVE')) return 'closed';
  if (
    message.includes('INVALID_QUESTION') ||
    message.includes('INVALID_CHOICE') ||
    message.includes('MISSING_REQUIRED_ANSWER') ||
    message.includes('INVALID_ANSWER_PAYLOAD')
  )
    return 'invalid';
  if (/fetch|network|offline/i.test(message)) return 'network';
  return 'unknown';
}

export async function submitPublicSurvey(
  surveyId: string,
  token: string,
  answers: Array<{ question_id: string; choice_id: string }>,
  supabase: SupabaseClient = publicClient(),
): Promise<string> {
  const { data, error } = await supabase.rpc('submit_survey_response', {
    p_survey_id: surveyId,
    p_anonymous_token: token,
    p_answers: answers,
  });
  if (error) {
    const kind = submissionErrorKind(error);
    const messages: Record<SubmissionErrorKind, string> = {
      duplicate: 'You have already submitted a response to this survey.',
      closed: 'This survey is no longer accepting responses.',
      invalid: 'The survey changed while you were answering. Refresh the page and try again.',
      network: 'Your response could not be sent. Check your connection and try again.',
      unknown: 'Your response could not be submitted. Please try again.',
    };
    throw new StudentSurveyError(kind, messages[kind]);
  }
  const result = object(data);
  if (result?.success !== true || typeof result.response_id !== 'string')
    throw new StudentSurveyError('unknown', 'The submission returned an invalid confirmation.');
  return result.response_id;
}
