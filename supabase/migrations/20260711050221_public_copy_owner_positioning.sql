-- Align managed public copy with the owner-operated positioning used by the
-- application fallbacks. This migration changes content only; it does not
-- alter schema, customer records, inquiries, orders, or pricing.

update public.content_blocks
set
  eyebrow = 'Owner-operated home bakery • Centerville, Utah',
  heading = 'From-scratch custom cakes and desserts, made for your celebration.',
  body = 'I''m Melissa, the owner and baker behind The Sweet Fork. I design and make each custom order from scratch with a carefully managed calendar so every celebration receives focused attention and clear communication.',
  items_json = jsonb_build_array(
    jsonb_build_object(
      'title', 'Made from scratch by Melissa',
      'description', 'Melissa prepares each order from scratch and stays involved from the first design notes through the final finish.'
    ),
    jsonb_build_object(
      'title', 'Designed for your event',
      'description', 'Colors, flavors, servings, piping, and presentation are planned around the specific celebration.'
    ),
    jsonb_build_object(
      'title', 'Centerville pickup + local delivery',
      'description', 'Pickup is in Centerville, with select delivery across Davis, Weber, and Salt Lake Counties when the date and order details allow. The Sweet Fork does not ship desserts.'
    )
  ),
  updated_at = timezone('utc'::text, now())
where page_key = 'home'
  and section_key = 'hero'
  and block_key = 'main';

update public.content_blocks
set
  heading = 'A personal, inquiry-first process from first details to pickup or delivery.',
  body = 'Ordering begins with a guided inquiry rather than instant checkout. Melissa reviews each request and follows up with availability, a custom quote, and clear next steps.',
  items_json = jsonb_build_array(
    jsonb_build_object(
      'step', '01',
      'title', 'Share the celebration',
      'description', 'Share your event, date, dessert needs, guest count, pickup or delivery preference, and inspiration in one guided inquiry.'
    ),
    jsonb_build_object(
      'step', '02',
      'title', 'Melissa reviews the details',
      'description', 'Melissa checks the date against her production calendar and usually follows up within 24 to 48 hours with availability, a custom quote, and next steps.'
    ),
    jsonb_build_object(
      'step', '03',
      'title', 'Reserve the date',
      'description', 'Once the quote is approved, a 50% non-refundable deposit secures the date. Final design and pickup or delivery details are coordinated before the celebration.'
    )
  ),
  updated_at = timezone('utc'::text, now())
where page_key = 'home'
  and section_key = 'process'
  and block_key = 'steps';

update public.content_blocks
set
  heading = 'Hi, I''m Melissa — the owner and baker behind The Sweet Fork.',
  body = 'The Sweet Fork is my owner-operated home bakery in Centerville, Utah. I create from-scratch cakes and desserts for local celebrations, balancing beautiful presentation with flavor, clear communication, and dependable service.',
  items_json = jsonb_build_array(
    jsonb_build_object(
      'text', 'I personally guide each order from the first inquiry through design, baking, finishing, and pickup or delivery coordination. That direct connection helps the final desserts reflect the event instead of feeling selected from a catalog.'
    ),
    jsonb_build_object(
      'text', 'Every order is baked from scratch in my Centerville home kitchen. Flavor and presentation matter equally, whether I am working through a color palette, piping details, florals, textures, or the way everything will be displayed and served.'
    ),
    jsonb_build_object(
      'text', 'I carefully manage my production calendar so confirmed orders receive focused attention and dependable communication. Inspiration is always welcome, but I interpret it for your celebration rather than copy another baker''s design exactly.'
    )
  ),
  settings_json = coalesce(settings_json, '{}'::jsonb) || jsonb_build_object(
    'accent', 'The Sweet Fork operates under Utah''s Home Consumption and Homemade Food Act, with pickup in Centerville and select delivery across Davis, Weber, and Salt Lake Counties.',
    'studioEyebrow', 'From Melissa''s kitchen',
    'studioQuote', '"Baked from my home kitchen in Centerville, with the kind of care I''d want for my own family''s celebration."'
  ),
  updated_at = timezone('utc'::text, now())
where page_key = 'about'
  and section_key = 'story'
  and block_key = 'main';

update public.site_settings
set
  value_json = coalesce(value_json, '{}'::jsonb) || jsonb_build_object(
    'name', 'The Sweet Fork',
    'tagline', 'Owner-operated custom cakes and desserts',
    'description', 'Owner-operated by Melissa in Centerville, The Sweet Fork creates from-scratch custom cakes and desserts for local pickup and select Northern Utah delivery.'
  ),
  updated_at = timezone('utc'::text, now())
where setting_key = 'brand.identity';

update public.site_settings
set
  value_json = coalesce(value_json, '{}'::jsonb) || jsonb_build_object(
    'titleSuffix', 'The Sweet Fork',
    'defaultDescription', 'Melissa creates from-scratch custom cakes and desserts from her owner-operated home bakery in Centerville, Utah, with local pickup and select delivery.'
  ),
  updated_at = timezone('utc'::text, now())
where setting_key = 'seo.defaults';

update public.faq_items
set
  answer = 'Start with the online inquiry form. Melissa usually follows up within 24 to 48 hours with availability, a custom quote, and next steps. Submitting an inquiry does not reserve the date; a 50% non-refundable deposit secures it after the quote is approved.',
  updated_at = timezone('utc'::text, now())
where question = 'How do I place an order?';

update public.faq_items
set
  answer = 'Delivery may be available across Davis, Weber, and Salt Lake Counties depending on the date, distance, and order details. Baked goods are available for local pickup or delivery only; The Sweet Fork does not currently ship desserts.',
  updated_at = timezone('utc'::text, now())
where question = 'Do you deliver?';

update public.faq_items
set
  answer = 'Inspiration photos and links are welcome, but Melissa uses them as a starting point rather than copying another baker''s design exactly.',
  updated_at = timezone('utc'::text, now())
where question = 'Can you recreate a cake I saw online?';

update public.faq_items
set
  answer = 'The Sweet Fork is an owner-operated home bakery in Centerville, where Melissa prepares each custom order in her home kitchen. Orders are managed through custom quotes, deposits, scheduled pickup, and local delivery when available. The Sweet Fork operates under Utah''s Home Consumption and Homemade Food Act in a home kitchen that is not subject to state food service licensing or inspection.',
  updated_at = timezone('utc'::text, now())
where question = 'Are you a licensed bakery?';

update public.faq_items
set
  answer = 'Melissa carefully manages the production calendar so each confirmed order receives focused design and production time. Weekly capacity varies with the size and detail of the orders already booked.',
  updated_at = timezone('utc'::text, now())
where question = 'How many orders do you take per week?';

update public.products
set
  short_description = case slug
    when 'custom-cakes' then 'From-scratch custom cakes designed by Melissa for celebrations in Centerville and nearby Northern Utah.'
    when 'wedding-cakes' then 'Wedding cakes planned directly with Melissa around servings, design, delivery, and display details.'
    when 'cupcakes' then 'From-scratch custom cupcakes made by Melissa for parties, gifting, and dessert tables.'
    when 'sugar-cookies' then 'Buttercream sugar cookie sets designed by Melissa around your colors, theme, quantity, and event.'
    when 'macarons' then 'Small-batch macarons with custom colors, flavors, and presentation planned for your celebration.'
    when 'diy-kits' then 'Cookie decorating kits prepared by Melissa for local pickup or select delivery.'
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
