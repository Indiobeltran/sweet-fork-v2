# Sweet Fork v2 Decision Log

Record durable repo, product, architecture, tooling, branch, validation, security, and launch-readiness decisions here. Do not rely on chat history as the only source of truth.

## 2026-06-12 - Require Privileged Supabase Admin Key for Inquiry Writes

### Status

Accepted

### Context

The Netlify `/start-order` deployment accepted inquiry form data but failed during submission while public Supabase-backed reads such as the gallery still worked. The app supports multiple Supabase key environment variable names during the hosting migration.

### Options Considered

- Continue preferring `SUPABASE_SECRET_KEY` whenever it is present.
- Rename environment variables and require immediate Netlify dashboard cleanup only.
- Validate candidate server keys and select the first key that is actually privileged for server-side writes.

### Decision

Validate the server-side Supabase admin key before using it. Accept current `sb_secret_...` keys and legacy JWT keys whose payload role is `service_role`; reject publishable/public keys for admin writes and fall back to `SUPABASE_SERVICE_ROLE_KEY` when it is the privileged candidate.

### Consequences

- Netlify can tolerate a stale or mis-set `SUPABASE_SECRET_KEY` as long as `SUPABASE_SERVICE_ROLE_KEY` is correctly configured.
- Inquiry writes fail closed instead of attempting privileged inserts with a public key.
- Public browser Supabase reads remain unchanged.

## 2026-06-03 - Netlify Deployment Parity and Notification Strategy

### Status

Accepted

### Context

The site is currently deployed on Vercel with a Supabase backend for inquiry management. A migration to Netlify is requested. Netlify Forms was proposed for email notifications to avoid adding a transactional email dependency.

### Options Considered

- Complete switch to Netlify Forms (changes frontend architecture and validation).
- Send transactional emails via Resend/Postmark within the API route.
- Defer notification layer until Netlify deployment is fully verified.

### Decision

- Migrate to Netlify by ensuring parity first: add a minimal `netlify.toml` and update IP headers (`x-nf-client-connection-ip`) and URL resolvers (`.netlify.app`) to support deploy previews.
- Keep the current Supabase/admin inquiry architecture intact.
- Evaluate Netlify Forms during the Netlify migration; if it introduces too much friction or disrupts the API flow, fall back to an external transactional email provider (Resend/Postmark).

### Consequences

- The app remains deployable on Vercel and Netlify interchangeably for now.
- `start-order` functionality is preserved exactly as-is.
- Email delivery remains deferred until a firm choice is tested on Netlify.

## 2026-05-31 - Safe Route Match for Home Route (/admin)

### Status

Accepted

### Context

Adding `/admin` as the dashboard route caused the helper `isAdminHrefActive` to incorrectly match it for all `/admin/*` subroutes since they start with `/admin/`. This broke the shell active route indicators and titles.

### Options Considered

- Sort the match routing list by specificity descending.
- Update the helper `isAdminHrefActive` to only match `/admin` exactly when `href === "/admin"`.

### Decision

Modified the `isAdminHrefActive` helper in `src/lib/admin/navigation.ts` to return `pathname === "/admin"` when `href === "/admin"`.

### Consequences

- Highlights the active navigation tab correctly across all sub-pages under the admin panel (Dashboard, Inquiries, Orders, etc.).
- Keeps all other sub-route matches completely intact and robust.
- Compiles, typechecks, and builds successfully.

## 2026-05-31 - Implement Owner-Friendly Admin Dashboard (Phase 2)

### Status

Accepted

### Context

The Sweet Fork bakery owner is non-technical and needs to quickly understand what needs attention from a beautiful, calm dashboard instead of immediately land on a dense list of inquiries.

### Options Considered

- Continue redirecting `/admin` to `/admin/inquiries` directly.
- Build a generic analytics hub with charts and high-level summaries.
- Build a premium, mobile-first, and owner-friendly summary dashboard of active inquiries, upcoming event orders, and prominent operational quick actions.

