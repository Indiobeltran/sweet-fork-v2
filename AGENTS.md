# AGENTS.md

## Agent operating model

This repository powers **The Sweet Fork v2**. Treat it as a production bakery website and inquiry system, not a sandbox.

Do not change application/source code unless the active user request explicitly asks for code changes. For documentation, repo-operations, planning, or handoff tasks, preserve the app and update only clearly relevant documentation files.

### Shared agent behavior

- Preserve existing decisions, handoff context, roadmap notes, and known constraints.
- Inspect files before assuming they exist.
- Prefer small, reviewable changes over broad rewrites.
- Avoid deleting, renaming, or overwriting important existing files.
- If an equivalent file already exists, update it carefully instead of replacing it wholesale.
- Do not add dependencies unless the active task explicitly requires them.
- Do not expose Supabase keys, internal endpoints, debug details, or secrets.
- Keep customer-facing work premium, polished, mobile-first, and launch-ready.
- Keep accessibility, performance, validation, and security in scope when touching the public site or inquiry flow.
- Summarize changed files and verification before stopping.

### Agent roles

- Codex, Gemini, and Antigravity may all work on this repo.
- Codex is preferred for structured repo edits, documentation, implementation, debugging, verification, and reviewable code changes.
- Gemini or Antigravity may be used for a second pass, alternate implementation, or continuation when token budget is tight.
- All agents share the same rules in `AGENTS.md`, `ROADMAP.md`, `GATES.md`, `HANDOFF.md`, `DECISIONS.md`, and `BACKLOG.md`.
- `GEMINI.md` is intentionally a short pointer unless a future Gemini-specific workflow requires more detail.

### Token-conscious agent usage

- Use low/standard reasoning for small documentation edits, typo fixes, and simple file alignment.
- Use medium reasoning for normal planning docs, scoped UI/content changes, and straightforward bug fixes.
- Use high reasoning for multi-file implementation, validation/security work, data-model changes, metadata/SEO architecture, and production-readiness passes.
- Use extra-high reasoning only for major architecture, incident investigation, security-sensitive review, or work that requires reconciling conflicting historical decisions.
- Prefer targeted file reads with `rg`, `sed`, and existing docs before broad exploration.
- Preserve handoff notes so another agent can continue without rediscovering the same context.

### Branch rules

- `main` is production-only and must remain stable.
- Do not commit directly to `main`.
- Do not push directly to `main`.
- Use `launch-readiness` as the integration branch for coordinated Sweet Fork v2 hardening work once it exists.
- Use scoped task branches for individual work items, preferably `codex/<short-kebab-scope>`, `gemini/<short-kebab-scope>`, or `antigravity/<short-kebab-scope>`.
- Start task branches from the current integration branch unless the user explicitly requests a production hotfix.
- Production hotfix branches should start from `main` and use a clear name such as `hotfix/<short-kebab-scope>`.
- Keep task branches short-lived and reviewable.
- Never stage, commit, push, force-push, merge, rebase, or open a PR unless the user explicitly asks.
- Never revert unrelated user changes. If unrelated changes are present, preserve them and call them out in the final report.

### Required reading before coding

Before making application/source code changes, every agent must read:

- `AGENTS.md`
- `ROADMAP.md`
- `GATES.md`
- `HANDOFF.md`
- `DECISIONS.md`
- `BACKLOG.md`
- `README.md`

For public website or inquiry-flow work, also inspect the actual files for the affected routes, shared layout/navigation, metadata utilities, image components, form schemas, API routes/server actions, middleware, Next.js config, sitemap, and robots generation. Do not guess paths.

For architecture, vendors, integrations, framework choices, tooling, hosting, analytics, auth, data shape, validation, or security decisions, read `DECISIONS.md` before changing files and update it while context is fresh.

### Handoff rules

- Update `HANDOFF.md` before stopping after any substantive repo task.
- Handoff notes must include current branch, current objective, last completed work, in-progress work, next exact task, commands run, commands still needed, files changed recently, known issues, and open decisions.
- If Codex stops and Gemini or Antigravity continues, the next agent should start from `AGENTS.md`, `ROADMAP.md`, `GATES.md`, `HANDOFF.md`, `DECISIONS.md`, and `BACKLOG.md`.
- If Gemini or Antigravity stops and Codex continues, Codex should follow the same handoff flow.

### Required task-end report

Before ending a task, report:

- Current branch.
- Files created.
- Files changed.
- Files intentionally preserved.
- Commands run.
- Verification results.
- Decisions made.
- Assumptions made.
- Open questions.
- Known issues.
- Recommended next step.
- Whether changes are staged or unstaged.

### Decision logging

