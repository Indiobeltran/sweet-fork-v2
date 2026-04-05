create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.admin_role as enum ('owner', 'manager');
create type public.product_type as enum (
  'custom-cake',
  'wedding-cake',
  'cupcakes',
  'sugar-cookies',
  'macarons',
  'diy-kit'
);
create type public.inquiry_status as enum (
  'new',
  'reviewing',
  'quoted',
  'approved',
  'declined',
  'archived'
);
create type public.order_status as enum (
  'draft',
  'quoted',
  'confirmed',
  'in-production',
  'fulfilled',
  'completed',
  'cancelled'
);
create type public.payment_status as enum ('unpaid', 'deposit-paid', 'paid', 'refunded');
create type public.payment_record_status as enum ('pending', 'paid', 'failed', 'refunded', 'voided');
create type public.contact_preference as enum ('email', 'text', 'phone');
create type public.fulfillment_method as enum ('pickup', 'delivery');
create type public.inquiry_source as enum ('web', 'manual', 'email', 'phone', 'instagram', 'referral');
create type public.inquiry_asset_type as enum ('image-upload', 'reference-link', 'reference-text');
create type public.internal_note_type as enum ('internal', 'system');
create type public.product_shape as enum ('round', 'heart', 'sheet', 'tiered', 'mini', 'assorted');
create type public.icing_style as enum ('buttercream', 'fondant', 'textured', 'painted', 'mixed');
create type public.content_block_type as enum (
  'hero',
  'rich-text',
  'feature-list',
  'cta',
  'gallery-grid',
  'faq-group',
  'testimonial-group',
  'pricing-summary',
  'page-meta'
);
create type public.product_price_kind as enum (
  'base',
  'starting',
  'per-serving',
  'per-unit',
  'package',
  'delivery-add-on'
);
create type public.pricing_rule_scope as enum ('product', 'order', 'delivery', 'seasonal');
create type public.pricing_rule_type as enum (
  'base',
  'per-serving',
  'per-unit',
  'complexity',
  'tier-count',
  'shape',
  'rush',
  'delivery',
  'discount',
  'surcharge'
);
create type public.pricing_adjustment_mode as enum ('fixed', 'per-unit', 'percentage', 'range-override');
create type public.media_asset_kind as enum ('image', 'document', 'video');
create type public.media_source_kind as enum ('upload', 'external');
create type public.media_assignment_type as enum (
  'page',
  'content-block',
  'product',
  'gallery-category',
  'faq-item',
  'testimonial'
);
create type public.calendar_entry_type as enum (
  'consultation',
  'tasting',
  'pickup',
  'delivery',
  'order-deadline',
  'task',
  'personal',
  'holiday',
  'blackout'
);
create type public.blackout_scope as enum ('all', 'pickup', 'delivery');
create type public.payment_type as enum ('deposit', 'balance', 'full', 'adjustment', 'refund');
create type public.payment_method as enum ('cash', 'card', 'invoice', 'bank-transfer', 'other');
create type public.notification_channel as enum ('email', 'sms', 'internal');
create type public.notification_delivery_status as enum ('pending', 'sent', 'failed', 'skipped');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext unique,
  full_name text,
  phone text,
  timezone text not null default 'America/Denver',
  is_active boolean not null default true,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  role public.admin_role not null,
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  email citext unique,
  full_name text not null,
  phone text,
  instagram_handle text,
  preferred_contact public.contact_preference not null default 'email',
  lead_source text,
  notes text,
  default_fulfillment_method public.fulfillment_method,
  last_inquiry_at timestamptz,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  product_type public.product_type not null unique,
  slug text not null unique,
  name text not null,
  short_description text,
  long_description text,
  is_active boolean not null default true,
  requires_consultation boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_format check (slug ~ '^[a-z0-9-]+$')
);

create table public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  price_kind public.product_price_kind not null,
  label text not null,
  unit_label text,
  minimum_amount numeric(12,2) not null,
  maximum_amount numeric(12,2),
  quantity_step numeric(10,2),
  currency_code char(3) not null default 'USD',
  effective_from date not null default current_date,
  effective_to date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_prices_min_nonnegative check (minimum_amount >= 0),
  constraint product_prices_max_valid check (maximum_amount is null or maximum_amount >= minimum_amount),
  constraint product_prices_effective_window check (effective_to is null or effective_to >= effective_from),
  constraint product_prices_unique_window unique (product_id, price_kind, label, effective_from)
);

