# Supabase database

Phase 2 provides a versioned PostgreSQL migration and verification suite. It has been applied successfully to disposable local PostgreSQL 16 databases. It has **not** been applied to a remote Supabase project.

## Files

- `migrations/202611020001_initial_classroom_survey.sql` — five tables, constraints, indexes, triggers, grants, RLS policies and RPC functions.
- `migrations/202611030002_atomic_survey_editor.sql` — instructor-only atomic survey graph create/update with stale-write and historical-response protection.
- `tests/000_local_supabase_bootstrap.sql` — local-only Supabase role/Auth compatibility layer. Never run this in Supabase.
- `tests/001_schema_and_security.sql` — transaction-wrapped structural, RLS, authorization, validation, lifecycle and integrity verification. It rolls back its synthetic records and can be pasted into Supabase SQL Editor after the migration.
- `tests/002_concurrency.sh` — concurrent activation and submit-versus-close checks. Use only against a disposable local/test database; it removes its two fixed survey fixtures on exit.
- `tests/003_editor.sql` — rollback-safe atomic editor create/update/reorder/conflict/history checks.
- `tests/run_local.sh` — creates a temporary PostgreSQL cluster under `/private/tmp`, applies the migration, runs both suites and removes the cluster.

## Local verification

PostgreSQL 16 client/server tools must be on `PATH`:

```sh
bash supabase/tests/run_local.sh
```

The script never connects to a remote database. It uses `mktemp`, trust authentication on a Unix socket inside the temporary directory, and a trap to stop and remove only that temporary cluster.

## Remote setup

Follow [the Supabase setup guide](../docs/SUPABASE_SETUP.md). Do not run the local bootstrap script remotely. Do not put a database password, secret key or service-role key in the frontend.
