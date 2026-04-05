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
    'Boutique celebration cakes for birthdays, showers, and milestone tables.',
    'Made-to-order cakes designed around the event palette, guest count, and overall celebration feel.',
    true,
    false,
    10
  ),
  (
    'wedding-cake',
    'wedding-cakes',
    'Wedding Cakes',
    'Editorial wedding cakes with room for companion desserts.',
    'Tiered cakes for modern weddings, with the structure needed for consultations, service planning, and delivery coordination.',
    true,
    true,
    20
  ),
  (
    'cupcakes',
    'cupcakes',
    'Cupcakes',
    'Custom cupcake assortments for event tables and easy serving.',
    'Boutique cupcake sets designed to support showers, birthdays, school events, and larger celebration spreads.',
    true,
    false,
    30
  ),
  (
    'sugar-cookies',
    'sugar-cookies',
    'Sugar Cookies',
    'Decorated sugar cookies for favors, gifting, and dessert displays.',
    'Custom cookies for monograms, event favors, branded sets, and detail-rich celebration moments.',
    true,
    false,
    40
  ),
  (
    'macarons',
    'macarons',
    'Macarons',
    'Macaron assortments for wedding desserts, gifting, and modern dessert bars.',
    'Color-led macaron assortments intended for polished dessert tables, favors, and gift boxes.',
    true,
    false,
    50
  ),
  (
    'diy-kit',
    'diy-kits',
    'DIY Kits',
    'Interactive decorating kits for parties, gifting, and hosted activities.',
    'Curated decorating kits designed for celebrations that need something approachable, packaged, and premium-feeling.',
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

insert into public.product_prices (
  product_id,
  price_kind,
  label,
  unit_label,
  minimum_amount,
  maximum_amount,
  quantity_step,
  is_active,
  notes
)
select
  p.id,
  seeded.price_kind::public.product_price_kind,
  seeded.label,
  seeded.unit_label,
  seeded.minimum_amount,
  seeded.maximum_amount,
  seeded.quantity_step,
  true,
  seeded.notes
from public.products p
join (
  values
    ('custom-cake', 'base', 'Base range', null, 160.00, 260.00, null, 'Matches the current starting custom cake range.'),
    ('custom-cake', 'per-serving', 'Per serving range', 'serving', 6.00, 10.00, 1.00, 'Current starter pricing logic from the Phase 1 hardcoded estimate utility.'),
    ('wedding-cake', 'base', 'Base range', null, 450.00, 850.00, null, 'Matches the current starting wedding cake range.'),
    ('wedding-cake', 'per-serving', 'Per serving range', 'serving', 7.00, 12.00, 1.00, 'Current starter pricing logic from the Phase 1 hardcoded estimate utility.'),
    ('cupcakes', 'base', 'Base range', null, 72.00, 96.00, null, 'Entry pricing for custom cupcake sets.'),
    ('cupcakes', 'per-unit', 'Per cupcake range', 'cupcake', 3.50, 5.00, 1.00, 'Unit range for cupcake quantity adjustments.'),
    ('sugar-cookies', 'base', 'Base range', null, 85.00, 115.00, null, 'Entry pricing for decorated cookie sets.'),
    ('sugar-cookies', 'per-unit', 'Per cookie range', 'cookie', 4.25, 6.00, 1.00, 'Unit range for custom decorated cookies.'),
    ('macarons', 'base', 'Base range', null, 70.00, 98.00, null, 'Entry pricing for macaron assortments.'),
    ('macarons', 'per-unit', 'Per macaron range', 'macaron', 3.25, 4.75, 1.00, 'Unit range for macaron assortments and favors.'),
    ('diy-kit', 'base', 'Base range', null, 48.00, 70.00, null, 'Entry pricing for DIY kit orders.'),
    ('diy-kit', 'per-unit', 'Per kit range', 'kit', 12.00, 18.00, 1.00, 'Unit range for additional DIY kits.')
) as seeded(product_type, price_kind, label, unit_label, minimum_amount, maximum_amount, quantity_step, notes)
  on seeded.product_type::public.product_type = p.product_type
on conflict (product_id, price_kind, label, effective_from) do update
set
  unit_label = excluded.unit_label,
  minimum_amount = excluded.minimum_amount,
  maximum_amount = excluded.maximum_amount,
  quantity_step = excluded.quantity_step,
  is_active = excluded.is_active,
  notes = excluded.notes,
  updated_at = now();

insert into public.gallery_categories (
  slug,
  name,
  description,
  display_order,
  is_active
)
values
  ('celebration', 'Celebration', 'General celebration cakes and styled moments.', 10, true),
  ('wedding-cakes', 'Wedding Cakes', 'Tiered cakes and wedding dessert centerpieces.', 20, true),
  ('custom-cakes', 'Custom Cakes', 'Birthdays, showers, anniversaries, and milestone cakes.', 30, true),
  ('cupcakes', 'Cupcakes', 'Cupcake assortments and supporting sweets.', 40, true),
  ('sugar-cookies', 'Sugar Cookies', 'Decorated cookie sets for favors and display.', 50, true),
  ('macarons', 'Macarons', 'Macaron towers, assortments, and boxed gifting.', 60, true),
  ('diy-kits', 'DIY Kits', 'Interactive decorating kits and packaged kits.', 70, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  updated_at = now();

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
      'tagline', 'Premium boutique custom bakery',
      'description', 'Premium boutique custom cakes, wedding desserts, macarons, and elevated celebration sweets for modern gatherings in Colorado.'
    ),
    true
  ),
  (
    'contact.primary',
    'contact',
    'Primary Contact',
    'Default bakery contact information for inquiry and footer use.',
    jsonb_build_object(
      'email', 'hello@thesweetfork.com',
      'phone', '(555) 302-1849',
      'location', 'Denver, Colorado'
    ),
    true
  ),
  (
    'social.instagram',
    'social',
    'Instagram',
    'Primary Instagram profile for the brand.',
    jsonb_build_object(
      'handle', 'thesweetforkbakery',
      'url', 'https://instagram.com/thesweetforkbakery'
    ),
    true
  ),
  (
    'inquiry.flags',
    'inquiry',
    'Inquiry Feature Flags',
    'Controls upload fallback behavior for the intake flow.',
    jsonb_build_object(
      'uploadsEnabled', true,
      'linkFallbackEnabled', true,
      'storageBucket', 'inspiration'
    ),
    false
  ),
  (
    'seo.defaults',
    'seo',
    'SEO Defaults',
    'Default metadata values used by the public marketing site.',
    jsonb_build_object(
      'titleSuffix', 'The Sweet Fork',
      'defaultDescription', 'Premium boutique custom cakes, wedding desserts, macarons, and elevated celebration sweets for modern gatherings in Colorado.'
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

insert into public.faq_items (
  category_key,
  question,
  answer,
  display_order,
  is_published
)
values
  (
    'ordering',
    'How early should I reach out?',
    'Weddings should reach out as early as possible. Celebration orders are best submitted at least two weeks ahead when calendar space allows.',
    10,
    true
  ),
  (
    'ordering',
    'Can one inquiry include multiple products?',
    'Yes. The v2 intake is designed so one inquiry can include several product types for the same event.',
    20,
    true
  ),
  (
    'fulfillment',
    'Do you deliver?',
    'Delivery is available for eligible orders and service areas. Pickup is also available for many celebration orders.',
    10,
    true
  ),
  (
    'design',
    'What if I do not have inspiration photos?',
    'You can still describe the look in words or add links. Image upload is available when enabled, but it is not required.',
    10,
    true
  ),
  (
    'weddings',
    'Do you offer tastings?',
    'Wedding tastings can be offered for qualified bookings and larger celebrations.',
    10,
    true
  )
on conflict (category_key, question) do update
set
  answer = excluded.answer,
  display_order = excluded.display_order,
  is_published = excluded.is_published,
  updated_at = now();
