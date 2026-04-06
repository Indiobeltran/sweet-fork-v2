-- Align reference content with the current live Sweet Fork marketing site.
-- These updates intentionally target the original placeholder seed values so
-- they do not blindly overwrite already-customized records.

update public.site_settings
set
  value_json = jsonb_build_object(
    'name', 'The Sweet Fork',
    'tagline', 'Custom cakes and desserts made to order',
    'description', 'Custom cakes, wedding cakes, cupcakes, macarons, and decorated cookies made to order in Centerville, Utah. Artisan quality, limited availability.'
  ),
  updated_at = now()
where setting_key = 'brand.identity'
  and value_json = jsonb_build_object(
    'name', 'The Sweet Fork',
    'tagline', 'Premium boutique custom bakery',
    'description', 'Premium boutique custom cakes, wedding desserts, macarons, and elevated celebration sweets for modern gatherings in Colorado.'
  );

update public.site_settings
set
  value_json = jsonb_build_object(
    'email', 'thesweetfork@yahoo.com',
    'phone', '(801) 739-4168',
    'location', 'Centerville, Utah'
  ),
  updated_at = now()
where setting_key = 'contact.primary'
  and value_json = jsonb_build_object(
    'email', 'hello@thesweetfork.com',
    'phone', '(555) 302-1849',
    'location', 'Denver, Colorado'
  );

update public.site_settings
set
  value_json = jsonb_build_object(
    'handle', 'the_sweet_fork',
    'url', 'https://www.instagram.com/the_sweet_fork'
  ),
  updated_at = now()
where setting_key = 'social.instagram'
  and value_json = jsonb_build_object(
    'handle', 'thesweetforkbakery',
    'url', 'https://instagram.com/thesweetforkbakery'
  );

update public.site_settings
set
  value_json = jsonb_build_object(
    'titleSuffix', 'The Sweet Fork',
    'defaultDescription', 'Custom cakes, wedding cakes, cupcakes, macarons, and decorated cookies made to order in Centerville, Utah. Artisan quality, limited availability.'
  ),
  updated_at = now()
where setting_key = 'seo.defaults'
  and value_json = jsonb_build_object(
    'titleSuffix', 'The Sweet Fork',
    'defaultDescription', 'Premium boutique custom cakes, wedding desserts, macarons, and elevated celebration sweets for modern gatherings in Colorado.'
  );

update public.products
set
  short_description = 'Custom cakes for birthdays, milestones, and celebrations, starting at $80.',
  long_description = 'Handcrafted custom cakes made to order for birthdays, weddings, and celebrations, with final pricing based on servings, design complexity, and delivery needs.',
  updated_at = now()
where product_type = 'custom-cake'
  and short_description = 'Boutique celebration cakes for birthdays, showers, and milestone tables.';

update public.products
set
  short_description = 'Wedding cakes starting at $300, with 4 to 6 weeks notice recommended.',
  long_description = 'Wedding cakes are quoted around servings, structure, design, and delivery, with companion desserts available as part of the same inquiry.',
  updated_at = now()
where product_type = 'wedding-cake'
  and short_description = 'Editorial wedding cakes with room for companion desserts.';

update public.products
set
  short_description = 'Custom cupcakes for parties and events, starting at $36 per dozen.',
  long_description = 'Moist, flavorful cupcakes topped with signature buttercream, with custom decorations and toppers available for birthdays, showers, and dessert tables.',
  updated_at = now()
where product_type = 'cupcakes'
  and short_description = 'Custom cupcake assortments for event tables and easy serving.';

update public.products
set
  short_description = 'Decorated sugar cookies for favors and dessert tables, starting at $48 per dozen.',
  long_description = 'Hand-decorated buttercream sugar cookies are priced by the dozen, with custom shapes and more detailed designs quoted by complexity.',
  updated_at = now()
