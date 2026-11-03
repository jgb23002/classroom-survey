#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 64
fi

psql_base=(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -qAt)
instructor_claim='{"sub":"90000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"instructor"}}'

"${psql_base[@]}" <<'SQL'
insert into public.surveys (id, title) values
  ('10000000-0000-4000-8000-000000000021', 'Concurrent A'),
  ('10000000-0000-4000-8000-000000000022', 'Concurrent B');
insert into public.questions (id, survey_id, question_text, question_type, position) values
  ('20000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000021', 'A?', 'multiple_choice', 1),
  ('20000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000022', 'B?', 'multiple_choice', 1);
insert into public.choices (id, question_id, choice_text, position) values
  ('30000000-0000-4000-8000-000000000021', '20000000-0000-4000-8000-000000000021', 'A1', 1),
  ('30000000-0000-4000-8000-000000000023', '20000000-0000-4000-8000-000000000021', 'A2', 2),
  ('30000000-0000-4000-8000-000000000022', '20000000-0000-4000-8000-000000000022', 'B1', 1),
  ('30000000-0000-4000-8000-000000000024', '20000000-0000-4000-8000-000000000022', 'B2', 2);
SQL

cleanup_rows() {
  "${psql_base[@]}" -c "delete from public.surveys where id in ('10000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000022')" >/dev/null 2>&1 || true
}
trap cleanup_rows EXIT

activate_one() {
  local survey_id="$1"
  "${psql_base[@]}" <<SQL
begin;
set local role authenticated;
select set_config('request.jwt.claims', '$instructor_claim', true);
select public.activate_survey('$survey_id');
select pg_sleep(0.25);
commit;
SQL
}

activate_one '10000000-0000-4000-8000-000000000021' &
pid_one=$!
activate_one '10000000-0000-4000-8000-000000000022' &
pid_two=$!
wait "$pid_one"
wait "$pid_two"

active_count=$("${psql_base[@]}" -c "select count(*) from public.surveys where status = 'active'")
if [[ "$active_count" != "1" ]]; then
  echo "Expected exactly one active survey after concurrent activation, found $active_count" >&2
  exit 1
fi

active_id=$("${psql_base[@]}" -c "select id from public.surveys where status = 'active'")
if [[ "$active_id" == '10000000-0000-4000-8000-000000000021' ]]; then
  active_question='20000000-0000-4000-8000-000000000021'
  active_choice='30000000-0000-4000-8000-000000000021'
else
  active_question='20000000-0000-4000-8000-000000000022'
  active_choice='30000000-0000-4000-8000-000000000022'
fi

"${psql_base[@]}" <<SQL &
begin;
set local role anon;
select public.submit_survey_response(
  '$active_id',
  'concurrent-close-token',
  '[{"question_id":"$active_question","choice_id":"$active_choice"}]'::jsonb
);
select pg_sleep(0.75);
commit;
SQL
submit_pid=$!

sleep 0.10
close_started=$(date +%s%N)
"${psql_base[@]}" <<SQL
begin;
set local role authenticated;
select set_config('request.jwt.claims', '$instructor_claim', true);
select public.close_survey('$active_id');
commit;
SQL
close_finished=$(date +%s%N)
wait "$submit_pid"

elapsed_ms=$(( (close_finished - close_started) / 1000000 ))
if (( elapsed_ms < 500 )); then
  echo "Close did not wait for admitted submission row lock (${elapsed_ms}ms)" >&2
  exit 1
fi

response_count=$("${psql_base[@]}" -c "select count(*) from public.responses where anonymous_token = 'concurrent-close-token'")
status=$("${psql_base[@]}" -c "select status from public.surveys where id = '$active_id'")
if [[ "$response_count" != "1" || "$status" != "closed" ]]; then
  echo "Unexpected submit/close result: responses=$response_count status=$status" >&2
  exit 1
fi

set +e
post_close_output=$("${psql_base[@]}" 2>&1 <<SQL
set role anon;
select public.submit_survey_response(
  '$active_id',
  'post-close-concurrency-token',
  '[{"question_id":"$active_question","choice_id":"$active_choice"}]'::jsonb
);
SQL
)
post_close_status=$?
set -e
if [[ $post_close_status -eq 0 || "$post_close_output" != *"SURVEY_NOT_ACTIVE"* ]]; then
  echo "Post-close submission was not rejected as SURVEY_NOT_ACTIVE" >&2
  exit 1
fi

echo "PASS: concurrent activation kept one active survey; close waited ${elapsed_ms}ms for an admitted submission; later submission rejected"
