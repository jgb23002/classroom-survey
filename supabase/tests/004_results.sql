begin;

insert into public.surveys (id, title, description, status) values
    ('11000000-0000-4000-8000-000000000001', 'Results fixture', 'Three responses', 'closed');
insert into public.questions (id, survey_id, question_text, question_type, position) values
    ('21000000-0000-4000-8000-000000000011', '11000000-0000-4000-8000-000000000001', 'Pick one', 'multiple_choice', 1),
    ('21000000-0000-4000-8000-000000000012', '11000000-0000-4000-8000-000000000001', 'True?', 'true_false', 2);
insert into public.choices (id, question_id, choice_text, position) values
    ('31000000-0000-4000-8000-000000000011', '21000000-0000-4000-8000-000000000011', 'A', 1),
    ('31000000-0000-4000-8000-000000000012', '21000000-0000-4000-8000-000000000011', 'Zero', 2),
    ('31000000-0000-4000-8000-000000000013', '21000000-0000-4000-8000-000000000012', 'True', 1),
    ('31000000-0000-4000-8000-000000000014', '21000000-0000-4000-8000-000000000012', 'False', 2);
insert into public.responses (id, survey_id, anonymous_token) values
    ('41000000-0000-4000-8000-000000000011', '11000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000011'),
    ('41000000-0000-4000-8000-000000000012', '11000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000012'),
    ('41000000-0000-4000-8000-000000000013', '11000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000013');
insert into public.answers (response_id, question_id, choice_id) values
    ('41000000-0000-4000-8000-000000000011', '21000000-0000-4000-8000-000000000011', '31000000-0000-4000-8000-000000000011'),
    ('41000000-0000-4000-8000-000000000012', '21000000-0000-4000-8000-000000000011', '31000000-0000-4000-8000-000000000011'),
    ('41000000-0000-4000-8000-000000000011', '21000000-0000-4000-8000-000000000012', '31000000-0000-4000-8000-000000000013'),
    ('41000000-0000-4000-8000-000000000012', '21000000-0000-4000-8000-000000000012', '31000000-0000-4000-8000-000000000014'),
    ('41000000-0000-4000-8000-000000000013', '21000000-0000-4000-8000-000000000012', '31000000-0000-4000-8000-000000000014');

set local role anon;
do $$ begin
    begin
        perform public.get_survey_results('11000000-0000-4000-8000-000000000001');
        raise exception 'Anonymous results call unexpectedly succeeded';
    exception when insufficient_privilege then null;
    end;
end $$;
reset role;

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"90000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student"}}',
    true
);
do $$ begin
    begin
        perform public.get_survey_results('11000000-0000-4000-8000-000000000001');
        raise exception 'Non-instructor results call unexpectedly succeeded';
    exception when insufficient_privilege then
        if sqlerrm <> 'AUTHORIZATION_REQUIRED' then raise; end if;
    end;
    begin
        perform public.export_survey_responses('11000000-0000-4000-8000-000000000001');
        raise exception 'Non-instructor export call unexpectedly succeeded';
    exception when insufficient_privilege then
        if sqlerrm <> 'AUTHORIZATION_REQUIRED' then raise; end if;
    end;
end $$;

select set_config(
    'request.jwt.claims',
    '{"sub":"90000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"instructor"}}',
    true
);
do $$
declare
    v_results jsonb;
    v_export jsonb;
begin
    v_results := public.get_survey_results('11000000-0000-4000-8000-000000000001');
    if (v_results ->> 'response_count')::integer <> 3
       or (v_results #>> '{questions,0,answered_count}')::integer <> 2
       or (v_results #>> '{questions,0,unanswered_count}')::integer <> 1
       or (v_results #>> '{questions,0,choices,0,count}')::integer <> 2
       or (v_results #>> '{questions,0,choices,1,count}')::integer <> 0 then
        raise exception 'Aggregate counts, unanswered or zero choice incorrect: %', v_results;
    end if;

    update public.surveys set status = 'active'
     where id = '11000000-0000-4000-8000-000000000001';
    if (public.get_survey_results('11000000-0000-4000-8000-000000000001') #>> '{survey,status}') <> 'active' then
        raise exception 'Active historical results unavailable';
    end if;
    perform public.close_survey('11000000-0000-4000-8000-000000000001');
    if (public.get_survey_results('11000000-0000-4000-8000-000000000001') #>> '{survey,status}') <> 'closed' then
        raise exception 'Closed historical results unavailable';
    end if;
    update public.surveys set status = 'archived'
     where id = '11000000-0000-4000-8000-000000000001';
    v_results := public.get_survey_results('11000000-0000-4000-8000-000000000001');
    if (v_results #>> '{survey,status}') <> 'archived'
       or (v_results ->> 'response_count')::integer <> 3
       or (select count(*) from public.answers a join public.responses r on r.id = a.response_id where r.survey_id = '11000000-0000-4000-8000-000000000001') <> 5 then
        raise exception 'Archive changed or hid historical responses';
    end if;

    v_export := public.export_survey_responses('11000000-0000-4000-8000-000000000001');
    if jsonb_array_length(v_export -> 'responses') <> 3
       or v_export::text like '%anonymous_token%'
       or v_export::text like '%71000000-0000-4000-8000-000000000011%' then
        raise exception 'Export count or token privacy incorrect: %', v_export;
    end if;
end;
$$;

rollback;
select 'PASS: instructor-only active/closed/archived results, preserved counts, zero choice, unanswered and token-free export' as verification_result;
