# Phase 2 — Database Implementation Report

Date: 2026-11-02 (America/New_York).

## Outcome

Implemented the complete five-table PostgreSQL migration, deny-by-default role grants, active-content RLS, trusted instructor authorization, lifecycle/submission RPCs, cross-table answer validation, rollback-safe verification SQL, and concurrent lifecycle tests.

The migration has been applied and tested only in disposable local PostgreSQL 16.13 clusters. No Supabase project, hosted schema, Auth user or secret was created or changed.

## Created files

- [Initial migration](../supabase/migrations/202611020001_initial_classroom_survey.sql)
- [Local Supabase compatibility bootstrap](../supabase/tests/000_local_supabase_bootstrap.sql)
- [Schema and security verification](../supabase/tests/001_schema_and_security.sql)
- [Concurrency verification](../supabase/tests/002_concurrency.sh)
- [Disposable local test runner](../supabase/tests/run_local.sh)
- [Database test/readme](../supabase/README.md)
- [Manual Supabase setup](SUPABASE_SETUP.md)
- This report

Removed the two placeholder `.gitkeep` files from `supabase/migrations/` and `supabase/tests/` after adding real files. Updated `TODO.md`, `docs/TODO_STATUS.md`, and `docs/AI_DEVELOPMENT_HISTORY.md` with evidence-backed progress.

## Schema and security implemented

- `surveys`, `questions`, `choices`, `responses`, and `answers` preserve the specified fields, UUID defaults, relationships and delete actions.
- Status/question-type/nonblank/positive-position checks; deferrable sibling-position uniqueness; response-question uniqueness; partial unique active-survey and duplicate-token indexes; all specified lookup indexes and timestamps.
- Survey `updated_at` uses a trigger with `clock_timestamp()` so successive updates inside one transaction are observable.
- Answer trigger proves response/question survey equality and choice/question ownership. Choice deletion still follows the specified `ON DELETE SET NULL` behavior.
- RLS enabled on all five tables. Anonymous direct read grants cover only survey/question/choice and policies expose active rows. No anonymous direct table writes or response/answer reads.
- Instructor policies require `auth.uid()` and trusted `auth.jwt().app_metadata.role = instructor`; ordinary authenticated claims see/manage nothing.
- Every definer function has `search_path = ''`, schema-qualified objects, explicit execute revokes/grants and internal authorization where privileged. Default future function execution by `PUBLIC` is revoked for the migration owner.

## RPC contracts

| Function                                  | Caller              | Result / invariant                                                                                                                                                                     |
| ----------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activate_survey(uuid)`                   | Approved instructor | Atomically closes prior active survey, retains/generates a 24-character random slug and returns ID/status/slug; global advisory lock plus row lock and unique index handle concurrency |
| `close_survey(uuid)`                      | Approved instructor | Idempotently closes active/closed target and returns ID/status; row lock conflicts with admitted submission shared locks                                                               |
| `submit_survey_response(uuid,text,jsonb)` | Anonymous student   | Requires active survey, valid nonblank token, exact unique required questions and owned choices; atomically inserts response/answers; returns success/response ID only                 |
| `get_public_survey(text)`                 | Anonymous student   | Returns ordered active content, minimal closed state, or not-found state; never returns response history                                                                               |

## Verification executed

`bash supabase/tests/run_local.sh` initializes a private Unix-socket PostgreSQL cluster under a unique `/private/tmp` directory, installs a local Auth compatibility shim, applies the migration, runs transaction-wrapped verification, runs concurrent sessions, then stops/removes the cluster.

Final successful suite covered:

- exactly five public tables, required RLS/policies/index/trigger/function configuration and exact RPC execute roles;
- active-only anonymous metadata/question/choice reads; denied response reads and direct inserts;
- ordinary authenticated user denial and trusted instructor DML/RPC access;
- updated timestamp, status/position/text/unique/FK/cascade and `ON DELETE SET NULL` behavior;
- public active/closed/not-found lookup without response data;
- malformed/missing/foreign/duplicate answer rejection and no partial rows;
- successful exact submission and duplicate browser-token rejection;
- one-active invariant, activation closing prior survey, and post-close rejection;
- simultaneous activation calls leaving exactly one active survey;
- submit-versus-close coordination: the final run measured close waiting 670 ms for the admitted submission transaction, committed that response, closed the survey, and rejected a later submission.

Intermediate test failures corrected test/migration details: PostgreSQL stores empty function search paths as `search_path=""`; `now()` is transaction-stable so the update trigger uses wall-clock time; anonymous atomicity counts must be asserted from an authorized test context. Each correction was followed by a fresh cluster/migration run.

## Remaining manual actions

Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md): create/select the Supabase project, run the migration once in SQL Editor, run the rollback-safe verification SQL, configure Auth, provision the instructor claim, refresh the session, and record actual remote evidence. Keep the URL/publishable key for later frontend integration; do not add a database password or secret/service-role key to browser code.

Remote TODO verification tasks remain unchecked until those steps succeed. Application Auth and data integration are later phases.
