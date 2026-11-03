import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';
import type { QuestionResult, SurveyExport, SurveyResults } from '../types/results';
import { isSurveyStatus } from '../types/survey';
import { resultPercentage } from '../utilities/results';

export class ResultsServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResultsServiceError';
  }
}

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function integer(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function parseResults(data: unknown): SurveyResults {
  const root = object(data);
  const survey = object(root?.survey);
  if (
    !root ||
    !survey ||
    typeof survey.id !== 'string' ||
    typeof survey.title !== 'string' ||
    (survey.description !== null && typeof survey.description !== 'string') ||
    !isSurveyStatus(survey.status) ||
    (survey.public_slug !== null && typeof survey.public_slug !== 'string') ||
    typeof survey.created_at !== 'string' ||
    !integer(root.response_count) ||
    !Array.isArray(root.questions)
  )
    throw new ResultsServiceError('The database returned invalid survey results.');

  const questions: QuestionResult[] = root.questions.map((value) => {
    const question = object(value);
    if (
      !question ||
      typeof question.id !== 'string' ||
      typeof question.question_text !== 'string' ||
      !integer(question.position) ||
      !integer(question.answered_count) ||
      !integer(question.unanswered_count) ||
      !Array.isArray(question.choices)
    )
      throw new ResultsServiceError('The database returned invalid question results.');
    const answeredCount = question.answered_count;
    const choices = question.choices.map((choiceValue) => {
      const choice = object(choiceValue);
      if (
        !choice ||
        typeof choice.id !== 'string' ||
        typeof choice.choice_text !== 'string' ||
        !integer(choice.position) ||
        !integer(choice.count)
      )
        throw new ResultsServiceError('The database returned invalid choice results.');
      return {
        id: choice.id,
        text: choice.choice_text,
        position: choice.position,
        count: choice.count,
        percentage: resultPercentage(choice.count, answeredCount),
      };
    });
    return {
      id: question.id,
      text: question.question_text,
      position: question.position,
      answeredCount,
      unansweredCount: question.unanswered_count,
      choices: choices.sort((a, b) => a.position - b.position),
    };
  });
  return {
    survey: {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      publicSlug: survey.public_slug,
      createdAt: survey.created_at,
    },
    responseCount: root.response_count,
    questions: questions.sort((a, b) => a.position - b.position),
  };
}

export async function getSurveyResults(
  id: string,
  supabase: SupabaseClient = getSupabaseClient(),
): Promise<SurveyResults> {
  const { data, error } = await supabase.rpc('get_survey_results', { p_survey_id: id });
  if (error || !data) throw new ResultsServiceError('Survey results could not be loaded.');
  return parseResults(data);
}

export async function getSurveyExport(
  id: string,
  supabase: SupabaseClient = getSupabaseClient(),
): Promise<SurveyExport> {
  const { data, error } = await supabase.rpc('export_survey_responses', { p_survey_id: id });
  if (error || !data) throw new ResultsServiceError('The CSV export could not be prepared.');
  const root = object(data);
  const survey = object(root?.survey);
  if (
    !root ||
    !survey ||
    typeof survey.id !== 'string' ||
    typeof survey.title !== 'string' ||
    (survey.description !== null && typeof survey.description !== 'string') ||
    !isSurveyStatus(survey.status) ||
    typeof survey.created_at !== 'string' ||
    !Array.isArray(root.questions) ||
    !Array.isArray(root.responses)
  )
    throw new ResultsServiceError('The database returned invalid export data.');

  return {
    survey: {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      createdAt: survey.created_at,
    },
    questions: root.questions.map((value) => {
      const question = object(value);
      if (
        !question ||
        typeof question.id !== 'string' ||
        typeof question.question_text !== 'string' ||
        !integer(question.position)
      )
        throw new ResultsServiceError('The database returned invalid export questions.');
      return { id: question.id, text: question.question_text, position: question.position };
    }),
    responses: root.responses.map((value) => {
      const response = object(value);
      if (
        !response ||
        typeof response.id !== 'string' ||
        typeof response.submitted_at !== 'string' ||
        !Array.isArray(response.answers)
      )
        throw new ResultsServiceError('The database returned invalid export responses.');
      return {
        id: response.id,
        submittedAt: response.submitted_at,
        answers: response.answers.map((value) => {
          const answer = object(value);
          if (
            !answer ||
            typeof answer.question_id !== 'string' ||
            typeof answer.answer !== 'string'
          )
            throw new ResultsServiceError('The database returned invalid export answers.');
          return { questionId: answer.question_id, answer: answer.answer };
        }),
      };
    }),
  };
}