- Record architecture, vendor, tooling, branch/workflow, security, validation, data-shape, hosting, or launch-readiness decisions in `DECISIONS.md`.
- Record decisions as they are made, not after a large batch.
- Include date, status, context, options considered, decision, and consequences.
- Do not bury decisions only in chat; future agents must be able to recover them from the repo.

### Commit, push, and PR rules

- Do not stage, commit, push, or open a PR unless explicitly asked.
- When asked to commit, inspect `git status --short` first and stage only files that belong to the task.
- Keep commits focused and use clear messages.
- Do not include secrets, `.env.local`, build artifacts, cache files, or unrelated user changes.
- When asked to push or open a PR, run the relevant quality gates first or clearly report which gates were skipped and why.
- PR descriptions should include summary, files changed, verification, risks, screenshots for visual changes when applicable, and any follow-up work.

### Quality gates

- Detect the package manager from the lockfile. This repo currently uses npm with `package-lock.json`.
- For documentation-only changes, run a documentation-focused verification: inspect diffs and confirm no app/source files were modified by the task.
- For application/source changes, run the applicable gates from `GATES.md`.
- Do not claim tests, builds, accessibility, security, or manual browser verification passed unless they were actually run.

## Project identity
This repository powers **The Sweet Fork v2**, a premium custom home bakery website and inquiry experience.

Brand priorities:
- elegant, upscale, editorial feel
- calm, luxurious UX
- strong conversion into inquiry submissions
- polished mobile-first presentation
- no dev/demo/prototype feeling anywhere customer-facing

Business context:
The Sweet Fork is a real bakery serving Centerville, Utah and nearby Northern Utah communities. Public pages must feel trustworthy, premium, and launch-ready.

## Product hardening objective
When the active task explicitly requests application/source work, execute a **production-readiness hardening pass** across the public website and inquiry flow.

This is not a redesign from scratch.
This is a focused refinement and hardening pass to:
- improve performance
- tighten inquiry UX
- strengthen validation and security
- improve accessibility
- improve gallery usefulness
- complete SEO / metadata / crawlability
- eliminate weak launch details

## Scope
Prioritize the **public marketing site and inquiry flow**.

Audit and verify these routes if they exist:
- /
- /custom-cakes
- /wedding-cakes
- /cupcakes
- /sugar-cookies
- /macarons
- /diy-kits
- /pricing
- /how-to-order
- /gallery
- /faq
- /about
- /start-order
- /terms
- /privacy

Do not ignore shared layout, metadata utilities, image components, form schemas, API routes, middleware, or deployment config.

## Working rules
Before changing code:
1. Inspect the repo structure and identify the actual files for:
   - app router / public routes
   - shared layout and navigation
   - metadata generation
   - image rendering components
   - gallery implementation
   - inquiry flow components
   - validation schema
   - form submission handlers / API routes / server actions
   - Next.js config
   - Vercel-specific config if present
   - sitemap / robots generation if present
2. Produce a concise implementation plan.
3. Execute in small, logical steps.
4. Validate after each major change cluster.

Do not guess file paths.
Discover the real structure first.

## Non-negotiable constraints
- Preserve the premium Sweet Fork aesthetic.
- Do not cheapen the UI.
- Do not introduce placeholder content.
- Do not introduce generic bakery stock copy.
- Do not remove or rename existing public routes unless absolutely necessary.
- Do not break the current inquiry flow.
- Do not expose Supabase keys, internal endpoints, debug info, or secrets.
- Do not make the UI feel overly “SaaS” or technical.
- Prefer minimal, high-confidence changes over wide rewrites.
- Do not touch admin functionality unless required by shared components or broken dependencies.
- Keep pricing, product names, and public service framing aligned with the existing live intent of the project.

## Required execution order

### Phase 1 — repo inspection and implementation plan
Identify:
- route structure
- layout composition
- metadata strategy
- image strategy
- inquiry architecture
- validation architecture
- submission architecture
- current security header setup
- SEO utilities
- robots/sitemap status

Then create a brief plan grouped by:
- performance
- inquiry UX
- validation + anti-spam
- security headers
- accessibility
- gallery
- SEO / metadata / sitemap / robots

### Phase 2 — performance hardening
Goal:
Improve perceived and real-world performance, especially homepage and image-heavy pages.

Required work:
- audit hero, gallery, and product imagery
- reduce oversized source images
- optimize delivery format where appropriate
- ensure `next/image` is used correctly
- add real `sizes` attributes where missing
- lazy-load below-the-fold media
- prevent layout shift from images
- review font loading behavior
- preserve premium photo quality

Do not:
- noticeably degrade image quality
- distort aspect ratios
- remove strong visual assets without reason