where product_type = 'sugar-cookies'
  and short_description = 'Decorated sugar cookies for favors, gifting, and dessert displays.';

update public.products
set
  short_description = 'Custom macarons for gifting and dessert tables, starting at $30 per dozen.',
  long_description = 'Delicate almond meringue cookies with smooth fillings, offered by the dozen in assorted or single-flavor custom orders.',
  updated_at = now()
where product_type = 'macarons'
  and short_description = 'Macaron assortments for wedding desserts, gifting, and modern dessert bars.';

update public.products
set
  short_description = 'DIY decorating kits for parties and gifting, starting at $25.',
  long_description = 'All-inclusive decorating kits built for family fun, classroom activities, birthdays, and seasonal celebrations.',
  updated_at = now()
where product_type = 'diy-kit'
  and short_description = 'Interactive decorating kits for parties, gifting, and hosted activities.';

update public.product_prices
set
  minimum_amount = 80.00,
  maximum_amount = 120.00,
  notes = 'Single tier, about 10 to 20 servings.',
  updated_at = now()
where price_kind = 'base'
  and label = 'Base range'
  and minimum_amount = 160.00
  and maximum_amount = 260.00
  and product_id in (
    select id from public.products where product_type = 'custom-cake'
  );

update public.product_prices
set
  minimum_amount = 0.00,
  maximum_amount = 3.00,
  notes = 'Additional pricing depends on servings and design complexity.',
  updated_at = now()
where price_kind = 'per-serving'
  and label = 'Per serving range'
  and minimum_amount = 6.00
  and maximum_amount = 10.00
  and product_id in (
    select id from public.products where product_type = 'custom-cake'
  );

update public.product_prices
set
  minimum_amount = 300.00,
  maximum_amount = 450.00,
  notes = 'Wedding cakes start at $300 and require consultation.',
  updated_at = now()
where price_kind = 'base'
  and label = 'Base range'
  and minimum_amount = 450.00
  and maximum_amount = 850.00
  and product_id in (
    select id from public.products where product_type = 'wedding-cake'
  );

update public.product_prices
set
  minimum_amount = 0.00,
  maximum_amount = 5.00,
  notes = 'Final pricing depends on servings, structure, and design complexity.',
  updated_at = now()
where price_kind = 'per-serving'
  and label = 'Per serving range'
  and minimum_amount = 7.00
  and maximum_amount = 12.00
  and product_id in (
    select id from public.products where product_type = 'wedding-cake'
  );

update public.product_prices
set
  minimum_amount = 36.00,
  maximum_amount = 48.00,
  notes = 'Per dozen.',
  updated_at = now()
where price_kind = 'base'
  and label = 'Base range'
  and minimum_amount = 72.00
  and maximum_amount = 96.00
  and product_id in (
    select id from public.products where product_type = 'cupcakes'
  );

update public.product_prices
set
  minimum_amount = 0.00,
  maximum_amount = 1.50,
  notes = 'Custom decorations and toppers can increase the final total.',
  updated_at = now()
where price_kind = 'per-unit'
  and label = 'Per cupcake range'
  and minimum_amount = 3.50
  and maximum_amount = 5.00
  and product_id in (
    select id from public.products where product_type = 'cupcakes'
  );

update public.product_prices
set
  minimum_amount = 48.00,
  maximum_amount = 60.00,
  notes = 'Per dozen, simple designs.',
  updated_at = now()
where price_kind = 'base'
  and label = 'Base range'
  and minimum_amount = 85.00
  and maximum_amount = 115.00
  and product_id in (
    select id from public.products where product_type = 'sugar-cookies'
  );

update public.product_prices
set
  minimum_amount = 0.00,
  maximum_amount = 1.50,
  notes = 'Detailed custom designs are quoted by complexity.',
  updated_at = now()
where price_kind = 'per-unit'
  and label = 'Per cookie range'
  and minimum_amount = 4.25
  and maximum_amount = 6.00
  and product_id in (
    select id from public.products where product_type = 'sugar-cookies'
  );

