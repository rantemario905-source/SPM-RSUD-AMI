create table public.units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'officer', 'unit_head', 'quality', 'leadership')),
  unit_id uuid references public.units(id),
  permissions jsonb not null default '{"view_dashboard": true, "input_reports": true, "view_own_unit_reports": true, "view_all_reports": false, "manage_indicators": false, "manage_periods": false, "view_audit": false, "manage_users": false, "edit_locked_periods": false}'::jsonb,
  created_at timestamptz not null default now(),
  check ((role in ('officer', 'unit_head')) = (unit_id is not null)),
  check (jsonb_typeof(permissions) = 'object')
);

create table public.indicators (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  service_name text not null,
  name text not null,
  operational_definition text not null default '',
  standard text not null default '',
  calculation_method text not null default 'percentage' check (calculation_method in ('percentage', 'average', 'scaled', 'numerator')),
  unit_label text not null default '',
  calculation_scale numeric,
  result_unit text not null default '%',
  unit_id uuid references public.units(id),
  effective_from date not null,
  effective_until date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_until is null or effective_until >= effective_from)
);

create table public.report_periods (
  period_start date primary key,
  period_end date not null,
  state text not null default 'open' check (state in ('open', 'locked')),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  check (extract(day from period_start) = 1)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id),
  period_start date not null references public.report_periods(period_start),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, period_start)
);

create table public.report_entries (
  report_id uuid not null references public.reports(id) on delete cascade,
  indicator_id uuid not null references public.indicators(id),
  numerator numeric check (numerator is null or numerator >= 0),
  denominator numeric check (denominator is null or denominator >= 0),
  analysis text not null default '',
  evidence_note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (report_id, indicator_id)
);

