begin;

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. Future
-- functions created by this migration owner must be explicitly granted.
alter default privileges revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

create table public.surveys (
    id uuid primary key default gen_random_uuid(),
    title text not null check (btrim(title) <> ''),
    description text,
    status text not null default 'draft'
        check (status in ('draft', 'active', 'closed', 'archived')),
    public_slug text unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint surveys_public_slug_format
        check (public_slug is null or public_slug ~ '^[a-z0-9_-]{12,64}$')
);

create table public.questions (
    id uuid primary key default gen_random_uuid(),
    survey_id uuid not null references public.surveys(id) on delete cascade,
    question_text text not null check (btrim(question_text) <> ''),
    question_type text not null
        check (question_type in ('multiple_choice', 'true_false')),
    position integer not null check (position > 0),
    created_at timestamptz not null default now(),
    constraint questions_survey_position_unique
        unique (survey_id, position) deferrable initially immediate
);

create table public.choices (
    id uuid primary key default gen_random_uuid(),
    question_id uuid not null references public.questions(id) on delete cascade,
    choice_text text not null check (btrim(choice_text) <> ''),
    position integer not null check (position > 0),
    created_at timestamptz not null default now(),
    constraint choices_question_position_unique
        unique (question_id, position) deferrable initially immediate
);

create table public.responses (
    id uuid primary key default gen_random_uuid(),
    survey_id uuid not null references public.surveys(id) on delete cascade,
    anonymous_token text,
    submitted_at timestamptz not null default now(),
    constraint responses_anonymous_token_valid
        check (
            anonymous_token is null
            or (btrim(anonymous_token) <> '' and length(anonymous_token) <= 256)
        )
);

create table public.answers (
    id uuid primary key default gen_random_uuid(),
    response_id uuid not null references public.responses(id) on delete cascade,
    question_id uuid not null references public.questions(id) on delete cascade,
    choice_id uuid references public.choices(id) on delete set null,
    text_answer text,
    created_at timestamptz not null default now(),
    constraint answers_response_question_unique unique (response_id, question_id)
);

create index surveys_status_idx on public.surveys(status);
create unique index only_one_active_survey
    on public.surveys ((status)) where status = 'active';
create index questions_survey_id_idx on public.questions(survey_id);
create index choices_question_id_idx on public.choices(question_id);
create index responses_survey_id_idx on public.responses(survey_id);
create index responses_submitted_at_idx on public.responses(submitted_at);
create unique index responses_unique_student_per_survey
    on public.responses(survey_id, anonymous_token)
    where anonymous_token is not null;
create index answers_response_id_idx on public.answers(response_id);
create index answers_question_id_idx on public.answers(question_id);
create index answers_choice_id_idx on public.answers(choice_id);

create function private.is_instructor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select
        auth.uid() is not null
        and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'instructor';
$$;

comment on function private.is_instructor() is
    'Authorizes a Supabase Auth user only when a trusted app_metadata.role claim equals instructor.';

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at := clock_timestamp();
    return new;
end;
$$;

create trigger surveys_updated_at
before update on public.surveys
for each row execute function private.set_updated_at();

create function private.validate_answer_relationships()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_response_survey_id uuid;
    v_question_survey_id uuid;
begin
    select r.survey_id
      into v_response_survey_id
      from public.responses as r
     where r.id = new.response_id;

    select q.survey_id
      into v_question_survey_id
      from public.questions as q
     where q.id = new.question_id;

    if v_response_survey_id is null
       or v_question_survey_id is null
       or v_response_survey_id <> v_question_survey_id then
        raise exception using errcode = '23514', message = 'ANSWER_SURVEY_MISMATCH';
    end if;

    if new.choice_id is not null and not exists (
        select 1
          from public.choices as c
         where c.id = new.choice_id
           and c.question_id = new.question_id
    ) then
        raise exception using errcode = '23514', message = 'ANSWER_CHOICE_MISMATCH';
    end if;

    return new;
end;
$$;

create trigger answers_validate_relationships
before insert or update of response_id, question_id, choice_id on public.answers
for each row execute function private.validate_answer_relationships();

alter table public.surveys enable row level security;
alter table public.questions enable row level security;
alter table public.choices enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;

create policy surveys_anon_read_active
on public.surveys for select to anon
using (status = 'active');

create policy questions_anon_read_active
on public.questions for select to anon
using (
    exists (
        select 1
          from public.surveys as s
         where s.id = questions.survey_id
           and s.status = 'active'
    )
);

create policy choices_anon_read_active
on public.choices for select to anon
using (
    exists (
        select 1
          from public.questions as q
          join public.surveys as s on s.id = q.survey_id
         where q.id = choices.question_id
           and s.status = 'active'
    )
);

create policy surveys_instructor_all
on public.surveys for all to authenticated
using ((select private.is_instructor()))
with check ((select private.is_instructor()));

create policy questions_instructor_all
on public.questions for all to authenticated
using ((select private.is_instructor()))
with check ((select private.is_instructor()));

