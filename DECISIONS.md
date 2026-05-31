# Sweet Fork v2 Decision Log

Record durable repo, product, architecture, tooling, branch, validation, security, and launch-readiness decisions here. Do not rely on chat history as the only source of truth.

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
