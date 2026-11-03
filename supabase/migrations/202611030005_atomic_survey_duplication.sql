begin;

create function public.duplicate_survey(p_survey_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_source public.surveys%rowtype;
    v_copy_id uuid;
    v_question record;
    v_new_question_id uuid;
    v_choice record;
begin
    if not private.is_instructor() then
        raise exception using errcode = '42501', message = 'AUTHORIZATION_REQUIRED';
    end if;

    select * into v_source
      from public.surveys
     where id = p_survey_id
     for share;
    if not found then
        raise exception using errcode = 'P0002', message = 'SURVEY_NOT_FOUND';
    end if;

    insert into public.surveys (title, description, status, public_slug)
    values ('Copy of ' || v_source.title, v_source.description, 'draft', null)
    returning id into v_copy_id;

    for v_question in
        select q.id, q.question_text, q.question_type, q.position
          from public.questions q
         where q.survey_id = p_survey_id
         order by q.position
    loop
        insert into public.questions (survey_id, question_text, question_type, position)
        values (v_copy_id, v_question.question_text, v_question.question_type, v_question.position)
        returning id into v_new_question_id;

        for v_choice in
            select c.choice_text, c.position
              from public.choices c
             where c.question_id = v_question.id
             order by c.position
        loop
            insert into public.choices (question_id, choice_text, position)
            values (v_new_question_id, v_choice.choice_text, v_choice.position);
        end loop;
    end loop;

    return jsonb_build_object('id', v_copy_id, 'status', 'draft');
end;
$$;

comment on function public.duplicate_survey(uuid) is
    'Instructor-only atomic survey graph duplication. Copies ordered content into a slugless draft and never copies responses or answers.';

revoke all on function public.duplicate_survey(uuid) from public, anon, authenticated;
grant execute on function public.duplicate_survey(uuid) to authenticated;

commit;
