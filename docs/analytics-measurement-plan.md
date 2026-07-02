# Analytics Measurement Plan

## Context

The Sweet Fork v2 reuses the existing GA4 web stream for `https://www.thesweetfork.com`:

- Stream name: The Sweet Fork
- Stream ID: `12126159657`
- Measurement ID: `G-3FG4VD58VP`
- Implementation: direct GA4 tag, not Google Tag Manager
- Environment variable: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Primary recommended key event: `inquiry_submitted`
- Potential secondary key event: `wedding_consultation_started`, only if the owner wants wedding leads separated in reporting

The implementation intentionally avoids Google Ads remarketing, Google Signals, advertising personalization, Meta Pixel, and cookie-consent UI for the current local Utah bakery posture.

## Privacy Rules

All custom payloads pass through the code allowlist in `src/lib/analytics/events.ts`.

Allowed parameter keys:

- `product_category`
- `product_slug`
- `cta_location`
- `gallery_category`
- `gallery_position`
- `step_number`
- `step_name`
- `occasion_type`
- `lead_time_bucket`
- `budget_bucket`
- `delivery_method`
- `has_inspiration_images`
- `selected_product_count`
- `contact_method`
- `page_path`
- `error_category`

Never send:

- customer name
- email address
- phone number
- exact street address
- event address
- free-form inquiry text
- uploaded filenames
- uploaded image URLs
- exact customer-specific event dates
- Supabase IDs
- inquiry IDs
- order IDs
- authentication information
- admin activity
- arbitrary user-entered values

## Phase 1 Events

| Event name | Business question | Trigger | Allowed parameters | Excluded parameters | Automatic or custom | Key event? | Implementation location | Verification method | Reporting use |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `product_viewed` | Which offering pages attract serious interest? | Product page viewed once per client route view | `product_category`, `product_slug`, `page_path` | product names from user input, IDs | Custom | No | `src/components/analytics/product-analytics.tsx` | Browser network/debug check on product routes | Offering interest |
| `product_cta_clicked` | Which product CTAs drive inquiry starts? | Product CTA click | `product_category`, `product_slug`, `cta_location`, `page_path` | customer data, quote values | Custom | No | `SitePrimaryCta`, `StickyProductCta`, product templates | Click CTA and inspect GA request | CTA performance |
| `wedding_consultation_started` | Are wedding cake visitors taking a lead action? | Wedding-cake CTA click | `product_category`, `product_slug`, `cta_location`, `page_path` | customer data | Custom | Optional secondary | Product CTAs for `/wedding-cakes` | Click wedding CTA and inspect GA request | Wedding lead signal |
| `pricing_section_viewed` | Do visitors reach pricing context before inquiring? | Pricing section crosses visibility threshold | `page_path`, `cta_location` | scroll depth, user ID | Custom | No | `src/components/analytics/visibility-analytics.tsx` on `/pricing` | Scroll pricing into view | Pricing engagement |
| `faq_opened` | Are visitors seeking policy/process details? | FAQ detail opens | `page_path` | question text, visitor data | Custom | No | `src/components/site/faq-list.tsx` | Open FAQ item | Objection handling |
| `gallery_filter_used` | Which gallery categories are useful? | User changes gallery filter | `gallery_category`, `page_path` | filenames, URLs, media IDs | Custom | No | `src/components/site/gallery-grid.tsx` | Change filter | Inspiration category demand |
| `gallery_item_viewed` | Are users opening larger examples? | Gallery lightbox opens | `gallery_category`, `gallery_position`, `page_path` | image URL, filename, media ID | Custom | No | `src/components/site/gallery-grid.tsx` | Open lightbox | Gallery engagement |
| `gallery_item_navigated` | Do users browse within the lightbox? | Next/previous lightbox navigation | `gallery_category`, `page_path` | image URL, filename, media ID | Custom | No | `src/components/site/gallery-grid.tsx` | Navigate lightbox | Deeper gallery engagement |
| `inquiry_started` | How many visitors meaningfully begin the inquiry? | First validated forward movement from step 1 | `page_path` | field values | Custom | No | `src/components/inquiry/start-order-wizard.tsx` | Complete step 1 | Funnel start |
| `inquiry_step_viewed` | Where do users progress in the wizard? | Step first viewed in a wizard session | `step_number`, `step_name`, `page_path` | field values | Custom | No | Inquiry wizard | Navigate steps | Funnel visualization |
| `inquiry_step_completed` | Where do users successfully pass validation? | Validated forward step progression | `step_number`, `step_name`, `lead_time_bucket`, `budget_bucket`, `delivery_method`, `selected_product_count`, `has_inspiration_images`, `page_path` | exact date, notes, ZIP | Custom | No | Inquiry wizard | Move forward after validation | Step completion |
| `inquiry_step_back` | Where do users go backward? | Back navigation in wizard | `step_number`, `step_name`, `page_path` | field values | Custom | No | Inquiry wizard | Use back controls | Friction indicator |
| `inquiry_validation_error` | Which safe error categories create friction? | Validation fails | `error_category`, `step_number`, `step_name`, `page_path` | invalid value, message with PII | Custom | No | Inquiry wizard | Trigger validation errors | UX improvement |
| `inquiry_submission_error` | Are real submission attempts failing? | Failed or unavailable submission attempt | `error_category`, `page_path` | raw error, payload, identifiers | Custom | No | Inquiry wizard | Force failed submission in controlled QA | Reliability alert |
| `inquiry_submitted` | How many confirmed leads were received? | API returns confirmed success | `budget_bucket`, `delivery_method`, `has_inspiration_images`, `lead_time_bucket`, `page_path`, `product_category`, `selected_product_count`, `step_name`, `step_number` | reference code, inquiry ID, exact date, contact data | Custom | Yes | Inquiry wizard after successful response | Submit QA inquiry and inspect event | Primary conversion |
| `contact_method_clicked` | Which contact paths get used? | Footer phone/email/Instagram click | `contact_method` | actual phone/email/URL | Custom | No | `src/components/site/site-footer.tsx` | Click contact links | Contact preference |