create table public.report_audit (
  id bigint generated always as identity primary key,
  report_id uuid not null references public.reports(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create table public.period_audit (
  id bigint generated always as identity primary key,
  period_start date not null references public.report_periods(period_start),
  actor_id uuid references auth.users(id),
  old_state text not null,
  new_state text not null,
  created_at timestamptz not null default now()
);

create index indicators_unit_active_idx on public.indicators(unit_id, active);
create index indicators_effective_idx on public.indicators(effective_from, effective_until);
create index reports_unit_period_idx on public.reports(unit_id, period_start);
create index report_entries_indicator_idx on public.report_entries(indicator_id);
create index report_audit_report_idx on public.report_audit(report_id, created_at desc);
create index period_audit_period_idx on public.period_audit(period_start, created_at desc);

create function public.spm_current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid())
$$;

create function public.spm_current_unit()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.unit_id from public.profiles p where p.id = (select auth.uid())
$$;

create function public.spm_can(permission_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(lower(p.permissions ->> permission_name) = 'true', false)
  from public.profiles p
  where p.id = (select auth.uid())
$$;

create function public.spm_audit_report_change()
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

create function public.spm_audit_entry_change()
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

create function public.spm_audit_period_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.state is distinct from new.state then
    insert into public.period_audit (period_start, actor_id, old_state, new_state)
    values (new.period_start, (select auth.uid()), old.state, new.state);
  end if;
  return new;
end;
$$;

revoke execute on function public.spm_current_role() from public, anon;
revoke execute on function public.spm_current_unit() from public, anon;
revoke execute on function public.spm_can(text) from public, anon;
grant execute on function public.spm_current_role() to authenticated;
grant execute on function public.spm_current_unit() to authenticated;
grant execute on function public.spm_can(text) to authenticated;

create trigger reports_audit_after_change
after insert or update on public.reports
for each row execute function public.spm_audit_report_change();

create trigger report_entries_audit_after_change
after insert or update on public.report_entries
for each row execute function public.spm_audit_entry_change();

create trigger report_periods_audit_after_change
after update on public.report_periods
for each row execute function public.spm_audit_period_change();

alter table public.units enable row level security;
alter table public.profiles enable row level security;
alter table public.indicators enable row level security;
alter table public.report_periods enable row level security;
alter table public.reports enable row level security;
alter table public.report_entries enable row level security;
alter table public.report_audit enable row level security;
alter table public.period_audit enable row level security;

revoke all on public.units, public.profiles, public.indicators, public.report_periods, public.reports, public.report_entries, public.report_audit, public.period_audit from anon;
grant select on public.units, public.profiles, public.indicators, public.report_periods, public.reports, public.report_entries, public.report_audit, public.period_audit to authenticated;
grant insert, update, delete on public.units, public.profiles, public.indicators to authenticated;
grant insert, update on public.report_periods to authenticated;
grant insert on public.reports to authenticated;
grant insert, update on public.report_entries to authenticated;

create policy "authenticated users can view units" on public.units
for select to authenticated using (true);

create policy "managers manage units" on public.units
for all to authenticated using (public.spm_can('manage_users'))
with check (public.spm_can('manage_users'));

create policy "users view own profile or user managers view all" on public.profiles
for select to authenticated using (id = (select auth.uid()) or public.spm_can('manage_users'));

create policy "authorized users manage profiles" on public.profiles
for all to authenticated using (public.spm_can('manage_users'))
with check (public.spm_can('manage_users'));

create policy "users view assigned active indicators" on public.indicators
for select to authenticated using (
  (active and (unit_id is null or unit_id = public.spm_current_unit()))
  or public.spm_can('manage_indicators')
);

create policy "authorized users manage indicators" on public.indicators
for all to authenticated using (public.spm_can('manage_indicators'))
with check (public.spm_can('manage_indicators'));

create policy "users view reporting periods" on public.report_periods
for select to authenticated using (true);

create policy "authorized users manage reporting periods" on public.report_periods
for insert to authenticated with check (public.spm_can('manage_periods'));

create policy "authorized users update reporting periods" on public.report_periods
for update to authenticated using (public.spm_can('manage_periods'))
with check (public.spm_can('manage_periods'));

create policy "users view reports in their scope" on public.reports
for select to authenticated using (
  (public.spm_can('view_own_unit_reports') and unit_id = public.spm_current_unit())
  or public.spm_can('view_all_reports')
);

create policy "unit staff create report in open period" on public.reports
for insert to authenticated with check (
  public.spm_can('input_reports')
  and unit_id = public.spm_current_unit()
  and created_by = (select auth.uid())
  and exists (
    select 1 from public.report_periods p
    where p.period_start = reports.period_start and p.state = 'open'
  )
);

create policy "users view entries in their scope" on public.report_entries
for select to authenticated using (
  public.spm_can('view_all_reports')
  or exists (
    select 1 from public.reports r
    where r.id = report_id
      and public.spm_can('view_own_unit_reports')
      and r.unit_id = public.spm_current_unit()
  )
);

create policy "unit staff add entries in open period" on public.report_entries
for insert to authenticated with check (
  exists (
    select 1 from public.reports r
    join public.report_periods p on p.period_start = r.period_start
    where r.id = report_id
      and r.unit_id = public.spm_current_unit()
      and public.spm_can('input_reports')
      and p.state = 'open'
  )
  and exists (
    select 1 from public.indicators i
    where i.id = indicator_id and i.active
      and (i.unit_id is null or i.unit_id = public.spm_current_unit())
  )
);

create policy "authorized users update entries in open or permitted locked periods" on public.report_entries
for update to authenticated using (
  exists (
    select 1 from public.reports r
    join public.report_periods p on p.period_start = r.period_start
    where r.id = report_id
      and (
        (r.unit_id = public.spm_current_unit() and public.spm_can('input_reports') and p.state = 'open')
        or (public.spm_can('edit_locked_periods') and p.state = 'locked')
      )
  )
) with check (
  exists (
    select 1 from public.reports r
    join public.report_periods p on p.period_start = r.period_start
    where r.id = report_id
      and (
        (r.unit_id = public.spm_current_unit() and public.spm_can('input_reports') and p.state = 'open')
        or (public.spm_can('edit_locked_periods') and p.state = 'locked')
      )
  )
  and exists (
    select 1 from public.indicators i
    where i.id = indicator_id and (i.unit_id is null or i.unit_id = public.spm_current_unit() or public.spm_can('edit_locked_periods'))
  )
);

create policy "authorized users view report audit" on public.report_audit
for select to authenticated using (public.spm_can('view_audit') or public.spm_can('manage_users'));

create policy "authorized users view period audit" on public.period_audit
for select to authenticated using (public.spm_can('view_audit') or public.spm_can('manage_periods'));
