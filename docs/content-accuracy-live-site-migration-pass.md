# The Sweet Fork v2 Content Accuracy + Live-Site Migration Pass

Date: 2026-04-05

## Scope

This pass used the current live marketing site at `https://thesweetfork.com` as the baseline source of truth for public-facing business content, then mapped that content into the v2 content structure without blindly overwriting intentional premium improvements.

## Extraction Method

- Confirmed crawlable routes from `robots.txt` and `sitemap.xml`.
- Extracted the live route map from the production JS router bundle.
- Extracted page copy, CTA text, pricing language, FAQ content, and SEO metadata from the live page chunks.
- Compared that live content against the current v2 content source and storefront copy.

## Live Route Map

| Live route | Status | Notes |
| --- | --- | --- |
| `/` | Active | Homepage |
| `/custom-cakes` | Active | Main cakes page |
| `/treats` | Active | Treats page covering cupcakes, macarons, cookies, DIY kits |
| `/pricing` | Active | Pricing page |
| `/gallery` | Active | Gallery page |
| `/about` | Active | About page |
| `/faq` | Active | FAQ page |
| `/policies` | Active | Policies and terms page |
| `/start-order` | Active | Inquiry page |
| `/thank-you` | Active | Post-inquiry page |
| `/menu` | Redirect | Redirects to `/custom-cakes` |
| `/our-story` | Redirect | Redirects to `/about` |
| `/terms-of-service` | Redirect | Redirects to `/policies` |
| `/events` | Redirect | Redirects to `/` |

No dedicated public privacy page was found on the live site.

## Structured Content Inventory

### `/`

- Display title: `Custom Desserts / Made to Order`
- SEO title: `The Sweet Fork | Custom Cakes & Desserts | Centerville, Utah`
- SEO description: `Artisan custom cakes, macarons, and decorated cookies made to order in Centerville, Utah. Limited availability. Start your order today.`
- Headings:
  - `Custom Desserts / Made to Order`
  - `Every Creation Tells a Story`
  - `Our Specialties`
  - `What They're Saying`
  - `Ready to Create Something Sweet?`
  - `Based in Centerville, Utah`
- Body copy summary:
  - Small intentional bakery
  - Artisan cakes, macarons, and decorated cookies
  - Limited availability and inquiry-only ordering
  - No mass production and no walk-ins
- CTA text:
  - `Start an Order`
  - `View Gallery`
  - `View Full Gallery`
  - `View Starting Prices`
- Pricing text:
  - Custom cakes `$80+`
  - Cupcakes `$36+/dozen`
  - Macarons `$30+/dozen`
- Process or order language:
  - `2 Weeks Notice`
  - Limited weekly slots
  - Inquiry-first ordering
- Service area or location language:
  - `Centerville, Utah`
  - `Davis County & Beyond`
  - `Serving Davis, Salt Lake & Weber Counties`
  - Phone `(801) 739-4168`
  - Email `thesweetfork@yahoo.com`
  - Instagram `@the_sweet_fork`

### `/custom-cakes`

- Legacy alias: `/menu`
- Display title: `Custom Cakes`
- SEO title: `Custom Cakes | The Sweet Fork | Centerville, Utah`
- SEO description: `Handcrafted custom cakes for birthdays, weddings, and celebrations. Starting at $80. Made to order in Centerville, Utah.`
- Headings:
  - `Custom Cakes`
  - `How It Works`
  - `Cake Types & Starting Prices`
  - `Cake Flavors`
  - `Frostings & Fillings`
  - `Design Styles`
  - `Ready to Order Your Custom Cake?`
- Body copy summary:
  - One-of-a-kind cakes designed for each celebration
  - Birthday, wedding, and tiered cakes all grouped on one page
  - Custom flavors available on request
- CTA text:
  - `Start an Order`
  - `View Full Pricing Guide`
- Pricing text:
  - Birthday and celebration cakes `$80+`
  - Tiered cakes `$150+`
  - Wedding cakes `$300+`
  - Lead times called out per cake type
- Process or order language:
  - Inquiry
  - Quote within `24-48 hours`
  - Deposit secures production

### `/treats`

