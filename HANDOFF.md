# Sweet Fork v2 Handoff

Update this file before stopping after any substantive repo task.

## Current Snapshot

- Date: 2026-05-31.
- Current branch: `codex/mobile-first-audit-hardening`.
- Current objective: Implement the mobile-first audit hardening plan from the ChatGPT audit report.
- Application/source code changes in this task: yes, focused on public site, gallery, inquiry flow, metadata/SEO, and documentation.

## Last Completed Work

- Created task branch `codex/mobile-first-audit-hardening` in the current dirty checkout to preserve pre-existing audit work.
- Added route-change scroll restoration and a mobile-aware Back to Top control for public routes.
- Reduced mobile hero height/typographic weight on the homepage, generic public heroes, and product page heroes.
- Reworked gallery lightbox controls so previous/next buttons are immediately visible, 48px touch targets, and the dialog panel no longer scrolls as a whole.
- Added touch-swipe handling for gallery navigation.
- Standardized public-facing brand references to `The Sweet Fork`.
- Improved `/start-order` required markers, error associations, numeric/mobile input attributes, upload accept types, drag-and-drop upload handling, and blur validation without focus jumps.
- Preserved existing server-side validation/spam protections and verified malformed requests are rejected.
- Added lightweight `Service` structured data to product pages.
- Added `docs/brand-style-guide.md`.
- Logged durable decisions in `DECISIONS.md`.

## In Progress

- No implementation work is intentionally left in progress.
- The working tree remains unstaged with both pre-existing changes and this task's new changes.

## Next Exact Task

Review the diff on `codex/mobile-first-audit-hardening`. If it looks good, explicitly ask Codex to stage/commit only the task files; do not include unrelated or undesired working-tree changes without review.

## Commands Run

- `git status --short --branch`
- `git switch -c codex/mobile-first-audit-hardening`
- `sed -n ...` reads for Superpowers skills and required project docs.
- `rg --files ...` and `rg ...` inspections for public routes, image usage, brand references, validation, headers, metadata, sitemap, and robots.
- `npm run lint` (failed once, then passed after ARIA/JSX fixes).
- `npm run typecheck`
- `npm run build`
- `npm run dev` (Next selected `http://localhost:3001` because port 3000 was already in use).
- Browser verification through the in-app browser at 320, 375, 768, and 1024 px.
- `curl -sI http://localhost:3001/`
- `curl -sS -X POST http://localhost:3001/api/inquiries ...`
- `curl` metadata checks for `/`, `/gallery`, `/pricing`, `/start-order`, and `/custom-cakes`.

## Commands Still Needed

- None required for the current implementation pass.
- Optional: rerun browser verification after any future visual edits.

## Files Changed Recently By This Task

- `DECISIONS.md`
- `HANDOFF.md`
- `docs/brand-style-guide.md`
- `src/app/(site)/about/page.tsx`
- `src/app/(site)/faq/page.tsx`
- `src/app/(site)/gallery/page.tsx`
- `src/app/(site)/how-to-order/page.tsx`
- `src/app/(site)/layout.tsx`
- `src/app/(site)/page.tsx`
- `src/app/(site)/pricing/page.tsx`
- `src/app/(site)/privacy/page.tsx`
- `src/app/(site)/terms/page.tsx`
- `src/components/inquiry/start-order-wizard.tsx`
- `src/components/site/back-to-top-button.tsx`
- `src/components/site/gallery-grid.tsx`
- `src/components/site/inquiry-cta.tsx`
- `src/components/site/product-page-template.tsx`
- `src/components/site/public-page-hero.tsx`
- `src/components/site/site-route-scroll-restoration.tsx`
- `src/lib/content/site-content.ts`
- `src/lib/seo.ts`

## Pre-Existing Working Tree Changes Observed

These were already present before this implementation and were preserved:

- `AGENTS.md`
- `next.config.ts`
- `src/app/api/inquiries/route.ts`
- `src/app/robots.ts`
- `src/components/inquiry/start-order-wizard.tsx`
- `src/components/site/gallery-grid.tsx`
- `src/lib/inquiries/submit.ts`
- `src/lib/seo.ts`
- `src/lib/validations/inquiry.ts`
- `supabase/.temp/cli-latest`
- Root docs created before this task: `BACKLOG.md`, `DECISIONS.md`, `GATES.md`, `GEMINI.md`, `HANDOFF.md`, `ROADMAP.md`

## Verification Results

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Browser checks passed for no horizontal overflow at 320, 375, 768, and 1024 px on `/`, `/gallery`, and `/start-order`.
- Route navigation from scrolled homepage to `/custom-cakes` reset scroll to top.
- Back to Top appeared on a long page after scrolling and returned to top.
- Gallery lightbox opened, focused close button, showed visible previous/next controls, changed image with next control, closed, and returned focus.
- `/start-order` showed required indicators, native date input with future minimum date, accessible error association, focus to first invalid field on submit, and blur validation clearing corrected errors.
- Malformed inquiry POST returned HTTP 400 with a user-safe validation message.
- Headers included CSP, Permissions-Policy, Referrer-Policy, X-Content-Type-Options, COOP, and X-Frame-Options.
- Metadata checks confirmed titles/descriptions/canonicals/OG/Twitter title output for key routes.
- Product route structured data was present as `Service`.

## Known Issues

- Browser automation could not synthesize a touch swipe event in the in-app browser sandbox, but the swipe handler is implemented in code and click/keyboard gallery navigation was verified.
- The repository still has uncommitted, unstaged changes, including pre-existing changes from before this task.
- Port 3000 was occupied during verification, so the dev server used port 3001.
- Local dev verification logged Supabase fallback warnings because the configured legacy API keys are disabled; public pages still rendered from fallback content.

## Open Decisions

- Confirm whether to keep using this task branch directly or move the work under a future `launch-readiness` integration branch.
- Confirm whether to stage/commit all audit-related changes together or split documentation, inquiry/security, gallery, and public-site visual polish into separate commits.
