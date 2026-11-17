begin;

create table if not exists public.hidden_study_groups (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  group_id text not null references public.study_groups(id) on delete cascade,
  primary key (user_id, group_id)
);

alter table public.hidden_study_groups enable row level security;
revoke all on public.hidden_study_groups from public, anon, authenticated;
grant select, insert, delete on public.hidden_study_groups to authenticated;

drop policy if exists hidden_study_groups_select_own on public.hidden_study_groups;
create policy hidden_study_groups_select_own on public.hidden_study_groups
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists hidden_study_groups_insert_own on public.hidden_study_groups;
create policy hidden_study_groups_insert_own on public.hidden_study_groups
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.study_groups g
      join public.group_members m on m.group_id = g.id
      where g.id = hidden_study_groups.group_id
        and g.status = 'completed' and m.member_id = hidden_study_groups.user_id::text
    )
  );

drop policy if exists hidden_study_groups_delete_own on public.hidden_study_groups;
create policy hidden_study_groups_delete_own on public.hidden_study_groups
  for delete to authenticated using (user_id = (select auth.uid()));

-- Preserve archived preferences created by the earlier account-based preview.
insert into public.hidden_study_groups (user_id, group_id)
select u.id, g.id
from auth.users u
cross join lateral jsonb_array_elements_text(
  case when jsonb_typeof(u.raw_user_meta_data -> 'study_flow_hidden_group_ids') = 'array'
    then u.raw_user_meta_data -> 'study_flow_hidden_group_ids' else '[]'::jsonb end
) hidden(group_id)
join public.study_groups g on g.id = hidden.group_id and g.status = 'completed'
join public.group_members m on m.group_id = g.id and m.member_id = u.id::text
on conflict do nothing;

create or replace function public.leave_study_group(
  p_group_id text,
  p_next_leader_id text default null,
  p_delete_if_solo boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id text := auth.uid()::text;
  caller_role text;
  has_other_members boolean;
  fallback_id text;
  fallback_role text;
begin
  if caller_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  perform 1 from public.study_groups where id = p_group_id for update;
  if not found then
    return;
  end if;

  perform 1 from public.group_members
    where group_id = p_group_id order by member_id for update;

  select member_role into caller_role
    from public.group_members where group_id = p_group_id and member_id = caller_id;
  if not found then
    return;
  end if;

  if coalesce(p_delete_if_solo, false) then
    if caller_role <> 'leader' or p_next_leader_id is not null or exists (
      select 1 from public.group_members where group_id = p_group_id and member_id <> caller_id
    ) then
      raise exception 'SOLO_DELETE_UNAVAILABLE';
    end if;
    delete from public.study_groups where id = p_group_id;
  else
    if caller_role = 'leader' then
      select exists (select 1 from public.group_members
        where group_id = p_group_id and member_id <> caller_id) into has_other_members;
      if not has_other_members then
        raise exception 'SOLO_DELETE_REQUIRED';
      end if;
      if p_next_leader_id is null then
        raise exception 'SUCCESSOR_REQUIRED';
      end if;
      update public.group_members set member_role = 'leader'
        where group_id = p_group_id and member_id = p_next_leader_id and member_id <> caller_id;
      if not found then
        raise exception 'SUCCESSOR_UNAVAILABLE';
      end if;
      update public.profiles set role = 'leader'
        where id = p_next_leader_id and joined_group_id = p_group_id;
    elsif p_next_leader_id is not null then
      raise exception 'SUCCESSOR_UNAVAILABLE';
    end if;

    delete from public.plan_item_completions c using public.plan_items p
      where c.plan_item_id = p.id and c.member_id = caller_id and p.group_id = p_group_id;
    delete from public.plan_item_feedbacks f using public.plan_items p
      where f.plan_item_id = p.id and f.member_id = caller_id and p.group_id = p_group_id;
    delete from public.review_candidates where group_id = p_group_id and member_id = caller_id;
    delete from public.personal_plan_items where group_id = p_group_id and member_id = caller_id;
    delete from public.personal_task_library_items where group_id = p_group_id and member_id = caller_id;
    delete from public.hidden_study_groups where group_id = p_group_id and user_id = auth.uid();
    delete from public.group_members where group_id = p_group_id and member_id = caller_id;
  end if;

  select g.id, m.member_role into fallback_id, fallback_role
  from public.group_members m
  join public.study_groups g on g.id = m.group_id
  where m.member_id = caller_id and g.status = 'active'
  order by g.exam_date, g.id limit 1;

  update public.profiles
    set joined_group_id = fallback_id, has_joined_group = fallback_id is not null, role = fallback_role
    where id = caller_id and joined_group_id = p_group_id;
end;
$$;

revoke all on function public.leave_study_group(text, text, boolean) from public, anon;
grant execute on function public.leave_study_group(text, text, boolean) to authenticated;

commit;
