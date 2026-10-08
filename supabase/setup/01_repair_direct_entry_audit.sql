-- Use this only if migration 001 succeeded and migration 002 failed.
-- Run each phase separately in Supabase SQL Editor, in order.

-- Phase 1: Confirm that the direct-entry schema from migration 001 exists.
do $$
begin
  if to_regclass('public.reports') is null
    or to_regclass('public.report_entries') is null
    or to_regclass('public.report_audit') is null
    or to_regclass('public.report_periods') is null then
    raise exception 'Expected migration 001 tables are missing. Do not run the repair; inspect the database first.';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reports' and column_name = 'period_start'
  ) or exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reports' and column_name = 'status'
  ) then
    raise exception 'The database does not match migration 001 direct-entry schema. Stop and inspect its columns.';
  end if;
end;
$$;

-- Phase 2: Restore the audit trigger functions from migration 001.
create or replace function public.spm_audit_report_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.report_audit (report_id, actor_id, action, old_values, new_values)
  values (
    new.id,
    (select auth.uid()),
    case when tg_op = 'INSERT' then 'report_created' else 'report_updated' end,
    case when tg_op = 'UPDATE' then jsonb_build_object('unit_id', old.unit_id, 'period_start', old.period_start) else null end,
    jsonb_build_object('unit_id', new.unit_id, 'period_start', new.period_start)
  );
  return new;
end;
$$;

create or replace function public.spm_audit_entry_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.report_audit (report_id, actor_id, action, old_values, new_values)
  values (
    new.report_id,
    (select auth.uid()),
    case when tg_op = 'INSERT' then 'entry_created' else 'entry_updated' end,
    case when tg_op = 'UPDATE' then jsonb_build_object(
      'indicator_id', old.indicator_id,
      'numerator', old.numerator,
      'denominator', old.denominator,
      'analysis', old.analysis,
      'evidence_note', old.evidence_note
    ) else null end,
    jsonb_build_object(
      'indicator_id', new.indicator_id,
      'numerator', new.numerator,
      'denominator', new.denominator,
      'analysis', new.analysis,
      'evidence_note', new.evidence_note
    )
  );
  return new;
end;
$$;

-- Phase 3: Recreate the triggers safely, even if they still exist.
drop trigger if exists reports_audit_after_change on public.reports;
create trigger reports_audit_after_change
after insert or update on public.reports
for each row execute function public.spm_audit_report_change();

drop trigger if exists report_entries_audit_after_change on public.report_entries;
create trigger report_entries_audit_after_change
after insert or update on public.report_entries
for each row execute function public.spm_audit_entry_change();

-- Phase 4: Confirm both audit triggers are enabled.
select tgname, tgenabled
from pg_trigger
where tgrelid in ('public.reports'::regclass, 'public.report_entries'::regclass)
  and tgname in ('reports_audit_after_change', 'report_entries_audit_after_change')
  and not tgisinternal
order by tgname;