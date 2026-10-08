insert into public.units (code, name)
values
  ('IGD', 'Gawat Darurat'),
  ('RJ', 'Rawat Jalan'),
  ('RI', 'Rawat Inap')
on conflict (code) do nothing;

insert into public.report_periods (period_start, period_end, state)
select month_start::date,
       (month_start + interval '1 month - 1 day')::date,
       'open'
from generate_series(
  date_trunc('year', current_date),
  date_trunc('year', current_date) + interval '11 months',
  interval '1 month'
) as months(month_start)
on conflict (period_start) do nothing;

drop policy if exists "unit staff create report in open period" on public.reports;
create policy "authorized users create report in open period" on public.reports
for insert to authenticated with check (
  public.spm_can('input_reports')
  and created_by = (select auth.uid())
  and (unit_id = public.spm_current_unit() or public.spm_can('manage_users'))
  and exists (
    select 1 from public.report_periods p
    where p.period_start = reports.period_start and p.state = 'open'
  )
);

drop policy if exists "unit staff add entries in open period" on public.report_entries;
create policy "authorized users add entries in open period" on public.report_entries
for insert to authenticated with check (
  exists (
    select 1 from public.reports r
    join public.report_periods p on p.period_start = r.period_start
    where r.id = report_id
      and p.state = 'open'
      and public.spm_can('input_reports')
      and (r.unit_id = public.spm_current_unit() or public.spm_can('manage_users'))
  )
  and exists (
    select 1 from public.indicators i
    where i.id = indicator_id and i.active
      and (i.unit_id is null or i.unit_id = public.spm_current_unit() or public.spm_can('manage_users'))
  )
);

drop policy if exists "authorized users update entries in open or permitted locked periods" on public.report_entries;
create policy "authorized users update entries in permitted periods" on public.report_entries
for update to authenticated using (
  exists (
    select 1 from public.reports r
    join public.report_periods p on p.period_start = r.period_start
    where r.id = report_id
      and (
        (public.spm_can('input_reports') and p.state = 'open'
          and (r.unit_id = public.spm_current_unit() or public.spm_can('manage_users')))
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
          and (r.unit_id = public.spm_current_unit() or public.spm_can('manage_users')))
        or (public.spm_can('edit_locked_periods') and p.state = 'locked')
      )
  )
  and exists (
    select 1 from public.indicators i
    where i.id = indicator_id
      and (i.unit_id is null or i.unit_id = public.spm_current_unit() or public.spm_can('manage_users') or public.spm_can('edit_locked_periods'))
  )
);