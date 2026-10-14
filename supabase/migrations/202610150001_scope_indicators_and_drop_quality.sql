-- 202610150001_scope_indicators_and_drop_quality.sql
-- 1) Hapus peran 'quality' (Mutu) dari sistem.
--    Profil yang masih berperan quality dihapus; akun Auth (auth.users) TIDAK dihapus.
--
--    FK ke public.profiles(id):
--      - report_periods.updated_by : nullable  -> dikosongkan
--      - reports.created_by        : NOT NULL  -> dialihkan ke administrator pertama
--    (report_audit.actor_id & period_audit.actor_id menunjuk auth.users, bukan profiles.)

update public.report_periods
set updated_by = null
where updated_by in (select id from public.profiles where role = 'quality');

update public.reports
set created_by = (
  select id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1
)
where created_by in (select id from public.profiles where role = 'quality')
  and exists (select 1 from public.profiles where role = 'admin');

do $$
declare
  v_left integer;
begin
  select count(*) into v_left
  from public.reports r
  join public.profiles p on p.id = r.created_by
  where p.role = 'quality';
  if v_left > 0 then
    raise exception 'Ada % laporan yang dibuat akun quality dan tidak ada profil administrator untuk mengalihkannya. Perbaiki profil administrator lalu jalankan ulang migrasi ini.', v_left;
  end if;
end $$;

delete from public.profiles where role = 'quality';

alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'officer', 'unit_head', 'leadership'));

-- 2) Batasi pengelolaan indikator ke unit yang dipegang pengguna.
--    Baca indikator AKTIF lintas unit tetap terbuka agar halaman Input laporan
--    dapat menampilkan indikator unit lain sebagai hanya-baca.

drop policy if exists "authenticated users view indicators" on public.indicators;
create policy "authenticated users view indicators" on public.indicators
for select to authenticated using (
  active
  or public.spm_can('view_all_reports')
  or public.spm_can('manage_users')
  or (public.spm_can('manage_indicators') and (unit_id is null or public.spm_has_unit(unit_id)))
);

drop policy if exists "authorized users manage indicators" on public.indicators;
create policy "authorized users manage indicators" on public.indicators
for all to authenticated using (
  public.spm_can('manage_indicators')
  and (public.spm_can('view_all_reports') or public.spm_can('manage_users') or public.spm_has_unit(unit_id))
) with check (
  public.spm_can('manage_indicators')
  and (public.spm_can('view_all_reports') or public.spm_can('manage_users') or public.spm_has_unit(unit_id))
);
