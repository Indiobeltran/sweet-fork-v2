-- Force-align public-facing marketing data to the premium Sweet Fork production baseline.
-- This intentionally overwrites stale placeholder-era values so Supabase matches the
-- current Utah brand, pricing minimums, and inquiry-first positioning.

insert into public.site_settings (
  setting_key,
  category_key,
  label,
  description,
  value_json,
  is_public
)
values
  (
    'brand.identity',
    'brand',
    'Brand Identity',
    'Primary public brand identity used across the site and email templates.',
    jsonb_build_object(
      'name', 'The Sweet Fork',
      'tagline', 'Custom cakes and desserts made to order',
      'description', 'Custom cakes, wedding cakes, cupcakes, macarons, and decorated cookies made to order in Centerville, Utah. Artisan quality, limited availability.'
    ),
    true
  ),
  (
    'contact.primary',
    'contact',
    'Primary Contact',
    'Default bakery contact information for inquiry and footer use.',
    jsonb_build_object(
      'email', 'thesweetfork@yahoo.com',
      'phone', '(801) 739-4168',
      'location', 'Centerville, Utah'
    ),
    true
  ),
  (
    'social.instagram',
    'social',
    'Instagram',
    'Primary Instagram profile for the brand.',
    jsonb_build_object(
      'handle', 'the_sweet_fork',
      'url', 'https://www.instagram.com/the_sweet_fork'
    ),
    true
  ),
  (
    'seo.defaults',
    'seo',
    'SEO Defaults',
    'Default metadata values used by the public marketing site.',
    jsonb_build_object(
      'titleSuffix', 'The Sweet Fork',
      'defaultDescription', 'Custom cakes, wedding cakes, cupcakes, macarons, and decorated cookies made to order in Centerville, Utah. Artisan quality, limited availability.'
    ),
    true
  )
on conflict (setting_key) do update
set
  category_key = excluded.category_key,
  label = excluded.label,
  description = excluded.description,
  value_json = excluded.value_json,
  is_public = excluded.is_public,
  updated_at = now();

insert into public.products (
  product_type,
  slug,
  name,
  short_description,
  long_description,
  is_active,
  requires_consultation,
  display_order
)
values
  (
    'custom-cake',
    'custom-cakes',
    'Custom Cakes',
    'Custom cakes for birthdays, milestones, and celebrations, starting at $80.',
    'Handcrafted custom cakes are quoted around servings, finish complexity, and delivery needs for a polished celebration fit.',
    true,
    false,
    10
  ),
  (
    'wedding-cake',
    'wedding-cakes',
    'Wedding Cakes',
    'Wedding cakes starting at $300, with 4 to 6 weeks notice recommended.',
    'Wedding cakes are designed as statement pieces and quoted around servings, structure, finish complexity, and venue coordination.',
    true,
    true,
    20
  ),
  (
    'cupcakes',
    'cupcakes',
    'Cupcakes',
    'Custom cupcakes for parties and events, starting at $36 per dozen.',
    'Custom cupcake orders are tailored around quantity, decorative finish, toppers, and dessert-table coordination.',
    true,
    false,
    30
  ),
  (
    'sugar-cookies',
    'sugar-cookies',
    'Sugar Cookies',
    'Decorated sugar cookies for favors and dessert tables, starting at $48 per dozen.',
    'Decorated sugar cookies are quoted around detail level, packaging direction, and how the set fits within the broader order.',
    true,
    false,
    40
  ),
  (
    'macarons',
    'macarons',
    'Macarons',
    'Custom macarons for gifting and dessert tables, starting at $30 per dozen.',
    'Macarons are offered by the dozen and quoted around color customization, flavor mix, and event styling needs.',
    true,
    false,
    50
  ),
  (
    'diy-kit',
    'diy-kits',
    'DIY Kits',
    'DIY decorating kits for parties and gifting, starting at $25.',
    'DIY kits are priced around kit size, seasonal direction, and how many finished sets need to be prepared together.',
    true,
    false,
    60
  )
on conflict (product_type) do update
set
  slug = excluded.slug,
  name = excluded.name,
  short_description = excluded.short_description,
  long_description = excluded.long_description,
  is_active = excluded.is_active,
  requires_consultation = excluded.requires_consultation,
  display_order = excluded.display_order,
  updated_at = now();

