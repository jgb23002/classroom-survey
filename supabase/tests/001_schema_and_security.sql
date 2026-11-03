begin;

-- Structural checks: exactly the five expected domain tables, RLS enabled,
-- required indexes/triggers/functions present, and definer search paths pinned.
do $$
declare
    v_tables text[];
begin
    select array_agg(tablename order by tablename)
      into v_tables
      from pg_catalog.pg_tables
     where schemaname = 'public';

    if v_tables <> array['answers', 'choices', 'questions', 'responses', 'surveys'] then
        raise exception 'Unexpected public tables: %', v_tables;
    end if;

    if exists (
        select 1
          from pg_catalog.pg_class as c
          join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
         where n.nspname = 'public'
           and c.relname = any(array['surveys', 'questions', 'choices', 'responses', 'answers'])
           and not c.relrowsecurity
    ) then
        raise exception 'RLS is not enabled on every domain table';
    end if;

    if (select count(*) from pg_catalog.pg_policies where schemaname = 'public') <> 8 then
        raise exception 'Expected eight RLS policies';
    end if;

    if not exists (
        select 1 from pg_catalog.pg_indexes
         where schemaname = 'public' and indexname = 'only_one_active_survey'
           and indexdef like '%WHERE (status = ''active''::text)%'
    ) then
        raise exception 'Missing one-active-survey partial unique index';
    end if;

    if not exists (
        select 1 from pg_catalog.pg_trigger
         where tgname = 'surveys_updated_at' and not tgisinternal
    ) then
        raise exception 'Missing surveys updated_at trigger';
    end if;

    if exists (
        select 1
          from pg_catalog.pg_proc as p
          join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
         where n.nspname in ('public', 'private')
           and p.proname in (
               'activate_survey', 'close_survey', 'submit_survey_response',
               'get_public_survey', 'is_instructor', 'validate_answer_relationships'
           )
           and p.prosecdef
           and not ('search_path=""' = any(p.proconfig))
    ) then
        raise exception 'A SECURITY DEFINER function lacks search_path=''''';
    end if;

    if not has_function_privilege('anon', 'public.submit_survey_response(uuid,text,jsonb)', 'EXECUTE')
       or not has_function_privilege('anon', 'public.get_public_survey(text)', 'EXECUTE')
       or has_function_privilege('anon', 'public.activate_survey(uuid)', 'EXECUTE')
       or has_function_privilege('anon', 'public.close_survey(uuid)', 'EXECUTE')
       or not has_function_privilege('authenticated', 'public.activate_survey(uuid)', 'EXECUTE')
       or not has_function_privilege('authenticated', 'public.close_survey(uuid)', 'EXECUTE')
       or has_function_privilege('authenticated', 'public.submit_survey_response(uuid,text,jsonb)', 'EXECUTE')
       or exists (
           select 1
             from pg_catalog.pg_proc as p,
                  aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as acl
            where p.oid in (
                'public.activate_survey(uuid)'::regprocedure,
                'public.close_survey(uuid)'::regprocedure,
                'public.submit_survey_response(uuid,text,jsonb)'::regprocedure,
                'public.get_public_survey(text)'::regprocedure
            )
              and acl.grantee = 0
              and acl.privilege_type = 'EXECUTE'
       ) then
        raise exception 'RPC execute grants do not match the intended roles';
    end if;
end;
$$;

-- Fixed synthetic UUIDs keep failures readable.
insert into public.surveys (id, title, status, public_slug) values
    ('10000000-0000-4000-8000-000000000001', 'Draft Survey', 'draft', null),
    ('10000000-0000-4000-8000-000000000002', 'Active Survey', 'active', 'active-survey-0002'),
    ('10000000-0000-4000-8000-000000000003', 'Closed Survey', 'closed', 'closed-survey-0003');

insert into public.questions (id, survey_id, question_text, question_type, position) values
    ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Draft question?', 'multiple_choice', 1),
    ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Pick one', 'multiple_choice', 1),
    ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'True or false?', 'true_false', 2),
    ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', 'Closed question?', 'multiple_choice', 1);

insert into public.choices (id, question_id, choice_text, position) values
    ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Draft A', 1),
    ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Draft B', 2),
    ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'Active A', 1),
    ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', 'Active B', 2),
    ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', 'True', 1),
    ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000003', 'False', 2),
    ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000004', 'Closed A', 1),
    ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000004', 'Closed B', 2);

-- Anonymous users see only active content and cannot read response data.
set local role anon;
do $$
begin
    if (select count(*) from public.surveys) <> 1
       or (select count(*) from public.questions) <> 2
       or (select count(*) from public.choices) <> 4 then
        raise exception 'Anonymous active-content RLS failed';
    end if;

    begin
        perform count(*) from public.responses;
        raise exception 'Anonymous response read unexpectedly succeeded';
    exception when insufficient_privilege then
        null;
    end;

    begin
        insert into public.responses (survey_id, anonymous_token)
        values ('10000000-0000-4000-8000-000000000002', 'forbidden-direct-insert');
        raise exception 'Anonymous direct insert unexpectedly succeeded';
    exception when insufficient_privilege then
        null;
    end;
end;
$$;

-- Public lookup returns active content, minimal closed state, and no draft state.
do $$
declare
    v_result jsonb;
begin
    v_result := public.get_public_survey('active-survey-0002');
    if v_result ->> 'state' <> 'active'
       or jsonb_array_length(v_result -> 'questions') <> 2
       or v_result ? 'responses' then
        raise exception 'Active public lookup returned unexpected data: %', v_result;
    end if;

    if public.get_public_survey('closed-survey-0003') <> '{"state":"closed"}'::jsonb then
        raise exception 'Closed lookup leaked or returned wrong state';
    end if;

    if public.get_public_survey('missing-slug') <> '{"state":"not_found"}'::jsonb then
        raise exception 'Missing lookup returned wrong state';
    end if;
end;
$$;
reset role;

-- Ordinary authenticated accounts have table grants but RLS exposes no rows and
-- blocks writes; privileged RPCs also verify the trusted instructor claim.
set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"90000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student"}}',
    true
);
do $$
begin
    if (select count(*) from public.surveys) <> 0 then
        raise exception 'Non-instructor authenticated user read survey rows';
    end if;

    begin
        insert into public.surveys (title) values ('Unauthorized');
        raise exception 'Non-instructor authenticated insert unexpectedly succeeded';
    exception when insufficient_privilege then
        null;
    end;

    begin
        perform public.activate_survey('10000000-0000-4000-8000-000000000001');
        raise exception 'Unauthorized activation unexpectedly succeeded';
    exception when insufficient_privilege then
        if sqlerrm <> 'AUTHORIZATION_REQUIRED' then raise; end if;
    end;
end;
$$;
reset role;

-- Instructor policy access and updated_at trigger.
set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"90000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"instructor"}}',
    true
);
do $$
declare
    v_before timestamptz;
    v_after timestamptz;
begin
    if (select count(*) from public.surveys) <> 3 then
        raise exception 'Instructor cannot read every survey';
    end if;

    select updated_at into v_before from public.surveys
     where id = '10000000-0000-4000-8000-000000000001';
    perform pg_sleep(0.01);
    update public.surveys set description = 'Updated by instructor'
     where id = '10000000-0000-4000-8000-000000000001';
    select updated_at into v_after from public.surveys
     where id = '10000000-0000-4000-8000-000000000001';
    if v_after <= v_before then raise exception 'updated_at trigger failed'; end if;
end;
$$;
reset role;

-- Student validation and atomicity.
set local role anon;
do $$
declare
    v_result jsonb;
begin
    begin
        perform public.submit_survey_response(
            '10000000-0000-4000-8000-000000000002', 'missing-answer-token',
            '[{"question_id":"20000000-0000-4000-8000-000000000002","choice_id":"30000000-0000-4000-8000-000000000003"}]'::jsonb
        );
        raise exception 'Missing required answer unexpectedly succeeded';
    exception when check_violation then
        if sqlerrm <> 'MISSING_REQUIRED_ANSWER' then raise; end if;
    end;

    begin
        perform public.submit_survey_response(
            '10000000-0000-4000-8000-000000000002', 'wrong-choice-token',
            '[{"question_id":"20000000-0000-4000-8000-000000000002","choice_id":"30000000-0000-4000-8000-000000000007"},{"question_id":"20000000-0000-4000-8000-000000000003","choice_id":"30000000-0000-4000-8000-000000000005"}]'::jsonb
        );
        raise exception 'Foreign choice unexpectedly succeeded';
    exception when check_violation then
        if sqlerrm <> 'INVALID_CHOICE' then raise; end if;
    end;

    v_result := public.submit_survey_response(
        '10000000-0000-4000-8000-000000000002', 'valid-browser-token',
        '[{"question_id":"20000000-0000-4000-8000-000000000002","choice_id":"30000000-0000-4000-8000-000000000003"},{"question_id":"20000000-0000-4000-8000-000000000003","choice_id":"30000000-0000-4000-8000-000000000005"}]'::jsonb
    );
    if v_result ->> 'success' <> 'true' or not (v_result ? 'response_id') then
        raise exception 'Unexpected submission result: %', v_result;
    end if;

    begin
        perform public.submit_survey_response(
            '10000000-0000-4000-8000-000000000002', 'valid-browser-token',
            '[{"question_id":"20000000-0000-4000-8000-000000000002","choice_id":"30000000-0000-4000-8000-000000000004"},{"question_id":"20000000-0000-4000-8000-000000000003","choice_id":"30000000-0000-4000-8000-000000000006"}]'::jsonb
        );
        raise exception 'Duplicate submission unexpectedly succeeded';
    exception when unique_violation then
        if sqlerrm <> 'DUPLICATE_RESPONSE' then raise; end if;
    end;
end;
$$;
reset role;

do $$
begin
    if exists (
        select 1 from public.responses
         where anonymous_token in ('missing-answer-token', 'wrong-choice-token')
    ) or (select count(*) from public.responses where anonymous_token = 'valid-browser-token') <> 1
       or (select count(*) from public.answers) <> 2 then
        raise exception 'Submission atomicity or answer insert count failed';
    end if;
end;
$$;

-- Cross-table answer integrity and the one-active invariant also protect direct
-- instructor writes. Test as migration owner to isolate database constraints.
do $$
declare
    v_response_id uuid;
    v_history_response_id uuid;
    v_choice_to_delete uuid;
begin
    select id into v_response_id from public.responses
     where anonymous_token = 'valid-browser-token';

    begin
        insert into public.answers (response_id, question_id, choice_id)
        values (
            v_response_id,
            '20000000-0000-4000-8000-000000000002',
            '30000000-0000-4000-8000-000000000005'
        );
        raise exception 'Mismatched choice unexpectedly succeeded';
    exception when check_violation then
        if sqlerrm <> 'ANSWER_CHOICE_MISMATCH' then raise; end if;
    end;

    insert into public.choices (question_id, choice_text, position)
    values ('20000000-0000-4000-8000-000000000002', 'Temporary historical choice', 3)
    returning id into v_choice_to_delete;

    insert into public.responses (survey_id, anonymous_token)
    values ('10000000-0000-4000-8000-000000000002', 'historical-set-null-token')
    returning id into v_history_response_id;
    insert into public.answers (response_id, question_id, choice_id)
    values (
        v_history_response_id,
        '20000000-0000-4000-8000-000000000002',
        v_choice_to_delete
    );
    delete from public.choices where id = v_choice_to_delete;
    if (select choice_id from public.answers where response_id = v_history_response_id) is not null then
        raise exception 'Choice ON DELETE SET NULL failed';
    end if;

    begin
        update public.surveys set status = 'active'
         where id = '10000000-0000-4000-8000-000000000001';
        raise exception 'Second active survey unexpectedly succeeded';
    exception when unique_violation then
        null;
    end;
end;
$$;

-- Activation closes the former survey and closure makes the public submission
-- RPC reject immediately. These calls also verify instructor-only RPC success.
set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"90000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"instructor"}}',
    true
);
do $$
declare
    v_result jsonb;
begin
    v_result := public.activate_survey('10000000-0000-4000-8000-000000000001');
    if v_result ->> 'status' <> 'active' or length(v_result ->> 'public_slug') < 12 then
        raise exception 'Activation result invalid: %', v_result;
    end if;
    if (select count(*) from public.surveys where status = 'active') <> 1
       or (select status from public.surveys where id = '10000000-0000-4000-8000-000000000002') <> 'closed' then
        raise exception 'Activation did not close previous survey';
    end if;

    v_result := public.close_survey('10000000-0000-4000-8000-000000000001');
    if v_result ->> 'status' <> 'closed' then
        raise exception 'Close result invalid: %', v_result;
    end if;
end;
$$;
reset role;

set local role anon;
do $$
begin
    begin
        perform public.submit_survey_response(
            '10000000-0000-4000-8000-000000000001', 'after-close-token',
            '[{"question_id":"20000000-0000-4000-8000-000000000001","choice_id":"30000000-0000-4000-8000-000000000001"}]'::jsonb
        );
        raise exception 'Post-close submission unexpectedly succeeded';
    exception when raise_exception then
        if sqlerrm <> 'SURVEY_NOT_ACTIVE' then raise; end if;
    end;
end;
$$;
reset role;

-- Cascading retention behavior is verified in a savepoint and rolled back.
savepoint cascade_test;
insert into public.surveys (id, title) values
    ('10000000-0000-4000-8000-000000000010', 'Cascade test');
insert into public.questions (id, survey_id, question_text, question_type, position) values
    ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000010', 'Cascade?', 'multiple_choice', 1);
insert into public.choices (id, question_id, choice_text, position) values
    ('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000010', 'Yes', 1);
insert into public.responses (id, survey_id, anonymous_token) values
    ('40000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000010', 'cascade-token');
insert into public.answers (response_id, question_id, choice_id) values
    ('40000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000010');
delete from public.surveys where id = '10000000-0000-4000-8000-000000000010';
do $$
begin
    if exists (select 1 from public.questions where id = '20000000-0000-4000-8000-000000000010')
       or exists (select 1 from public.choices where id = '30000000-0000-4000-8000-000000000010')
       or exists (select 1 from public.responses where id = '40000000-0000-4000-8000-000000000010')
       or exists (select 1 from public.answers where response_id = '40000000-0000-4000-8000-000000000010') then
        raise exception 'Cascade delete failed';
    end if;
end;
$$;
rollback to cascade_test;

rollback;

select 'PASS: schema, constraints, RLS, authorization, validation, duplicate, lifecycle, closure and cascade checks' as verification_result;
