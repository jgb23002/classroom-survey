# Remote Supabase Database Verification

Prepared: 2026-11-03 (America/New_York).

## Current evidence

The migration was reported as manually applied. No remote database URL, Supabase
CLI login, project URL/publishable key, or authenticated user session is
available in this workspace, so no remote query has been executed by Codex.

The rollback-safe verification suite was strengthened and passed against a
fresh disposable PostgreSQL 16 database on 2026-11-03. This validates the test
logic and migration locally; it does not establish the hosted project's state.

## Safe SQL Editor verification

Run the complete
[`supabase/tests/001_schema_and_security.sql`](../supabase/tests/001_schema_and_security.sql)
file in the Supabase SQL Editor during a quiet window.

The script:

- begins one transaction and ends with `rollback`;
- temporarily changes any existing active survey to closed only in its own
  uncommitted transaction, allowing a deterministic active fixture without
  committing a change to legitimate data;
- uses fixed synthetic UUIDs and tokens;
- switches to `anon` and `authenticated` roles before policy tests instead of
  treating SQL Editor administrator access as client access;
- supplies synthetic JWT claims for ordinary-user and instructor checks;
- rolls back every fixture and temporary change before printing `PASS`.

Run it when no instructor lifecycle operation is in progress because its
uncommitted update can briefly make a concurrent activation or closure wait.
If any assertion fails, preserve the exact error, run `rollback;` in that SQL
Editor session if it remains open, and do not label later checks as passed.

The only successful completion marker is:

```text
PASS: schema, constraints, RLS, authorization, validation, duplicate, lifecycle, closure and cascade checks
```

Afterward, run this read-only cleanup check as the SQL Editor administrator:

```sql
select 'surveys' as source, id::text as fixture_id
  from public.surveys where id::text like '10000000-0000-4000-8000-%'
union all
select 'questions', id::text
  from public.questions where id::text like '20000000-0000-4000-8000-%'
union all
select 'choices', id::text
  from public.choices where id::text like '30000000-0000-4000-8000-%'
union all
select 'responses', id::text
  from public.responses where id::text like '40000000-0000-4000-8000-%';
```

Expected result: zero rows. Do not delete anything if rows appear; first
determine whether they predated the test.

## Requested check status

|   # | Check                                        | Local suite                         | Remote SQL role test | Real Supabase client session            |
| --: | -------------------------------------------- | ----------------------------------- | -------------------- | --------------------------------------- |
|   1 | Five required tables exist                   | Passed                              | Not run              | Not applicable                          |
|   2 | Foreign keys and delete actions              | Passed                              | Not run              | Not applicable                          |
|   3 | Survey-status check                          | Passed                              | Not run              | Not applicable                          |
|   4 | At most one active survey                    | Passed                              | Not run              | Not applicable                          |
|   5 | RLS enabled on all five tables               | Passed                              | Not run              | Not applicable                          |
|   6 | Anonymous active questions/choices           | Passed as `anon`                    | Not run              | Not run                                 |
|   7 | Anonymous draft/archived content hidden      | Passed as `anon`                    | Not run              | Not run                                 |
|   8 | Anonymous responses/answers denied           | Passed as `anon`                    | Not run              | Not run                                 |
|   9 | Anonymous survey writes denied               | Passed as `anon`                    | Not run              | Not run                                 |
|  10 | Anonymous instructor RPC execution denied    | Passed as `anon`                    | Not run              | Not run                                 |
|  11 | Authorized instructor management             | Passed with synthetic trusted claim | Not run              | Not run with the provisioned instructor |
|  12 | Invalid choices/questions rejected           | Passed                              | Not run              | Not run                                 |
|  13 | Duplicate anonymous submission rejected      | Passed                              | Not run              | Not run                                 |
|  14 | Closed survey rejects submission             | Passed                              | Not run              | Not run                                 |
|  15 | Failed submission leaves no partial response | Passed                              | Not run              | Not run                                 |

## Real-session verification still required

Role switching in SQL verifies PostgreSQL grants, RLS, and function checks, but
it does not prove that the hosted Auth configuration issues the expected JWT.
After the SQL suite passes, use the public publishable key—not a secret or
service-role key—to perform these checks:

1. Signed out, verify active public content is readable while draft/archived
   content and response/answer tables are unavailable.
2. Signed out, verify direct survey writes and instructor lifecycle RPC calls
   return authorization errors.
3. Sign in as an ordinary Auth user with no instructor claim and verify survey
   management and instructor RPCs remain denied.
4. Sign in as the provisioned instructor after a fresh logout/login and verify
   its access token contains `app_metadata.role = instructor`; create, update,
   and delete only a clearly named disposable draft.
5. Delete that disposable draft through the authorized instructor client and
   confirm it no longer exists. Do not use SQL Editor administrator success as
   evidence for this step.

Record the project reference, test time, client role/session used, operation,
and sanitized result. Never record passwords, access tokens, secret keys, or
the database password.