## Phase 2 Candidates

- `delivery_selected`: useful if delivery demand needs deeper reporting; current `inquiry_step_completed` already captures `delivery_method`.
- `rush_timeline_selected`: useful after rush-fee policy is more explicit in the wizard.
- `multiple_products_selected`: useful if bundle/cross-sell reporting becomes important; current submission event includes `selected_product_count`.
- `social_link_clicked`: can be added if more social channels are introduced. Current Instagram footer click is covered by `contact_method_clicked`.
- `site_search_used` and `no_search_results`: not applicable because there is no public site search.

## Not Recommended

- Duplicate scroll tracking. Enhanced Measurement already covers scrolls.
- Duplicate generic outbound click tracking. Enhanced Measurement already covers outbound clicks.
- Treating Enhanced Measurement form interactions as conversions. The multi-step wizard needs `inquiry_submitted` after confirmed success.
- Sending exact event dates, ZIP-derived user identifiers, filenames, URLs, or free-form inquiry notes.

## GA4 Account Follow-Up

- Mark `inquiry_submitted` as the primary key event in GA4 after code/network verification.
- Consider `wedding_consultation_started` as a secondary key event only if it represents a meaningful lead action in owner reporting.
- Review GA4 URL query parameter redaction for keys that could contain email, inquiry details, customer identifiers, uploaded asset references, or sensitive campaign data. Candidate keys to redact if ever used: `email`, `phone`, `name`, `customer`, `inquiry`, `order`, `event_date`, `address`, `asset`, `image`, `file`, `reference`.
- Do not change GA4 account settings from code. Owner should verify Realtime/DebugView after cutover.
