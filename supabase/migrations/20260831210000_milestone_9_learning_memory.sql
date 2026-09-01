-- Milestone 9: private, deterministic learning memory for explicitly saved phrases.
-- Phrase content remains in user_phrasebook; scheduling state is isolated here.

alter table public.user_phrasebook
  add constraint user_phrasebook_id_user_unique unique (id, user_id);

create table public.user_phrase_review (
  phrase_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  state text not null default 'new',
  next_review_at timestamptz not null default (timezone('utc', now()) + interval '1 day'),
  last_reviewed_at timestamptz,
  review_count integer not null default 0,
  success_count integer not null default 0,
  lapse_count integer not null default 0,
  interval_days integer not null default 1,
  difficulty numeric(3, 2) not null default 2.20,
  last_rating text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_phrase_review_phrase_owner_fkey
    foreign key (phrase_id, user_id)
    references public.user_phrasebook (id, user_id)
    on delete cascade,
  constraint user_phrase_review_state_check
    check (state in ('new', 'learning', 'review', 'stable')),
  constraint user_phrase_review_rating_check
    check (last_rating is null or last_rating in ('again', 'hard', 'good', 'easy')),
  constraint user_phrase_review_counts_check
    check (review_count >= 0 and success_count >= 0 and lapse_count >= 0
      and success_count <= review_count and lapse_count <= review_count),
  constraint user_phrase_review_interval_check
    check (interval_days between 1 and 365),
  constraint user_phrase_review_difficulty_check
    check (difficulty between 1.30 and 3.00)
);

comment on table public.user_phrase_review is
  'Private source-light spaced-review state. Contains no source text, transcript, audio, prompt or provider payload.';

create index user_phrase_review_due_idx
  on public.user_phrase_review (user_id, next_review_at, lapse_count desc);

create trigger user_phrase_review_set_updated_at
before update on public.user_phrase_review
for each row execute function public.set_updated_at();

create or replace function public.initialize_phrase_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_phrase_review (phrase_id, user_id, next_review_at)
  values (new.id, new.user_id, timezone('utc', now()) + interval '1 day')
  on conflict (phrase_id) do nothing;
  return new;
end;
$$;

comment on function public.initialize_phrase_review() is
  'Initializes one review state for a newly saved phrase without resetting existing history.';

create trigger user_phrasebook_initialize_review
after insert on public.user_phrasebook
for each row execute function public.initialize_phrase_review();

-- Existing pre-M9 phrases become reviewable immediately without changing their content.
insert into public.user_phrase_review (phrase_id, user_id, next_review_at)
select id, user_id, timezone('utc', now())
from public.user_phrasebook
on conflict (phrase_id) do nothing;

alter table public.user_phrase_review enable row level security;

create policy user_phrase_review_select_own
on public.user_phrase_review for select to authenticated
using ((select auth.uid()) = user_id);

-- Review scheduling is written only by the authenticated Cantu server after it
-- reloads the owned phrase, grades the answer and runs the deterministic scheduler.
revoke all on table public.user_phrase_review from anon, authenticated;
grant select on table public.user_phrase_review to authenticated;
grant select, insert, update, delete on table public.user_phrase_review to service_role;

revoke all on function public.initialize_phrase_review() from public, anon, authenticated;