create table public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade,
  rule_scope public.pricing_rule_scope not null default 'product',
  rule_type public.pricing_rule_type not null,
  rule_name text not null,
  description text,
  criteria jsonb not null default '{}'::jsonb,
  adjustment_mode public.pricing_adjustment_mode not null,
  adjustment_min numeric(12,2),
  adjustment_max numeric(12,2),
  priority integer not null default 100,
  starts_on date,
  ends_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pricing_rules_criteria_object check (jsonb_typeof(criteria) = 'object'),
  constraint pricing_rules_adjustment_present check (
    adjustment_min is not null or adjustment_max is not null
  ),
  constraint pricing_rules_date_window check (ends_on is null or ends_on >= starts_on)
);

create table public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_categories_slug_format check (slug ~ '^[a-z0-9-]+$')
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'marketing',
  storage_path text not null unique,
  public_url text,
  asset_kind public.media_asset_kind not null default 'image',
  source_kind public.media_source_kind not null default 'upload',
  mime_type text,
  original_filename text,
  alt_text text,
  caption text,
  file_size_bytes bigint,
  width integer,
  height integer,
  checksum text,
  focal_point jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  uploaded_by_profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assets_size_nonnegative check (file_size_bytes is null or file_size_bytes >= 0),
  constraint media_assets_width_positive check (width is null or width > 0),
  constraint media_assets_height_positive check (height is null or height > 0),
  constraint media_assets_focal_point_object check (jsonb_typeof(focal_point) = 'object'),
  constraint media_assets_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  section_key text not null,
  block_key text not null,
  block_type public.content_block_type not null,
  label text,
  eyebrow text,
  heading text,
  body text,
  items_json jsonb not null default '[]'::jsonb,
  settings_json jsonb not null default '{}'::jsonb,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_blocks_unique_key unique (page_key, section_key, block_key),
  constraint content_blocks_items_array check (jsonb_typeof(items_json) = 'array'),
  constraint content_blocks_settings_object check (jsonb_typeof(settings_json) = 'object')
);

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  category_key text not null,
  label text not null,
  description text,
  value_json jsonb not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  category_key text not null,
  question text not null,
  answer text not null,
  display_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint faq_items_unique_question unique (category_key, question)
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  quote text not null,
  attribution_name text not null,
  attribution_role text,
  source_label text,
  display_order integer not null default 0,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  status public.inquiry_status not null default 'new',
  source_channel public.inquiry_source not null default 'web',
  customer_name text not null,
  customer_email citext not null,
  customer_phone text not null,
  instagram_handle text,
  preferred_contact public.contact_preference not null default 'email',
  how_did_you_hear text,
  event_type text not null,
  event_date date not null,
  event_time text,
  guest_count integer,
  serving_target integer,
  venue_name text,
  venue_address text,
  fulfillment_method public.fulfillment_method not null default 'pickup',
  delivery_window text,
  budget_min numeric(12,2),
  budget_max numeric(12,2),
  color_palette text,
  dietary_notes text,
  additional_notes text,
  inspiration_text text,
  internal_summary text,
  estimated_min numeric(12,2),
  estimated_max numeric(12,2),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiries_guest_count_positive check (guest_count is null or guest_count > 0),
  constraint inquiries_serving_target_positive check (serving_target is null or serving_target > 0),
  constraint inquiries_budget_min_nonnegative check (budget_min is null or budget_min >= 0),
  constraint inquiries_budget_max_nonnegative check (budget_max is null or budget_max >= 0),
  constraint inquiries_budget_range check (budget_max is null or budget_min is null or budget_max >= budget_min),
  constraint inquiries_estimate_range check (
    estimated_max is null or estimated_min is null or estimated_max >= estimated_min
  ),
  constraint inquiries_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.inquiry_items (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_type public.product_type not null,
  product_label text not null,
  quantity integer not null default 1,
  sort_order integer not null default 0,
  servings integer,
  flavor_notes text,
  design_notes text,
  inspiration_notes text,
  size_label text,
  tiers smallint,
  shape public.product_shape,
  icing_style public.icing_style,
  cupcake_count integer,
  cookie_count integer,
  macaron_count integer,
  kit_count integer,
  wedding_servings integer,
  topper_text text,
  color_palette text,
  estimated_min numeric(12,2),
  estimated_max numeric(12,2),
  detail_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiry_items_quantity_positive check (quantity > 0),
  constraint inquiry_items_servings_positive check (servings is null or servings > 0),
  constraint inquiry_items_tiers_range check (tiers is null or tiers between 1 and 6),
  constraint inquiry_items_cupcake_count_positive check (cupcake_count is null or cupcake_count > 0),
  constraint inquiry_items_cookie_count_positive check (cookie_count is null or cookie_count > 0),
  constraint inquiry_items_macaron_count_positive check (macaron_count is null or macaron_count > 0),
  constraint inquiry_items_kit_count_positive check (kit_count is null or kit_count > 0),
  constraint inquiry_items_wedding_servings_positive check (wedding_servings is null or wedding_servings > 0),
  constraint inquiry_items_estimate_range check (
    estimated_max is null or estimated_min is null or estimated_max >= estimated_min
  ),
  constraint inquiry_items_detail_object check (jsonb_typeof(detail_json) = 'object')
);

