create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  instagram_url text not null,
  caption_text text not null default '',
  application_link text not null default '',
  organization_name text not null default '',
  deadline timestamptz,
  performance_date timestamptz,
  deadline_event_id text,
  performance_event_id text,
  status text not null default 'discovered'
    check (status in ('discovered', 'applied', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists opportunities_user_id_idx on public.opportunities (user_id);

alter table public.opportunities enable row level security;

create policy "Users can view their own opportunities"
  on public.opportunities for select
  using (auth.uid() = user_id);

create policy "Users can insert their own opportunities"
  on public.opportunities for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own opportunities"
  on public.opportunities for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own opportunities"
  on public.opportunities for delete
  using (auth.uid() = user_id);
