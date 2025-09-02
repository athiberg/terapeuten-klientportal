-- Slå Row Level Security til
alter table public.profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.notes enable row level security;
alter table public.posts enable row level security;
alter table public.tasks enable row level security;
alter table public.consents enable row level security;
alter table public.audit_events enable row level security;
alter table public.calendar_tokens enable row level security;

-- Profiler
create policy profiles_read_own on public.profiles
for select using ( auth.uid() = id );

create policy profiles_update_own on public.profiles
for update using ( auth.uid() = id );

create policy profiles_read_all_for_therapist on public.profiles
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('therapist','admin'))
);

-- Bookinger
create policy appt_select on public.appointments
for select using ( client_id = auth.uid() or therapist_id = auth.uid() );

create policy appt_insert_client on public.appointments
for insert with check ( client_id = auth.uid() );

create policy appt_update_therapist on public.appointments
for update using (
  therapist_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('therapist','admin'))
);

-- Noter
create policy notes_select_client_shared on public.notes
for select using ( client_id = auth.uid() and visibility = 'shared' );

create policy notes_select_therapist on public.notes
for select using (
  therapist_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('therapist','admin'))
);

create policy notes_insert_therapist on public.notes
for insert with check ( therapist_id = auth.uid() );

create policy notes_update_therapist on public.notes
for update using ( therapist_id = auth.uid() );

-- Opslag
create policy posts_select_all on public.posts
for select using ( true );

create policy posts_write_therapist on public.posts
for all
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('therapist','admin'))
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('therapist','admin'))
);

-- Opgaver
create policy tasks_select_client on public.tasks
for select using ( client_id = auth.uid() );

create policy tasks_select_therapist on public.tasks
for select using (
  therapist_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('therapist','admin'))
);

create policy tasks_insert_therapist on public.tasks
for insert with check ( therapist_id = auth.uid() );

create policy tasks_update_client_done on public.tasks
for update using ( client_id = auth.uid() ) with check ( client_id = auth.uid() );

create policy tasks_update_therapist on public.tasks
for update using ( therapist_id = auth.uid() );

-- Samtykker
create policy consents_owner on public.consents
for all using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );

-- Audit logs
create policy audit_read_self on public.audit_events
for select using ( actor_id = auth.uid() );

-- Kalender tokens
create policy caltok_owner on public.calendar_tokens
for all using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );
