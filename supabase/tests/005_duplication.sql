begin;

insert into public.surveys (id, title, description, status, public_slug) values
    ('12000000-0000-4000-8000-000000000001', 'Original', 'Keep this', 'closed', 'original-slug');
insert into public.questions (id, survey_id, question_text, question_type, position) values
    ('22000000-0000-4000-8000-000000000011', '12000000-0000-4000-8000-000000000001', 'Second', 'true_false', 2),
    ('22000000-0000-4000-8000-000000000012', '12000000-0000-4000-8000-000000000001', 'First', 'multiple_choice', 1);
insert into public.choices (id, question_id, choice_text, position) values
    ('32000000-0000-4000-8000-000000000011', '22000000-0000-4000-8000-000000000011', 'False', 2),
    ('32000000-0000-4000-8000-000000000012', '22000000-0000-4000-8000-000000000011', 'True', 1),
    ('32000000-0000-4000-8000-000000000013', '22000000-0000-4000-8000-000000000012', 'B', 2),
    ('32000000-0000-4000-8000-000000000014', '22000000-0000-4000-8000-000000000012', 'A', 1);
insert into public.responses (id, survey_id, anonymous_token) values
    ('42000000-0000-4000-8000-000000000011', '12000000-0000-4000-8000-000000000001', '72000000-0000-4000-8000-000000000011');
insert into public.answers (response_id, question_id, choice_id) values
    ('42000000-0000-4000-8000-000000000011', '22000000-0000-4000-8000-000000000012', '32000000-0000-4000-8000-000000000014');

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"90000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"student"}}',
    true
);
do $$ begin
    begin
        perform public.duplicate_survey('12000000-0000-4000-8000-000000000001');
        raise exception 'Non-instructor duplication unexpectedly succeeded';
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
    v_result jsonb;
    v_copy_id uuid;
begin
    v_result := public.duplicate_survey('12000000-0000-4000-8000-000000000001');
    v_copy_id := (v_result ->> 'id')::uuid;
    if (select row(title, description, status::text, public_slug) from public.surveys where id = v_copy_id)
       is distinct from row('Copy of Original'::text, 'Keep this'::text, 'draft'::text, null::text) then
        raise exception 'Duplicate metadata/status/slug incorrect';
    end if;
    if (select array_agg(question_text order by position) from public.questions where survey_id = v_copy_id)
       <> array['First', 'Second'] then
        raise exception 'Question content/order was not copied';
    end if;
    if (select array_agg(c.choice_text order by q.position, c.position)
          from public.questions q join public.choices c on c.question_id = q.id
         where q.survey_id = v_copy_id) <> array['A', 'B', 'True', 'False'] then
        raise exception 'Choice content/order was not copied';
    end if;
    if exists (select 1 from public.responses where survey_id = v_copy_id)
       or exists (select 1 from public.answers a join public.responses r on r.id = a.response_id where r.survey_id = v_copy_id) then
        raise exception 'Duplicate copied responses or answers';
    end if;
    if (select count(*) from public.responses where survey_id = '12000000-0000-4000-8000-000000000001') <> 1
       or (select status from public.surveys where id = '12000000-0000-4000-8000-000000000001') <> 'closed' then
        raise exception 'Original changed during duplication';
    end if;

    begin
        perform public.duplicate_survey('12000000-0000-4000-8000-000000000099');
        raise exception 'Missing-source duplication unexpectedly succeeded';
    exception when no_data_found then
        if sqlerrm <> 'SURVEY_NOT_FOUND' then raise; end if;
    end;
    if (select count(*) from public.surveys where title like 'Copy of %') <> 1 then
        raise exception 'Failed duplication left a partial survey';
    end if;
end;
$$;

rollback;
select 'PASS: atomic survey duplication copied ordered content only and preserved original/failure state' as verification_result;