- Display title: `Treats & Confections`
- SEO title: `Treats | Macarons, Cupcakes & Cookies | The Sweet Fork`
- SEO description: `Custom macarons, cupcakes, decorated sugar cookies, and DIY decoration kits made to order in Centerville, Utah. Perfect for parties, gifts, and celebrations.`
- Headings:
  - `Treats & Confections`
  - `Need Something Custom?`
- Body copy summary:
  - Treats page combines macarons, cupcakes, decorated sugar cookies, and DIY kits
  - Same made-to-order positioning as cakes
- CTA text:
  - `Order Custom Macarons`
  - `Order Cupcakes`
  - `Order Decorated Sugar Cookies`
  - `Order DIY Decoration Kits`
  - `Start an Order`
  - `View Gallery`
- Pricing text:
  - Macarons `$30+` per dozen
  - Cupcakes `$36+` per dozen
  - Decorated sugar cookies `$48+` per dozen
  - DIY kits `$25+` per kit
- Process or order language:
  - Minimum order of one dozen for macarons and cupcakes
  - Lead times mostly `1-2 weeks`, cookies `2 weeks`

### `/pricing`

- Display title: `Starting Prices`
- SEO title: `Pricing | Starting Prices for Custom Cakes & Treats | The Sweet Fork`
- SEO description: `Transparent starting prices for custom cakes, macarons, cupcakes, and decorated cookies. Based in Centerville, Utah.`
- Headings:
  - `Starting Prices`
  - `About Our Pricing`
  - `Additional Considerations`
  - `What's Included`
  - `Important Note`
  - `Still Have Questions?`
- CTA text:
  - `Check Availability`
  - `View FAQ`
  - `Read Policies`
- Pricing text:
  - Birthday and celebration cakes `$80+`
  - Two-tier cakes `$150+`
  - Three-tier cakes `$250+`
  - Wedding cakes `$300+`
  - Macarons `$30+`
  - Cupcakes `$36+`
  - Decorated sugar cookies `$48+`
  - DIY kits `$25+`
  - Delivery `$15-$50+`
  - Rush fee `up to 25%`
- Policy or payment language:
  - `50% deposit`
  - Balance due before pickup or delivery
  - `Venmo, Square, or cash`
  - Invoices sent by email
- Capacity language:
  - Typically `6-7 custom cake orders per week`

### `/gallery`

- Display title: `Our Gallery`
- SEO title/meta: not clearly confirmed from bundle extraction
- Headings:
  - `Our Gallery`
  - Category previews for:
    - Buttercream Sugar Cookies
    - Custom Cakes
    - Custom Macarons
    - DIY Decoration Kits
    - Custom Cupcakes
    - Wedding Cakes
- Body copy summary:
  - Photo-led gallery with category previews and full-photo browsing
  - Gallery language remains warm and product-focused rather than transactional
- CTA text:
  - `Order Your Custom Creation`
  - `View All Photos`
  - `Browse Categories`

### `/about`

- Legacy alias: `/our-story`
- Display title: `About The Sweet Fork`
- SEO title: `About | The Sweet Fork | Centerville, Utah`
- SEO description: `Learn about The Sweet Fork, a small custom bakery in Centerville, Utah specializing in handcrafted cakes, macarons, and decorated cookies.`
- Headings:
  - `About The Sweet Fork`
  - `Our Values`
  - `Home Kitchen, Professional Standards`
  - `Serving Northern Utah`
- Body copy summary:
  - Passion project turned small intentional bakery
  - Based in Centerville, Utah
  - Custom cakes, macarons, cupcakes, and decorated sugar cookies
  - Made from scratch in a home kitchen
  - Weekly orders intentionally limited
- CTA text:
  - `Read Our Policies`
  - `Start an Order`
- Policy or location language:
  - Utah Home Consumption and Homemade Food Act
  - Davis County, Salt Lake County, Weber County
  - Approximate 25-mile delivery range

### `/faq`

- Display title: `Frequently Asked Questions`
- SEO title: `FAQ | Frequently Asked Questions | The Sweet Fork`
- SEO description: `Common questions about ordering custom cakes, pricing, delivery, and more from The Sweet Fork in Centerville, Utah.`
- Headings:
  - `Frequently Asked Questions`
  - Section groups:
    - Ordering
    - Pricing & Payment
    - Pickup & Delivery
    - Design & Customization
    - General
