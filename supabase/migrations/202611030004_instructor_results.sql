begin;

create function public.get_survey_results(p_survey_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    v_result jsonb;
begin
    if not private.is_instructor() then
        raise exception using errcode = '42501', message = 'AUTHORIZATION_REQUIRED';
    end if;

    select jsonb_build_object(
        'survey', jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'description', s.description,
            'status', s.status,
            'public_slug', s.public_slug,
            'created_at', s.created_at
        ),
        'response_count', (select count(*) from public.responses r where r.survey_id = s.id),
        'questions', coalesce((
            select jsonb_agg(
                jsonb_build_object(
                    'id', q.id,
                    'question_text', q.question_text,
                    'position', q.position,
                    'answered_count', (
                        select count(*) from public.answers a
                        join public.responses r on r.id = a.response_id
                        where r.survey_id = s.id
                          and a.question_id = q.id
                          and a.choice_id is not null
                    ),
                    'unanswered_count', (
                        (select count(*) from public.responses r where r.survey_id = s.id)
                        - (select count(*) from public.answers a
                           join public.responses r on r.id = a.response_id
                           where r.survey_id = s.id
                             and a.question_id = q.id
                             and a.choice_id is not null)
                    ),
                    'choices', coalesce((
                        select jsonb_agg(
                            jsonb_build_object(
                                'id', c.id,
                                'choice_text', c.choice_text,
                                'position', c.position,
                                'count', (
                                    select count(*) from public.answers a
                                    join public.responses r on r.id = a.response_id
                                    where r.survey_id = s.id
                                      and a.question_id = q.id
                                      and a.choice_id = c.id
                                )
                            ) order by c.position
                        ) from public.choices c where c.question_id = q.id
                    ), '[]'::jsonb)
                ) order by q.position
            ) from public.questions q where q.survey_id = s.id
        ), '[]'::jsonb)
    ) into v_result
    from public.surveys s
    where s.id = p_survey_id;

    if v_result is null then
        raise exception using errcode = 'P0002', message = 'SURVEY_NOT_FOUND';
    end if;
    return v_result;
end;
$$;

comment on function public.get_survey_results(uuid) is
    'Instructor-only aggregate snapshot with every ordered choice, zero counts and unanswered counts; returns no response identities or browser tokens.';

create function public.export_survey_responses(p_survey_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    v_result jsonb;
begin
    if not private.is_instructor() then
        raise exception using errcode = '42501', message = 'AUTHORIZATION_REQUIRED';
    end if;

    select jsonb_build_object(
        'survey', jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'description', s.description,
            'status', s.status,
            'created_at', s.created_at
        ),
        'questions', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', q.id,
                'question_text', q.question_text,
                'position', q.position
            ) order by q.position)
            from public.questions q where q.survey_id = s.id
        ), '[]'::jsonb),
        'responses', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', r.id,
                'submitted_at', r.submitted_at,
                'answers', coalesce((
                    select jsonb_agg(jsonb_build_object(
                        'question_id', a.question_id,
                        'answer', coalesce(c.choice_text, a.text_answer, '')
                    ))
                    from public.answers a
                    left join public.choices c on c.id = a.choice_id
                    where a.response_id = r.id
                ), '[]'::jsonb)
            ) order by r.submitted_at, r.id)
            from public.responses r where r.survey_id = s.id
        ), '[]'::jsonb)
    ) into v_result
    from public.surveys s
    where s.id = p_survey_id;

    if v_result is null then
        raise exception using errcode = 'P0002', message = 'SURVEY_NOT_FOUND';
    end if;
    return v_result;
end;
$$;

comment on function public.export_survey_responses(uuid) is
    'Instructor-only ordered response export snapshot. Deliberately excludes anonymous_token.';

revoke all on function public.get_survey_results(uuid),
    public.export_survey_responses(uuid) from public, anon, authenticated;
grant execute on function public.get_survey_results(uuid),
    public.export_survey_responses(uuid) to authenticated;

commit;
