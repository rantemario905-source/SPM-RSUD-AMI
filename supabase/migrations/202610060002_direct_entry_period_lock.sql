drop trigger if exists reports_audit_after_change on public.reports;
drop trigger if exists report_entries_audit_after_change on public.report_entries;
drop function if exists public.spm_audit_report_change();
drop function if exists public.spm_audit_entry_change();

create table public.reporting_periods (
  id uuid primary key default gen_random_uuid(),
  period_start date not null unique,
  period_end date not null,
  label text not null,
  state text not null default 'open' check (state in ('open', 'locked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_start <= period_end)
);

insert into public.reporting_periods (period_start, period_end, label, state)
select
  date_trunc('month', period_start)::date,
  (date_trunc('month', period_start) + interval '1 month - 1 day')::date,
  to_char(date_trunc('month', period_start), 'YYYY-MM'),
  case when bool_and(status = 'approved') then 'locked' else 'open' end
from public.reports
group by date_trunc('month', period_start);

alter table public.reports add column reporting_period_id uuid references public.reporting_periods(id);
update public.reports r
set reporting_period_id = p.id
from public.reporting_periods p
where p.period_start = date_trunc('month', r.period_start)::date;
alter table public.reports alter column reporting_period_id set not null;
alter table public.reports drop constraint if exists reports_unit_id_period_start_key;
alter table public.reports add constraint reports_unit_period_unique unique (unit_id, reporting_period_id);
alter table public.reports drop column if exists status cascade;
alter table public.reports drop column if exists submitted_at;
alter table public.reports drop column if exists reviewed_by;
alter table public.reports drop column if exists reviewed_at;
alter table public.reports drop column if exists revision_note;
alter table public.reports drop column if exists period_start;

alter table public.profiles add column can_manage_indicators boolean not null default false;
alter table public.profiles add column can_manage_periods boolean not null default false;
alter table public.profiles add column can_edit_locked_periods boolean not null default false;

alter table public.indicators drop constraint if exists indicators_code_key;
alter table public.indicators add column effective_from date;
alter table public.indicators add column effective_to date;
alter table public.indicators add column changed_by uuid references public.profiles(id);
update public.indicators
set effective_from = coalesce((select min(period_start) from public.reporting_periods), current_date)
where effective_from is null;
alter table public.indicators alter column effective_from set not null;
alter table public.indicators add constraint indicators_code_effective_from_unique unique (code, effective_from);
alter table public.indicators add constraint indicators_validity_dates check (effective_to is null or effective_to >= effective_from);

alter table public.report_entries add column id uuid default gen_random_uuid();
alter table public.report_entries alter column id set not null;
alter table public.report_entries add constraint report_entries_id_unique unique (id);
alter table public.report_entries add column updated_by uuid references public.profiles(id);

alter table public.report_audit rename to audit_log;
alter table public.audit_log rename column created_at to changed_at;
alter table public.audit_log alter column report_id drop not null;
alter table public.audit_log add column entity_type text not null default 'reports';
alter table public.audit_log add column record_id uuid;
alter table public.audit_log add column old_values jsonb;
alter table public.audit_log add column new_values jsonb;
update public.audit_log
set record_id = report_id,
    old_values = case when old_status is null then null else jsonb_build_object('status', old_status) end,
    new_values = case when new_status is null then null else jsonb_build_object('status', new_status) end;
alter table public.audit_log alter column record_id set not null;
alter table public.audit_log drop column old_status;
alter table public.audit_log drop column new_status;
alter table public.audit_log drop column action;

alter table public.units enable row level security;
alter table public.profiles enable row level security;
alter table public.indicators enable row level security;
alter table public.reporting_periods enable row level security;
alter table public.reports enable row level security;
alter table public.report_entries enable row level security;
alter table public.audit_log enable row level security;

 drop policy if exists "authenticated users can view units" on public.units;
drop policy if exists "users can view own profile or managers can view all" on public.profiles;
drop policy if exists "admins manage profiles" on public.profiles;
drop policy if exists "authenticated users can view indicators" on public.indicators;
drop policy if exists "admins manage indicators" on public.indicators;
drop policy if exists "users view reports for their scope" on public.reports;
drop policy if exists "unit staff create own draft reports" on public.reports;
drop policy if exists "unit staff submit drafts or revisions" on public.reports;
drop policy if exists "quality reviews submitted reports" on public.reports;
drop policy if exists "admins manage reports" on public.reports;
drop policy if exists "users view entries for their scope" on public.report_entries;
drop policy if exists "unit staff enter data on editable reports" on public.report_entries;
drop policy if exists "unit staff update data on editable reports" on public.report_entries;
drop policy if exists "managers view report audit" on public.audit_log;

create or replace function public.spm_current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid())
$$;

create or replace function public.spm_current_unit()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.unit_id from public.profiles p where p.id = (select auth.uid())
$$;

create function public.spm_can_manage_indicators()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p.can_manage_indicators, false) or p.role = 'admin'
  from public.profiles p where p.id = (select auth.uid())
