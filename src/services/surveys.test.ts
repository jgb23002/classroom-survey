import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { saveSurveyDraft, surveySaveErrorCategory, surveySaveErrorMessage } from './surveys';

const draft = { title: 'Test', description: '', questions: [] };

function client(role: string | undefined, rpcResult: unknown): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: role ? { user: { app_metadata: { role } } } : { user: { app_metadata: {} } },
        },
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue(rpcResult),
  } as unknown as SupabaseClient;
}

describe('survey draft persistence diagnostics', () => {
  it('identifies a missing save RPC and gives the migration name', () => {
    const error = {
      code: 'PGRST202',
      message: 'Could not find public.save_survey in schema cache',
    };
    expect(surveySaveErrorCategory(error)).toBe('rpc-unavailable');
    expect(surveySaveErrorMessage(error)).toContain('202611030002_atomic_survey_editor.sql');
  });

  it('refuses to call the RPC without the trusted instructor claim', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const supabase = client(undefined, { data: null, error: null });
    await expect(saveSurveyDraft(null, null, draft, supabase)).rejects.toThrow(
      'not authorized as an instructor',
    );
    expect(supabase.rpc).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('returns a saved draft for an instructor and valid RPC response', async () => {
    const supabase = client('instructor', {
      data: {
        id: '10000000-0000-4000-8000-000000000001',
        status: 'draft',
        updated_at: '2026-11-03T12:00:00.000Z',
      },
      error: null,
    });
    await expect(saveSurveyDraft(null, null, draft, supabase)).resolves.toEqual({
      id: '10000000-0000-4000-8000-000000000001',
      status: 'draft',
      updatedAt: '2026-11-03T12:00:00.000Z',
    });
  });
});
