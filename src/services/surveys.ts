import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';
import { isSurveyStatus, type SurveySummary } from '../types/survey';

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
