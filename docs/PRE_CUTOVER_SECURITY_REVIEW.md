# Pre-Cutover Security Review

Review date: 2026-07-02

Reviewed branch: `codex/pre-cutover-security-review`

Baseline commit reviewed: `7e7d3287390e88844ce293196ff82d8cfefad01d`

Production preview reviewed: `https://sweet-fork-v2.netlify.app`

## Executive Summary

This was a focused defensive source-code, configuration, authorization, Supabase, Storage, dependency, and production-verification review for the pre-DNS-cutover state of The Sweet Fork v2.

No Critical findings were confirmed. One High dependency finding was confirmed and fixed locally by updating the Next.js package declaration to the current 15.5 patch line and refreshing the audited dependency tree. Anonymous Supabase database checks did not expose customer-sensitive tables. Anonymous Storage upload probes were denied by RLS. Signed-out admin routes redirected to `/admin/login` and used private/no-store cache behavior.

Security readiness is limited by two operational realities: direct inquiry-notification email receipt remains the launch gate, and a non-admin authenticated production account was not available for a live negative RLS test. Source and policy review still show admin access depends on `profiles.is_active` plus `user_roles`, not client-side navigation hiding.

Final classification from this review: **SECURITY READY - MANUAL VERIFICATION REMAINS**.

## Scope

Reviewed:

- Public routes, admin routes, `/api/inquiries`, middleware, metadata, sitemap, robots, Next.js config, Netlify config.
- Supabase browser, server, admin, and middleware clients.
- Inquiry validation, sanitization, anti-spam, duplicate detection, and Netlify Forms bridge.
- Admin server actions and authorization guards.
- Supabase migrations for tables, RLS policies, helper functions, grants, and public read models.
- Storage usage for marketing media and removed inquiry uploads.
- Tracked files, targeted git history for env files, local env variable names/status, Netlify project/env metadata, and dependency advisories.
- Production response headers and signed-out admin behavior.

Not performed:

- DNS changes.
- Destructive testing, DoS testing, credential attacks, broad automated exploitation, or production data modification.
- Production customer-record retrieval.
- Creation of production test users or administrator accounts.
- Credential rotation.

## Architecture And Trust Boundaries

Public browser surfaces:

- Marketing routes under `src/app/(site)`: `/`, product pages, `/pricing`, `/how-to-order`, `/gallery`, `/faq`, `/about`, `/start-order`, `/terms`, `/privacy`.
- Public generated routes: `/robots.txt`, `/sitemap.xml`, `/og`.
- Public inquiry API: `src/app/api/inquiries/route.ts`.

Server-rendered and server-action surfaces:

- Public pages render through App Router server components and Supabase-backed fallback helpers.
- Admin server actions live under `src/app/admin/(protected)/**/actions.ts`.
- Protected admin layout calls `requireAdmin()` before rendering protected content.

API / function surfaces:

- Only one app API route was found: `POST /api/inquiries`.
- No Netlify Functions or Edge Functions were found in the repo.
- Netlify Forms bridge uses static `public/__forms.html` and posts to `inquiry-notification`.

Supabase client usage:

- Browser client: `src/lib/supabase/browser.ts` uses public Supabase URL and publishable/anon key only.
- Public data client: `src/lib/supabase/public.ts` uses public key without session persistence.
- Server client: `src/lib/supabase/server.ts` uses public key with Supabase SSR cookies.
- Admin client: `src/lib/supabase/admin.ts` uses server-only privileged key with no session persistence.

Authentication and authorization:

- Supabase Auth handles login/logout/session refresh.
- Admin authorization checks `profiles.is_active` and a matching `user_roles` row.
- Admin server actions call `requireAdmin()` or `requireAdmin(["owner"])` before privileged writes.
- RLS helper functions `current_admin_role()`, `is_admin()`, and `is_owner()` are `SECURITY DEFINER` with `set search_path = public`.

Inquiry submission path:

- `/start-order` wizard posts form data to `POST /api/inquiries`.
- API route validates origin, honeypot, timing, size, duplicate fingerprint, rate limit, and rejects file uploads.
- `submitInquiry()` normalizes and validates with Zod, then writes via the server admin client.
- Netlify Forms bridge records notification payloads for operational email notification.

File-upload path:

- Public inquiry uploads are removed/rejected.
- Admin marketing media uploads are allowed only after `requireAdmin()` and use randomized storage paths with `upsert: false`.

