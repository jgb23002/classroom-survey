begin;

-- Preserve the already-reviewed atomic implementation behind a private entry
-- point, then expose a strict UUIDv4-validating public wrapper. Existing
-- response rows are not rewritten or deleted.
alter function public.submit_survey_response(uuid, text, jsonb) set schema private;
alter function private.submit_survey_response(uuid, text, jsonb)
    rename to insert_survey_response;

revoke all on function private.insert_survey_response(uuid, text, jsonb)
    from public, anon, authenticated;

create function public.submit_survey_response(
    p_survey_id uuid,
    p_anonymous_token text,
    p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
    if p_anonymous_token is null
       or p_anonymous_token !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
        raise exception using errcode = '22023', message = 'INVALID_ANONYMOUS_TOKEN';
    end if;

    return private.insert_survey_response(
        p_survey_id,
        lower(p_anonymous_token),
        p_answers
    );
end;
$$;

comment on function public.submit_survey_response(uuid, text, jsonb) is
    'Anonymous atomic submission wrapper. Requires a canonical-shape UUIDv4 browser token, then delegates to the private validated transactional insert.';

revoke all on function public.submit_survey_response(uuid, text, jsonb)
    from public, anon, authenticated;
grant execute on function public.submit_survey_response(uuid, text, jsonb) to anon;

commit;