Definition of done:
- image rendering is stable
- payload is reduced where possible
- no broken images
- no ugly compression artifacts
- homepage and gallery feel faster

### Phase 3 — inquiry flow UX hardening
Goal:
Make `/start-order` feel clear, premium, trustworthy, and easy to finish.

Required work:
- preserve current multi-step structure
- make step progress explicit
- improve validation clarity and error messaging
- clearly indicate required fields
- improve keyboard behavior and focus order
- improve screen-reader clarity where useful
- harden date entry with a proper date input / picker approach appropriate to the stack
- ensure future dates work reliably
- keep summary / snapshot synced correctly
- reduce friction on mobile

Do not:
- turn the inquiry into a long single-page dump
- expose internal quote logic in a customer-scaring way
- make the UI feel technical or cluttered

Definition of done:
- users always know where they are
- validation feels clear and calm
- date input is dependable
- flow works well on mobile and desktop

### Phase 4 — server-side validation and anti-spam protection
Goal:
The form must not rely on client-side validation alone.

Required work:
- find the actual submission path
- add strict server-side validation
- sanitize free-text fields
- validate email, phone, ZIP, date, guest count, and numeric ranges as relevant
- reject malformed payloads
- add low-friction spam protection first:
  - honeypot field
  - submission timing check
  - rate limiting if feasible in current architecture
- validate uploads if upload support exists
- return user-friendly failure messages
- avoid unsafe logging

Definition of done:
- invalid/malicious submissions are rejected server-side
- normal users can still submit easily
- spam resistance is improved

### Phase 5 — security header hardening
Goal:
Improve public-launch security posture without breaking the app.

Required work:
- inspect `next.config.*`, middleware, or Vercel config for existing headers
- add or improve:
  - Content-Security-Policy
  - frame protection via `X-Frame-Options` or CSP `frame-ancestors`
  - Referrer-Policy
  - X-Content-Type-Options
  - Permissions-Policy
  - Strict-Transport-Security where appropriate
- ensure fonts, images, analytics, uploads, and form submission still work

Do not:
- add an unrealistic CSP that breaks the app
- claim headers are correct without verifying build/runtime behavior

Definition of done:
- headers are implemented in the right place
- site still builds and runs correctly
- no obvious blocked asset regressions

### Phase 6 — accessibility polish
Goal:
Bring public pages closer to launch-quality accessibility.

Required work:
- add strong visible `:focus-visible` states
- improve low-contrast supporting text where needed
- preserve heading hierarchy
- ensure inputs have labels and associated errors/help text
- ensure keyboard navigation works in header, footer, gallery, FAQ, and inquiry flow
- add ARIA only where it adds real clarity
- ensure gallery imagery has meaningful alt text

Definition of done:
- keyboard users can navigate with confidence
- focus is always visible
- supporting copy is readable
- accessibility improvements do not hurt aesthetics

### Phase 7 — gallery conversion and content polish
Goal:
Make gallery more useful for trust, inspiration, and conversion.

Required work:
- inspect current gallery implementation
- make items more meaningfully interactive if feasible without overengineering
- preferred options:
  - modal/lightbox with larger image + caption
  - or clean detail view if architecture supports it simply
- improve alt text and descriptive labeling
- preserve fast loading and mobile usability

Do not:
- create a bloated gallery system
- sacrifice speed for novelty

Definition of done:
- gallery feels intentional and premium
- users can engage with examples more deeply

### Phase 8 — SEO, metadata, and crawlability
Goal:
Complete route-level SEO and sharing readiness.

Required work:
- confirm every public route has:
  - unique title
  - unique meta description
  - canonical
  - OG tags
  - Twitter tags
- improve page-specific social preview strategy where assets exist
- generate or update sitemap
- generate or update robots.txt
- preserve route integrity
- ensure semantic headings remain clean

Definition of done:
- main public routes have route-specific metadata
- sitemap and robots are present and valid
- public pages are share-ready

## QA expectations
After implementation:
1. Detect package manager from lockfile and use the correct commands.
2. Run lint.
3. Run typecheck if available.
4. Run tests if available.
5. Run production build.
6. Manually verify these areas:
   - global nav
   - footer links
   - CTA links
   - product page CTAs
   - gallery behavior
   - FAQ interactions
   - inquiry flow step progression
   - inquiry validation
   - keyboard tab order
   - mobile layout behavior
   - metadata output on key routes

## Output format when finished
Provide:
1. concise summary of what changed
2. files changed and why
3. verification results
4. risks / follow-up items
5. anything not completed and why

Do not claim manual verification, tests, accessibility compliance, or security correctness unless actually verified.
