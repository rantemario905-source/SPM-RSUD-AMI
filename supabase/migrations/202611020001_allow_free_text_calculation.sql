alter table public.indicators
  drop constraint if exists indicators_calculation_method_check;

alter table public.indicators
  add constraint indicators_calculation_method_check
  check (calculation_method in ('percentage', 'average', 'scaled', 'numerator', 'direct', 'free_text'));

alter table public.report_entries
  add column if not exists result_text text;

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
      'result_text', old.result_text,
      'analysis', old.analysis,
      'evidence_note', old.evidence_note
    ) else null end,
    jsonb_build_object(
      'indicator_id', new.indicator_id,
      'numerator', new.numerator,
      'denominator', new.denominator,
      'result_text', new.result_text,
      'analysis', new.analysis,
      'evidence_note', new.evidence_note
    )
  );
  return new;
end;
$$;