update public.product_prices
set
  minimum_amount = 30.00,
  maximum_amount = 42.00,
  notes = 'Per dozen.',
  updated_at = now()
where price_kind = 'base'
  and label = 'Base range'
  and minimum_amount = 70.00
  and maximum_amount = 98.00
  and product_id in (
    select id from public.products where product_type = 'macarons'
  );

update public.product_prices
set
  minimum_amount = 0.00,
  maximum_amount = 1.25,
  notes = 'Custom colors and flavors can increase the final total.',
  updated_at = now()
where price_kind = 'per-unit'
  and label = 'Per macaron range'
  and minimum_amount = 3.25
  and maximum_amount = 4.75
  and product_id in (
    select id from public.products where product_type = 'macarons'
  );

update public.product_prices
set
  minimum_amount = 25.00,
  maximum_amount = 35.00,
  notes = 'Per kit.',
  updated_at = now()
where price_kind = 'base'
  and label = 'Base range'
  and minimum_amount = 48.00
  and maximum_amount = 70.00
  and product_id in (
    select id from public.products where product_type = 'diy-kit'
  );

update public.product_prices
set
  minimum_amount = 0.00,
  maximum_amount = 5.00,
  notes = 'Larger kit formats can increase the final total.',
  updated_at = now()
where price_kind = 'per-unit'
  and label = 'Per kit range'
  and minimum_amount = 12.00
  and maximum_amount = 18.00
  and product_id in (
    select id from public.products where product_type = 'diy-kit'
  );

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
  p.id,
  'delivery-add-on',
  'Delivery fee',
  null,
  15.00,
  50.00,
  null,
  true,
  'Delivery is available across Davis County, Salt Lake County, and nearby Weber County communities.',
  date '2026-04-05'
from public.products p
where p.product_type = 'custom-cake'
  and not exists (
    select 1
    from public.product_prices pp
    where pp.product_id = p.id
      and pp.price_kind = 'delivery-add-on'
      and pp.label = 'Delivery fee'
  );

update public.faq_items
set
  is_published = false,
  updated_at = now()
where question in (
  'How early should I reach out?',
  'Can one inquiry include multiple products?',
  'Do you deliver?',
  'What if I do not have inspiration photos?',
  'Do you offer tastings?'
);

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
  ('public', 'How do I place an order?', 'Start with the online inquiry form. The Sweet Fork usually replies within 24 to 48 hours with a detailed quote, and a 50% deposit secures the date.', 30, true),
  ('public', 'How much do custom cakes cost?', 'Custom cakes start at $80 for celebration cakes and $300 for wedding cakes. Final pricing depends on size, design complexity, and customizations.', 40, true),
  ('public', 'What forms of payment do you accept?', 'Venmo, Square, and cash are accepted. A 50% deposit is required to secure the order, and the remaining balance is due before pickup or delivery.', 50, true),
  ('public', 'Is the deposit refundable?', 'Deposits are non-refundable. If an order is cancelled more than 14 days before pickup or delivery, payments beyond the deposit may be applied as a future-order credit. Cancellations within 14 days do not receive refunds or credits.', 60, true),
  ('public', 'Where are you located?', 'The Sweet Fork is based in Centerville, Utah. Pickup is available from the bakery location, and the pickup address is shared after booking.', 70, true),
  ('public', 'Do you deliver?', 'Yes. Delivery is available across Davis County, Salt Lake County, and nearby Weber County communities, with fees based on location.', 80, true),
  ('public', 'Can you recreate a cake I saw online?', 'Inspiration photos are welcome, but they are used as a starting point rather than copied exactly. Each design is interpreted in The Sweet Fork''s style.', 90, true),
  ('public', 'What flavors do you offer?', 'Available flavors include vanilla, chocolate, red velvet, lemon, strawberry, funfetti, carrot, almond, and coconut, with some custom flavors available on request.', 100, true),
  ('public', 'Can you accommodate dietary restrictions?', 'Some dietary needs can be discussed, but everything is made in a home kitchen that processes common allergens, so allergen-free products cannot be guaranteed.', 110, true),
  ('public', 'Are you a licensed bakery?', 'The Sweet Fork operates under Utah''s Home Consumption and Homemade Food Act in a dedicated home kitchen that is not subject to state food service licensing or inspection.', 120, true),
  ('public', 'How many orders do you take per week?', 'The Sweet Fork typically limits custom cake orders to about 6 to 7 per week so each client and event receives full attention.', 130, true),
  ('public', 'Do you offer tastings?', 'There are no in-person tastings right now, but wedding sample boxes may be available for an additional fee.', 140, true)