create table public.inquiry_assets (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  inquiry_item_id uuid references public.inquiry_items (id) on delete cascade,
  media_asset_id uuid references public.media_assets (id) on delete set null,
  asset_type public.inquiry_asset_type not null,
  label text,
  asset_url text,
  external_url text,
  text_content text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiry_assets_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint inquiry_assets_payload_valid check (
    (asset_type = 'image-upload' and (media_asset_id is not null or asset_url is not null) and external_url is null and text_content is null)
    or
    (asset_type = 'reference-link' and external_url is not null and text_content is null)
    or
    (asset_type = 'reference-text' and text_content is not null and external_url is null)
  )
);

create table public.inquiry_notes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  author_profile_id uuid references public.profiles (id) on delete set null,
  note_type public.internal_note_type not null default 'internal',
  note_body text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  inquiry_id uuid unique references public.inquiries (id) on delete set null,
  status public.order_status not null default 'draft',
  payment_status public.payment_status not null default 'unpaid',
  fulfillment_method public.fulfillment_method not null default 'pickup',
  event_type text not null,
  event_date date not null,
  due_at timestamptz,
  venue_name text,
  venue_address text,
  fulfillment_window text,
  delivery_address text,
  subtotal_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  deposit_due_amount numeric(12,2) not null default 0,
  balance_due_amount numeric(12,2) not null default 0,
  deposit_due_at timestamptz,
  final_due_at timestamptz,
  internal_summary text,
  production_notes text,
  quoted_at timestamptz,
  confirmed_at timestamptz,
  fulfilled_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_subtotal_nonnegative check (subtotal_amount >= 0),
  constraint orders_discount_nonnegative check (discount_amount >= 0),
  constraint orders_delivery_fee_nonnegative check (delivery_fee >= 0),
  constraint orders_tax_nonnegative check (tax_amount >= 0),
  constraint orders_total_nonnegative check (total_amount >= 0),
  constraint orders_deposit_due_nonnegative check (deposit_due_amount >= 0),
  constraint orders_balance_due_nonnegative check (balance_due_amount >= 0),
  constraint orders_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  inquiry_item_id uuid references public.inquiry_items (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  product_type public.product_type not null,
  product_label text not null,
  quantity integer not null default 1,
  sort_order integer not null default 0,
  servings integer,
  size_label text,
  tiers smallint,
  shape public.product_shape,
  icing_style public.icing_style,
  cupcake_count integer,
  cookie_count integer,
  macaron_count integer,
  kit_count integer,
  wedding_servings integer,
  flavor_notes text,
  design_notes text,
  kitchen_notes text,
  topper_text text,
  color_palette text,
  unit_price numeric(12,2),
  line_total numeric(12,2),
  detail_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_servings_positive check (servings is null or servings > 0),
  constraint order_items_tiers_range check (tiers is null or tiers between 1 and 6),
  constraint order_items_cupcake_count_positive check (cupcake_count is null or cupcake_count > 0),
  constraint order_items_cookie_count_positive check (cookie_count is null or cookie_count > 0),
  constraint order_items_macaron_count_positive check (macaron_count is null or macaron_count > 0),
  constraint order_items_kit_count_positive check (kit_count is null or kit_count > 0),
  constraint order_items_wedding_servings_positive check (wedding_servings is null or wedding_servings > 0),
  constraint order_items_unit_price_nonnegative check (unit_price is null or unit_price >= 0),
  constraint order_items_line_total_nonnegative check (line_total is null or line_total >= 0),
  constraint order_items_detail_object check (jsonb_typeof(detail_json) = 'object')
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  payment_type public.payment_type not null default 'deposit',
  status public.payment_record_status not null default 'pending',
  amount numeric(12,2) not null,
  method public.payment_method not null default 'invoice',
  currency_code char(3) not null default 'USD',
  due_at timestamptz,
  paid_at timestamptz,
  reference_code text,
  provider_name text,
  provider_intent_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_positive check (amount > 0)
);