Storage buckets:

- `marketing`: intended public marketing-media bucket; anonymous write probe denied.
- `inspiration`: legacy/inquiry upload bucket; public inquiry uploads currently rejected; anonymous write probe denied.

Sensitive tables:

- Customer and business-sensitive: `inquiries`, `inquiry_items`, `inquiry_assets`, `customers`, `orders`, `order_items`, `payments`, `profiles`, `user_roles`, `notification_logs`, `calendar_entries`, `blackout_dates`.
- Intentionally public read models: active `products`, active/current `product_prices`, active `gallery_categories`, public `site_settings`, published `faq_items`, published `testimonials`, active `content_blocks`, public-url-backed `media_assets`, page-key `media_assignments`.

Third-party services/scripts:

- Supabase Database/Auth/Storage.
- Netlify hosting and Netlify Forms.
- No unrelated third-party browser scripts were found in source.

## Findings By Severity

### SF-SEC-001 - High - Production Dependency Advisories

Affected component: `next`, transitive `ws` dependency tree.

Evidence: Initial `npm audit --omit=dev --json` reported High advisories for `next@15.5.15`, including App Router middleware/proxy bypass and DoS/SSRF-class advisories. It also reported a High transitive `ws` advisory through Supabase realtime.

Exploit or abuse scenario: An attacker targets a known framework vulnerability to cause service degradation or to bypass middleware/proxy behavior. The admin area also has server-side `requireAdmin()` guards, so the middleware bypass advisories were not treated as a confirmed admin-data bypass in this app.

Business impact: Potential site availability loss or framework-level exposure during launch.

Confidence: High.

Recommended remediation: Keep Next.js on the patched 15.5 line or newer and keep production dependency audit clean before DNS cutover.

Blocks DNS cutover: Yes before remediation; no after the fix is deployed and verified.

Fixed: Yes. `package.json` now declares `next@^15.5.20` and `eslint-config-next@^15.5.20`; `npm audit fix --package-lock-only` refreshed the audited dependency graph so transitive `ws` resolves to a non-vulnerable version.

Verification performed: `npm audit --omit=dev --json` now reports zero vulnerabilities.

### SF-SEC-002 - Medium - Netlify Secret Scan Omission Needs Owner Review

Affected component: Netlify project environment configuration.

Evidence: Netlify env metadata includes `SECRETS_SCAN_OMIT_KEYS` for `SUPABASE_SECRET_KEY`. Privileged Supabase keys are present as secret vars and scoped to builds/functions/runtime. Secret values are intentionally omitted from this report.

Exploit or abuse scenario: If a privileged Supabase key were accidentally introduced into tracked source, build output, or logs under the omitted variable name, Netlify's scanner may not flag that specific key name.

Business impact: A missed privileged-key exposure could lead to customer data, order, payment-status, media, or admin-content compromise.

Confidence: Medium. The omission exists, but no active tracked secret exposure was confirmed.

Recommended remediation: Remove `SECRETS_SCAN_OMIT_KEYS` if it is not required, or document the exact false-positive rationale and add an alternate secret-scanning gate. Do not change it during launch without confirming Netlify build behavior.

Blocks DNS cutover: No, because no active repo/history exposure was found in this review.

Fixed: No.

Verification performed: Netlify env metadata was inspected through the connector; tracked source and targeted `.env*` history checks found only placeholders or variable names, not committed secret values.

### SF-SEC-003 - Low - Admin Pages Relied On Robots Disallow Without Explicit Noindex

Affected component: Admin route metadata.

Evidence: `robots.ts` disallowed `/admin`, but admin login/protected layouts did not emit explicit noindex metadata.

Exploit or abuse scenario: Crawlers should obey `robots.txt`, but explicit page metadata gives another signal that admin pages should not be indexed.

Business impact: Defense-in-depth for private workspace discoverability.

Confidence: High.

Recommended remediation: Add `robots: { index: false, follow: false }` to admin login and protected layouts.

Blocks DNS cutover: No.

Fixed: Yes.

Verification performed: Source diff confirms metadata added to `src/app/admin/(auth)/login/page.tsx` and `src/app/admin/(protected)/layout.tsx`.

### SF-SEC-004 - Low - CSP Still Uses Unsafe Inline Script/Style Allowances