- CTA text:
  - `Start an Order`
  - `Email Us`
- FAQ coverage:
  - Minimum `2 weeks` notice
  - Wedding cakes `4-6 weeks`
  - Rush orders `up to 25%`
  - Website inquiry form is preferred ordering method
  - Celebration cakes `$80+`
  - Wedding cakes `$300+`
  - Deposit is non-refundable
  - Delivery available within approximately `25 miles`
  - Inspiration photos welcome but not copied exactly
  - Dietary needs discussed but allergen-free cannot be guaranteed
  - Utah home-bakery status
  - Weekly limit of `6-7 custom cakes`
  - No in-person tastings, wedding sample boxes may be available

### `/policies`

- Legacy alias: `/terms-of-service`
- Display title: `Policies & Terms`
- SEO title: `Policies | Terms & Conditions | The Sweet Fork`
- SEO description: `Order policies, allergen information, and terms for The Sweet Fork custom bakery in Centerville, Utah.`
- Headings:
  - `Policies & Terms`
  - `Allergen Notice`
  - `Ordering & Lead Time`
  - `Payment Terms`
  - `Cancellations & Refunds`
  - `Pickup & Delivery`
  - `Design & Expectations`
  - `Servings & Portions`
  - `Non-Edible Items`
  - `Photography & Marketing`
  - `Limitation of Liability`
  - `Indemnification`
  - `Force Majeure`
  - `Governing Law & Amendments`
  - `Utah Home Consumption & Homemade Food Act`
- CTA text:
  - `Start an Order`
- Policy language:
  - Common allergen disclosure
  - `2 weeks` custom-order lead time
  - `4-6 weeks` wedding lead time
  - Rush fee `up to 25%`
  - `50% non-refundable deposit`
  - Remaining balance due the day before pickup or delivery
  - Delivery within approximately `25 miles` for `$15-$50+`
  - Exact replicas not offered
  - Finished work may be photographed for marketing
  - Home kitchen not subject to food service licensing or inspection

### `/start-order`

- Display title: `Start Your Order`
- SEO title: `Start an Order | The Sweet Fork`
- SEO description: `Request a custom cake, macarons, or decorated cookies from The Sweet Fork. Based in Centerville, Utah. 2 weeks notice required.`
- Headings:
  - `Start Your Order`
  - `Before You Submit`
- CTA text inside flow:
  - `Continue`
  - `Submit Request`
- Body copy summary:
  - Complete inquiry form for a detailed quote
  - `2 Weeks Notice`
  - `50% Deposit`
  - `Limited Slots`
- Process or order language:
  - Response within `24-48 hours`
  - Product-first multistep inquiry
  - Delivery ZIP validation against standard service area
  - Review, quote, deposit, then final details
- Budget language:
  - `Under $75`
  - `$75 - $150`
  - `$150 - $300`
  - `$300 - $500`
  - `$500+`
  - `Not sure yet`
- Policy language surfaced in flow:
  - Orders under `14 days` may incur rush fees
  - Home kitchen allergen notice
  - No pre-made options

### `/thank-you`

- Display title: `Request Received`
- SEO title: `Thank You | The Sweet Fork`
- SEO description: `Thank you for your order inquiry. We will be in touch within 24-48 hours.`
- Headings:
  - `Request Received`
  - `What Happens Next`
  - `Response Time`
- CTA text:
  - `Return Home`
- Process language:
  - Review in `24-48 hours`
  - Detailed quote
  - Deposit secures date
  - Direct phone and email follow-up paths

## Major Accuracy Gaps Found In v2

1. Geography and contact details were inaccurate.
   - v2 still referenced Colorado or Denver placeholder geography in content seeds and migrations.
   - Phone, email, and Instagram handle were placeholders instead of the live Sweet Fork contact details.

2. Pricing floors were materially inflated.
   - v2 baseline pricing used premium placeholder numbers well above the live site.
   - Delivery estimate defaults also exceeded the live `$15-$50+` range.

3. Several public pages still sounded like an internal product prototype.
   - Homepage, inquiry flow, and CTA areas still referenced operational improvements, platform behavior, or internal systems rather than customer-facing bakery language.

