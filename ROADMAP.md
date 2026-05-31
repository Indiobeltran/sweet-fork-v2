# Sweet Fork v2 Roadmap

This roadmap is for repo coordination and agent handoff. It does not authorize application/source changes by itself; app work still requires an explicit user request.

## Current Product Direction

The Sweet Fork v2 is a premium custom home bakery website and inquiry experience for Centerville, Utah and nearby Northern Utah communities.

Public work should preserve:

- Elegant, upscale, editorial presentation.
- Calm and luxurious inquiry UX.
- Strong conversion into inquiry submissions.
- Polished mobile-first behavior.
- No customer-facing dev, demo, or prototype feeling.

## Operating Priorities

1. Preserve existing decisions and handoff context.
2. Keep `main` production-only.
3. Use an integration/task branch workflow for reviewable work.
4. Keep documentation current enough for Codex, Gemini, or Antigravity to resume without rediscovery.
5. Require quality gates before claiming readiness.

## Recommended Branch Flow

- Production branch: `main`.
- Integration branch: `launch-readiness` once created.
- Task branches: `codex/<short-kebab-scope>`, `gemini/<short-kebab-scope>`, or `antigravity/<short-kebab-scope>`.
- Hotfix branches: `hotfix/<short-kebab-scope>` from `main` only when explicitly requested.

## Product Readiness Tracks

### Public Site Hardening

- Performance for homepage, gallery, and product pages.
- Route-level metadata and share previews.
- Sitemap and robots correctness.
- Image delivery quality and layout stability.
- Accessible navigation, headings, focus states, and supporting copy contrast.

### Inquiry Flow Hardening

- Clear multi-step progress.
- Calm validation and required-field communication.
- Reliable future-date handling.
- Mobile-friendly controls and keyboard flow.
- Server-side validation, sanitization, and low-friction spam protection.

### Launch Trust

- Security headers that do not break assets or submissions.
- No exposed secrets or debug details.
- Footer, CTA, product-page, FAQ, gallery, and metadata verification.
- Handoff notes and decision logs kept current.

## Documentation Operations

- Keep `AGENTS.md` as the primary agent contract.
- Keep `GEMINI.md` as a short pointer unless Gemini-specific rules become necessary.
- Keep `HANDOFF.md` current after substantive work.
- Log durable decisions in `DECISIONS.md`.
- Track open work in `BACKLOG.md`.
- Use `GATES.md` for verification expectations.