on conflict (category_key, question) do nothing;

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
    'Custom desserts made to order.',
    'Artisan cakes, macarons, cupcakes, and decorated cookies are made to order in Centerville, Utah, with limited weekly availability and custom quotes for every event.',
    jsonb_build_array(
      jsonb_build_object('title', 'Made from scratch', 'description', 'Every order is handcrafted with quality ingredients and no mass-production shortcuts.'),
      jsonb_build_object('title', 'Limited weekly availability', 'description', 'The Sweet Fork typically accepts 6 to 7 custom cake orders per week to keep quality personal and consistent.'),
      jsonb_build_object('title', 'Serving Northern Utah', 'description', 'Based in Centerville with pickup available and delivery offered across Davis County, Salt Lake County, and nearby Weber County communities.')
    ),
    jsonb_build_object(
      'primaryCtaHref', '/start-order',
      'primaryCtaLabel', 'Start Order',
      'secondaryCtaHref', '/gallery',
      'secondaryCtaLabel', 'View Gallery'
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
    'Wedding cakes start at $300 and usually need 4 to 6 weeks notice.',
    'Wedding cakes are available as elegant centerpieces, and companion desserts can be added to the same inquiry when a full dessert spread is needed.',
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
    'Inquiry first, then a quote, then the order is reserved.',
    'The ordering process is straightforward: start with the inquiry form, receive a detailed quote within 24 to 48 hours, and secure the date with a deposit.',
    jsonb_build_array(
      jsonb_build_object('step', '01', 'title', 'Submit the inquiry', 'description', 'Share the event, date, servings, pickup or delivery needs, and the desserts you are considering.'),
      jsonb_build_object('step', '02', 'title', 'Receive the quote', 'description', 'The Sweet Fork reviews the request and usually replies within 24 to 48 hours with a detailed quote.'),
      jsonb_build_object('step', '03', 'title', 'Reserve the date', 'description', 'Once the quote is approved, a 50% deposit secures the order and production details move forward.')
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
    'A small custom bakery rooted in Centerville, Utah.',
    'The Sweet Fork began with the belief that every celebration deserves something special, and it continues to operate as a small, intentional bakery serving Northern Utah.',
    jsonb_build_array(
      jsonb_build_object('text', 'What started as a passion project has grown into a made-to-order bakery focused on custom cakes, macarons, cupcakes, and decorated sugar cookies.'),
      jsonb_build_object('text', 'Every creation is made from scratch in a home kitchen using quality ingredients and a careful, hands-on process.'),
      jsonb_build_object('text', 'Weekly order volume stays intentionally limited so each client receives full attention from inquiry through pickup or delivery.')
    ),
    jsonb_build_object(
      'accent', 'The Sweet Fork operates under Utah''s Home Consumption and Homemade Food Act and serves Davis County, Salt Lake County, and Weber County.',
      'studioEyebrow', 'The Sweet Fork',
      'studioQuote', '"Life''s sweetest moments, made from scratch."'
    ),
    10,
    true
  )
on conflict (page_key, section_key, block_key) do nothing;