create policy choices_instructor_all
on public.choices for all to authenticated
using ((select private.is_instructor()))
with check ((select private.is_instructor()));

create policy responses_instructor_all
on public.responses for all to authenticated
using ((select private.is_instructor()))
with check ((select private.is_instructor()));

create policy answers_instructor_all
on public.answers for all to authenticated
using ((select private.is_instructor()))
with check ((select private.is_instructor()));

revoke all on public.surveys, public.questions, public.choices,
    public.responses, public.answers from public, anon, authenticated;
grant select on public.surveys, public.questions, public.choices to anon;
grant select, insert, update, delete on public.surveys, public.questions,
    public.choices, public.responses, public.answers to authenticated;

grant usage on schema private to authenticated;
revoke all on function private.is_instructor() from public, anon, authenticated;
grant execute on function private.is_instructor() to authenticated;
revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.validate_answer_relationships() from public, anon, authenticated;

create function public.activate_survey(p_survey_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_survey public.surveys%rowtype;
    v_slug text;
begin
    if not private.is_instructor() then
        raise exception using errcode = '42501', message = 'AUTHORIZATION_REQUIRED';
    end if;

    -- Serialize all lifecycle changes before taking row locks. The constant is
    -- application-specific and must also be used by close_survey.
    perform pg_catalog.pg_advisory_xact_lock(4095, 1);

    select * into v_survey
      from public.surveys
     where id = p_survey_id
     for update;

    if not found then
        raise exception using errcode = 'P0002', message = 'SURVEY_NOT_FOUND';
    end if;

    if v_survey.status = 'archived' then
        raise exception using errcode = '22023', message = 'SURVEY_ARCHIVED';
    end if;

    if v_survey.status = 'active' then
        return jsonb_build_object(
            'id', v_survey.id,
            'status', v_survey.status,
            'public_slug', v_survey.public_slug
        );
    end if;

    if not exists (
        select 1 from public.questions as q where q.survey_id = p_survey_id
    ) then
        raise exception using errcode = '22023', message = 'SURVEY_HAS_NO_QUESTIONS';
    end if;

    if exists (
        select 1
          from public.questions as q
          left join public.choices as c on c.question_id = q.id
         where q.survey_id = p_survey_id
         group by q.id, q.question_type
        having (q.question_type = 'multiple_choice' and count(c.id) < 2)
            or (q.question_type = 'true_false' and (
                count(c.id) <> 2
                or count(*) filter (where lower(btrim(c.choice_text)) in ('true', 'false')) <> 2
            ))
    ) then
        raise exception using errcode = '22023', message = 'SURVEY_HAS_INVALID_CHOICES';
    end if;

    update public.surveys
       set status = 'closed'
     where status = 'active'
       and id <> p_survey_id;

    v_slug := v_survey.public_slug;
    if v_slug is null then
        loop
            v_slug := lower(encode(extensions.gen_random_bytes(12), 'hex'));
            exit when not exists (
                select 1 from public.surveys as s where s.public_slug = v_slug
            );
        end loop;
    end if;

    update public.surveys
       set status = 'active', public_slug = v_slug
     where id = p_survey_id
     returning * into v_survey;

    return jsonb_build_object(
        'id', v_survey.id,
        'status', v_survey.status,
        'public_slug', v_survey.public_slug
    );
end;
$$;

comment on function public.activate_survey(uuid) is
    'Instructor-only atomic lifecycle transition. Closes the previous active survey and returns id/status/public_slug.';

create function public.close_survey(p_survey_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_survey public.surveys%rowtype;
begin
    if not private.is_instructor() then
        raise exception using errcode = '42501', message = 'AUTHORIZATION_REQUIRED';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(4095, 1);

    select * into v_survey
      from public.surveys
     where id = p_survey_id
     for update;

    if not found then
        raise exception using errcode = 'P0002', message = 'SURVEY_NOT_FOUND';
    end if;

    if v_survey.status not in ('active', 'closed') then
        raise exception using errcode = '22023', message = 'SURVEY_NOT_ACTIVE';
    end if;

    if v_survey.status = 'active' then
        update public.surveys
           set status = 'closed'
         where id = p_survey_id
         returning * into v_survey;
    end if;

    return jsonb_build_object('id', v_survey.id, 'status', v_survey.status);
end;
$$;

comment on function public.close_survey(uuid) is
    'Instructor-only idempotent close for active/closed surveys. Row locking coordinates with submissions.';

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
declare
    v_status text;
    v_question_count integer;
    v_answer jsonb;
    v_question_id uuid;
    v_choice_id uuid;
    v_seen_question_ids uuid[] := array[]::uuid[];
    v_response_id uuid;
begin
    if p_anonymous_token is null
       or btrim(p_anonymous_token) = ''
       or length(p_anonymous_token) > 256 then
        raise exception using errcode = '22023', message = 'INVALID_ANONYMOUS_TOKEN';
    end if;

    if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
        raise exception using errcode = '22023', message = 'INVALID_ANSWER_PAYLOAD';
    end if;

    -- FOR SHARE permits concurrent student submissions, but conflicts with the
    -- FOR UPDATE lock used by close_survey and lifecycle changes.
    select s.status into v_status
      from public.surveys as s
     where s.id = p_survey_id
     for share;

    if not found or v_status <> 'active' then
        raise exception using errcode = 'P0001', message = 'SURVEY_NOT_ACTIVE';
    end if;

    if exists (
        select 1
          from public.responses as r
         where r.survey_id = p_survey_id
           and r.anonymous_token = p_anonymous_token
    ) then
        raise exception using errcode = '23505', message = 'DUPLICATE_RESPONSE';
    end if;

    select count(*) into v_question_count
      from public.questions as q
     where q.survey_id = p_survey_id;

    if v_question_count = 0 then
        raise exception using errcode = '23514', message = 'MISSING_REQUIRED_ANSWER';
    end if;

    for v_answer in select value from jsonb_array_elements(p_answers)
    loop
        if jsonb_typeof(v_answer) <> 'object'
           or not (v_answer ? 'question_id')
           or not (v_answer ? 'choice_id')
           or jsonb_typeof(v_answer -> 'question_id') <> 'string'
           or jsonb_typeof(v_answer -> 'choice_id') <> 'string'
           or (v_answer ->> 'question_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
           or (v_answer ->> 'choice_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
            raise exception using errcode = '22023', message = 'INVALID_ANSWER_PAYLOAD';
        end if;

        v_question_id := (v_answer ->> 'question_id')::uuid;
        v_choice_id := (v_answer ->> 'choice_id')::uuid;

        if not exists (
            select 1
              from public.questions as q
             where q.id = v_question_id
               and q.survey_id = p_survey_id
        ) then
            raise exception using errcode = '23514', message = 'INVALID_QUESTION';
        end if;

        if v_question_id = any(v_seen_question_ids) then
            raise exception using errcode = '23514', message = 'INVALID_QUESTION';
        end if;

        if not exists (
            select 1
              from public.choices as c
             where c.id = v_choice_id
               and c.question_id = v_question_id
        ) then
            raise exception using errcode = '23514', message = 'INVALID_CHOICE';
        end if;

        v_seen_question_ids := array_append(v_seen_question_ids, v_question_id);
    end loop;

    if cardinality(v_seen_question_ids) <> v_question_count then
        raise exception using errcode = '23514', message = 'MISSING_REQUIRED_ANSWER';
    end if;

    begin
        insert into public.responses (survey_id, anonymous_token)
        values (p_survey_id, p_anonymous_token)
        returning id into v_response_id;
    exception
        when unique_violation then
            raise exception using errcode = '23505', message = 'DUPLICATE_RESPONSE';
    end;

    for v_answer in select value from jsonb_array_elements(p_answers)
    loop
        insert into public.answers (response_id, question_id, choice_id)
        values (
            v_response_id,
            (v_answer ->> 'question_id')::uuid,
            (v_answer ->> 'choice_id')::uuid
        );
    end loop;

    return jsonb_build_object('success', true, 'response_id', v_response_id);
end;
$$;

comment on function public.submit_survey_response(uuid, text, jsonb) is
    'Anonymous atomic submission. Validates exact required answers and returns only success plus the new response id.';

-- This narrow helper supports distinct closed/not-found public states without
-- returning closed survey content. Direct active-table reads remain available.
create function public.get_public_survey(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    v_survey public.surveys%rowtype;
begin
    select * into v_survey
      from public.surveys as s
     where s.public_slug = p_slug;

    if not found or v_survey.status = 'draft' then
        return jsonb_build_object('state', 'not_found');
    end if;

    if v_survey.status <> 'active' then
        return jsonb_build_object('state', 'closed');
    end if;

    return jsonb_build_object(
        'state', 'active',
        'survey', jsonb_build_object(
            'id', v_survey.id,
            'title', v_survey.title,
            'description', v_survey.description
        ),
        'questions', coalesce((
            select jsonb_agg(
                jsonb_build_object(
                    'id', q.id,
                    'question_text', q.question_text,
                    'question_type', q.question_type,
                    'position', q.position,
                    'choices', coalesce((
                        select jsonb_agg(
                            jsonb_build_object(
                                'id', c.id,
                                'choice_text', c.choice_text,
                                'position', c.position
                            ) order by c.position
                        )
                          from public.choices as c
                         where c.question_id = q.id
                    ), '[]'::jsonb)
                ) order by q.position
            )
              from public.questions as q
             where q.survey_id = v_survey.id
        ), '[]'::jsonb)
    );
end;
$$;

revoke all on function public.activate_survey(uuid) from public, anon, authenticated;
revoke all on function public.close_survey(uuid) from public, anon, authenticated;
revoke all on function public.submit_survey_response(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.get_public_survey(text) from public, anon, authenticated;

grant execute on function public.activate_survey(uuid) to authenticated;
grant execute on function public.close_survey(uuid) to authenticated;
grant execute on function public.submit_survey_response(uuid, text, jsonb) to anon;
grant execute on function public.get_public_survey(text) to anon;

commit;
