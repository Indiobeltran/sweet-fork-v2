# Analytics Measurement Plan

## Context

The Sweet Fork v2 reuses the existing GA4 web stream for `https://www.thesweetfork.com`:

- Stream name: The Sweet Fork
- Stream ID: `12126159657`
- Measurement ID: `G-3FG4VD58VP`
- Implementation: direct GA4 tag, not Google Tag Manager
- Environment variable: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Primary recommended key event: `generate_lead`
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
- `lead_time_bucket`
- `budget_bucket`
- `delivery_method`
- `has_inspiration_links`
- `selected_product_count`
- `contact_method`
- `page_path`
- `error_category`
- `error_code`
- `field_id`
- `form_version`
- `from_step_id`
- `step_id`
- `to_step_id`

Never send:

- customer name
- email address
- phone number
- exact street address
- event address
- free-form inquiry text
- inspiration URLs, domains, paths, or query strings
- inspiration-link counts
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
| `inquiry_started` | How many visitors meaningfully begin the inquiry? | First form value or selection change, never page load alone | `form_version`, `page_path` | field values | Custom | No | `src/components/inquiry/start-order-wizard.tsx` | Change the first field | Funnel start |
| `inquiry_step_viewed` | Where do users progress in the wizard? | Step first viewed in a mounted inquiry session | `form_version`, `step_id`, `step_name`, `step_number`, `page_path` | field values | Custom | No | Inquiry wizard | Navigate steps | Funnel visualization |
| `inquiry_step_completed` | Where do users successfully pass validation? | First successful validated forward progression for that step per inquiry session | `form_version`, `step_id`, `step_name`, `step_number`, `lead_time_bucket`, `budget_bucket`, `delivery_method`, `selected_product_count`, `has_inspiration_links`, `page_path` | exact date, notes, ZIP, inspiration URL/domain/path/query, link count | Custom | No | Inquiry wizard | Move forward after validation, then go back and repeat | Diagnostic step completion only; not a conversion |
| `inquiry_back_clicked` | Where do users go backward? | Intentional Back-button or earlier-step-marker navigation | `form_version`, `from_step_id`, `to_step_id`, `page_path` | field values | Custom | No | Inquiry wizard | Use back controls | Friction indicator |
| `inquiry_validation_error` | Which safe error categories create friction? | Advance or submit attempt fails validation; blur-only revalidation is excluded | `form_version`, `step_id`, `step_name`, `step_number`, `field_id`, `error_code`, `page_path` | invalid value, customer text, validation message | Custom | No | Inquiry wizard | Attempt to continue with a required field missing | UX improvement |
| `inquiry_submission_error` | Are real submission attempts failing? | Failed or unavailable submission attempt | `error_category`, `page_path` | raw error, payload, identifiers | Custom | No | Inquiry wizard | Force failed submission in controlled QA | Reliability alert |
| `generate_lead` | How many confirmed leads were received? | API returns an explicit `persisted: true` response after all required Supabase inquiry records are saved | `form_version`, `budget_bucket`, `delivery_method`, `has_inspiration_links`, `lead_time_bucket`, `page_path`, `product_category`, `selected_product_count` | reference code, inquiry ID, exact date, contact data, inspiration URL/domain/path/query, link count, all free text | GA4 recommended custom emission | Yes | Inquiry wizard after successful persistence response | Submit one QA inquiry and confirm one database/admin record plus one DebugView event | Primary conversion |
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
- Treating Enhanced Measurement form interactions or `inquiry_step_completed` as conversions. The multi-step wizard uses `generate_lead` only after confirmed persistence.
- Sending exact event dates, ZIP-derived user identifiers, filenames, URLs, or free-form inquiry notes.

## Inspiration Reference Policy

- Customer inspiration references are URL-only and optional. The public wizard accepts one or more publicly accessible links separated by new lines.
- Valid bare public domains are normalized to `https://` when needed; explicit valid HTTP/HTTPS URLs are otherwise preserved except for surrounding whitespace.
- The application does not fetch, crawl, preview, download, or otherwise access customer-provided URLs during submission.
- Links are stored with the inquiry as `reference-link` records and are visible in the authenticated inquiry detail view.
- File inputs, multipart inquiry requests, customer Supabase Storage uploads, preview generation, filename persistence, upload validation, and upload-state restoration are intentionally unsupported.
- GA4 may receive only `has_inspiration_links: true|false`. It must never receive a URL, domain, path, query string, link count, or customer-entered reference text.
- A future customer-upload feature requires a separately approved storage, authorization, validation, security, retention, deletion, and privacy design.

## GA4 Account Follow-Up

- Mark `generate_lead` as the primary key event in GA4 after code/network verification. Do not mark `inquiry_step_completed` as a key event.
- Consider `wedding_consultation_started` as a secondary key event only if it represents a meaningful lead action in owner reporting.
- Register event-scoped custom dimensions for `form_version`, `step_id`, `step_name`, `field_id`, `error_code`, `from_step_id`, and `to_step_id` as reporting needs justify.
- Link the existing Search Console domain property to GA4 if it is not already linked.
- Build a funnel exploration using `inquiry_started`, the ordered `inquiry_step_completed` values, and `generate_lead`; keep step completion diagnostic.
- Review GA4 URL query parameter redaction for keys that could contain email, inquiry details, customer identifiers, uploaded asset references, or sensitive campaign data. Candidate keys to redact if ever used: `email`, `phone`, `name`, `customer`, `inquiry`, `order`, `event_date`, `address`, `asset`, `image`, `file`, `reference`.
- Do not change GA4 account settings from code. Owner should verify Realtime/DebugView after cutover.

## Owner Production Verification

1. Open the production site through Google Tag Assistant with debug mode enabled.
2. Open the matching GA4 property and keep DebugView visible.
3. Begin `/start-order`, leave one required field incomplete, and intentionally try to continue.
4. Confirm one `inquiry_validation_error` contains only the expected `step_id`, `step_name`, `field_id`, `error_code`, and `form_version`; confirm the invalid value is absent.
5. Complete and submit one clearly identifiable QA inquiry.
6. Sign in to the Sweet Fork admin dashboard and confirm that inquiry appears exactly once.
7. In DebugView, confirm `generate_lead` appears exactly once for that submission.
8. Inspect all inquiry event parameters and confirm no name, email, phone, address, exact event date, inspiration URL/domain/path/query, topper wording, flavor/design notes, link count, or other customer-entered free text appears.
9. Repeat the validation and successful-submission checks from a mobile device.
10. During the mobile pass, use the wizard Back controls and confirm answers and inspiration links remain populated. Customer file uploads are intentionally unsupported.
