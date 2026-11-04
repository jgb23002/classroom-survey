import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { getSurveyResults } from './results';

function client(result: unknown): SupabaseClient {
  return { rpc: vi.fn().mockResolvedValue(result) } as unknown as SupabaseClient;
}

describe('instructor results service', () => {
  it('loads an archived survey with preserved response aggregates', async () => {
    const supabase = client({
      data: {
        survey: {
          id: '10000000-0000-4000-8000-000000000001',
          title: 'Archived recursion check',
          description: null,
          status: 'archived',
          public_slug: 'archived-recursion-check',
          created_at: '2026-11-03T12:00:00.000Z',
        },
        response_count: 1,
        questions: [
          {
            id: '20000000-0000-4000-8000-000000000001',
            question_text: 'What stops recursion?',
            position: 1,
            answered_count: 1,
            unanswered_count: 0,
            choices: [
              {
                id: '30000000-0000-4000-8000-000000000001',
                choice_text: 'A base case',
                position: 1,
                count: 1,
              },
              {
                id: '30000000-0000-4000-8000-000000000002',
                choice_text: 'A pointer',
                position: 2,
                count: 0,
              },
            ],
          },
        ],
      },
      error: null,
    });
    await expect(
      getSurveyResults('10000000-0000-4000-8000-000000000001', supabase),
    ).resolves.toMatchObject({
      survey: { status: 'archived' },
      responseCount: 1,
      questions: [
        {
          answeredCount: 1,
          choices: [
            { text: 'A base case', count: 1, percentage: 100 },
            { text: 'A pointer', count: 0, percentage: 0 },
          ],
        },
      ],
    });
  });

  it('identifies a missing remote results RPC with the required migration', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const supabase = client({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find public.get_survey_results' },
    });
    await expect(
      getSurveyResults('10000000-0000-4000-8000-000000000001', supabase),
    ).rejects.toThrow('202611030004_instructor_results.sql');
    expect(console.error).toHaveBeenCalledWith('[survey-results]', {
      code: 'PGRST202',
      category: 'rpc-unavailable',
    });
  });
});
