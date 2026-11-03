# Supabase Manual Setup and Verification

Prepared: 2026-11-02 (America/New_York).

The migration is locally verified against disposable PostgreSQL 16. The remote Supabase project remains unconfigured until the owner completes and records these steps.

## 1. Create or select the project

1. Sign in to Supabase and create/select the project intended for this application.
2. Keep the database password and all secret/service-role keys private. The browser will later receive only the project URL and `sb_publishable_...` key.
3. In Authentication settings, enable email/password sign-in, disable public user signup, and disable anonymous Auth sign-ins. Students use the database `anon` role through the publishable key; they do not create Auth users.

## 2. Apply the migration in SQL Editor

1. Open the project's **SQL Editor** and create a new query.
2. Open [the versioned migration](../supabase/migrations/202611020001_initial_classroom_survey.sql), copy the entire file without modifying it, and paste it into the query.
3. Confirm the query starts with `begin;` and ends with `commit;`.
4. Run it once. A successful SQL Editor result must complete without an error. Do not rerun this initial migration after it succeeds; it intentionally uses `create` statements so an accidental second run fails instead of silently changing an existing schema.
5. Record the project name, UTC execution time and successful result in the Phase 2 report or evidence notes. Do not include passwords or keys.

The SQL Editor does not automatically add a repository migration to Supabase CLI migration history. Keep the migration file as the source of truth. A later authenticated CLI workflow can reconcile migration history deliberately; do not mark it applied based only on the local file.

## 3. Run the rollback-safe remote verification

1. Open [the verification SQL](../supabase/tests/001_schema_and_security.sql) in a second SQL Editor query.
2. Copy the entire file and run it after the migration. It begins a transaction, creates fixed synthetic fixtures, switches among `anon`/`authenticated` claims, and ends with `rollback;`.
3. Confirm the final result contains:

   ```text
   PASS: schema, constraints, RLS, authorization, validation, duplicate, lifecycle, closure and cascade checks
   ```

4. Confirm the Table Editor contains no synthetic IDs beginning with `10000000-...`. The verification transaction should have rolled them back.

The suite temporarily closes an existing active survey only within its
uncommitted transaction so it can create a deterministic active fixture. Run it
during a quiet window: API readers continue to see committed data, but a
concurrent lifecycle write may wait for the verification transaction. See the
[remote verification record](REMOTE_DATABASE_VERIFICATION.md) for the cleanup
query, per-check evidence status, and required real-session follow-up.

This test checks RLS and RPC behavior through database roles. It does not replace a later browser test using real Supabase Auth sessions and the public API key. Run `002_concurrency.sh` only on a disposable local/test project with a direct database connection; do not run load or concurrency fixtures against a classroom production project.

## 4. Apply and verify the Phase 5 editor migration

After the initial migration is present, run the complete
[`202611030002_atomic_survey_editor.sql`](../supabase/migrations/202611030002_atomic_survey_editor.sql)
file once in SQL Editor. It adds only the instructor-authorized `save_survey`
RPC; it does not replace tables, policies, or existing data. Then run
[`003_editor.sql`](../supabase/tests/003_editor.sql) and require its final
`PASS` result. The verification is transaction-wrapped and rolls back its
synthetic survey.

If the browser reports that survey saving is not installed after the migration
finishes successfully, run `notify pgrst, 'reload schema';` once in SQL Editor,
refresh the browser, and retry. A `PGRST202` response means the API schema cache
cannot currently resolve `public.save_survey`; it is not a form-validation
failure.

## 5. Provision the approved instructor

The application does not treat every signed-in user as an instructor. RLS and privileged RPCs require both a real Supabase Auth user ID and the trusted server-managed claim `app_metadata.role = instructor`.

1. In **Authentication → Users**, create or invite the single instructor account. Do not expose its password in the repository or screenshots.
2. Copy that user's UUID from the Auth Users page.
3. In SQL Editor, replace only the placeholder UUID below and run the statement:

   ```sql
   update auth.users
      set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
          || '{"role":"instructor"}'::jsonb
    where id = 'REPLACE_WITH_AUTH_USER_UUID'::uuid
   returning id, raw_app_meta_data ->> 'role' as application_role;
   ```

4. Require the result to return exactly one row with `application_role = instructor`. Zero rows means the UUID was wrong; do not continue by weakening the RLS policies.
5. Sign the instructor out and back in after changing metadata so the access token contains the new claim. JWTs already issued before a role change can remain stale until refreshed/expired.

To revoke instructor access, use the trusted SQL Editor/admin path and remove the key, then require session revocation/sign-out:

```sql
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role'
 where id = 'REPLACE_WITH_AUTH_USER_UUID'::uuid;
```

Never authorize from `user_metadata`, an email string, a frontend environment variable, or the generic `authenticated` role.

## 6. Record the remote result before checking TODO verification tasks

Only after the remote migration and verification succeed should these TODO items be checked:

- Create a Supabase project.
- Verify students cannot read survey results.
- Verify anonymous students can read active surveys.
- Verify anonymous students can submit responses.
- Verify authenticated instructors have full access.

Record the remote test date/project and any deviations. Phase 2 source preparation and local PostgreSQL verification do not prove the hosted project is configured.

## Function behavior and security

- `activate_survey(uuid)` and `close_survey(uuid)` are executable only by `authenticated`, then independently require the trusted instructor claim. Their fixed empty `search_path`, schema-qualified references, advisory lifecycle lock and row locks prevent role/path bypass and serialize activation.
- `submit_survey_response(uuid, text, jsonb)` is executable only by `anon`. It validates the active status under a shared row lock, the nonblank browser token, exact one-answer-per-question coverage and choice ownership. It inserts response/answers in the function's transaction and returns only `{success, response_id}`.
- `get_public_survey(text)` is executable only by `anon` and returns active survey content, `{state: closed}` without closed content, or `{state: not_found}`.
- Anonymous direct table grants allow `SELECT` only on surveys/questions/choices; RLS filters them to active content. There is no anonymous direct response/answer read or table write grant.
- Approved instructors have table DML grants filtered by the trusted-claim RLS policies. The partial unique index remains the database backstop for one active survey.
