# Sweet Fork v2 Quality Gates

Use these gates before claiming a task is complete. Do not claim a gate passed unless it was actually run.

## Package Manager

This repo currently uses npm with `package-lock.json`.

## Documentation-Only Gate

Use this gate for repo-operations and documentation-only tasks.

1. Run `git status --short`.
2. Inspect changed documentation files with `git diff -- <files>`.
3. Confirm no application/source files were modified by the current task.
4. Report any unrelated pre-existing working-tree changes separately.
5. Do not stage or commit unless explicitly asked.

## Application/Source Gate

Use this gate for changes under `src/`, `public/`, `supabase/`, config files, scripts, or any file that affects runtime behavior.

1. Run `npm run lint`.
2. Run `npm run typecheck`.
3. Run tests if a test command exists or if the task adds tests.
4. Run `npm run build`.
5. Manually verify affected routes or flows in a browser when the change is visual, interactive, metadata-related, or form-related.

## Public Site Manual Checks

For public-site changes, verify affected items from this list:

- Global navigation.
- Footer links.
- CTA links.
- Product page CTAs.
- Gallery behavior.
- FAQ interactions.
- Mobile layout behavior.
- Keyboard tab order and visible focus.
- Metadata output on key routes.

## Inquiry Flow Manual Checks

For `/start-order` changes, verify:

- Step progression.
- Required field indicators.
- Validation messages.
- Date behavior with future dates.
- Keyboard flow.
- Mobile layout.
- Submission success and user-friendly failure states.
- Server-side rejection of malformed payloads when validation or API behavior changes.

## Security and Privacy Checks

For security, validation, Supabase, API, or deployment changes:

- Confirm no secrets or internal debug details are exposed.
- Confirm server-side validation rejects malformed payloads.
- Confirm spam protection does not block normal users.
- Confirm headers do not block required fonts, images, analytics, uploads, or form submissions.
- Avoid unsafe logging of inquiry details or sensitive fields.
