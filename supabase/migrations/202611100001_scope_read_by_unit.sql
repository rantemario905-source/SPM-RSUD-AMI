-- Batasi BACA laporan/entri/indikator ke unit yang dipegang pengguna.
-- Pengecualian: pemegang izin view_all_reports atau manage_users (mis. Pimpinan
-- dan Administrator) tetap dapat membaca semua unit. Penulisan tidak diubah.

drop policy if exists "authenticated users view reports" on public.reports;
create policy "users view reports in scope or all" on public.reports
for select to authenticated using (
  public.spm_has_unit(unit_id)
  or public.spm_can('view_all_reports')
  or public.spm_can('manage_users')
);

drop policy if exists "authenticated users view entries" on public.report_entries;
create policy "users view entries in scope or all" on public.report_entries
for select to authenticated using (
  exists (
    select 1
    from public.reports r
    where r.id = report_entries.report_id
      and (
        public.spm_has_unit(r.unit_id)
        or public.spm_can('view_all_reports')
        or public.spm_can('manage_users')
      )
  )
);

drop policy if exists "authenticated users view indicators" on public.indicators;
create policy "authenticated users view indicators" on public.indicators
for select to authenticated using (
  public.spm_can('view_all_reports')
  or public.spm_can('manage_users')
  or (active and (unit_id is null or public.spm_has_unit(unit_id)))
  or (public.spm_can('manage_indicators') and (unit_id is null or public.spm_has_unit(unit_id)))
);
