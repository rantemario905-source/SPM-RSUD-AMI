alter table public.indicators
  drop constraint if exists indicators_calculation_method_check;

alter table public.indicators
  add constraint indicators_calculation_method_check
  check (calculation_method in ('percentage', 'average', 'scaled', 'numerator', 'direct'));
