alter table public.profiles
  add column if not exists active boolean;

update public.profiles
set active = true
where active is null;

alter table public.profiles
  alter column active set default true;

alter table public.profiles
  alter column active set not null;
