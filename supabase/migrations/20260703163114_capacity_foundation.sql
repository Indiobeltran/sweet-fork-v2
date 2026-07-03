alter table public.products
  add column if not exists capacity_points integer not null default 2;

alter table public.order_items
  add column if not exists capacity_points_override integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_capacity_points_positive'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_capacity_points_positive check (capacity_points > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_capacity_points_override_positive'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_capacity_points_override_positive
      check (capacity_points_override is null or capacity_points_override > 0);
  end if;
end;
$$;

update public.products
set capacity_points = 2
where capacity_points is null or capacity_points <= 0;

insert into public.site_settings (
  setting_key,
  category_key,
  label,
  description,
  value_json,
  is_public
)
values (
  'capacity.settings',
  'capacity',
  'Capacity settings',
  'Operational workload capacity settings for the admin calendar.',
  jsonb_build_object(
    'weekly_capacity_ceiling', 12,
    'week_start_day', 0
  ),
  false
)
on conflict (setting_key) do update
set
  category_key = excluded.category_key,
  label = excluded.label,
  description = excluded.description,
  value_json = excluded.value_json || public.site_settings.value_json,
  is_public = excluded.is_public,
  updated_at = now();
