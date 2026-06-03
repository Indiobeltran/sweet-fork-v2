# Sweet Fork v2 Backlog

Use this backlog for agent-visible repo operations and public-site readiness work. Do not treat backlog items as permission to change application/source code; an active user request is still required.

## Repo Operations

- [x] Preserve existing Sweet Fork production-readiness guidance in `AGENTS.md`.
- [x] Add shared agent operating rules for Codex, Gemini, Antigravity, and future agents.
- [x] Add `GEMINI.md` pointer to shared instructions.
- [x] Add root-level `ROADMAP.md`.
- [x] Add root-level `GATES.md`.
- [x] Add root-level `HANDOFF.md`.
- [x] Add root-level `DECISIONS.md`.
- [x] Add root-level `BACKLOG.md`.
- [ ] Confirm and create the `launch-readiness` integration branch if the user wants that branch model activated.
- [ ] Keep `HANDOFF.md` current after every substantive agent task.
- [ ] Keep `DECISIONS.md` current when branch, tooling, architecture, launch, validation, security, or vendor decisions change.

## Production Readiness

- [ ] Re-run the public-site hardening audit from `AGENTS.md` when explicitly requested.
- [ ] Configure Netlify deploy settings (Environment Variables, Build Settings) and verify Preview deployments.
- [ ] Implement robust transactional email delivery (Resend/Postmark) or Netlify Forms once Netlify migration is validated.
- [x] Verify performance and image delivery on homepage, gallery, and product pages.
- [x] Verify `/start-order` inquiry UX, validation, future-date behavior, and mobile flow.
- [x] Verify server-side validation, sanitization, and spam protection.
- [x] Verify security headers against required assets and form submissions.
- [x] Verify accessibility basics across navigation, footer, gallery, FAQ, and inquiry flow.
- [x] Verify gallery interaction, captions, alt text, and mobile usability.
- [x] Verify route-level metadata, sitemap, robots, OG tags, and Twitter tags.
- [ ] Defer inquiry email notification delivery to Netlify migration (admin dashboard `/admin/inquiries` remains the source of truth; evaluate Netlify Forms or transactional email providers like Resend/Postmark during Netlify planning).

## Quality and Release

- [x] Run `npm run lint` before app changes are considered complete.
- [x] Run `npm run typecheck` before app changes are considered complete.
- [x] Run `npm run build` before app changes are considered complete.
- [ ] Add or identify a test command if automated tests are introduced.
- [x] Capture screenshots or manual browser notes for visual changes.
- [ ] Use PRs for task branches and integration-to-main promotion.
