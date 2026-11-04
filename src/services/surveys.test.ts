import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import {
  activateSurvey,
  closeSurvey,
  duplicateSurvey,
  saveSurveyDraft,
  surveySaveErrorCategory,
  surveySaveErrorMessage,
} from './surveys';

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

describe('survey lifecycle service', () => {
  it('activates through the lifecycle RPC and validates the active slug', async () => {
    const supabase = client('instructor', {
      data: {
        id: '10000000-0000-4000-8000-000000000001',
        status: 'active',
        public_slug: 'random-public-slug',
      },
      error: null,
    });
    await expect(activateSurvey('10000000-0000-4000-8000-000000000001', supabase)).resolves.toEqual(
      {
        id: '10000000-0000-4000-8000-000000000001',
        status: 'active',
        publicSlug: 'random-public-slug',
      },
    );
    expect(supabase.rpc).toHaveBeenCalledWith('activate_survey', {
      p_survey_id: '10000000-0000-4000-8000-000000000001',
    });
  });

  it('closes through the lifecycle RPC and reports database failures', async () => {
    const success = client('instructor', { data: { status: 'closed' }, error: null });
    await expect(
      closeSurvey('10000000-0000-4000-8000-000000000001', success),
    ).resolves.toBeUndefined();
    expect(success.rpc).toHaveBeenCalledWith('close_survey', {
      p_survey_id: '10000000-0000-4000-8000-000000000001',
    });

    const failure = client('instructor', { data: null, error: { message: 'denied' } });
    await expect(closeSurvey('10000000-0000-4000-8000-000000000001', failure)).rejects.toThrow(
      'could not be closed',
    );
  });
});

describe('survey duplication', () => {
  it('uses one atomic RPC and returns its new draft ID', async () => {
    const supabase = client('instructor', {
      data: { id: '10000000-0000-4000-8000-000000000099', status: 'draft' },
      error: null,
    });
    await expect(duplicateSurvey('10000000-0000-4000-8000-000000000001', supabase)).resolves.toBe(
      '10000000-0000-4000-8000-000000000099',
    );
    expect(supabase.rpc).toHaveBeenCalledWith('duplicate_survey', {
      p_survey_id: '10000000-0000-4000-8000-000000000001',
    });
  });

  it('identifies a missing remote duplication RPC without exposing payload data', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const supabase = client('instructor', {
      data: null,
      error: { code: 'PGRST202', message: 'Could not find public.duplicate_survey' },
    });
    await expect(duplicateSurvey('10000000-0000-4000-8000-000000000001', supabase)).rejects.toThrow(
      '202611030005_atomic_survey_duplication.sql',
    );
    expect(console.error).toHaveBeenCalledWith('[survey-duplicate]', {
      code: 'PGRST202',
      category: 'rpc-unavailable',
    });
  });
});
