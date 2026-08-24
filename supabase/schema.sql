create extension if not exists "uuid-ossp";

create table if not exists slots (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  start_time time not null,
  end_time time not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  slot_id uuid not null references slots(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

alter table slots enable row level security;
alter table bookings enable row level security;

create policy "Qualquer um pode ver horários"
  on slots for select
  using (true);

create policy "Só o admin autenticado gerencia horários"
  on slots for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Qualquer um pode agendar"
  on bookings for insert
  with check (true);

create policy "Só o admin autenticado vê os agendamentos"
  on bookings for select
  using (auth.role() = 'authenticated');

create index if not exists idx_slots_date on slots(date, is_booked);
