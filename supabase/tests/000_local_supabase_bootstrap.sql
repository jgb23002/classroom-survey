\set ON_ERROR_STOP on

-- Local PostgreSQL-only compatibility layer for migration verification.
-- Supabase already provides these roles, schemas and auth helpers remotely.
create role anon nologin;
create role authenticated nologin;
create schema extensions;
create schema auth;

create function auth.jwt()
returns jsonb
language sql
stable
as $$
    select coalesce(
        nullif(current_setting('request.jwt.claims', true), '')::jsonb,
        '{}'::jsonb
    );
$$;

create function auth.uid()
returns uuid
language sql
stable
as $$
    select nullif(auth.jwt() ->> 'sub', '')::uuid;
$$;

grant usage on schema auth to anon, authenticated;
grant execute on function auth.jwt(), auth.uid() to anon, authenticated;