$$;

create function public.spm_can_manage_periods()
returns boolean
language sql
stable
security definer
set search_path = ''
 as $$
  select coalesce(p.can_manage_periods, false) or p.role = 'admin'
  from public.profiles p where p.id = (select auth.uid())
$$;

create function public.spm_can_edit_locked_periods()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p.can_edit_locked_periods, false) or p.role = 'admin'
  from public.profiles p where p.id = (select auth.uid())
$$;

create function public.spm_capture_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
  record_key uuid;
  parent_report uuid;
begin
  if tg_op = 'INSERT' then
    new_row := to_jsonb(new);
    old_row := null;
  else
    new_row := to_jsonb(new);
    old_row := to_jsonb(old);
  end if;

  record_key := (new_row ->> 'id')::uuid;
  if tg_table_name = 'reports' then
    parent_report := record_key;
  elsif tg_table_name = 'report_entries' then
    parent_report := (new_row ->> 'report_id')::uuid;
  else
    parent_report := null;
  end if;

  insert into public.audit_log (report_id, actor_id, entity_type, record_id, old_values, new_values, changed_at)
  values (parent_report, (select auth.uid()), tg_table_name, record_key, old_row, new_row, now());
  return new;
end;
$$;

create function public.spm_stamp_report_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_by := (select auth.uid());
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.spm_current_role() from public, anon;
revoke execute on function public.spm_current_unit() from public, anon;
revoke execute on function public.spm_can_manage_indicators() from public, anon;
revoke execute on function public.spm_can_manage_periods() from public, anon;
revoke execute on function public.spm_can_edit_locked_periods() from public, anon;
grant execute on function public.spm_current_role() to authenticated;
grant execute on function public.spm_current_unit() to authenticated;
grant execute on function public.spm_can_manage_indicators() to authenticated;
grant execute on function public.spm_can_manage_periods() to authenticated;
grant execute on function public.spm_can_edit_locked_periods() to authenticated;

create trigger audit_reports after insert or update on public.reports
for each row execute function public.spm_capture_change();
create trigger audit_report_entries after insert or update on public.report_entries
for each row execute function public.spm_capture_change();
create trigger stamp_report_entries before insert or update on public.report_entries
for each row execute function public.spm_stamp_report_entry();
create trigger audit_indicators after insert or update on public.indicators
for each row execute function public.spm_capture_change();
create trigger audit_reporting_periods after insert or update on public.reporting_periods
for each row execute function public.spm_capture_change();

revoke all on public.units, public.profiles, public.indicators, public.reporting_periods, public.reports, public.report_entries, public.audit_log from anon;
revoke all on public.audit_log from authenticated;
grant select on public.units, public.profiles, public.indicators, public.reporting_periods, public.reports, public.report_entries, public.audit_log to authenticated;
grant insert, update, delete on public.profiles to authenticated;
grant insert on public.indicators to authenticated;
grant update (effective_to) on public.indicators to authenticated;
grant insert, update (state) on public.reporting_periods to authenticated;
grant insert on public.reports to authenticated;
grant insert, update on public.report_entries to authenticated;

create policy "authenticated users can view units" on public.units
for select to authenticated using (true);

create policy "users can view own profile or managers can view all" on public.profiles
for select to authenticated using (
  id = (select auth.uid()) or public.spm_current_role() in ('admin', 'quality', 'leadership')
);
create policy "admins manage profiles" on public.profiles
for all to authenticated using (public.spm_current_role() = 'admin')
with check (public.spm_current_role() = 'admin');

create policy "users view indicators in their unit" on public.indicators
for select to authenticated using (
  (active and (unit_id is null or unit_id = public.spm_current_unit()))
  or public.spm_can_manage_indicators()
  or public.spm_current_role() in ('quality', 'leadership')
);
create policy "authorized staff create indicator versions" on public.indicators
for insert to authenticated with check (
  public.spm_can_manage_indicators() and changed_by = (select auth.uid())
);
create policy "authorized staff close indicator version" on public.indicators
for update to authenticated using (public.spm_can_manage_indicators())
with check (public.spm_can_manage_indicators());

