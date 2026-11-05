-- 202611050002_indicator_helper_min_sample.sql
-- Minimum sampel untuk alat bantu perhitungan (mis. Rekam Medis: minimal 100 dokumen).
-- Hanya peringatan di UI; penyimpanan tetap diperbolehkan meski sampel belum mencapai minimum.

alter table public.indicators
  add column if not exists helper_min_sample integer;

alter table public.indicators
  drop constraint if exists indicators_helper_min_sample_check;
alter table public.indicators
  add constraint indicators_helper_min_sample_check
  check (helper_min_sample is null or helper_min_sample > 0);