with seeded_prices(product_type, price_kind, label, unit_label, minimum_amount, maximum_amount, quantity_step, notes, effective_from) as (
  values
    ('custom-cake', 'base', 'Base range', null, 80.00, 120.00, null, 'Single-tier celebration cakes for roughly 10 to 20 servings.', date '2026-04-08'),
    ('custom-cake', 'per-serving', 'Per serving range', 'serving', 0.00, 3.00, 1.00, 'Additional servings and finish complexity can move the quote upward.', date '2026-04-08'),
    ('custom-cake', 'delivery-add-on', 'Delivery fee', null, 15.00, 50.00, null, 'Delivery is quoted by location within Northern Utah.', date '2026-04-08'),
    ('wedding-cake', 'base', 'Base range', null, 300.00, 450.00, null, 'Wedding cakes are quoted around servings, structure, and delivery.', date '2026-04-08'),
    ('wedding-cake', 'per-serving', 'Per serving range', 'serving', 0.00, 5.00, 1.00, 'Servings, tier structure, and decorative finish shape the final quote.', date '2026-04-08'),
    ('cupcakes', 'base', 'Base range', null, 36.00, 48.00, null, 'Per dozen.', date '2026-04-08'),
    ('cupcakes', 'per-unit', 'Per cupcake range', 'cupcake', 0.00, 1.50, 1.00, 'Decorative work and toppers can increase the final quote.', date '2026-04-08'),
    ('sugar-cookies', 'base', 'Base range', null, 48.00, 60.00, null, 'Per dozen for simpler custom sets.', date '2026-04-08'),
    ('sugar-cookies', 'per-unit', 'Per cookie range', 'cookie', 0.00, 1.50, 1.00, 'Detailed custom sets are quoted by complexity.', date '2026-04-08'),
    ('macarons', 'base', 'Base range', null, 30.00, 42.00, null, 'Per dozen.', date '2026-04-08'),
    ('macarons', 'per-unit', 'Per macaron range', 'macaron', 0.00, 1.25, 1.00, 'Custom colors and flavors can increase the quote.', date '2026-04-08'),
    ('diy-kit', 'base', 'Base range', null, 25.00, 35.00, null, 'Per kit.', date '2026-04-08'),
    ('diy-kit', 'per-unit', 'Per kit range', 'kit', 0.00, 5.00, 1.00, 'Larger or more detailed kits can increase the quote.', date '2026-04-08')
)
insert into public.product_prices (
  product_id,
  price_kind,
  label,
  unit_label,
  minimum_amount,
  maximum_amount,
  quantity_step,
  is_active,
  notes,
  effective_from
)
select
  products.id,
  seeded_prices.price_kind::public.product_price_kind,
  seeded_prices.label,
  seeded_prices.unit_label,
  seeded_prices.minimum_amount,
  seeded_prices.maximum_amount,
  seeded_prices.quantity_step,
  true,
  seeded_prices.notes,
  seeded_prices.effective_from
from seeded_prices
join public.products as products
  on products.product_type = seeded_prices.product_type::public.product_type
on conflict (product_id, price_kind, label, effective_from) do update
set
  unit_label = excluded.unit_label,
  minimum_amount = excluded.minimum_amount,
  maximum_amount = excluded.maximum_amount,
  quantity_step = excluded.quantity_step,
  is_active = excluded.is_active,
  notes = excluded.notes,
  updated_at = now();

update public.faq_items
set
  is_published = false,
  updated_at = now()
where category_key = 'public';

insert into public.faq_items (
  category_key,
  question,
  answer,
  display_order,
  is_published
)
values
  ('public', 'How far in advance should I order?', 'Custom cakes and treats need a minimum of 2 weeks notice. Wedding cakes usually need 4 to 6 weeks, and busy seasons are best booked even earlier.', 10, true),
  ('public', 'Do you accept rush orders?', 'Rush orders may be accommodated with less than 2 weeks notice, subject to availability, and can include a rush fee of up to 25%.', 20, true),
  ('public', 'How do I place an order?', 'Start with the online inquiry form. The Sweet Fork usually replies within 24 to 48 hours with a tailored quote, and a 50% deposit secures the date.', 30, true),
  ('public', 'How much do custom cakes cost?', 'Custom cakes start at $80 for celebration cakes and $300 for wedding cakes. Final pricing depends on size, design complexity, and customizations.', 40, true),
  ('public', 'What forms of payment do you accept?', 'Venmo, Square, and cash are accepted. A 50% deposit is required to secure the order, and the remaining balance is due before pickup or delivery.', 50, true),
  ('public', 'Is the deposit refundable?', 'Deposits are non-refundable. If an order is cancelled more than 14 days before pickup or delivery, payments beyond the deposit may be applied as a future-order credit. Cancellations within 14 days do not receive refunds or credits.', 60, true),
  ('public', 'Where are you located?', 'The Sweet Fork is based in Centerville, Utah. Pickup is available locally, and the pickup address is shared after booking.', 70, true),
  ('public', 'Do you deliver?', 'Yes. Delivery is available across Davis County, Salt Lake County, and nearby Weber County communities, with fees based on location.', 80, true),
  ('public', 'Can you recreate a cake I saw online?', 'Inspiration photos are welcome, but they are used as a starting point rather than copied exactly. Each design is interpreted in The Sweet Fork''s style.', 90, true),
  ('public', 'What flavors do you offer?', 'Available flavors include vanilla, chocolate, red velvet, lemon, strawberry, funfetti, carrot, almond, and coconut, with some custom flavors available on request.', 100, true),
  ('public', 'Can you accommodate dietary restrictions?', 'Some dietary needs can be discussed, but everything is made in a home kitchen that processes common allergens, so allergen-free products cannot be guaranteed.', 110, true),
  ('public', 'Are you a licensed bakery?', 'The Sweet Fork operates under Utah''s Home Consumption and Homemade Food Act in a dedicated home kitchen that is not subject to state food service licensing or inspection.', 120, true),
  ('public', 'How many orders do you take per week?', 'The Sweet Fork typically limits custom cake orders to about 6 to 7 per week so each client and event receives full attention.', 130, true),
  ('public', 'Do you offer tastings?', 'There are no in-person tastings right now, but curated wedding tasting boxes may be available for an additional fee.', 140, true)
