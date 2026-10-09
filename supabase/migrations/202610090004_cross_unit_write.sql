-- Izinkan peran lintas unit (Mutu/Pimpinan dengan view_all_reports) menulis
-- laporan untuk unit mana pun. Petugas/Kepala unit tetap terbatas pada unit
-- profilnya karena mereka tidak memiliki view_all_reports.

drop policy if exists "authorized users create report in open period" on public.reports;
create policy "authorized users create report in open period" on public.reports
for insert to authenticated with check (
  public.spm_can('input_reports')
  and created_by = (select auth.uid())
  and (unit_id = public.spm_current_unit() or public.spm_can('manage_users') or public.spm_can('view_all_reports'))
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
      and (r.unit_id = public.spm_current_unit() or public.spm_can('manage_users') or public.spm_can('view_all_reports'))
  )
  and exists (
    select 1 from public.indicators i
    where i.id = indicator_id and i.active
      and (i.unit_id is null or i.unit_id = public.spm_current_unit() or public.spm_can('manage_users') or public.spm_can('view_all_reports'))
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
          and (r.unit_id = public.spm_current_unit() or public.spm_can('manage_users') or public.spm_can('view_all_reports')))
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
          and (r.unit_id = public.spm_current_unit() or public.spm_can('manage_users') or public.spm_can('view_all_reports')))
        or (public.spm_can('edit_locked_periods') and p.state = 'locked')
      )
  )
  and exists (
    select 1 from public.indicators i
    where i.id = indicator_id
      and (i.unit_id is null or i.unit_id = public.spm_current_unit() or public.spm_can('manage_users') or public.spm_can('view_all_reports') or public.spm_can('edit_locked_periods'))
  )
);
