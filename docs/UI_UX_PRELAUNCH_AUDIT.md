# Sweet Fork v2 — Pre-Launch UI/UX Audit

- **Date:** 2026-07-02
- **Branch:** `claude/sweet-fork-prelaunch-audit-4wr0p4`
- **Starting commit:** `63ae66c feat: add homepage gallery carousel preview`
- **Auditor:** Automated pre-production visual/usability review (browser-rendered inspection + code verification)

## Review environment and limitations

This audit ran in a sandboxed remote environment whose network policy blocks
both `sweet-fork-v2.netlify.app` and `renjsmdsrzjnppqpaoaa.supabase.co`.
Consequences, stated so no claim below is overread:

- All rendered inspection was performed against a **local production build**
  (`npm run build` + `next start`) of commit `63ae66c`, not the live Netlify
  deploy.
- Supabase-backed reads degraded to the curated fallback content by design, so
  pages rendered with fallback imagery/copy (`src/lib/content/site-content.ts`).
  Findings that depend on production media (crop quality, real gallery volume,
  carousel density) are marked accordingly.
- **Admin routes could not be exercised end-to-end**: admin auth requires
  Supabase, which is unreachable here. Admin findings come from code review of
  `src/app/admin` and `src/components/admin`, plus the rendered `/admin/login`
  page. The admin area has already been through several dedicated UX passes
  (see HANDOFF entries from 2026-06-13).
- Remote images requested through the Next image optimizer were served locally
  from `public/placeholders` during browser QA to keep the local server stable
  (the sandbox black-holes those requests; not a product issue).

Rendered inspection covered every public route at **320, 375, 430, 768, 1280,
and 1440 px**, with document-level overflow measured via
`scrollWidth`/`clientWidth`, console/pageerror capture, heading/alt scans,
keyboard-focus walks, the full 5-step inquiry wizard at 375 and 1280, the
gallery lightbox at 375 and 1280, and the mobile navigation drawer.

## Executive summary

- **Customer-facing readiness: strong.** Zero horizontal overflow at any of
  the 84 route x viewport combinations tested, zero console errors, exactly one
  `h1` per page, no missing alt attributes, visible focus everywhere tested,
  a skip link, `prefers-reduced-motion` respected globally, and a cohesive,
  genuinely editorial visual system. The site does not read as a template.
- **Admin readiness: good, with one shared defect.** The admin shell
  (bottom nav, More sheet, pending-route feedback) is thoughtfully built. The
  one material problem found is shared with the public wizard (SF-01 below).
- **Strongest aspects:** typography and hero composition; consistent
  section rhythm across routes; the inquiry wizard's step framing, sidebar
  reassurance, and snapshot panel; gallery lightbox quality; mobile-first
  hardening clearly shows.
- **Largest remaining risk (was): SF-01.** The Tailwind config redefines
  `rose` as a single brand color, which silently deletes Tailwind's default
  `rose-50…900` scale. ~40 class usages across the inquiry wizard and admin
  (validation errors, destructive/danger badges, overdue-balance chips,
  high-severity media warnings, login errors) compiled to **nothing** — error
  text rendered in plain charcoal, indistinguishable from help text, and danger
  badges rendered unstyled next to working green/amber ones. Verified in the
  compiled CSS and in the rendered wizard. Fixed in this pass.
- **Launch blockers:** none remaining from this audit's scope. SF-01 was the
  only finding I would have called blocking, and it is fixed. The known-open
  inquiry email-notification gate (BACKLOG) is a business decision outside this
  audit's scope and unchanged.
- **Visual credibility for production:** yes. With SF-01 fixed, the customer
  experience is credible, distinctive, and conversion-focused.

## Findings table

Severity: P0 broken/unsafe; P1 material usability/accessibility/conversion;
P2 meaningful polish; P3 subjective/future.
Disposition: Fix now / Near-term / Future / No change.