on conflict (category_key, question) do update
set
  answer = excluded.answer,
  display_order = excluded.display_order,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.content_blocks (
  page_key,
  section_key,
  block_key,
  block_type,
  label,
  eyebrow,
  heading,
  body,
  items_json,
  settings_json,
  display_order,
  is_active
)
values
  (
    'home',
    'hero',
    'main',
    'hero',
    'Homepage Hero',
    'Centerville, Utah',
    'Custom cakes and desserts with a refined, made-to-order feel.',
    'A boutique home bakery for custom cakes and desserts designed with a polished finish, thoughtful hospitality, and limited weekly availability.',
    jsonb_build_array(
      jsonb_build_object('title', 'Handcrafted in small batches', 'description', 'Each order is made from scratch with the kind of restraint and finish that feels personal, not mass produced.'),
      jsonb_build_object('title', 'Limited weekly availability', 'description', 'Weekly order volume stays intentionally limited so every cake, dessert table, and pickup window receives close attention.'),
      jsonb_build_object('title', 'Serving Northern Utah', 'description', 'Based in Centerville, with pickup available locally and delivery offered across Davis, Salt Lake, and nearby Weber County communities.')
    ),
    jsonb_build_object(
      'primaryCtaHref', '/start-order',
      'primaryCtaLabel', 'Start Your Inquiry',
      'secondaryCtaHref', '/gallery',
      'secondaryCtaLabel', 'Explore the Gallery'
    ),
    10,
    true
  ),
  (
    'home',
    'hero',
    'weddings-highlight',
    'rich-text',
    'Wedding Highlight',
    'Wedding cakes',
    'Wedding cakes are quoted with the event, table, and guest experience in mind.',
    'Wedding cakes are designed as statement pieces, with companion desserts available when you want the full table to feel cohesive.',
    '[]'::jsonb,
    '{}'::jsonb,
    20,
    true
  ),
  (
    'home',
    'process',
    'steps',
    'feature-list',
    'How It Works',
    'How it works',
    'A simple inquiry-first process designed to keep the details easy.',
    'The process stays personal and clear from the first inquiry through the final confirmation.',
    jsonb_build_array(
      jsonb_build_object('step', '01', 'title', 'Share the celebration', 'description', 'Tell us about the event, timing, dessert mix, and overall design direction in one guided inquiry.'),
      jsonb_build_object('step', '02', 'title', 'Receive your quote', 'description', 'The Sweet Fork reviews availability and usually replies within 24 to 48 hours with a tailored quote and next steps.'),
      jsonb_build_object('step', '03', 'title', 'Reserve the date', 'description', 'Once the quote is approved, a deposit secures the date and the order moves into production planning.')
    ),
    '{}'::jsonb,
    30,
    true
  ),
  (
    'about',
    'story',
    'main',
    'rich-text',
    'About Story',
    'About',
    'A small bakery rooted in Centerville, Utah, with a luxury-minded finish.',
    'The Sweet Fork began with the idea that handmade desserts can feel both personal and beautifully composed, and it continues to grow as a small, intentional bakery serving Northern Utah.',
    jsonb_build_array(
      jsonb_build_object('text', 'What began as a passion project has become a made-to-order bakery focused on custom cakes, macarons, cupcakes, and decorated sugar cookies for celebrations across Northern Utah.'),
      jsonb_build_object('text', 'Every order is made from scratch in a home kitchen using quality ingredients, careful technique, and an intentionally limited production calendar.'),
      jsonb_build_object('text', 'That smaller scale allows each client to receive thoughtful guidance from inquiry through pickup or delivery.')
    ),
    jsonb_build_object(
      'accent', 'The Sweet Fork operates under Utah''s Home Consumption and Homemade Food Act and serves Davis, Salt Lake, and nearby Weber County communities.',
      'studioEyebrow', 'The Sweet Fork',
      'studioQuote', '"Handcrafted for life''s sweetest moments."'
    ),
    10,
    true
  )
on conflict (page_key, section_key, block_key) do update
set
  block_type = excluded.block_type,
  label = excluded.label,
  eyebrow = excluded.eyebrow,
  heading = excluded.heading,
  body = excluded.body,
  items_json = excluded.items_json,
  settings_json = excluded.settings_json,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  updated_at = now();

delete from public.media_assets
where lower(coalesce(public_url, '') || ' ' || coalesce(storage_path, '')) like '%placeholders%'
  and lower(coalesce(public_url, '') || ' ' || coalesce(storage_path, '')) like '%marketing%';
