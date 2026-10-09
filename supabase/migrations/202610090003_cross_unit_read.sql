-- Membuka akses BACA lintas unit untuk pengguna terautentikasi.
-- Penulisan (insert/update) tetap dibatasi ke unit pengguna sendiri
-- melalui policy insert/update yang sudah ada.

drop policy if exists "users view reports in their scope" on public.reports;
create policy "authenticated users view reports" on public.reports
for select to authenticated using (true);

drop policy if exists "users view entries in their scope" on public.report_entries;
create policy "authenticated users view entries" on public.report_entries
for select to authenticated using (true);

drop policy if exists "users view assigned active indicators" on public.indicators;
create policy "authenticated users view indicators" on public.indicators
for select to authenticated using (active or public.spm_can('manage_indicators'));
