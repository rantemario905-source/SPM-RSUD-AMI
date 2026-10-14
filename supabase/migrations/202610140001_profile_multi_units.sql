-- Satu profil dapat memegang lebih dari satu unit (mis. petugas yang merangkap).
-- `unit_id` tetap dipertahankan sebagai UNIT UTAMA (default saat input laporan),
-- sedangkan `unit_ids` menyimpan seluruh unit yang dipegang pengguna.

alter table public.profiles
  add column if not exists unit_ids uuid[] not null default '{}'::uuid[];

update public.profiles
set unit_ids = array[unit_id]
where unit_id is not null
  and coalesce(array_length(unit_ids, 1), 0) = 0;

alter table public.profiles
  drop constraint if exists profiles_unit_ids_include_primary;
alter table public.profiles
  add constraint profiles_unit_ids_include_primary
  check (unit_id is null or unit_id = any (unit_ids));

alter table public.profiles
  drop constraint if exists profiles_units_required_for_unit_roles;
alter table public.profiles
  add constraint profiles_units_required_for_unit_roles
  check ((role in ('officer', 'unit_head')) = (coalesce(array_length(unit_ids, 1), 0) >= 1));

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
$$;

create or replace function public.spm_has_unit(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target is not null and target = any (public.spm_current_units())
$$;

create or replace function public.spm_validate_profile_units()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from unnest(coalesce(new.unit_ids, array[]::uuid[])) as candidate(id)
    where not exists (select 1 from public.units u where u.id = candidate.id)
  ) then
    raise exception 'unit_ids memuat unit yang tidak terdaftar';
  end if;
  return new;
end;
$$;

revoke execute on function public.spm_current_units() from public, anon;
grant execute on function public.spm_current_units() to authenticated;
revoke execute on function public.spm_has_unit(uuid) from public, anon;
grant execute on function public.spm_has_unit(uuid) to authenticated;

drop trigger if exists profiles_validate_units on public.profiles;
create trigger profiles_validate_units
before insert or update of unit_ids on public.profiles
for each row execute function public.spm_validate_profile_units();

-- Penulisan laporan/entri kini mengizinkan SEMUA unit yang dipegang pengguna
-- (sebelumnya hanya unit utama pada profiles.unit_id).

drop policy if exists "authorized users create report in open period" on public.reports;
create policy "authorized users create report in open period" on public.reports
for insert to authenticated with check (
  public.spm_can('input_reports')
  and created_by = (select auth.uid())
  and (public.spm_has_unit(unit_id) or public.spm_can('manage_users') or public.spm_can('view_all_reports'))
  and exists (
    select 1 from public.report_periods p
    where p.period_start = reports.period_start and p.state = 'open'
  )
);

drop policy if exists "authorized users add entries in open period" on public.report_entries;
create policy "authorized users add entries in open period" on public.report_entries
for insert to authenticated with check (
  exists (
    select 1 from public.reports r
    join public.report_periods p on p.period_start = r.period_start
    where r.id = report_id
      and p.state = 'open'
      and public.spm_can('input_reports')
      and (public.spm_has_unit(r.unit_id) or public.spm_can('manage_users') or public.spm_can('view_all_reports'))
  )
  and exists (
    select 1 from public.indicators i
    where i.id = indicator_id and i.active
      and (i.unit_id is null or public.spm_has_unit(i.unit_id) or public.spm_can('manage_users') or public.spm_can('view_all_reports'))
  )
);

drop policy if exists "authorized users update entries in permitted periods" on public.report_entries;
create policy "authorized users update entries in permitted periods" on public.report_entries
for update to authenticated using (
  exists (
    select 1 from public.reports r
    join public.report_periods p on p.period_start = r.period_start
    where r.id = report_id
      and (
        (public.spm_can('input_reports') and p.state = 'open'
          and (public.spm_has_unit(r.unit_id) or public.spm_can('manage_users') or public.spm_can('view_all_reports')))
        or (public.spm_can('edit_locked_periods') and p.state = 'locked')
      )
  )
) with check (
  exists (
    select 1 from public.reports r
    join public.report_periods p on p.period_start = r.period_start
    where r.id = report_id
      and (
        (public.spm_can('input_reports') and p.state = 'open'
          and (public.spm_has_unit(r.unit_id) or public.spm_can('manage_users') or public.spm_can('view_all_reports')))
        or (public.spm_can('edit_locked_periods') and p.state = 'locked')
      )
  )
  and exists (
    select 1 from public.indicators i
    where i.id = indicator_id
      and (i.unit_id is null or public.spm_has_unit(i.unit_id) or public.spm_can('manage_users') or public.spm_can('view_all_reports') or public.spm_can('edit_locked_periods'))
  )
);
