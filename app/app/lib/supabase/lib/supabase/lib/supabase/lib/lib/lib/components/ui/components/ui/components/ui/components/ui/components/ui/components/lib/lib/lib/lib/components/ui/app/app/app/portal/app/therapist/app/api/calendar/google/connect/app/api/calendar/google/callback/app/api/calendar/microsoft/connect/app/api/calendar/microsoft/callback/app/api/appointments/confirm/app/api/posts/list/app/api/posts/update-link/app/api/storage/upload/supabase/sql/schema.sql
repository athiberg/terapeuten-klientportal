-- Nødvendig udvidelse til UUID
create extension if not exists "uuid-ossp";

-- Brugere/profiler
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text check (role in ('client','therapist','admin')) default 'client',
  created_at timestamptz default now()
);

-- Bookinger
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references auth.users(id) on delete cascade,
  therapist_id uuid references auth.users(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text check (status in ('proposed','confirmed','cancelled')) default 'proposed',
  created_at timestamptz default now()
);

-- Noter
create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references auth.users(id) on delete cascade,
  therapist_id uuid references auth.users(id) on delete set null,
  title text not null,
  body text not null,
  visibility text check (visibility in ('shared','internal')) default 'shared',
  created_at timestamptz default now()
);

-- Opslag
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  therapist_id uuid references auth.users(id) on delete set null,
  title text not null,
  teaser text,
  link text,
  created_at timestamptz default now()
);

-- Opgaver
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references auth.users(id) on delete cascade,
  therapist_id uuid references auth.users(id) on delete set null,
  title text not null,
  due_date date,
  is_done boolean default false,
  created_at timestamptz default now()
);

-- GDPR-relateret
create table if not exists public.consents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  version text not null,
  text text not null,
  accepted_at timestamptz default now()
);

create table if not exists public.audit_events (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz default now()
);

-- Kalender tokens (Google/Outlook)
create table if not exists public.calendar_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text check (provider in ('google','microsoft')) not null,
  access_token text not null,
  refresh_token text,
  scope text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, provider)
);

-- Audit-trigger når en tid bekræftes
create or replace function public.audit_appointment_confirm() returns trigger as $$
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    insert into public.audit_events(actor_id, action, entity, entity_id, meta)
    values (new.therapist_id, 'appointment_confirmed', 'appointments', new.id,
      jsonb_build_object('client_id', new.client_id, 'start', new.start_time));
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_audit_appointment_confirm on public.appointments;
create trigger trg_audit_appointment_confirm
  after update on public.appointments
  for each row execute procedure public.audit_appointment_confirm();
