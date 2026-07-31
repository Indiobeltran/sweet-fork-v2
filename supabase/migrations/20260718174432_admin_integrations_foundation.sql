create table public.integration_connections (
  provider text primary key,
  enabled boolean not null default false,
  mode text not null default 'sandbox',
  status text not null default 'not-configured',
  display_name text,
  external_account_id text,
  config_json jsonb not null default '{}'::jsonb,
  last_event_at timestamptz,
  last_sync_at timestamptz,
  last_success_at timestamptz,
  last_error_code text,
  last_error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_connections_provider_valid check (
    provider in ('square', 'google-calendar', 'resend', 'google-maps')
  ),
  constraint integration_connections_mode_valid check (
    mode in ('sandbox', 'production')
  ),
  constraint integration_connections_status_valid check (
    status in ('not-configured', 'ready', 'degraded', 'error', 'disabled')
  ),
  constraint integration_connections_config_object check (
    jsonb_typeof(config_json) = 'object'
  )
);

create table public.integration_links (
  id uuid primary key default gen_random_uuid(),
  provider text not null references public.integration_connections (provider) on delete cascade,
  local_entity_type text not null,
  local_entity_id uuid not null,
  external_entity_type text not null,
  external_id text not null,
  external_parent_id text,
  external_version text,
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_links_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint integration_links_external_unique unique (provider, external_entity_type, external_id),
  constraint integration_links_local_unique unique (
    provider,
    local_entity_type,
    local_entity_id,
    external_entity_type
  )
);

create table public.integration_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null references public.integration_connections (provider) on delete cascade,
  external_event_id text not null,
  event_type text not null,
  status text not null default 'pending',
  entity_type text,
  entity_id text,
  payload_checksum text not null,
  occurred_at timestamptz,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  attempt_count integer not null default 0,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_webhook_events_status_valid check (
    status in ('pending', 'processing', 'processed', 'failed', 'ignored')
  ),
  constraint integration_webhook_events_attempt_nonnegative check (attempt_count >= 0),
  constraint integration_webhook_events_provider_event_unique unique (provider, external_event_id)
);

create table public.integration_sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  provider text not null references public.integration_connections (provider) on delete cascade,
  integration_link_id uuid references public.integration_links (id) on delete set null,
  local_entity_type text,
  local_entity_id uuid,
  conflict_type text not null,
  field_name text,
  local_value jsonb not null default 'null'::jsonb,
  external_value jsonb not null default 'null'::jsonb,
  status text not null default 'open',
  resolution_note text,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_sync_conflicts_status_valid check (
    status in ('open', 'resolved', 'ignored')
  )
);

create table public.delivery_route_snapshots (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references public.inquiries (id) on delete cascade,
  inquiry_quote_id uuid references public.inquiry_quotes (id) on delete cascade,
  order_id uuid references public.orders (id) on delete cascade,
  provider text not null default 'google-maps',
  normalized_destination text not null,
  destination_place_id text,
  distance_meters integer not null,
  duration_seconds integer,
  round_trip_miles numeric(10,2) not null,
  mileage_rate numeric(10,3) not null,
  calculated_fee numeric(12,2) not null,
  owner_override_fee numeric(12,2),
  provider_response_hash text not null,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint delivery_route_snapshots_parent_present check (
    inquiry_id is not null or inquiry_quote_id is not null or order_id is not null
  ),
  constraint delivery_route_snapshots_distance_nonnegative check (distance_meters >= 0),
  constraint delivery_route_snapshots_duration_nonnegative check (
    duration_seconds is null or duration_seconds >= 0
  ),
  constraint delivery_route_snapshots_miles_nonnegative check (round_trip_miles >= 0),
  constraint delivery_route_snapshots_rate_nonnegative check (mileage_rate >= 0),
  constraint delivery_route_snapshots_fee_nonnegative check (calculated_fee >= 0),
  constraint delivery_route_snapshots_override_nonnegative check (
    owner_override_fee is null or owner_override_fee >= 0
  )
);

create index integration_links_local_idx
  on public.integration_links (provider, local_entity_type, local_entity_id);
create index integration_webhook_events_status_idx
  on public.integration_webhook_events (provider, status, received_at);
create index integration_sync_conflicts_open_idx
  on public.integration_sync_conflicts (provider, detected_at desc)
  where status = 'open';