create table public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  author_profile_id uuid references public.profiles (id) on delete set null,
  note_type public.internal_note_type not null default 'internal',
  note_body text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_assignments (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null references public.media_assets (id) on delete cascade,
  assignment_type public.media_assignment_type not null,
  target_id uuid,
  page_key text,
  section_key text,
  slot_key text not null default 'default',
  display_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assignments_target_present check (target_id is not null or page_key is not null),
  constraint media_assignments_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.calendar_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type public.calendar_entry_type not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  customer_id uuid references public.customers (id) on delete set null,
  inquiry_id uuid references public.inquiries (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  location_text text,
  notes text,
  color_token text,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_entries_time_window check (ends_at is null or ends_at >= starts_at)
);

create table public.blackout_dates (
  id uuid primary key default gen_random_uuid(),
  starts_on date not null,
  ends_on date not null,
  scope public.blackout_scope not null default 'all',
  reason text not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blackout_dates_window check (ends_on >= starts_on)
);

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  category_key text not null,
  description text,
  default_channels jsonb not null default '[]'::jsonb,
  template_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_events_channels_array check (jsonb_typeof(default_channels) = 'array')
);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  notification_event_id uuid references public.notification_events (id) on delete set null,
  inquiry_id uuid references public.inquiries (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  customer_id uuid references public.customers (id) on delete set null,
  channel public.notification_channel not null,
  status public.notification_delivery_status not null default 'pending',
  recipient text not null,
  subject text,
  payload jsonb not null default '{}'::jsonb,
  response_json jsonb not null default '{}'::jsonb,
  error_message text,
  attempted_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_logs_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint notification_logs_response_object check (jsonb_typeof(response_json) = 'object')
);

create index idx_user_roles_role on public.user_roles (role);

create index idx_customers_full_name on public.customers (full_name);
create index idx_customers_last_inquiry_at on public.customers (last_inquiry_at desc);
create index idx_customers_last_order_at on public.customers (last_order_at desc);

create index idx_products_active_order on public.products (is_active, display_order);

create index idx_product_prices_product_active on public.product_prices (product_id, is_active, effective_from desc);
create index idx_pricing_rules_product_active_priority on public.pricing_rules (product_id, is_active, priority);
create index idx_gallery_categories_active_order on public.gallery_categories (is_active, display_order);

create index idx_media_assets_bucket_created on public.media_assets (bucket, created_at desc);
create index idx_media_assets_kind_created on public.media_assets (asset_kind, created_at desc);

create index idx_content_blocks_page_section on public.content_blocks (page_key, section_key, is_active, display_order);
create index idx_site_settings_category on public.site_settings (category_key, is_public);
create index idx_faq_items_category on public.faq_items (category_key, is_published, display_order);
create index idx_testimonials_published_featured on public.testimonials (is_published, is_featured, display_order);

create index idx_inquiries_status_event_date on public.inquiries (status, event_date);
create index idx_inquiries_customer_email on public.inquiries (customer_email);
create index idx_inquiries_customer_id on public.inquiries (customer_id);
create index idx_inquiries_submitted_at on public.inquiries (submitted_at desc);

create index idx_inquiry_items_inquiry on public.inquiry_items (inquiry_id, sort_order);
create index idx_inquiry_items_product_type on public.inquiry_items (product_type);
create index idx_inquiry_assets_inquiry on public.inquiry_assets (inquiry_id, sort_order);
create index idx_inquiry_assets_item on public.inquiry_assets (inquiry_item_id);
create index idx_inquiry_notes_inquiry on public.inquiry_notes (inquiry_id, created_at desc);

create index idx_orders_customer_status_date on public.orders (customer_id, status, event_date);
create index idx_orders_inquiry_id on public.orders (inquiry_id);
create index idx_orders_due_at on public.orders (due_at);

create index idx_order_items_order on public.order_items (order_id, sort_order);
create index idx_order_items_inquiry_item on public.order_items (inquiry_item_id);
create index idx_payments_order_status_due on public.payments (order_id, status, due_at);
create index idx_order_notes_order on public.order_notes (order_id, created_at desc);

create index idx_media_assignments_lookup on public.media_assignments (assignment_type, target_id, display_order);
create index idx_media_assignments_page_section on public.media_assignments (page_key, section_key, display_order);
create unique index idx_media_assignments_unique_context
  on public.media_assignments (
    media_asset_id,
    assignment_type,
    coalesce(target_id::text, ''),
    coalesce(page_key, ''),
    coalesce(section_key, ''),
    slot_key
  );

create index idx_calendar_entries_starts_at on public.calendar_entries (starts_at);
create index idx_calendar_entries_entry_type on public.calendar_entries (entry_type);
create index idx_calendar_entries_order on public.calendar_entries (order_id);
create index idx_calendar_entries_inquiry on public.calendar_entries (inquiry_id);

create index idx_blackout_dates_range on public.blackout_dates (starts_on, ends_on);
create index idx_blackout_dates_active on public.blackout_dates (is_active);

create index idx_notification_events_category on public.notification_events (category_key, is_active);
create index idx_notification_logs_status_created on public.notification_logs (status, created_at desc);
create index idx_notification_logs_event on public.notification_logs (notification_event_id, created_at desc);
create index idx_notification_logs_order on public.notification_logs (order_id);
create index idx_notification_logs_inquiry on public.notification_logs (inquiry_id);

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
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      table_name,
      table_name
    );
  end loop;
end;
$$;