4. The content model did not reflect the live route model.
   - The live site groups cupcakes, macarons, cookies, and DIY kits under `/treats`, while v2 intentionally splits them into premium individual pages.
   - That split is workable, but the page copy had to be grounded in live treats-page facts instead of invented product narratives.

5. FAQ and policy content were partly invented or incomplete.
   - Live-site FAQ, payment language, lead times, and home-bakery disclosures were not consistently represented in v2.

6. Legal and privacy content was mismatched.
   - `/terms` and `/privacy` in v2 were placeholders.
   - The live site only has a detailed policies page and no dedicated public privacy page.

7. Public inquiry budgeting drifted from the live form.
   - v2 budget bands had shifted upward and become more luxury-filtered than the live site.
   - That was adjusted toward the live form while preserving polished note copy.

## Migration Map

| Live source | Migration action | v2 target | Notes |
| --- | --- | --- | --- |
| Site-wide brand, contact, SEO defaults | Copy directly | `siteConfig`, marketing fallbacks, layout metadata, SQL migration | Replaced Colorado placeholders with live Utah details |
| Homepage promise, testimonials, contact footer | Copy directly with light polish | homepage content sections and storefront copy | Preserved boutique tone while removing prototype language |
| Homepage process language | Convert to structured content block | `processSteps`, `home.process`, SQL `content_blocks` seed | Kept inquiry → quote → deposit sequence |
| `/custom-cakes` page | Split and reuse across v2 cake pages | `productPageContent.custom-cakes` and `wedding-cakes` | Wedding facts still come from live cakes page |
| `/treats` page | Split into structured v2 product pages | cupcakes, macarons, sugar cookies, DIY kits content records | Intentional v2 page split kept, live facts mapped into each |
| Pricing page | Copy starting prices directly | pricing highlights, matrix, pricing baseline, inquiry catalog | Removed inflated placeholder prices |
| FAQ page | Copy directly with cleanup | `faqItems` and SQL FAQ seed alignment | Converted into structured FAQ records |
| Policies page | Copy into structured sections | `termsSections`, `/terms` page | Turned long live legal page into maintainable section arrays |
| Start order page | Rewrite to match live ordering language | start-order hero, wizard copy, budget bands, success state | Preserved improved v2 intake UX while aligning public content |
| Privacy handling | Rewrite and flag for review | `privacySections`, `/privacy` page | No direct live source page exists; factual but still needs owner/legal confirmation |
| Placeholder testimonials and invented descriptors | Remove | homepage and product-facing copy | Replaced with live testimonials and live business language |

## Repo Updates In This Pass

- Updated the main static content source in `src/lib/content/site-content.ts`.
- Updated marketing fallbacks in `src/lib/site/marketing.ts`.
- Updated public storefront copy across the homepage, pricing, about, gallery, FAQ, how-to-order, start-order, terms, and privacy routes.
- Updated inquiry CTA and product-page template copy to remove internal or prototype phrasing.
- Updated pricing baselines and inquiry catalog descriptions to reflect live starting prices.
- Updated public inquiry budget bands to match the live form while keeping compatibility with older inquiry metadata.
- Added `supabase/migrations/20260405190000_content_accuracy_live_site_alignment.sql` so placeholder seeded records can be safely moved toward live-site truth without clobbering already-customized data.

## Confirmed Owner Decisions Applied

1. Cancellation and deposit wording follows the live policies page.
   - Future-order credit language now uses `more than 14 days`.
   - `Within 14 days` now clearly states no refunds or credits.

2. Rush-fee wording is standardized to `up to 25%`.
   - This follows the FAQ and policies wording rather than the inconsistent start-order checklist wording on the live site.

3. Delivery wording now avoids a numeric radius.
   - v2 uses nearby service-area language centered on Davis County, Salt Lake County, and nearby Weber County communities until a precise delivery radius is confirmed operationally.

## Items Still Requiring Manual Confirmation

1. Privacy policy content is inferred, not copied.
   - The live site does not expose a standalone public privacy page.
   - v2 now has a factual privacy page based on observed inquiry fields and order handling, but it still needs owner or legal review.

2. v2 retains a more premium page architecture than live.
   - Live combines several products under `/treats`.
   - v2 keeps separate premium routes for cupcakes, macarons, sugar cookies, and DIY kits.
   - That structure was preserved intentionally, but its content is now grounded in the live treats page.