| ID | Surface | Route/Component | Viewport | Category | Evidence | Impact | Sev | Conf | Recommendation | Risk | Disposition |
|----|---------|-----------------|----------|----------|----------|--------|-----|------|----------------|------|-------------|
| SF-01 | Both | `tailwind.config.ts` → wizard, admin dashboard/orders/media/login | All | Feedback/A11y | `rose-*` classes absent from compiled CSS (grep = 0 matches); rendered wizard error probe: error `<p role="alert">` color `rgb(44,36,27)`, alert box bg transparent, border default gray. Custom `colors.rose` string replaces Tailwind's rose scale. | Validation errors indistinguishable from help text in the money flow; admin danger/overdue/high-severity indicators lose all color coding | **P1** | High | Restore default rose scale via `colors.rose` spread, keep brand token as `DEFAULT` | Very low (bare `rose` utility never used — verified by grep) | **Fix now** |
| SF-02 | Public | `globals.css` `.luxury-panel` | All | Visual system | Computed style probe: `border: 0px none`. `rgba(var(--color-charcoal), 0.07)` is invalid CSS (space-separated channels + comma alpha), so the whole `border` shorthand is dropped | Panels on product pages (availability, FAQ, pricing, detail bullets), pricing page, FAQ, terms/privacy lose their intended hairline definition | P2 | High | Rewrite as `1px solid rgb(var(--color-charcoal) / 0.07)`; no usage overrides border utilities (verified) | Very low | **Fix now** |
| SF-03 | Public | `gallery-grid.tsx` card badges | ≤640px | Legibility | Computed font-size 7.5px at 320/375 ("Wedding Cakes", "View larger" pills) | Sub-8px text is effectively unreadable on phones; brief explicitly flags tiny text | P2 | High | Raise to 9px mobile / 10px `sm+` within existing fixed-pill layout | Low (verify wrap at 320) | **Fix now** |
| SF-04 | Public | Inquiry wizard step markers (`wizard-ui.tsx`) | ≥1024 | Polish/Orientation | Screenshots at 1280: all five step titles truncate ("Event De…", "Select Desse…", "Customize It…", "Style & Inspi…", "Review &…") | The primary conversion flow looks unfinished at desktop widths; step names are the user's map | P2 | High | Allow two-line wrap instead of `truncate` (full titles remain in `aria-label`) | Low | **Fix now** |
| SF-05 | Public | Gallery lightbox category badge | All | Consistency | Lightbox shows raw `category` ("WEDDING-CAKE") while the card badge on the same item shows normalized "Wedding Cakes" | Inconsistent taxonomy label in an otherwise premium lightbox; visible whenever category values are slug-style (all fallback items; any raw production rows) | P2 | High | Use the existing `getFilterCategory()` normalization in the lightbox badge | Very low (same module) | **Fix now** |
| SF-06 | Public | `site-content.ts` DIY kits fallback hero | All | Robustness | Only fallback hero that references remote Supabase storage; every sibling uses `/placeholders/marketing/*.jpg`; local `diy-kit.jpg` exists. Broke `/diy-kits` rendering in this sandbox when storage was unreachable | Fallback content fails exactly when fallback is needed (Supabase outage) | P2 | High | Point at the local placeholder like the other five product pages | Very low (production uses the approved Supabase hero assignment; fallback only) | **Fix now** |
| SF-07 | Public | Homepage offerings header CTA | All | Copy consistency | "Start an inquiry" sits on the same page as hero/nav/process "Start Your Inquiry" | Slightly dilutes the deliberate CTA system the brief specifies | P3 | High | Align to "Start Your Inquiry" | Very low | **Fix now** (single label) |
| SF-08 | Public | `globals.css` `.eyebrow-label` | All | Visual system/A11y | Same invalid `rgba(var(),α)` pattern as SF-02: intended 54% charcoal never applies; renders at inherited full charcoal (or ivory inside dark heroes) | None today — the accident is *more* accessible (54% would be ~3.4:1, failing AA at 11px). But the broken declaration is a trap: a naive syntax fix would (a) fail AA and (b) override `text-gold/80` on product heroes (source-order wins), painting charcoal on dark photos | P3 | High | Post-launch: move component classes into `@layer components`, then choose an AA-compliant muted value (≈0.66+) deliberately | Medium if done naively | **Document (near-term)** |
| SF-09 | Public | Component classes after utilities | All | Architecture | `.luxury-panel` (radius 2rem) and `.eyebrow-label` are emitted after the utilities layer, so per-use overrides like `rounded-[1.8rem]` and `text-gold/80` silently lose | Dead classes in markup; future styling surprises | P3 | High | Wrap custom component classes in `@layer components` post-launch and re-verify | Medium (cascade-wide) | **Document (near-term)** |
| SF-10 | Public | Wizard progress label | All | Feedback | Entering step 5 shows "100% COMPLETE" while required contact fields are still empty and nothing is submitted | Mildly misleading; a user may feel done before submitting | P3 | Med | Consider counting *completed* steps (80% entering step 5) or wording "Step 5 of 5" | Low | **Near-term** |
| SF-11 | Public | Product pages, empty showcase state | All | Duplication | When a category has no showcase items, section shows both "VIEW THE FULL GALLERY" button and "BROWSE THE FULL GALLERY" link back-to-back | Redundant double CTA, but only in degraded/empty-category mode; production categories have items | P3 | High | Suppress the header link when the empty-state card renders | Low | **Near-term** |
| SF-12 | Public | Footer | All | Navigation | Footer contains brand, contact, and legal links only — no product/gallery/FAQ links | Dead-end for scroll-to-bottom users; header/CTAs mitigate | P3 | Med | Consider a slim link column post-launch; deliberate minimalism is also defensible | Low | **Future** |
| SF-13 | Public | Mobile nav drawer | <1024 | Naming | "Home" listed under "Shop by category" | Minor label/category mismatch | P3 | High | Rename group or split Home out | Very low | **Future** |
| SF-14 | Public | Wizard paused banner | All | Copy | "Online submission is paused." heading + "Online submission is temporarily unavailable…" body repeat themselves (env-gated banner; not shown when Supabase is configured, verified in `catalog.ts`) | Minor redundancy in a rare state | P3 | High | Tighten body copy | Very low | **Future** |
| SF-15 | Admin | `product-page-template.tsx` showcase badge | All | Consistency | Shows raw `item.category`; production categories are display names so usually fine | Slug-style labels appear only for slug-style data | P3 | Med | Share one category-label helper (needs a server-safe module) | Low | **Near-term** |
| SF-16 | Admin | All admin routes | — | Verification gap | Admin flows not exercisable in this environment (Supabase auth unreachable) | Admin visual claims in this audit are code-level only | — | — | Owner should re-run the existing admin QA checklist on production after deploy | — | **Document** |
| SF-17 | Public | Gallery filter chips | ≤640 | Touch targets | Chips are min-h 37.6px (≥ WCAG 2.2 24px minimum, < 44px ideal) | Acceptable; slightly small for thumbs | P3 | Med | Consider 44px min-height post-launch | Low | **Future** |

