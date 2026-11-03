#!/usr/bin/env bash
set -euo pipefail

project_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
migration="$project_root/supabase/migrations/202611020001_initial_classroom_survey.sql"
bootstrap="$project_root/supabase/tests/000_local_supabase_bootstrap.sql"
verification="$project_root/supabase/tests/001_schema_and_security.sql"
concurrency="$project_root/supabase/tests/002_concurrency.sh"

test_root=$(mktemp -d /private/tmp/classroom-survey-postgres.XXXXXX)
data_dir="$test_root/data"
socket_dir="$test_root/socket"
log_file="$test_root/postgres.log"
mkdir -p "$socket_dir"

cleanup() {
  if [[ -f "$data_dir/postmaster.pid" ]]; then
    pg_ctl -D "$data_dir" -m fast stop >/dev/null 2>&1 || true
  fi
  rm -rf "$test_root"
}
trap cleanup EXIT

initdb -D "$data_dir" --auth=trust --username=postgres >/dev/null
pg_ctl -D "$data_dir" -l "$log_file" -o "-F -k $socket_dir -c listen_addresses=''" start >/dev/null

database_url="postgresql://postgres@/postgres?host=$socket_dir"
psql "$database_url" -X -v ON_ERROR_STOP=1 -f "$bootstrap" >/dev/null
psql "$database_url" -X -v ON_ERROR_STOP=1 -f "$migration" >/dev/null
psql "$database_url" -X -v ON_ERROR_STOP=1 -f "$verification"
DATABASE_URL="$database_url" bash "$concurrency"

echo "PASS: disposable PostgreSQL migration verification completed; remote Supabase remains unconfigured"
