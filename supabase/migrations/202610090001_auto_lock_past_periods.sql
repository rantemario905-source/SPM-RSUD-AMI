alter table public.report_periods
  add column if not exists manually_opened boolean not null default false;

create or replace function public.spm_lock_past_periods()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  locked_count integer;
begin
  update public.report_periods
  set state = 'locked',
      updated_at = now()
  where state = 'open'
    and manually_opened = false
    and period_end < current_date;
  get diagnostics locked_count = row_count;
  return locked_count;
end;
$$;

revoke all on function public.spm_lock_past_periods() from public, anon;
grant execute on function public.spm_lock_past_periods() to authenticated;

-- Penjadwalan otomatis harian. Jika pg_cron belum diaktifkan di proyek Supabase,
-- jalankan `create extension pg_cron;` lebih dahulu, atau biarkan aplikasi
-- memanggil spm_lock_past_periods() setiap kali dibuka.
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron tidak tersedia; penguncian otomatis mengandalkan pemanggilan dari aplikasi.';
    return;
  end;

  begin
    perform cron.unschedule('spm-lock-past-periods');
  exception when others then
    null;
  end;

  perform cron.schedule('spm-lock-past-periods', '5 0 * * *', 'select public.spm_lock_past_periods()');
end;
$$;
