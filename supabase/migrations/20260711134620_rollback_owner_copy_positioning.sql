-- Restore the managed public copy that was live before the owner-positioning
-- copy pass. This is a content-only rollback; no schema, pricing, customer,
-- inquiry, or order data is changed.

update public.content_blocks
set
  eyebrow = 'Centerville, Utah',
  heading = 'Custom cakes and desserts with a refined, made-to-order feel.',
  body = 'A boutique home bakery for custom cakes and desserts designed with a polished finish, thoughtful hospitality, and limited weekly availability.',
  items_json = jsonb_build_array(
    jsonb_build_object(
      'title', 'Handcrafted in small batches',
      'description', 'Each order is made from scratch with the kind of restraint and finish that feels personal, not mass produced.'
    ),
    jsonb_build_object(
      'title', 'Limited weekly availability',
      'description', 'Weekly order volume stays intentionally limited so every cake, dessert table, and pickup window receives close attention.'
    ),
    jsonb_build_object(
      'title', 'Serving Northern Utah',
      'description', 'Based in Centerville, with pickup available locally and delivery offered across Davis, Salt Lake, and nearby Weber County communities.'
    )
  ),
  updated_at = timezone('utc'::text, now())
where page_key = 'home'
  and section_key = 'hero'
  and block_key = 'main';

update public.content_blocks
set
  eyebrow = 'How it works',
  heading = 'A simple inquiry-first process designed to keep the details easy.',
  body = 'The process stays personal and clear from the first inquiry through the final confirmation.',
  items_json = jsonb_build_array(
    jsonb_build_object(
      'step', '01',
      'title', 'Share the celebration',
      'description', 'Tell us about the event, timing, dessert mix, and overall design direction in one guided inquiry.'
    ),
    jsonb_build_object(
      'step', '02',
      'title', 'Receive your quote',
      'description', 'The Sweet Fork reviews availability and usually replies within 24 to 48 hours with a tailored quote and next steps.'
    ),
    jsonb_build_object(
      'step', '03',
      'title', 'Reserve the date',
      'description', 'Once the quote is approved, a deposit secures the date and the order moves into production planning.'
    )
  ),
  updated_at = timezone('utc'::text, now())
where page_key = 'home'
  and section_key = 'process'
  and block_key = 'steps';

update public.content_blocks
set
  eyebrow = 'About',
  heading = 'Hi, I''m Melissa — the baker behind The Sweet Fork.',
  body = 'I''m a home baker in Centerville, Utah who believes handmade desserts should feel personal and beautifully made. The Sweet Fork is my small, intentional bakery serving families across Northern Utah.',
  items_json = jsonb_build_array(
    jsonb_build_object(
      'text', 'What began as a love of baking for the people around me has grown into a made-to-order bakery for custom cakes, macarons, cupcakes, and decorated sugar cookies — created for celebrations across Northern Utah.'
    ),
    jsonb_build_object(
      'text', 'Every order is baked from scratch in my home kitchen with the kind of care you''d expect for your own family celebration. I keep my calendar intentionally small so each cake and dessert gets the attention it deserves.'
    ),
    jsonb_build_object(
      'text', 'From birthday cakes and decorated sugar cookies to wedding tastings and macarons, my goal is to make the whole process feel personal, clear, and special — from your first inquiry through pickup or delivery.'
    )
  ),
  settings_json = jsonb_build_object(
    'accent', 'The Sweet Fork operates under Utah''s Home Consumption and Homemade Food Act, baking for Centerville and the surrounding Davis, Salt Lake, and nearby Weber County communities.',
    'studioQuote', '"Baked from my home kitchen in Centerville, with the kind of care I''d want for my own family''s celebration."',
    'studioEyebrow', 'From Melissa''s kitchen'
  ),
  updated_at = timezone('utc'::text, now())
where page_key = 'about'
  and section_key = 'story'
  and block_key = 'main';

update public.site_settings
set
  value_json = jsonb_build_object(
    'name', 'The Sweet Fork',
    'tagline', 'Custom cakes and desserts made to order',
    'description', 'Custom cakes, wedding cakes, cupcakes, macarons, and decorated cookies made to order in Centerville, Utah. Artisan quality, limited availability.'
  ),
  updated_at = timezone('utc'::text, now())
where setting_key = 'brand.identity';

update public.site_settings
set
  value_json = jsonb_build_object(
    'titleSuffix', 'The Sweet Fork',
    'defaultDescription', 'Custom cakes, wedding cakes, cupcakes, macarons, and decorated cookies made to order in Centerville, Utah. Artisan quality, limited availability.'
  ),
  updated_at = timezone('utc'::text, now())
where setting_key = 'seo.defaults';

update public.faq_items
set
  answer = 'Start with the online inquiry form. The Sweet Fork usually replies within 24 to 48 hours with a tailored quote, and a 50% deposit secures the date.',
  updated_at = timezone('utc'::text, now())
where question = 'How do I place an order?';

update public.faq_items
set
  answer = 'Yes. Delivery is available across Davis County, Salt Lake County, and nearby Weber County communities, with fees based on location.',
  updated_at = timezone('utc'::text, now())
where question = 'Do you deliver?';

update public.faq_items
set
  answer = 'Inspiration photos are welcome, but they are used as a starting point rather than copied exactly. Each design is interpreted in The Sweet Fork''s style.',
  updated_at = timezone('utc'::text, now())
where question = 'Can you recreate a cake I saw online?';

update public.faq_items
set
  answer = 'The Sweet Fork operates under Utah''s Home Consumption and Homemade Food Act in a dedicated home kitchen that is not subject to state food service licensing or inspection.',
  updated_at = timezone('utc'::text, now())
where question = 'Are you a licensed bakery?';

update public.faq_items
set
  answer = 'The Sweet Fork typically limits custom cake orders to about 6 to 7 per week so each client and event receives full attention.',
  updated_at = timezone('utc'::text, now())
where question = 'How many orders do you take per week?';

update public.products
set
  short_description = case slug
    when 'custom-cakes' then 'Custom cakes for birthdays, milestones, and celebrations, starting at $80.'
    when 'wedding-cakes' then 'Wedding cakes starting at $300, with 4 to 6 weeks notice recommended.'
    when 'cupcakes' then 'Custom cupcakes for parties and events, starting at $36 per dozen.'
    when 'sugar-cookies' then 'Decorated sugar cookies for favors and dessert tables, starting at $48 per dozen.'
    when 'macarons' then 'Custom macarons for gifting and dessert tables, starting at $30 per dozen.'
    when 'diy-kits' then 'DIY decorating kits for parties and gifting, starting at $25.'
    else short_description
  end,
  updated_at = timezone('utc'::text, now())
where slug in (
  'custom-cakes',
  'wedding-cakes',
  'cupcakes',
  'sugar-cookies',
  'macarons',
  'diy-kits'
);
