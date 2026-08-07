create table if not exists public.calendar_credentials (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.calendar_credentials enable row level security;

-- No policies are defined intentionally: this table is only ever read/written by Edge
-- Functions using the service_role key, which bypasses RLS. Neither the anon nor the
-- authenticated role should ever be able to read a stored Google refresh token directly.
