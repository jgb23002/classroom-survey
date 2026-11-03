import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';
import { isSurveyStatus, type SurveySummary } from '../types/survey';
import type { LoadedSurveyEditor, SavedSurvey, SurveyEditorValue } from '../types/surveyEditor';

export class SurveyServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SurveyServiceError';
  }
}

interface SurveyRow {
  id: string;
  title: string;
  description: string | null;
  status: unknown;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
  responses: { count: number }[] | null;
}

interface SurveyGraph {
  title: string;
  description: string | null;
  questions: Array<{
    id: string;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false';
    position: number;
    choices: Array<{ choice_text: string; position: number }>;
  }>;
}

interface EditorSurveyRow {
  id: string;
  title: string;
  description: string | null;
  status: unknown;
  updated_at: string;
  responses: { count: number }[] | null;
  questions: Array<{
    id: string;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false';
    position: number;
    choices: Array<{ id: string; choice_text: string; position: number }>;
  }>;
}

function client() {
  return getSupabaseClient();
}

function message(action: string) {
  return `The survey could not be ${action}. Please try again.`;
}

export async function listSurveys(supabase: SupabaseClient = client()): Promise<SurveySummary[]> {
  const { data, error } = await supabase
    .from('surveys')
    .select('id,title,description,status,public_slug,created_at,updated_at,responses(count)')
    .order('created_at', { ascending: false });

  if (error) throw new SurveyServiceError('Surveys could not be loaded. Please try again.');

  return ((data ?? []) as SurveyRow[]).map((row) => {
    if (!isSurveyStatus(row.status))
      throw new SurveyServiceError('A survey has an invalid status.');
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      publicSlug: row.public_slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      responseCount: row.responses?.[0]?.count ?? 0,
    };
  });
}

export async function activateSurvey(id: string, supabase: SupabaseClient = client()) {
  const { error } = await supabase.rpc('activate_survey', { p_survey_id: id });
  if (error) throw new SurveyServiceError(message('activated'));
}

export async function closeSurvey(id: string, supabase: SupabaseClient = client()) {
  const { error } = await supabase.rpc('close_survey', { p_survey_id: id });
  if (error) throw new SurveyServiceError(message('closed'));
}

export async function archiveSurvey(id: string, supabase: SupabaseClient = client()) {
  const { data, error } = await supabase
    .from('surveys')
    .update({ status: 'archived' })
    .eq('id', id)
    .in('status', ['draft', 'closed'])
    .select('id')
    .maybeSingle();
  if (error || !data) throw new SurveyServiceError(message('archived'));
}

export async function deleteSurvey(id: string, supabase: SupabaseClient = client()) {
  const { data, error } = await supabase
    .from('surveys')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error || !data) throw new SurveyServiceError(message('deleted'));
}

export async function duplicateSurvey(
  id: string,
  supabase: SupabaseClient = client(),
): Promise<string> {
  const { data: sourceData, error: sourceError } = await supabase
    .from('surveys')
    .select(
      'title,description,questions(id,question_text,question_type,position,choices(choice_text,position))',
    )
    .eq('id', id)
    .order('position', { referencedTable: 'questions', ascending: true })
    .order('position', { referencedTable: 'questions.choices', ascending: true })
    .single();

  if (sourceError || !sourceData) throw new SurveyServiceError(message('duplicated'));
  const source = sourceData as unknown as SurveyGraph;
  const { data: copy, error: copyError } = await supabase
    .from('surveys')
    .insert({ title: `Copy of ${source.title}`, description: source.description, status: 'draft' })
    .select('id')
    .single();
  if (copyError || !copy) throw new SurveyServiceError(message('duplicated'));

  try {
    for (const question of source.questions) {
      const { data: copiedQuestion, error: questionError } = await supabase
        .from('questions')
        .insert({
          survey_id: copy.id,
          question_text: question.question_text,
          question_type: question.question_type,
          position: question.position,
        })
        .select('id')
        .single();
      if (questionError || !copiedQuestion) throw new Error('question copy failed');

      if (question.choices.length) {
        const { error: choicesError } = await supabase.from('choices').insert(
          question.choices.map((choice) => ({
            question_id: copiedQuestion.id,
            choice_text: choice.choice_text,
            position: choice.position,
          })),
        );
        if (choicesError) throw new Error('choice copy failed');
      }
    }
    return copy.id as string;
  } catch {
    await supabase.from('surveys').delete().eq('id', copy.id);
    throw new SurveyServiceError(message('duplicated'));
  }
}

export async function loadSurveyEditor(
  id: string,
  supabase: SupabaseClient = client(),
): Promise<LoadedSurveyEditor> {
  const { data, error } = await supabase
    .from('surveys')
    .select(
      'id,title,description,status,updated_at,responses(count),questions(id,question_text,question_type,position,choices(id,choice_text,position))',
    )
    .eq('id', id)
    .order('position', { referencedTable: 'questions', ascending: true })
    .order('position', { referencedTable: 'questions.choices', ascending: true })
    .single();
  if (error || !data) throw new SurveyServiceError('The survey could not be loaded.');

  const row = data as unknown as EditorSurveyRow;
  if (!isSurveyStatus(row.status))
    throw new SurveyServiceError('The survey has an invalid status.');
  return {
    id: row.id,
    status: row.status,
    updatedAt: row.updated_at,
    responseCount: row.responses?.[0]?.count ?? 0,
    value: {
      title: row.title,
      description: row.description ?? '',
      questions: row.questions.map((question) => ({
        id: question.id,
        text: question.question_text,
        type: question.question_type,
        choices: question.choices.map((choice) => ({ id: choice.id, text: choice.choice_text })),
      })),
    },
  };
}

function saveError(rawMessage: string): string {
  if (rawMessage.includes('SURVEY_EDIT_CONFLICT'))
    return 'This survey changed in another tab. Reload before saving again.';
  if (rawMessage.includes('SURVEY_ACTIVE')) return 'Close this active survey before editing it.';
  if (rawMessage.includes('SURVEY_ARCHIVED')) return 'Archived surveys cannot be edited.';
  if (rawMessage.includes('SURVEY_HAS_RESPONSES'))
    return 'This survey has responses and its content is locked. Duplicate it to make changes.';
  return 'The survey could not be saved. Your edits are still here; please try again.';
}

export async function saveSurveyDraft(
  surveyId: string | null,
  expectedUpdatedAt: string | null,
  value: SurveyEditorValue,
  supabase: SupabaseClient = client(),
): Promise<SavedSurvey> {
  const questions = value.questions.map((question, questionIndex) => ({
    id: question.id,
    question_text: question.text,
    question_type: question.type,
    position: questionIndex + 1,
    choices: question.choices.map((choice, choiceIndex) => ({
      id: choice.id,
      choice_text: choice.text,
      position: choiceIndex + 1,
    })),
  }));
  const { data, error } = await supabase.rpc('save_survey', {
    p_survey_id: surveyId,
    p_expected_updated_at: expectedUpdatedAt,
    p_title: value.title,
    p_description: value.description,
    p_questions: questions,
  });
  if (error || !data) throw new SurveyServiceError(saveError(error?.message ?? ''));
  const result = data as { id?: unknown; status?: unknown; updated_at?: unknown };
  if (
    typeof result.id !== 'string' ||
    result.status !== 'draft' ||
    typeof result.updated_at !== 'string'
  ) {
    throw new SurveyServiceError('The database returned an invalid save result.');
  }
  return { id: result.id, status: 'draft', updatedAt: result.updated_at };
}
