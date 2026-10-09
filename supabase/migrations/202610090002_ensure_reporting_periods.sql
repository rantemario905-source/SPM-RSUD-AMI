create or replace function public.spm_ensure_periods()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_year integer := extract(year from current_date)::integer;
  inserted_count integer;
begin
  with new_periods as (
    insert into public.report_periods (period_start, period_end, state)
    select make_date(target_year, month_number, 1),
           (make_date(target_year, month_number, 1) + interval '1 month - 1 day')::date,
           'open'
    from generate_series(1, 12) as month_number
    on conflict (period_start) do nothing
    returning 1
  )
  select count(*) into inserted_count from new_periods;
  return inserted_count;
end;
$$;

revoke all on function public.spm_ensure_periods() from public, anon;
grant execute on function public.spm_ensure_periods() to authenticated;

-- Penjadwalan otomatis harian. Bila pg_cron belum aktif, aplikasi tetap
-- memanggil spm_ensure_periods() setiap kali dibuka.
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron tidak tersedia; pembuatan periode otomatis mengandalkan pemanggilan dari aplikasi.';
    return;
  end;

  begin
    perform cron.unschedule('spm-ensure-periods');
  exception when others then
    null;
  end;

  perform cron.schedule('spm-ensure-periods', '0 0 * * *', 'select public.spm_ensure_periods()');
end;
$$;