create index delivery_route_snapshots_quote_idx
  on public.delivery_route_snapshots (inquiry_quote_id, calculated_at desc);
create unique index payments_provider_intent_unique_idx
  on public.payments (provider_name, provider_intent_id);

create trigger set_integration_connections_updated_at
  before update on public.integration_connections
  for each row execute function public.set_updated_at();
create trigger set_integration_links_updated_at
  before update on public.integration_links
  for each row execute function public.set_updated_at();
create trigger set_integration_webhook_events_updated_at
  before update on public.integration_webhook_events
  for each row execute function public.set_updated_at();
create trigger set_integration_sync_conflicts_updated_at
  before update on public.integration_sync_conflicts
  for each row execute function public.set_updated_at();

alter table public.integration_connections enable row level security;
alter table public.integration_links enable row level security;
alter table public.integration_webhook_events enable row level security;
alter table public.integration_sync_conflicts enable row level security;
alter table public.delivery_route_snapshots enable row level security;

revoke all on public.integration_connections from anon, authenticated;
revoke all on public.integration_links from anon, authenticated;
revoke all on public.integration_webhook_events from anon, authenticated;
revoke all on public.integration_sync_conflicts from anon, authenticated;
revoke all on public.delivery_route_snapshots from anon, authenticated;

grant select on public.integration_connections to authenticated;
grant select on public.integration_links to authenticated;
grant select on public.integration_webhook_events to authenticated;
grant select, update on public.integration_sync_conflicts to authenticated;
grant select on public.delivery_route_snapshots to authenticated;

grant select, insert, update, delete on public.integration_connections to service_role;
grant select, insert, update, delete on public.integration_links to service_role;
grant select, insert, update, delete on public.integration_webhook_events to service_role;
grant select, insert, update, delete on public.integration_sync_conflicts to service_role;
grant select, insert, update, delete on public.delivery_route_snapshots to service_role;

create policy integration_connections_admin_select
  on public.integration_connections for select to authenticated
  using ((select public.is_admin()));
create policy integration_connections_owner_insert
  on public.integration_connections for insert to authenticated
  with check ((select public.is_owner()));
create policy integration_connections_owner_update
  on public.integration_connections for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy integration_connections_owner_delete
  on public.integration_connections for delete to authenticated
  using ((select public.is_owner()));

create policy integration_links_admin_select
  on public.integration_links for select to authenticated
  using ((select public.is_admin()));
create policy integration_webhook_events_admin_select
  on public.integration_webhook_events for select to authenticated
  using ((select public.is_admin()));
create policy integration_sync_conflicts_admin_select
  on public.integration_sync_conflicts for select to authenticated
  using ((select public.is_admin()));
create policy integration_sync_conflicts_admin_update
  on public.integration_sync_conflicts for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy delivery_route_snapshots_admin_select
  on public.delivery_route_snapshots for select to authenticated
  using ((select public.is_admin()));

insert into public.integration_connections (provider, enabled, mode, status, display_name)
values
  ('square', false, 'sandbox', 'disabled', 'Square'),
  ('google-calendar', false, 'sandbox', 'disabled', 'Google Calendar'),
  ('resend', false, 'sandbox', 'disabled', 'Customer email'),
  ('google-maps', false, 'sandbox', 'disabled', 'Delivery routing')
on conflict (provider) do nothing;

insert into public.notification_events (
  event_key,
  category_key,
  description,
  default_channels,
  template_key,
  is_active
)
values
  (
    'order.booking-confirmed',
    'orders',
    'Sent after a deposit confirms an order.',
    '["email"]'::jsonb,
    'booking-confirmed',
    true
  ),
  (
    'order.fulfillment-reminder',
    'orders',
    'Sent 48 hours before pickup or delivery unless suppressed on the order.',
    '["email"]'::jsonb,
    'fulfillment-reminder',
    true
  ),
  (
    'order.review-request',
    'orders',
    'Sent 24 hours after an order is completed.',
    '["email"]'::jsonb,
    'review-request',
    true
  )
on conflict (event_key) do update
set
  category_key = excluded.category_key,
  description = excluded.description,
  default_channels = excluded.default_channels,
  template_key = excluded.template_key,
  updated_at = now();