### Decision

Adopted a luxurious, editorial dashboard using existing data-access helpers. The dashboard compiles active and archived counts, shows the most immediate items needing follow-up, and presents four beautiful quick action buttons for daily bakery workflows.

### Consequences

- Dramatically improves the administrative dashboard ease of use, landing on a clear, premium workspace.
- Safely uses existing read-only data fetching helpers, presenting zero database write or security header risks.
- Maintains full authentication protection, seamlessly redirecting unauthenticated staff to `/admin/login`.

## 2026-05-31 - Adopt shared agent operating docs

### Status

Accepted

### Context

The repo needed project agent operating instructions similar to the TrueHold Digital repo, adapted for The Sweet Fork v2. The task was documentation and repo-operations only, with no application/source code changes requested.

### Options Considered

- Keep all guidance only in `AGENTS.md`.
- Create separate root-level operating docs for roadmap, gates, handoff, decisions, and backlog.
- Copy the TrueHold Digital files verbatim.

### Decision

Use `AGENTS.md` as the primary agent contract and add root-level companion files: `GEMINI.md`, `ROADMAP.md`, `GATES.md`, `HANDOFF.md`, `DECISIONS.md`, and `BACKLOG.md`.

### Consequences

- Codex, Gemini, Antigravity, and future agents have a shared operating model.
- Existing Sweet Fork production-readiness guidance remains in `AGENTS.md`.
- Future substantive work should update `HANDOFF.md` and log durable decisions here.

## 2026-05-31 - Keep `main` production-only

### Status

Accepted

### Context

The user requested branch rules with `main` as production-only plus an integration/task branch workflow.

### Options Considered

- Continue working directly on `main`.
- Use only short-lived branches from `main`.
- Use a long-lived integration branch plus scoped task branches.

### Decision

Keep `main` production-only. Use `launch-readiness` as the recommended integration branch once created. Use scoped task branches such as `codex/<short-kebab-scope>`, `gemini/<short-kebab-scope>`, or `antigravity/<short-kebab-scope>` for individual work.

### Consequences

- Future app changes should not be committed directly to `main`.
- The integration branch still needs to be created if the user approves that workflow.
- Existing uncommitted changes on `main` must be handled carefully and not overwritten.

## 2026-05-31 - Keep Gemini instructions as a pointer

### Status

Accepted

### Context

The user asked for `GEMINI.md` to be a short pointer to `AGENTS.md` unless the repo already had a stronger Gemini-specific pattern. No existing Gemini file or stronger pattern was found.

### Options Considered

- Create a full duplicate Gemini operating guide.
- Keep `GEMINI.md` short and point to the shared rules.

### Decision

Create `GEMINI.md` as a short pointer to `AGENTS.md` plus the required reading set.

### Consequences

- Gemini stays aligned with shared project rules.
- Future Gemini-specific behavior can be added only if needed.

## 2026-05-31 - Preserve dirty audit baseline on task branch

### Status

Accepted

### Context

The mobile-first audit hardening work started with uncommitted application changes already present on `main`. The user explicitly asked to preserve the current dirty working tree as the baseline for implementation.

### Options Considered

- Move the current dirty tree onto a scoped task branch and continue in place.
- Create a clean worktree from `origin/main` and reimplement the audit work from scratch.

### Decision

Create and use `codex/mobile-first-audit-hardening` in the current checkout, preserving all existing uncommitted changes as the baseline.

### Consequences

- The task avoids overwriting or duplicating pre-existing audit work.
- The branch contains both pre-existing uncommitted changes and the new mobile-first hardening edits.
- No files are staged or committed unless the user explicitly asks.

## 2026-05-31 - Use Service structured data for product routes

### Status

Accepted

### Context

The product pages describe custom quoted bakery offerings, not fixed ecommerce products with checkout inventory.

### Options Considered

- Add `Product` structured data with starting prices.
- Add lightweight `Service` structured data for each product route.
- Skip product-route structured data.

### Decision

