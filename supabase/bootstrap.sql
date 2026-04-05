create table if not exists public.profiles (
  id text primary key,
  name text not null,
  role text not null,
  focus text not null
);

create table if not exists public.study_groups (
  id text primary key,
  name text not null,
  subject text not null,
  exam_date date not null,
  presentation_date date,
  deadline_date date,
  weekly_goal text not null,
  overall_goal text not null default '',
  description text not null,
  recent_update text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.study_groups
  add column if not exists presentation_date date;

alter table public.study_groups
  add column if not exists deadline_date date;

alter table public.study_groups
  add column if not exists overall_goal text not null default '';

create table if not exists public.group_members (
  group_id text not null references public.study_groups(id) on delete cascade,
  member_id text not null references public.profiles(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (group_id, member_id)
);

create table if not exists public.materials (
  id text primary key,
  group_id text not null references public.study_groups(id) on delete cascade,
  title text not null,
  summary text not null,
  uploaded_by_member_id text not null references public.profiles(id) on delete cascade,
  uploaded_at timestamptz not null default timezone('utc', now()),
  format text not null,
  location_hint text not null
);

create table if not exists public.plan_items (
  id text primary key,
  group_id text not null references public.study_groups(id) on delete cascade,
  day text not null,
  title text not null,
  detail text not null,
  duration text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.plan_item_completions (
  plan_item_id text not null references public.plan_items(id) on delete cascade,
  member_id text not null references public.profiles(id) on delete cascade,
  primary key (plan_item_id, member_id)
);

create table if not exists public.chat_messages (
  id text primary key,
  group_id text not null references public.study_groups(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chat_message_sources (
  id text primary key,
  message_id text not null references public.chat_messages(id) on delete cascade,
  material_id text references public.materials(id) on delete set null,
  title text not null,
  location_hint text not null,
  summary text not null,
  sort_order integer not null default 0
);

create index if not exists idx_group_members_group_id
  on public.group_members (group_id);

create index if not exists idx_materials_group_id
  on public.materials (group_id);

create index if not exists idx_plan_items_group_id
  on public.plan_items (group_id);

create index if not exists idx_plan_item_completions_member_id
  on public.plan_item_completions (member_id);

create index if not exists idx_chat_messages_group_id
  on public.chat_messages (group_id);

create index if not exists idx_chat_message_sources_message_id
  on public.chat_message_sources (message_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.materials enable row level security;
alter table public.plan_items enable row level security;
alter table public.plan_item_completions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_message_sources enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "profiles_insert_all" on public.profiles;
create policy "profiles_insert_all"
  on public.profiles
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "profiles_update_all" on public.profiles;
create policy "profiles_update_all"
  on public.profiles
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "profiles_delete_all" on public.profiles;
create policy "profiles_delete_all"
  on public.profiles
  for delete
  to anon, authenticated
  using (true);

drop policy if exists "study_groups_select_all" on public.study_groups;
create policy "study_groups_select_all"
  on public.study_groups
  for select
  to anon, authenticated
  using (true);

drop policy if exists "study_groups_insert_all" on public.study_groups;
create policy "study_groups_insert_all"
  on public.study_groups
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "study_groups_update_all" on public.study_groups;
create policy "study_groups_update_all"
  on public.study_groups
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "study_groups_delete_all" on public.study_groups;
create policy "study_groups_delete_all"
  on public.study_groups
  for delete
  to anon, authenticated
  using (true);

drop policy if exists "group_members_select_all" on public.group_members;
create policy "group_members_select_all"
  on public.group_members
  for select
  to anon, authenticated
  using (true);

drop policy if exists "group_members_insert_all" on public.group_members;
create policy "group_members_insert_all"
  on public.group_members
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "group_members_update_all" on public.group_members;
create policy "group_members_update_all"
  on public.group_members
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "group_members_delete_all" on public.group_members;
create policy "group_members_delete_all"
  on public.group_members
  for delete
  to anon, authenticated
  using (true);

drop policy if exists "materials_select_all" on public.materials;
create policy "materials_select_all"
  on public.materials
  for select
  to anon, authenticated
  using (true);

drop policy if exists "materials_insert_all" on public.materials;
create policy "materials_insert_all"
  on public.materials
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "materials_update_all" on public.materials;
create policy "materials_update_all"
  on public.materials
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "materials_delete_all" on public.materials;
create policy "materials_delete_all"
  on public.materials
  for delete
  to anon, authenticated
  using (true);

drop policy if exists "plan_items_select_all" on public.plan_items;
create policy "plan_items_select_all"
  on public.plan_items
  for select
  to anon, authenticated
  using (true);

drop policy if exists "plan_items_insert_all" on public.plan_items;
create policy "plan_items_insert_all"
  on public.plan_items
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "plan_items_update_all" on public.plan_items;
create policy "plan_items_update_all"
  on public.plan_items
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "plan_items_delete_all" on public.plan_items;
create policy "plan_items_delete_all"
  on public.plan_items
  for delete
  to anon, authenticated
  using (true);

drop policy if exists "plan_item_completions_select_all" on public.plan_item_completions;
create policy "plan_item_completions_select_all"
  on public.plan_item_completions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "plan_item_completions_insert_all" on public.plan_item_completions;
create policy "plan_item_completions_insert_all"
  on public.plan_item_completions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "plan_item_completions_update_all" on public.plan_item_completions;
create policy "plan_item_completions_update_all"
  on public.plan_item_completions
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "plan_item_completions_delete_all" on public.plan_item_completions;
create policy "plan_item_completions_delete_all"
  on public.plan_item_completions
  for delete
  to anon, authenticated
  using (true);

drop policy if exists "chat_messages_select_all" on public.chat_messages;
create policy "chat_messages_select_all"
  on public.chat_messages
  for select
  to anon, authenticated
  using (true);

drop policy if exists "chat_messages_insert_all" on public.chat_messages;
create policy "chat_messages_insert_all"
  on public.chat_messages
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "chat_messages_update_all" on public.chat_messages;
create policy "chat_messages_update_all"
  on public.chat_messages
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "chat_messages_delete_all" on public.chat_messages;
create policy "chat_messages_delete_all"
  on public.chat_messages
  for delete
  to anon, authenticated
  using (true);

drop policy if exists "chat_message_sources_select_all" on public.chat_message_sources;
create policy "chat_message_sources_select_all"
  on public.chat_message_sources
  for select
  to anon, authenticated
  using (true);

drop policy if exists "chat_message_sources_insert_all" on public.chat_message_sources;
create policy "chat_message_sources_insert_all"
  on public.chat_message_sources
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "chat_message_sources_update_all" on public.chat_message_sources;
create policy "chat_message_sources_update_all"
  on public.chat_message_sources
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "chat_message_sources_delete_all" on public.chat_message_sources;
create policy "chat_message_sources_delete_all"
  on public.chat_message_sources
  for delete
  to anon, authenticated
  using (true);