## Page-by-page assessment (public)

**Home (`/`)** — Works: hero composition and typographic scale are excellent at
every width; the mobile hero keeps H1 + both CTAs + reassurance line inside the
first viewport; process section (dark) provides rhythm; carousel pauses on
hover/focus and disables auto-advance under reduced motion. Weakens: CTA label
drift (SF-07); page is long on mobile (~7,400px at 375) but each section earns
its place. Most valuable improvement: SF-07 (implemented). Code change: yes
(SF-07).

**Gallery (`/gallery`)** — Works: filter chips with live counts, uniform 4/5
crops, focus-trapped lightbox with arrow keys, swipe, position indicator
("1 / 6"), and a serving-area + CTA card up top. Weakens: 7.5px badges
(SF-03), raw category in lightbox (SF-05). Most valuable: SF-03. Code change:
yes (SF-03, SF-05).

**Product pages (custom-cakes, cupcakes, sugar-cookies, macarons,
wedding-cakes, diy-kits)** — Works: consistent premium hero with
"What makes it premium" overlay; practical detail bullets; starting-price
panel sets expectations at the right moment; per-page FAQ; sticky mobile CTA;
JSON-LD Service schema. Weakens: luxury panels missing their intended border
(SF-02); DIY kits fallback hero fragility (SF-06); empty-showcase duplicate CTA
(SF-11). Most valuable: SF-02. Code change: yes (SF-02, SF-06).

**Start Order (`/start-order`)** — Works: 5-step structure with clear
"Current step" card, progress bar, per-step descriptions, an aria-live step
announcer, honeypot, "What happens next" and live "Inquiry snapshot" sidebars,
budget ranges with plain-language notes, per-item required-count gating with
calm messaging. Weakens: SF-01 made every validation message look like help
text (fixed); step titles truncated on desktop (SF-04, fixed); "100% complete"
on entry to step 5 (SF-10, documented). Most valuable: SF-01. Code change: yes.

**About / FAQ / How to Order / Pricing** — Works: one shared hero pattern
(eyebrow, serif title, CTA + "Takes 2–3 minutes • No commitment required"),
"The Sweet Fork Standard" panel reinforcing trust; about page is personal and
names Melissa and the Home Consumption and Homemade Food Act. Weakens: nothing
material found. Code change: no.

**Privacy / Terms / admin login** — Render cleanly at all tested widths; login
error styling was affected by SF-01 (fixed).

## Admin assessment (code-level; see SF-16)

