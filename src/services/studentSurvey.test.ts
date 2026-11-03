import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import type { SubmissionErrorKind } from '../types/studentSurvey';
import { loadPublicSurvey, submitPublicSurvey } from './studentSurvey';

function rpcClient(result: unknown): SupabaseClient {
  return { rpc: vi.fn().mockResolvedValue(result) } as unknown as SupabaseClient;
}

describe('anonymous student survey service', () => {
  it('parses and orders active questions and choices', async () => {
    const result = await loadPublicSurvey(
      'slug',
      rpcClient({
        data: {
          state: 'active',
          survey: { id: 'survey-id', title: 'Recursion', description: null },
          questions: [
            {
              id: 'q2',
              question_text: 'Second?',
              question_type: 'true_false',
              position: 2,
              choices: [
                { id: 'false', choice_text: 'False', position: 2 },
                { id: 'true', choice_text: 'True', position: 1 },
              ],
            },
            {
              id: 'q1',
              question_text: 'First?',
              question_type: 'multiple_choice',
              position: 1,
              choices: [{ id: 'a', choice_text: 'A', position: 1 }],
            },
          ],
        },
        error: null,
      }),
    );
    expect(result.state).toBe('active');
    if (result.state !== 'active') throw new Error('Expected active survey');
    expect(result.questions.map((question) => question.id)).toEqual(['q1', 'q2']);
    expect(result.questions[1]?.choices.map((choice) => choice.id)).toEqual(['true', 'false']);
  });

  const submissionErrors: Array<[string, string, SubmissionErrorKind]> = [
    ['DUPLICATE_RESPONSE', '23505', 'duplicate'],
    ['SURVEY_NOT_ACTIVE', 'P0001', 'closed'],
    ['INVALID_CHOICE', '23514', 'invalid'],
    ['Failed to fetch', '', 'network'],
  ];

  it.each(submissionErrors)('maps %s submission failures to %s', async (message, code, kind) => {
    const promise = submitPublicSurvey(
      'survey-id',
      'token',
      [],
      rpcClient({ data: null, error: { message, code } }),
    );
    await expect(promise).rejects.toMatchObject({ kind });
  });

  it('returns only the new submission receipt ID', async () => {
    await expect(
      submitPublicSurvey(
        'survey-id',
        'token',
        [{ question_id: 'q1', choice_id: 'c1' }],
        rpcClient({ data: { success: true, response_id: 'response-id' }, error: null }),
      ),
    ).resolves.toBe('response-id');
  });
});
