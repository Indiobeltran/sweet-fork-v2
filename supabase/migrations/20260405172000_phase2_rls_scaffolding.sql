grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant select on public.products to anon;
grant select on public.product_prices to anon;
grant select on public.gallery_categories to anon;
grant select on public.site_settings to anon;
grant select on public.faq_items to anon;
grant select on public.testimonials to anon;
grant select on public.content_blocks to anon;
grant select on public.media_assets to anon;
grant select on public.media_assignments to anon;

create or replace function public.current_admin_role()
returns public.admin_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.user_roles
  where user_id = auth.uid()
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_admin_role() in ('owner', 'manager')
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_admin_role() = 'owner'
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array ARRAY[
    'profiles',
    'user_roles',
    'customers',
    'products',
    'product_prices',
    'pricing_rules',
    'gallery_categories',
    'media_assets',
    'content_blocks',
    'site_settings',
    'faq_items',
    'testimonials',
    'inquiries',
    'inquiry_items',
    'inquiry_assets',
    'inquiry_notes',
    'orders',
    'order_items',
    'payments',
    'order_notes',
    'media_assignments',
    'calendar_entries',
    'blackout_dates',
    'notification_events',
    'notification_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security;', table_name);
  end loop;
end;
$$;

create policy "profiles_select_self_or_admin"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_self_or_admin"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "profiles_insert_owner"
  on public.profiles
  for insert
  to authenticated
  with check (public.is_owner());

create policy "profiles_delete_owner"
  on public.profiles
  for delete
  to authenticated
  using (public.is_owner());

create policy "user_roles_select_admin"
  on public.user_roles
  for select
  to authenticated
  using (public.is_admin());

create policy "user_roles_insert_owner"
  on public.user_roles
  for insert
  to authenticated
  with check (public.is_owner());

create policy "user_roles_update_owner"
  on public.user_roles
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "user_roles_delete_owner"
  on public.user_roles
  for delete
  to authenticated
  using (public.is_owner());

do $$
declare
  table_name text;
begin
  foreach table_name in array ARRAY[
    'customers',
    'pricing_rules',
    'inquiries',
    'inquiry_items',
    'inquiry_assets',
    'inquiry_notes',
    'orders',
    'order_items',
    'payments',
    'order_notes',
    'calendar_entries',
    'blackout_dates',
    'notification_events',
    'notification_logs'
  ]
  loop
    execute format(
      'create policy admin_select on public.%I for select to authenticated using (public.is_admin());',
      table_name
    );
    execute format(
      'create policy admin_insert on public.%I for insert to authenticated with check (public.is_admin());',
      table_name
    );
    execute format(
      'create policy admin_update on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin());',
      table_name
    );
    execute format(
      'create policy admin_delete on public.%I for delete to authenticated using (public.is_admin());',
      table_name
    );
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array ARRAY[
    'products',
    'product_prices',
    'gallery_categories',
    'media_assets',
    'content_blocks',
    'site_settings',
    'faq_items',
    'testimonials',
    'media_assignments'
  ]
  loop
    execute format(
      'create policy admin_select on public.%I for select to authenticated using (public.is_admin());',
      table_name
    );
    execute format(
      'create policy admin_insert on public.%I for insert to authenticated with check (public.is_admin());',
      table_name
    );
    execute format(
      'create policy admin_update on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin());',
      table_name
    );
    execute format(
      'create policy admin_delete on public.%I for delete to authenticated using (public.is_admin());',
      table_name
    );
  end loop;
end;
$$;

create policy "products_public_read"
  on public.products
  for select
  to anon, authenticated
  using (is_active);

create policy "product_prices_public_read"
  on public.product_prices
  for select
  to anon, authenticated
  using (
    is_active
    and (effective_to is null or effective_to >= current_date)
  );

create policy "gallery_categories_public_read"
  on public.gallery_categories
  for select
  to anon, authenticated
  using (is_active);

create policy "site_settings_public_read"
  on public.site_settings
  for select
  to anon, authenticated
  using (is_public);

create policy "faq_items_public_read"
  on public.faq_items
  for select
  to anon, authenticated
  using (is_published);

create policy "testimonials_public_read"
  on public.testimonials
  for select
  to anon, authenticated
  using (is_published);

create policy "content_blocks_public_read"
  on public.content_blocks
  for select
  to anon, authenticated
  using (is_active);

create policy "media_assets_public_read"
  on public.media_assets
  for select
  to anon, authenticated
  using (public_url is not null);

create policy "media_assignments_public_read"
  on public.media_assignments
  for select
  to anon, authenticated
  using (page_key is not null);
