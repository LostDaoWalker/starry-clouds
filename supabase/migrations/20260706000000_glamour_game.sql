-- GLAMOUR: one-screen PBBG schema for Supabase
-- Run in Supabase SQL Editor or via: supabase db push

create table public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  glamour integer not null default 5 check (glamour >= 0),
  makeup integer not null default 5 check (makeup >= 0),
  fashion integer not null default 5 check (fashion >= 0),
  luster integer not null default 20 check (luster >= 0),
  energy integer not null default 100 check (energy >= 0 and energy <= 100),
  fame integer not null default 0 check (fame >= 0),
  last_energy_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.players enable row level security;

create policy "Players read own row"
  on public.players for select
  to authenticated
  using (auth.uid() = id);

create policy "Players insert own row"
  on public.players for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Players update own row"
  on public.players for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