- **Shell/navigation** (`admin-shell-chrome.tsx`, `mobile-bottom-nav.tsx`,
  `more-menu-sheet.tsx`): four primary destinations + grouped "More" sheet,
  active/pending states, Escape handling, 8s pending timeout, top progress
  strip with `aria-live`. Clear labels, low cognitive load. No change needed.
- **Dashboard** (`(protected)/page.tsx`): "Needs attention" pills lead with
  counts and destinations; "All clear" state exists. The urgent "Due within 7
  days" pill was unstyled by SF-01 (fixed).
- **Inquiries/Orders**: compact chip-based rows, balance-due chip (rose —
  SF-01), paid chip (emerald, was fine). Search/status patterns present.
- **Media** (`media-library-manager.tsx`): placement-warning banner
  distinguishes high (rose — SF-01) vs medium (amber) severities; assignment
  destinations spelled out. Prior handoff passes covered drawer density and
  mobile editing.
- **Feedback patterns**: `role="alert"` used for errors; confirm-submit
  button component exists for destructive actions.

## Cross-site system observations

- **Typography**: consistent two-font system (Cormorant Garamond display,
  Inter body); scale discipline is good across routes.
- **Spacing/containers**: `section-shell` (max-w-7xl) used uniformly; section
  padding rhythm `py-12 md:py-16` on home vs `py-16 md:py-20` on product/hero
  pages — intentional-looking, consistent within page types.
- **Buttons**: pill vocabulary is coherent (charcoal solid primary, bordered
  white secondary, underlined tertiary). CTA labels now aligned (SF-07).
- **Cards/images**: uniform 4/5 gallery crops; product cards square on mobile,
  4/3 at `sm+`. Image `sizes` attributes are tuned per slot.
- **Motion**: restrained (fade-up reveals, 4.5s carousel, hover lifts); global
  `prefers-reduced-motion` kill-switch verified in CSS and carousel JS.
- **Forms**: labels + required markers + `aria-describedby` error wiring are
  present; error *color* was the gap (SF-01).
- **Accessibility**: skip link, single h1s, aria-current nav states, focus
  outlines on a11y-relevant elements, `inert` on the closed mobile drawer,
  focus-trapped lightbox. Gaps: SF-01 (color-only severity lost), SF-03 (tiny
  text), SF-08/SF-09 (latent cascade traps).
- **Feedback**: public wizard has calm step alerts + inline errors; admin has
  notice banners/chips. One vocabulary (rose = error/urgent, amber = warning,
  emerald = good) — restored by SF-01.

## Deferred recommendations (do not implement pre-launch)

1. **Cascade-layer cleanup (SF-08/SF-09):** move `.eyebrow-label`,
   `.luxury-panel`, `.section-shell` into `@layer components`; then decide the
   eyebrow opacity intentionally (AA-compliant ≈0.66+ charcoal), and re-verify
   product-hero gold eyebrows.
2. **Wizard progress semantics (SF-10)** and paused-banner copy (SF-14).
3. **Footer navigation column (SF-12)** — owner preference.
4. **Shared category-label helper (SF-05/SF-15)** in a server-safe module.
5. **Touch-target uplift to 44px** for gallery filter chips (SF-17).
6. **Empty-showcase CTA dedupe (SF-11).**
7. **Image delivery**: consider AVIF/WebP format hints and a blur placeholder
   for the homepage hero (perception polish; needs production measurement).
8. **Testimonial provenance**: quotes cite names + "Google Review" — a link or
   aggregate rating could strengthen proof (needs owner preference and data).

## Changes implemented in this pass

| ID | Files | Change |
|----|-------|--------|
| SF-01 | `tailwind.config.ts` | Restore Tailwind's default rose scale; keep brand rose as `DEFAULT` |
| SF-02 | `src/app/globals.css` | Valid hairline border on `.luxury-panel` |
| SF-03 | `src/components/site/gallery-grid.tsx` | Badge text 7.5→9px mobile, 9→10px `sm+` |
| SF-04 | `src/components/inquiry/wizard-ui.tsx` | Step titles wrap to two lines instead of truncating |
| SF-05 | `src/components/site/gallery-grid.tsx` | Lightbox badge uses normalized category label |
| SF-06 | `src/lib/content/site-content.ts` | DIY kits fallback hero uses the local placeholder |
| SF-07 | `src/app/(site)/page.tsx` | "Start an inquiry" → "Start Your Inquiry" |

Each change was re-rendered and inspected at the affected widths; the full
overflow/console sweep was re-run after implementation (see HANDOFF entry for
gate results).
