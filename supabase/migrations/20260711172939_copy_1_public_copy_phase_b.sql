-- COPY-1 Phase B: align managed public copy with the approved source fallbacks.
-- This migration updates existing content values only. It does not alter schema,
-- RLS, tables, enums, storage, pricing, customers, inquiries, orders, or products.

update public.content_blocks
set
  heading = 'Custom cakes and desserts, designed for your celebration and baked from scratch in Centerville, Utah.',
  body = 'I take a limited number of orders each week. Every cake and dessert is made to order, start to finish, by me.',
  items_json = jsonb_build_array(
    jsonb_build_object(
      'title', 'Baked from scratch in small batches',
      'description', 'Each order is baked from scratch with real butter, balanced flavors, and a finish shaped for your celebration.'
    ),
    jsonb_build_object(
      'title', 'Small-batch weekly calendar',
      'description', 'I take a limited number of orders each week so every cake, dessert table, and pickup window gets my full attention.'
    ),
    jsonb_build_object(
      'title', 'Serving Northern Utah',
      'description', 'Based in Centerville, with pickup available locally and delivery offered across Davis, Salt Lake, and nearby Weber County communities. Baked goods are currently available for local pickup or local delivery only. I do not currently ship desserts.'
    )
  ),
  settings_json = coalesce(settings_json, '{}'::jsonb) || jsonb_build_object(
    'primaryCtaLabel', 'Request a Quote'
  ),
  updated_at = timezone('utc'::text, now())
where page_key = 'home'
  and section_key = 'hero'
  and block_key = 'main';

update public.content_blocks
set
  heading = 'I quote wedding cakes around servings, venue plans, and the dessert table you want.',
  body = 'I design wedding cakes as focal points, with companion desserts available when you want the full table to feel cohesive.',
  updated_at = timezone('utc'::text, now())
where page_key = 'home'
  and section_key = 'hero'
  and block_key = 'weddings-highlight';

update public.content_blocks
set
  heading = 'A clear process from first details to final confirmation.',
  body = 'I keep the process clear from your first request through final confirmation.',
  items_json = jsonb_build_array(
    jsonb_build_object(
      'step', '01',
      'title', 'Share the celebration',
      'description', 'Tell me about the event, timing, dessert mix, and overall design direction in one guided request.'
    ),
    jsonb_build_object(
      'step', '02',
      'title', 'Receive your quote',
      'description', 'I review availability and usually reply within 24 to 48 hours with a custom quote and next steps.'
    ),
    jsonb_build_object(
      'step', '03',
      'title', 'Reserve the date',
      'description', 'Once you approve the quote, a 50% deposit reserves your date and I move the order into planning. Final payment is due before pickup or delivery.'
    )
  ),
  updated_at = timezone('utc'::text, now())
where page_key = 'home'
  and section_key = 'process'
  and block_key = 'steps';

update public.site_settings
set
  value_json = jsonb_set(
    coalesce(value_json, '{}'::jsonb),
    '{description}',
    to_jsonb('Custom cakes, wedding cakes, cupcakes, macarons, and decorated cookies made to order in Centerville, Utah with from-scratch recipes and custom design details.'::text),
    true
  ),
  updated_at = timezone('utc'::text, now())
where setting_key = 'brand.identity';

update public.site_settings
set
  value_json = jsonb_set(
    jsonb_set(
      coalesce(value_json, '{}'::jsonb),
      '{title}',
      to_jsonb('Booking calendar update'::text),
      true
    ),
    '{message}',
    to_jsonb('Most custom orders need at least 2 weeks notice. Wedding cakes usually need 4 to 6 weeks.'::text),
    true
  ),
  updated_at = timezone('utc'::text, now())
where setting_key = 'booking.notice';

update public.faq_items
set
  answer = 'Start with the online form. I usually reply within 24 to 48 hours with a detailed quote, and a 50% deposit secures the date.',
  updated_at = timezone('utc'::text, now())
where question = 'How do I place an order?';

update public.faq_items
set
  answer = 'I am based in Centerville, Utah. Pickup is available from the bakery location, and the pickup address is shared after booking.',
  updated_at = timezone('utc'::text, now())
where question = 'Where are you located?';

update public.faq_items
set
  answer = 'Inspiration photos are welcome, but they are used as a starting point rather than copied exactly. I interpret each design in my style.',
  updated_at = timezone('utc'::text, now())
where question = 'Can you recreate a cake I saw online?';

update public.faq_items
set
  answer = 'I operate under Utah''s Home Consumption and Homemade Food Act in a home kitchen that is not subject to state food service licensing or inspection.',
  updated_at = timezone('utc'::text, now())
where question = 'Are you a licensed bakery?';

update public.faq_items
set
  answer = 'I typically limit custom cake orders to about 6 to 7 per week so each client and event receives full attention.',
  updated_at = timezone('utc'::text, now())
where question = 'How many orders do you take per week?';

update public.faq_items
set
  answer = 'Wedding tasting boxes are available at a cost. Depending on final order size and details, the tasting cost may sometimes be credited toward the final product.',
  updated_at = timezone('utc'::text, now())
where question = 'Do you offer tastings?';
