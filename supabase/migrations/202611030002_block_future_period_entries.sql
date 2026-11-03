create or replace function public.spm_ensure_periods()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_year integer := extract(year from current_date)::integer;
  target_month integer := extract(month from current_date)::integer;
  inserted_count integer;
begin
  with new_periods as (
    insert into public.report_periods (period_start, period_end, state)
    select make_date(target_year, month_number, 1),
           (make_date(target_year, month_number, 1) + interval '1 month - 1 day')::date,
           'open'
    from generate_series(1, target_month) as month_number
    on conflict (period_start) do nothing
    returning 1
  )
  select count(*) into inserted_count from new_periods;
  return inserted_count;
end;
$$;

drop policy if exists "authorized users create report in open period" on public.reports;
create policy "authorized users create report in open period" on public.reports
for insert to authenticated with check (
  public.spm_can('input_reports')
  and created_by = (select auth.uid())
  and (public.spm_has_unit(unit_id) or public.spm_can('manage_users') or public.spm_can('view_all_reports'))
  and exists (
    select 1 from public.report_periods p
    where p.period_start = reports.period_start
      and p.state = 'open'
      and p.period_start <= date_trunc('month', current_date)::date
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
      and p.period_start <= date_trunc('month', current_date)::date
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
      and p.period_start <= date_trunc('month', current_date)::date
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
      and p.period_start <= date_trunc('month', current_date)::date
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
