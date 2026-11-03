begin;

create function public.save_survey(
    p_survey_id uuid,
    p_expected_updated_at timestamptz,
    p_title text,
    p_description text,
    p_questions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_survey public.surveys%rowtype;
    v_question jsonb;
    v_choice jsonb;
    v_question_id uuid;
    v_choice_id uuid;
    v_question_type text;
begin
    if not private.is_instructor() then
        raise exception using errcode = '42501', message = 'AUTHORIZATION_REQUIRED';
    end if;

    if p_title is null or btrim(p_title) = '' then
        raise exception using errcode = '23514', message = 'TITLE_REQUIRED';
    end if;
    if p_questions is null or jsonb_typeof(p_questions) <> 'array' then
        raise exception using errcode = '22023', message = 'QUESTIONS_MUST_BE_ARRAY';
    end if;

    for v_question in select value from jsonb_array_elements(p_questions)
    loop
        if jsonb_typeof(v_question) <> 'object'
           or coalesce(v_question ->> 'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
           or btrim(coalesce(v_question ->> 'question_text', '')) = ''
           or coalesce(v_question ->> 'question_type', '') not in ('multiple_choice', 'true_false')
           or coalesce(v_question ->> 'position', '') !~ '^[1-9][0-9]*$'
           or jsonb_typeof(v_question -> 'choices') <> 'array' then
            raise exception using errcode = '23514', message = 'INVALID_QUESTION';
        end if;

        v_question_id := (v_question ->> 'id')::uuid;
        v_question_type := v_question ->> 'question_type';
        if exists (
            select 1 from public.questions q
             where q.id = v_question_id
               and (p_survey_id is null or q.survey_id <> p_survey_id)
        ) then
            raise exception using errcode = '23514', message = 'QUESTION_ID_CONFLICT';
        end if;
        if (select count(*) from jsonb_array_elements(p_questions) q where q ->> 'id' = v_question ->> 'id') <> 1
           or (select count(*) from jsonb_array_elements(p_questions) q where q ->> 'position' = v_question ->> 'position') <> 1 then
            raise exception using errcode = '23514', message = 'DUPLICATE_QUESTION';
        end if;

        if v_question_type = 'true_false' and (
            jsonb_array_length(v_question -> 'choices') <> 2
            or (select count(*) from jsonb_array_elements(v_question -> 'choices') c
                 where lower(btrim(c ->> 'choice_text')) = 'true') <> 1
            or (select count(*) from jsonb_array_elements(v_question -> 'choices') c
                 where lower(btrim(c ->> 'choice_text')) = 'false') <> 1
        ) then
            raise exception using errcode = '23514', message = 'INVALID_TRUE_FALSE_CHOICES';
        end if;

        for v_choice in select value from jsonb_array_elements(v_question -> 'choices')
        loop
            if jsonb_typeof(v_choice) <> 'object'
               or coalesce(v_choice ->> 'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
               or btrim(coalesce(v_choice ->> 'choice_text', '')) = ''
               or coalesce(v_choice ->> 'position', '') !~ '^[1-9][0-9]*$' then
                raise exception using errcode = '23514', message = 'INVALID_CHOICE';
            end if;
            v_choice_id := (v_choice ->> 'id')::uuid;
            if exists (
                select 1 from public.choices c
                join public.questions q on q.id = c.question_id
                 where c.id = v_choice_id
                   and (c.question_id <> v_question_id
                        or p_survey_id is null
                        or q.survey_id <> p_survey_id)
            ) then
                raise exception using errcode = '23514', message = 'CHOICE_ID_CONFLICT';
            end if;
            if (select count(*) from jsonb_array_elements(v_question -> 'choices') c where c ->> 'id' = v_choice ->> 'id') <> 1
               or (select count(*) from jsonb_array_elements(v_question -> 'choices') c where c ->> 'position' = v_choice ->> 'position') <> 1 then
                raise exception using errcode = '23514', message = 'DUPLICATE_CHOICE';
            end if;
        end loop;
    end loop;

    if p_survey_id is null then
        insert into public.surveys (title, description, status)
        values (btrim(p_title), nullif(btrim(coalesce(p_description, '')), ''), 'draft')
        returning * into v_survey;
    else
        select * into v_survey from public.surveys
         where id = p_survey_id for update;
        if not found then
            raise exception using errcode = 'P0002', message = 'SURVEY_NOT_FOUND';
        end if;
        if p_expected_updated_at is null or v_survey.updated_at <> p_expected_updated_at then
            raise exception using errcode = '40001', message = 'SURVEY_EDIT_CONFLICT';
        end if;
        if v_survey.status = 'active' then
            raise exception using errcode = '55000', message = 'SURVEY_ACTIVE';
        end if;
        if v_survey.status = 'archived' then
            raise exception using errcode = '55000', message = 'SURVEY_ARCHIVED';
        end if;
        if v_survey.status = 'closed' and exists (
            select 1 from public.responses r where r.survey_id = p_survey_id
        ) then
            raise exception using errcode = '55000', message = 'SURVEY_HAS_RESPONSES';
        end if;

        update public.surveys
           set title = btrim(p_title),
               description = nullif(btrim(coalesce(p_description, '')), ''),
               status = 'draft'
         where id = p_survey_id
         returning * into v_survey;
    end if;

    set constraints public.questions_survey_position_unique,
                    public.choices_question_position_unique deferred;

    delete from public.choices c
     using public.questions q
     where q.survey_id = v_survey.id
       and c.question_id = q.id
       and not exists (
           select 1
             from jsonb_array_elements(p_questions) question,
                  jsonb_array_elements(question -> 'choices') choice
            where (choice ->> 'id')::uuid = c.id
       );

    delete from public.questions q
     where q.survey_id = v_survey.id
       and not exists (
           select 1 from jsonb_array_elements(p_questions) question
            where (question ->> 'id')::uuid = q.id
       );

    for v_question in select value from jsonb_array_elements(p_questions)
    loop
        v_question_id := (v_question ->> 'id')::uuid;
        insert into public.questions (
            id, survey_id, question_text, question_type, position
        ) values (
            v_question_id, v_survey.id, btrim(v_question ->> 'question_text'),
            v_question ->> 'question_type', (v_question ->> 'position')::integer
        )
        on conflict (id) do update set
            question_text = excluded.question_text,
            question_type = excluded.question_type,
            position = excluded.position;

        for v_choice in select value from jsonb_array_elements(v_question -> 'choices')
        loop
            insert into public.choices (id, question_id, choice_text, position)
            values (
                (v_choice ->> 'id')::uuid, v_question_id,
                btrim(v_choice ->> 'choice_text'), (v_choice ->> 'position')::integer
            )
            on conflict (id) do update set
                choice_text = excluded.choice_text,
                position = excluded.position;
        end loop;
    end loop;

    select * into v_survey from public.surveys where id = v_survey.id;
    return jsonb_build_object(
        'id', v_survey.id,
        'status', v_survey.status,
        'updated_at', v_survey.updated_at
    );
end;
$$;

comment on function public.save_survey(uuid, timestamptz, text, text, jsonb) is
    'Instructor-only atomic create/update of an editable draft and its ordered question/choice graph.';

revoke all on function public.save_survey(uuid, timestamptz, text, text, jsonb)
    from public, anon, authenticated;
grant execute on function public.save_survey(uuid, timestamptz, text, text, jsonb)
    to authenticated;

commit;