Affected component: Browser security headers in `next.config.ts`.

Evidence: Production headers include `script-src 'self' 'unsafe-inline'` and `style-src 'self' 'unsafe-inline'`.

Exploit or abuse scenario: If a separate XSS bug is introduced later, inline allowances reduce CSP's ability to block execution.

Business impact: Defense-in-depth gap, not a confirmed XSS in this review.

Confidence: High.

Recommended remediation: Defer a report-only nonce/hash CSP design until after launch, then migrate carefully with Next.js, Supabase, Netlify Forms, fonts, and image sources accounted for.

Blocks DNS cutover: No.

Fixed: No.

Verification performed: Production headers were inspected on `/`, `/gallery`, `/start-order`, `/admin/login`, and `/admin/inquiries`.

## Supabase RLS Matrix

Source review:

- RLS is enabled for all application tables in `20260405172000_phase2_rls_scaffolding.sql`.
- Public data is exposed by specific public read policies.
- Sensitive tables have admin-only policies for authenticated users using `public.is_admin()`.
- Owner-only operations exist for user-role mutation and inquiry deletion where source requires them.
- No `auth.jwt()` or user-editable `user_metadata` authorization policy was found in migrations.
- `SECURITY DEFINER` helper functions set `search_path = public`.

Live anonymous count checks:

| Table group | Anonymous result |
| --- | --- |
| `inquiries`, `inquiry_items`, `inquiry_assets` | 0 visible rows |
| `customers`, `orders`, `order_items`, `payments` | 0 visible rows |
| `profiles`, `user_roles`, `notification_logs`, `calendar_entries`, `blackout_dates` | 0 visible rows |
| Public marketing tables | expected public counts visible |

Live authenticated admin count checks:

| Table group | Admin QA result |
| --- | --- |
| `profiles`, `user_roles` | count-only reads succeeded |
| `inquiries`, `customers`, `orders`, `payments`, `notification_logs` | count-only reads succeeded |
| `media_assets` | count-only read succeeded |

Normal authenticated non-admin result:

- Not live-tested because this review did not create production test users. Source/migration review indicates a normal authenticated user without `public.is_admin()` should not pass admin policies.

## Storage Access Matrix

| Bucket | Intended access | Review result |
| --- | --- | --- |
| `marketing` | Public read for approved marketing images; admin-only writes | Anonymous tiny PNG upload denied by RLS; no test object created |
| `inspiration` | Legacy/private inquiry uploads; public uploads currently rejected by app | Anonymous tiny PNG upload denied by RLS; no test object created |

Additional notes:

- Public inquiry uploads are rejected in `POST /api/inquiries`.
- Admin media uploads require `requireAdmin()`, use randomized paths, MIME starts-with image check, and `upsert: false`.
- Admin media deletion uses service-side cleanup and revalidation.

## Admin Authorization Assessment

Passed:

- Signed-out `/admin/inquiries` returned a 307 redirect to `/admin/login`.
- Admin routes use `dynamic = "force-dynamic"` and production responses used private/no-store cache behavior.
- Protected admin layout calls `requireAdmin()` before rendering child pages.
- Admin server actions call `requireAdmin()` before privileged mutation.
- Owner-only operations use `requireAdmin(["owner"])`.
- Admin role updates prevent demoting the last owner in source.
- Redirect targets are constrained to internal admin prefixes; no external open redirect was found.
- Admin pages now include explicit `noindex,nofollow` metadata.

Not fully verified:

- Full browser-based authenticated admin workflow after this local patch was not repeated in this report. Supabase Auth sign-in and admin count-only RLS reads succeeded using the existing local QA admin variables.

## Secrets Assessment

Source/history:

- Tracked `.env.example` contains placeholders only.
- `.env.local` exists locally and is ignored; only variable set/empty status was recorded.
- Targeted history check for `.env*` did not find committed active secrets.
- Source search found secret variable names and documentation references, not hard-coded active key values.
- `createAdminClient()` is server-only and uses non-`NEXT_PUBLIC` privileged variables.
- Browser clients use only public Supabase URL and publishable/anon key.

Netlify:

