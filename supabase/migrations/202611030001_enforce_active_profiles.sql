create or replace function public.spm_current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.active
$$;

create or replace function public.spm_current_unit()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.unit_id
  from public.profiles p
  where p.id = (select auth.uid())
    and p.active
$$;

create or replace function public.spm_can(permission_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(lower(p.permissions ->> permission_name) = 'true', false)
  from public.profiles p
  where p.id = (select auth.uid())
    and p.active
$$;

create or replace function public.spm_current_units()
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p.unit_ids, array[]::uuid[])
  from public.profiles p
  where p.id = (select auth.uid())
    and p.active
$$;
