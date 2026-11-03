begin;

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"90000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"instructor"}}',
    true
);

do $$
declare
    v_result jsonb;
    v_id uuid;
    v_updated_at timestamptz;
begin
    v_result := public.save_survey(
        null, null, 'Editor test', 'Atomic draft',
        '[{"id":"21000000-0000-4000-8000-000000000001","question_text":"What is required for a recursive function?","question_type":"multiple_choice","position":1,"choices":[{"id":"31000000-0000-4000-8000-000000000001","choice_text":"A base case","position":1},{"id":"31000000-0000-4000-8000-000000000002","choice_text":"A pointer","position":2},{"id":"31000000-0000-4000-8000-000000000005","choice_text":"A loop","position":3},{"id":"31000000-0000-4000-8000-000000000006","choice_text":"A compiler","position":4}]},{"id":"21000000-0000-4000-8000-000000000002","question_text":"Every recursive function needs a stopping condition.","question_type":"true_false","position":2,"choices":[{"id":"31000000-0000-4000-8000-000000000003","choice_text":"True","position":1},{"id":"31000000-0000-4000-8000-000000000004","choice_text":"False","position":2}]}]'::jsonb
    );
    v_id := (v_result ->> 'id')::uuid;
    v_updated_at := (v_result ->> 'updated_at')::timestamptz;
    if (select count(*) from public.questions where survey_id = v_id) <> 2 then
        raise exception 'Editor create did not persist questions';
    end if;
    if (select count(*) from public.choices c join public.questions q on q.id = c.question_id where q.survey_id = v_id) <> 6 then
        raise exception 'Editor create did not persist six related choices';
    end if;

    begin
        perform public.save_survey(
            v_id, v_updated_at, 'Invalid partial update', null,
            '[{"id":"21000000-0000-4000-8000-000000000001","question_text":"Valid first row","question_type":"multiple_choice","position":1,"choices":[{"id":"31000000-0000-4000-8000-000000000001","choice_text":"A","position":1}]},{"id":"not-a-uuid","question_text":"Invalid second row","question_type":"multiple_choice","position":2,"choices":[]}]'::jsonb
        );
        raise exception 'Invalid graph unexpectedly saved';
    exception when check_violation then
        if sqlerrm <> 'INVALID_QUESTION' then raise; end if;
    end;
    if (select count(*) from public.questions where survey_id = v_id) <> 2
       or (select count(*) from public.choices c join public.questions q on q.id = c.question_id where q.survey_id = v_id) <> 6
       or (select title from public.surveys where id = v_id) <> 'Editor test' then
        raise exception 'Failed graph save left partial records';
    end if;

    v_result := public.save_survey(
        v_id, v_updated_at, 'Editor test updated', null,
        '[{"id":"21000000-0000-4000-8000-000000000002","question_text":"Correct now?","question_type":"true_false","position":1,"choices":[{"id":"31000000-0000-4000-8000-000000000004","choice_text":"False","position":1},{"id":"31000000-0000-4000-8000-000000000003","choice_text":"True","position":2}]}]'::jsonb
    );
    if (select count(*) from public.questions where survey_id = v_id) <> 1
       or (select position from public.choices where id = '31000000-0000-4000-8000-000000000004') <> 1 then
        raise exception 'Editor update/delete/reorder failed';
    end if;

    begin
        perform public.save_survey(v_id, v_updated_at, 'Stale', null, '[]'::jsonb);
        raise exception 'Stale save unexpectedly succeeded';
    exception when serialization_failure then
        if sqlerrm <> 'SURVEY_EDIT_CONFLICT' then raise; end if;
    end;

    insert into public.responses (survey_id, anonymous_token) values (v_id, 'editor-history');
    update public.surveys set status = 'closed' where id = v_id;
    select updated_at into v_updated_at from public.surveys where id = v_id;
    begin
        perform public.save_survey(v_id, v_updated_at, 'History edit', null, '[]'::jsonb);
        raise exception 'Historical survey edit unexpectedly succeeded';
    exception when object_not_in_prerequisite_state then
        if sqlerrm <> 'SURVEY_HAS_RESPONSES' then raise; end if;
    end;
end;
$$;

rollback;
select 'PASS: atomic six-choice editor create, failed-write rollback, update, reorder, stale-write and history rules' as verification_result;