Use `Service` structured data for product routes, with The Sweet Fork as the bakery provider and Northern Utah service area context.

### Consequences

- Search engines receive clearer route context without implying fixed product checkout, inventory, or guaranteed pricing.
- Product pages remain aligned with the inquiry-first business model.

## 2026-05-31 - Standardize public brand name

### Status

Accepted

### Context

The mobile-first audit found inconsistent public usage of `Sweet Fork` and `The Sweet Fork`.

### Options Considered

- Keep both names depending on sentence flow.
- Standardize public-facing copy and metadata on `The Sweet Fork`.

### Decision

Use `The Sweet Fork` in public headings, body copy, alt text, metadata, social preview text, and structured data. Keep internal/admin shorthand only where it is not customer-facing.

### Consequences

- Public copy, metadata, and future content updates have a single brand standard.
- A concise brand style guide now documents the rule for future agents.

## 2026-06-03 - Conservative HSTS and CSP Header Refinement

### Status

Accepted

### Context

Baseline security headers were needed to harden the application before launch. However, overly aggressive HSTS configuration (using `includeSubDomains; preload`) on preview/staging domains (like `*.vercel.app`) can permanently force HTTPS for all subdomains, creating risks before the production domain configuration is finalized. Additionally, the existing pragmatic CSP correctly allows essential assets (Supabase images/storage, Next.js hydration, local development hot-reloads) and needs to be preserved to prevent customer-facing runtime errors.

### Options Considered

- Maintain aggressive HSTS (`includeSubDomains; preload`) and restrict CSP further.
- Adopt a conservative baseline HSTS (`max-age=31536000` only) and add standard `X-DNS-Prefetch-Control: on` while preserving the verified, error-free CSP rules.

### Decision

Implement the conservative baseline. Removed `includeSubDomains` and `preload` from HSTS, added `X-DNS-Prefetch-Control: on`, and verified that the CSP allows all routes (including `/`, `/gallery`, `/start-order`, and `/admin/login`) to function without console violations.

### Consequences

- Eliminates SSL/subdomain lockout risks on temporary preview URLs.
- Minimizes risk of broken image assets, font errors, or client-side form routing issues.
- Confirms production build, linting, typechecking, and browser screenshots succeed with zero regressions.

## 2026-06-03 - Defer Deployed Inquiry Email Notifications to Netlify Migration Planning

### Status

Accepted

### Context

During the deployed end-to-end inquiry test, customer submission and admin triage/archiving successfully worked, and notification event logs were successfully created. However, transactional email dispatch (to `thesweetfork@yahoo.com`) remains pending because no transactional email provider (such as Resend, Postmark, or SendGrid) is configured or integrated into the current Vercel setup.

### Options Considered

- Integrate a transactional email provider (e.g. Resend, Postmark) on Vercel immediately.
- Defer actual email notification delivery configuration until the planned migration to Netlify, where Netlify Forms and native Netlify notification triggers can be evaluated.

### Decision

Defer transactional email delivery integration until the Netlify migration.
- The admin dashboard (`/admin/inquiries`) remains the primary source of truth for incoming custom orders.
- Until the Netlify notification strategy is finalized, the bakery owner/admin must monitor the `/admin/inquiries` page manually.
- During Netlify migration, Netlify Forms should be evaluated as an email trigger/helper layer, not as a replacement for the existing Supabase database schema and admin workflow (unless all detailed product selections and custom multi-step fields can be fully preserved).
- If Netlify Forms does not integrate cleanly with the wizard's JSON payload or multi-step structure, we will revisit a clean transactional API provider integration (such as Resend or Postmark) directly in the Next.js app.
- Email notification delivery status is marked as a pending/deferred pre-launch cutover checklist item in the backlog.

### Consequences

- Avoids setting up unnecessary third-party accounts and environment secrets on Vercel that may change during the upcoming Netlify migration.
- Keeps deployment dependencies lean.
- Requires admin to manually poll the dashboard for new inquiries in the short term.
