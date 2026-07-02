# V1 To V2 URL Migration Map

## Canonical Target

Preferred production canonical hostname: `https://thesweetfork.com`

Expected host behavior after DNS cutover:

- `http://thesweetfork.com/*` -> `https://thesweetfork.com/*`
- `http://www.thesweetfork.com/*` -> `https://thesweetfork.com/*`
- `https://www.thesweetfork.com/*` -> `https://thesweetfork.com/*`

The v2 app now uses the apex hostname for metadata, Open Graph URLs, robots, sitemap URLs, and structured data. DNS itself is intentionally unchanged in this task.

## Current V1 Findings

- The current public v1 site has direct GA4 installed with `G-3FG4VD58VP`.
- No GTM marker was found in fetched v1 HTML.
- `https://thesweetfork.com/` currently redirects to `https://www.thesweetfork.com/`.
- `http://thesweetfork.com/` currently chains through HTTPS and then to `www`.
- The v1 host returns `200` for many stale/demo paths, including storefront template URLs.
- V1 robots references `https://thesweetfork.com/sitemap.xml`. Verified July 2, 2026: direct fetch of `https://thesweetfork.com/sitemap.xml` returns `301` to `https://www.thesweetfork.com/sitemap.xml`, which returns `200`, `content-type: application/xml; charset=utf-8`, valid XML shape, and approximately 13 `<loc>` URLs. This means a public v1 sitemap exists. That is separate from the owner Search Console finding that no sitemap was submitted there; public availability and Search Console submission are separate facts.
- The v1 `/menu` URL returns an HTML shell at HTTP level, then the rendered SPA lands on `https://www.thesweetfork.com/custom-cakes` with title `Custom Cakes | The Sweet Fork | Centerville, Utah`, H1 `Custom Cakes`, cake-process content, and cake-type starting prices.

## Route Map

| V1 URL | V2 action | V2 target | Rationale |
| --- | --- | --- | --- |
| `/` | Preserve exact route | `/` | Homepage remains the primary branded search result. |
| `/gallery` | Preserve exact route | `/gallery` | Existing indexed gallery path maps directly to v2 gallery. |
| `/category/sugar-cookies` | 301 redirect | `/sugar-cookies` | Category intent maps to the v2 sugar cookies offering page. |
| `/custom-cakes` | Preserve exact route | `/custom-cakes` | Existing route exists in v2. |
| `/terms-of-service` | 301 redirect | `/terms` | Legal terms content exists at the shorter v2 route. |
| `/start-order` | Preserve exact route | `/start-order` | Inquiry route exists and remains the main conversion path. |
| `/signin` | 410 Gone | none | Old auth/storefront route should not be recreated or indexed. |
| `/menu` | 301 redirect | `/custom-cakes` | Rendered v1 `/menu` lands on the Custom Cakes experience, so the v2 custom-cakes page is the closest existing intent match. |
| `/category/` | 410 Gone | none | Empty storefront category route has no customer-useful equivalent. |
| `/product/` | 410 Gone | none | Empty storefront product route has no customer-useful equivalent. |
| `/events` | 410 Gone | none | No accurate v2 events page exists. |
| `/product/wool-throw-blanket` | 410 Gone | none | Stale ecommerce demo product; do not recreate or redirect to homepage. |
| `/category/pillows` | 410 Gone | none | Stale ecommerce demo category; do not recreate or redirect to homepage. |
| `/product/grey-ceramic-plate` | 410 Gone | none | Stale ecommerce demo product; do not recreate or redirect to homepage. |
| `/category/bedroom` | 410 Gone | none | Stale ecommerce demo category; do not recreate or redirect to homepage. |

## V2 Indexable Public Routes

The v2 sitemap should include only canonical public routes:

- `/`
- `/about`
- `/custom-cakes`
- `/cupcakes`
- `/diy-kits`
- `/faq`
- `/gallery`
- `/how-to-order`
- `/macarons`
- `/privacy`
- `/pricing`
- `/start-order`
- `/sugar-cookies`
- `/terms`
- `/wedding-cakes`

Excluded:

- `/admin` and descendants
- `/api` routes
- retired `/category/*`, `/product/*`, `/events`, and `/signin` routes
- preview-only or temporary host URLs
- redirecting legacy paths

## Owner Cutover Checklist

Before DNS cutover:

- Configure `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-3FG4VD58VP` in Netlify production.
- Verify no duplicate Google tags in v2.
- Verify custom events at code/network level.
- Verify canonical URLs use `https://thesweetfork.com`.
- Verify sitemap and robots output on the deployed build.
- Verify `/admin` and preview hosts emit noindex signals.
- Verify old URL redirects and 410 responses.
- Confirm production build and deployed `main` checks pass.

At DNS cutover:

- Point `thesweetfork.com` to v2.
- Verify HTTPS.
- Verify apex canonical host.
- Verify `www` redirects to apex.
- Verify HTTP redirects.
- Verify old paths in this map.
- Verify GA4 Realtime and one successful inquiry conversion event.
- Verify `https://thesweetfork.com/sitemap.xml`.
- Submit `sitemap.xml` to the existing `thesweetfork.com` Search Console property.
- Request indexing for the homepage and key offering pages where appropriate.
- Update Google Business Profile website URL if needed.

After cutover:

- Monitor GA4 Realtime and reports.
- Monitor Search Console indexing and sitemap processing.
- Monitor redirect and 404/410 patterns.
- Monitor Core Web Vitals.
- Compare impressions, clicks, CTR, average position, inquiry volume, and conversion rate.
- Retire or untag v1 if it remains reachable on another hostname.
- Do not delete the existing GA4 property or Search Console property.