create policy "authenticated users can view reporting periods" on public.reporting_periods
for select to authenticated using (true);
create policy "authorized staff create periods" on public.reporting_periods
for insert to authenticated with check (public.spm_can_manage_periods());
create policy "authorized staff lock periods" on public.reporting_periods
for update to authenticated using (public.spm_can_manage_periods())
with check (public.spm_can_manage_periods());

create policy "users view reports for their scope" on public.reports
for select to authenticated using (
  unit_id = public.spm_current_unit()
  or public.spm_current_role() in ('admin', 'quality', 'leadership')
  or public.spm_can_edit_locked_periods()
);
create policy "unit staff create reports in open periods" on public.reports
for insert to authenticated with check (
  unit_id = public.spm_current_unit()
  and created_by = (select auth.uid())
  and public.spm_current_role() in ('officer', 'unit_head')
  and exists (
    select 1 from public.reporting_periods p
    where p.id = reporting_period_id and p.state = 'open'
  )
);

create policy "users view entries for their scope" on public.report_entries
for select to authenticated using (
  public.spm_current_role() in ('admin', 'quality', 'leadership')
  or public.spm_can_edit_locked_periods()
  or exists (
    select 1 from public.reports r
    where r.id = report_id and r.unit_id = public.spm_current_unit()
  )
);
create policy "authorized unit staff enter data" on public.report_entries
for insert to authenticated with check (
  (public.spm_current_role() in ('officer', 'unit_head') or public.spm_can_edit_locked_periods())
  and exists (
    select 1 from public.reports r
    join public.reporting_periods p on p.id = r.reporting_period_id
    where r.id = report_id
      and (r.unit_id = public.spm_current_unit() or public.spm_can_edit_locked_periods())
      and (p.state = 'open' or public.spm_can_edit_locked_periods())
  )
  and exists (
    select 1 from public.indicators i
    join public.reports r on r.id = report_id
    join public.reporting_periods p on p.id = r.reporting_period_id
    where i.id = indicator_id
      and (i.unit_id is null or i.unit_id = r.unit_id)
      and i.effective_from <= p.period_start
      and (i.effective_to is null or i.effective_to >= p.period_start)
  )
);
create policy "authorized staff update data" on public.report_entries
for update to authenticated using (
  (public.spm_current_role() in ('officer', 'unit_head') or public.spm_can_edit_locked_periods())
  and exists (
    select 1 from public.reports r
    join public.reporting_periods p on p.id = r.reporting_period_id
    where r.id = report_id
      and (r.unit_id = public.spm_current_unit() or public.spm_can_edit_locked_periods())
      and (p.state = 'open' or public.spm_can_edit_locked_periods())
  )
) with check (
  (public.spm_current_role() in ('officer', 'unit_head') or public.spm_can_edit_locked_periods())
  and exists (
    select 1 from public.reports r
    join public.reporting_periods p on p.id = r.reporting_period_id
    where r.id = report_id
      and (r.unit_id = public.spm_current_unit() or public.spm_can_edit_locked_periods())
      and (p.state = 'open' or public.spm_can_edit_locked_periods())
  )
  and exists (
    select 1 from public.indicators i
    join public.reports r on r.id = report_id
    join public.reporting_periods p on p.id = r.reporting_period_id
    where i.id = indicator_id
      and (i.unit_id is null or i.unit_id = r.unit_id)
      and i.effective_from <= p.period_start
      and (i.effective_to is null or i.effective_to >= p.period_start)
  )
);

create policy "users view audit for their scope" on public.audit_log
for select to authenticated using (
  public.spm_current_role() in ('admin', 'quality', 'leadership')
  or public.spm_can_edit_locked_periods()
  or (report_id is not null and exists (
    select 1 from public.reports r
    where r.id = report_id and r.unit_id = public.spm_current_unit()
  ))
  or (report_id is null and entity_type = 'indicators' and public.spm_can_manage_indicators())
  or (report_id is null and entity_type = 'reporting_periods' and public.spm_can_manage_periods())
);

create index if not exists reporting_periods_state_idx on public.reporting_periods(state);
create index if not exists indicators_effective_period_idx on public.indicators(code, effective_from, effective_to);
create index if not exists audit_log_changed_at_idx on public.audit_log(changed_at desc);
