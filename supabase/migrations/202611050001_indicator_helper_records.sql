-- 202611050001_indicator_helper_records.sql
-- Alat bantu perhitungan per indikator (mis. waktu tunggu rawat jalan).
-- Indikator bertanda `helper_kind` mendapat tombol "Alat bantu" di Input laporan;
-- rekaman pasien di tabel ini dijumlahkan menjadi numerator/denominator entri
-- laporan (`time_span` -> total menit/jam, `date_span` -> total hari).

alter table public.indicators
  add column if not exists helper_kind text;

alter table public.indicators
  drop constraint if exists indicators_helper_kind_check;
alter table public.indicators
  add constraint indicators_helper_kind_check
  check (helper_kind is null or helper_kind in ('time_span', 'date_span'));

create table if not exists public.indicator_helper_records (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  indicator_id uuid not null references public.indicators(id),
  subject_name text not null,
  room text not null default '',
  start_date date not null,
  start_time time,
  end_date date,
  end_time time,
  note text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  check (end_time is null or start_time is null or end_time >= start_time)
);

create index if not exists indicator_helper_records_scope_idx
  on public.indicator_helper_records(report_id, indicator_id);

alter table public.indicator_helper_records enable row level security;

revoke all on public.indicator_helper_records from anon;
grant select, insert, update, delete on public.indicator_helper_records to authenticated;

-- Baca: hanya unit pemilik (nama pasien tidak dibuka lintas unit).
drop policy if exists "unit owners view helper records" on public.indicator_helper_records;
create policy "unit owners view helper records" on public.indicator_helper_records
for select to authenticated using (
  exists (
    select 1 from public.reports r
    where r.id = report_id
      and public.spm_has_unit(r.unit_id)
  )
);

drop policy if exists "unit owners add helper records" on public.indicator_helper_records;
create policy "unit owners add helper records" on public.indicator_helper_records
for insert to authenticated with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.reports r
    join public.report_periods p on p.period_start = r.period_start
    where r.id = report_id
      and public.spm_has_unit(r.unit_id)
      and p.period_start <= date_trunc('month', current_date)::date
      and (
        (public.spm_can('input_reports') and p.state = 'open')
        or public.spm_can('edit_locked_periods')
      )
  )
);

drop policy if exists "unit owners update helper records" on public.indicator_helper_records;
create policy "unit owners update helper records" on public.indicator_helper_records
for update to authenticated using (
  exists (
    select 1 from public.reports r
    join public.report_periods p on p.period_start = r.period_start
    where r.id = report_id
      and public.spm_has_unit(r.unit_id)
      and p.period_start <= date_trunc('month', current_date)::date
      and (
        (public.spm_can('input_reports') and p.state = 'open')
        or public.spm_can('edit_locked_periods')
      )
  )
) with check (
  exists (
    select 1 from public.reports r
    join public.report_periods p on p.period_start = r.period_start
    where r.id = report_id
      and public.spm_has_unit(r.unit_id)
      and p.period_start <= date_trunc('month', current_date)::date
      and (
        (public.spm_can('input_reports') and p.state = 'open')
        or public.spm_can('edit_locked_periods')
      )
  )
);

drop policy if exists "unit owners delete helper records" on public.indicator_helper_records;
create policy "unit owners delete helper records" on public.indicator_helper_records
for delete to authenticated using (
  exists (
    select 1 from public.reports r
    join public.report_periods p on p.period_start = r.period_start
    where r.id = report_id
      and public.spm_has_unit(r.unit_id)
      and p.period_start <= date_trunc('month', current_date)::date
      and (
        (public.spm_can('input_reports') and p.state = 'open')
        or public.spm_can('edit_locked_periods')
      )
  )
);