- `SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are marked secret and scoped to builds/functions/runtime.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are intentionally public.
- `SECRETS_SCAN_OMIT_KEYS` suppresses scanning for `SUPABASE_SECRET_KEY` and should be reviewed.

No credential rotation was performed.

## Form And Upload Assessment

Inquiry form/API controls:

- Origin validation.
- Honeypot field: `website`.
- Submission timing check.
- In-memory per-identifier rate limiting.
- Duplicate fingerprint prevention.
- Payload size enforcement.
- Zod server-side validation.
- Text normalization removes control characters and HTML-looking tags.
- Public URL validation limits inspiration links to HTTP/HTTPS.
- File uploads are rejected server-side.
- Generic user-friendly failure messages are returned.
- Unexpected malformed JSON is rejected.

Live safe checks:

- Cross-origin POST was rejected.
- Honeypot POST was rejected.
- No live valid inquiry was submitted during this review.

Netlify Forms:

- Form `inquiry-notification` exists with 7 submissions.
- Direct email receipt is still not confirmed by this workspace.

## Header Assessment

Production routes checked: `/`, `/gallery`, `/start-order`, `/admin/login`, `/admin/inquiries`.

Observed:

- `Content-Security-Policy` present.
- `frame-ancestors 'none'` and `X-Frame-Options: DENY` present.
- `Referrer-Policy: strict-origin-when-cross-origin` present.
- `X-Content-Type-Options: nosniff` present.
- `Permissions-Policy` present.
- `Strict-Transport-Security` present.
- Admin/start-order responses used private/no-store behavior; static public pages were cacheable.

Deferred:

- CSP nonce/hash hardening should be handled as a separate report-only rollout.

## Dependency Assessment

Commands:

- `npm audit --omit=dev --json`
- `npm outdated --json`

Result after remediation:

- Production audit reports zero vulnerabilities.
- Several dependencies have newer non-security versions available. Broad upgrades were intentionally deferred.

## Error Handling And Privacy

Passed:

- Public inquiry errors return generic customer-safe JSON.
- Unknown inquiry submission errors log only the error message, not full inquiry payloads.
- React rendering escapes customer/admin text by default; no `dangerouslySetInnerHTML`, `eval`, `new Function`, shell execution, or raw HTML rendering was found in source searches.
- Admin responses are dynamic/private and protected server-side.

Deferred:

- Retention policy for customer inquiries/uploads should be documented as an operational policy.

## Fixes Implemented

- Updated `package.json` to `next@^15.5.20` and `eslint-config-next@^15.5.20`.
- Refreshed dependency audit state so transitive `ws` resolves cleanly.
- Added explicit `robots: { index: false, follow: false }` to admin login and protected admin layout metadata.

## Deferred Hardening

- Review/remove or document `SECRETS_SCAN_OMIT_KEYS=SUPABASE_SECRET_KEY`.
- Add a non-admin authenticated QA account or staging fixture for repeatable negative RLS tests.
- Add report-only CSP nonce/hash hardening as a post-launch project.
- Document inquiry/customer/upload retention expectations.
- Consider administrator MFA/passkeys after owner approval and operational planning.

## DNS-Cutover Blockers

Security blockers found by this review: none remaining after dependency remediation.

Operational blockers still open:

- Direct receipt of production inquiry notification email by the intended recipient remains unverified.

DNS status:

- DNS was not changed.

## Exact Retest Instructions

Run local gates:

```bash
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Run dependency checks:

```bash
npm audit --omit=dev
npm outdated
```

Run safe production checks:

```bash
curl -sSI https://sweet-fork-v2.netlify.app/
curl -sSI https://sweet-fork-v2.netlify.app/gallery
curl -sSI https://sweet-fork-v2.netlify.app/start-order
curl -sSI https://sweet-fork-v2.netlify.app/admin/login
curl -sSI https://sweet-fork-v2.netlify.app/admin/inquiries
```

Confirm after deploy:

- `/admin/login` and an authenticated admin route emit noindex metadata.
- Signed-out `/admin/inquiries`, `/admin/orders`, `/admin/media` redirect to `/admin/login`.
- Anonymous Supabase count checks still show zero visible rows for customer-sensitive tables.
- Anonymous Storage image upload to `marketing` and `inspiration` remains denied by RLS.
- Public gallery and inquiry wizard still load.
- Admin login and count-only/admin read smoke checks still work.
- No privileged key appears in built static assets.
- Netlify deploy is ready for the pushed commit.
- Direct inquiry-notification email receipt is confirmed manually before DNS cutover.
