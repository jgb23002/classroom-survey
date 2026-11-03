import { describe, expect, it } from 'vitest';
import { ConfigurationError, readSupabaseConfiguration } from './env';

const valid = {
  VITE_SUPABASE_URL: 'https://classroom-test.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic_test_value',
};

describe('public Supabase configuration', () => {
  it('reports both missing variable names', () => {
    expect(() => readSupabaseConfiguration({})).toThrow(
      'Missing Supabase configuration: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY',
    );
  });

  it.each([
    [{ VITE_SUPABASE_URL: valid.VITE_SUPABASE_URL }, 'VITE_SUPABASE_PUBLISHABLE_KEY'],
    [{ VITE_SUPABASE_PUBLISHABLE_KEY: valid.VITE_SUPABASE_PUBLISHABLE_KEY }, 'VITE_SUPABASE_URL'],
    [{ VITE_SUPABASE_URL: '  ', VITE_SUPABASE_PUBLISHABLE_KEY: ' ' }, 'Missing Supabase'],
  ])('rejects incomplete configuration %j', (environment, message) => {
    expect(() => readSupabaseConfiguration(environment)).toThrow(message);
  });

  it('normalizes whitespace and a trailing origin slash', () => {
    expect(
      readSupabaseConfiguration({
        VITE_SUPABASE_URL: ` ${valid.VITE_SUPABASE_URL}/ `,
        VITE_SUPABASE_PUBLISHABLE_KEY: ` ${valid.VITE_SUPABASE_PUBLISHABLE_KEY} `,
      }),
    ).toEqual({
      url: valid.VITE_SUPABASE_URL,
      publishableKey: valid.VITE_SUPABASE_PUBLISHABLE_KEY,
    });
  });

  it.each(['http://localhost:54321', 'http://127.0.0.1:54321', 'http://[::1]:54321'])(
    'allows local Supabase at %s',
    (url) => {
      expect(readSupabaseConfiguration({ ...valid, VITE_SUPABASE_URL: url }).url).toBe(url);
    },
  );

  it.each([
    'not a URL',
    'http://classroom-test.supabase.co',
    'file:///etc/hosts',
    'https://user:private-password@classroom-test.supabase.co',
    'https://classroom-test.supabase.co/rest/v1',
    'https://classroom-test.supabase.co?secret=private',
    'https://classroom-test.supabase.co#private',
  ])('rejects unsafe project URLs without reflecting their values', (url) => {
    try {
      readSupabaseConfiguration({ ...valid, VITE_SUPABASE_URL: url });
      expect.fail('Expected invalid configuration to throw.');
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigurationError);
      expect((error as Error).message).not.toContain(url);
      expect((error as Error).message).not.toContain('private-password');
    }
  });

  it.each([
    'sb_secret_synthetic_private_value',
    'eyJsynthetic_service_role_jwt',
    'unrecognized_key',
  ])('rejects private or legacy keys without reflecting them', (key) => {
    try {
      readSupabaseConfiguration({ ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: key });
      expect.fail('Expected a non-publishable key to be rejected.');
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigurationError);
      expect((error as Error).message).toContain('public sb_publishable_ key');
      expect((error as Error).message).not.toContain(key);
    }
  });

  it.each([
    { ...valid, VITE_SUPABASE_URL: 'https://your-project.supabase.co' },
    { ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_replace_me' },
  ])('rejects the committed example placeholders', (environment) => {
    expect(() => readSupabaseConfiguration(environment)).toThrow(
      'Replace the Supabase placeholders',
    );
  });
});
