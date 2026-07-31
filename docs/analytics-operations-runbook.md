# Sweet Fork Analytics Operations Runbook

This toolkit provides local, credential-safe operations for the Sweet Fork GA4
property and Search Console property. It uses Google's supported Node.js client
libraries and Application Default Credentials (ADC). It does not add a server,
scheduled job, hosted runtime, database, or production-site dependency.

## Security model

- Keep the service-account credential outside the repository at
  `$HOME/.config/sweet-fork-analytics/service-account.json`.
- Keep the local variable loader outside the repository at
  `$HOME/.config/sweet-fork-analytics/env.sh`.
- Never paste, print, inspect, log, commit, or copy credential contents.
- The scripts check that the configured credential path is readable, but do not
  read it directly. Google's authentication library performs authentication.
- Command errors redact bearer tokens, credential-shaped JSON values, home
  directory prefixes, and PEM-shaped credential material.
- Reports contain aggregate GA4 and Search Console data only. They do not query
  inquiry records and do not log customer names, contact information, inquiry
  text, inspiration URLs, database identifiers, or authentication material.
- `analytics:configure` and `analytics:retire-legacy` are dry runs unless
  `--apply` is supplied. Every reporting, verification, and audit command is
  read-only.

Load the local environment in each new shell before using a command:

```bash
source "$HOME/.config/sweet-fork-analytics/env.sh"
```

The loader must set `GOOGLE_APPLICATION_CREDENTIALS`,
`GOOGLE_CLOUD_PROJECT_ID`, `GA4_PROPERTY_ID`, and
`SEARCH_CONSOLE_SITE_URL`. The GA4 property ID must contain digits only.
Search Console accepts either an `sc-domain:` identifier or an HTTPS
URL-prefix property ending in `/`.

## Installation

Use the repository's npm workflow:

```bash
npm install
```

The toolkit uses `@google-analytics/admin`, `@google-analytics/data`, and
`googleapis`. No second package manager is required.

## Commands

Every command supports `--json` for machine-readable output. Reports accept
`--days N` or a paired `--start YYYY-MM-DD --end YYYY-MM-DD`; most also accept
`--limit N`.

| Command | Behavior and expected output |
|---|---|
| `npm run analytics:test` | Runs focused identifier, idempotency, date-range, sanitization, and URL-boundary tests. |
| `npm run analytics:verify` | Reads the GA4 property and runs a minimal Data API report. Prints only property identity and success status. |
| `npm run analytics:audit` | Reads property metadata, streams, key events, custom definitions, retention, reporting bounds, and requested-dimension duplicates. It does not mutate GA4. |
| `npm run analytics:configure` | Dry-runs the approved GA4 desired state: Mountain reporting timezone, `generate_lead` key event, and five Event-scope custom dimensions. |
| `npm run analytics:configure -- --apply` | Applies only missing approved state, using a timezone-only update mask and create-if-absent resources, then freshly verifies protected property fields, retained key events, and dimensions. A repeated apply makes no changes. |
| `npm run analytics:retire-legacy` | Dry-runs the one-time retirement of the legacy `inquiry_submitted` key-event configuration. It reports zero changes now that the approved retirement is complete. |
| `npm run analytics:retire-legacy -- --apply` | Deletes only the uniquely audited, custom, deletable `inquiry_submitted` key-event resource. It blocks on property-identity, duplicate-resource, protected-key-event, or custom-dimension ambiguity and verifies that no unrelated configuration changed. |
| `npm run analytics:realtime` | Shows inquiry event names and counts from the recent Realtime window. Use `--minutes N` from 1 through 29. |
| `npm run analytics:realtime -- --expect-lead` | Fails if no `generate_lead` is visible. `--expected-count 1` requires an exact count and `--fail-on-unexpected` rejects legacy or unknown inquiry event names. The command never submits an inquiry. |
| `npm run analytics:funnel` | Reports `inquiry_started`, `inquiry_step_completed` by step, and `generate_lead`. |
| `npm run analytics:validation` | Reports errors by stable step, field, error code, form version, device, source/medium, users, and sessions. |
| `npm run analytics:monthly` | Reports acquisition and `generate_lead` performance by source/medium, landing page, device, product category, budget bucket, and lead-time bucket. |
| `npm run search-console:verify` | Lists accessible-property metadata and runs a minimal Search Analytics query without printing search terms. |
| `npm run search-console:report` | Reports queries and landing pages with clicks, impressions, CTR, average position, and a previous-period comparison. The default period ends three days ago. |
| `npm run search-console:sitemap` | Lists submitted sitemaps, download/submission dates, pending state, warnings, and errors. |
| `npm run search-console:inspect -- --url https://www.thesweetfork.com/` | Runs read-only URL Inspection for an HTTPS URL inside the configured property. |

Examples:

```bash
npm run analytics:funnel -- --days 30
npm run analytics:validation -- --start 2026-07-01 --end 2026-07-31
npm run analytics:monthly -- --days 30 --json
npm run search-console:report -- --days 28 --limit 100
```

## Production analytics QA

The owner controls the browser submission. Do not automate a production
inquiry.

The owner completed the controlled production QA on July 30, 2026 (MDT). One
inquiry persisted, exactly one authenticated admin record appeared, and exactly
one `generate_lead` appeared in both DebugView and Realtime. DebugView exposed
no PII, customer free text, identifier, exact date, URL or URL component,
filename, or link count. Mobile navigation and draft restoration also passed.
The procedure below remains the repeatable process for future releases.

1. Run `npm run analytics:realtime` to establish the recent baseline.
2. Enable Tag Assistant/debug mode and open GA4 DebugView.
3. Submit one clearly controlled inquiry through the production wizard.
4. Confirm the inquiry appears once in authenticated admin.
5. Run:

   ```bash
   npm run analytics:realtime -- --minutes 29 --expected-count 1 --fail-on-unexpected
   ```

6. Confirm the command finds exactly one `generate_lead` and no unexpected
   inquiry event names. If the baseline window already contained a lead, wait
   for a clean window or compare a narrower window; no identifier is sent to
   GA4 to correlate an individual inquiry.
7. Confirm DebugView parameters contain no personal information, inquiry text,
   exact date, inspiration URL details, filename, or database/reference ID.

Realtime reporting can lag and may not expose newly registered Event-scope
custom parameters immediately. Use DebugView for parameter-level QA and the
standard reports after processing completes.

## Audit interpretation

- `generate_lead key event: YES` means the Admin API currently returns that
  event exactly once with `ONCE_PER_EVENT` counting and no default monetary
  value.
- `already_present` means a custom dimension exists once with Event scope and
  the requested display name.
- `display_name_mismatch` means the parameter exists once with Event scope but
  has a different display name. The toolkit reports and preserves it.
- Duplicate, archived, or scope conflicts block an apply operation.
- The Analytics Admin API used here does not expose the Search Console link.
  Verify that link in GA4 Admin; API access is independently tested with
  `search-console:verify`.

## Approved GA4 property state

On July 30, 2026, the Admin API verified and applied the following desired
state to `properties/504065366`, display name `The Sweet Fork`:

- Reporting timezone: `America/Denver`
- Currency: `USD` (preserved)
- Industry category: `FOOD_AND_DRINK` (preserved)
- `generate_lead`: key event resource
  `properties/504065366/keyEvents/15355822985`, counted
  `ONCE_PER_EVENT`, with no default monetary value
- Final key events: `purchase`, `generate_lead`, `qualify_lead`, and
  `close_convert_lead`
- Requested custom parameters: `step_id`, `step_name`, `field_id`,
  `error_code`, and `form_version`, each present exactly once with Event scope

The toolkit created `generate_lead` through the Admin API because the production
application already emits GA4's recommended lead event only after persistence,
while the audited property had not marked that event as a key event.
`ONCE_PER_EVENT` keeps each confirmed event instance eligible as a lead; the
application's persistence guard remains responsible for exact-once emission.
No fallback value or currency is configured on the key-event resource.

Mountain Time is the correct reporting boundary because The Sweet Fork operates
in Centerville, Utah and the application business-time source of truth is
`America/Denver`. The property was changed from `America/Los_Angeles` with an
update mask containing only `time_zone`. Google documents that a reporting
timezone change affects data going forward; it can temporarily cause a flat
spot or spike around the time shift, and reports may refer to the old timezone
until processing catches up. Historical data is not rewritten. See [Google's
reporting-timezone
guidance](https://support.google.com/analytics/answer/9744165).

### Retired `inquiry_submitted` key-event configuration

After the successful production QA above, the owner explicitly approved
retirement. On July 30, 2026 (MDT), a fresh Admin API audit found exactly one
custom, deletable resource:
`properties/504065366/keyEvents/15190855388`. The guarded cleanup command:

1. Proposed that single deletion and made no change in dry-run mode.
2. Deleted only that fixed resource with
   `properties.keyEvents.delete` in explicit apply mode.
3. Freshly verified the four final key events and all five custom parameters.
4. Proposed and made zero changes on the second dry run.

Deleting the key-event configuration did not delete or rewrite historical
Analytics event data, create an event-edit rule, or change the application
event contract. The cleanup command remains available as an idempotent audit
and should not be repurposed for another event. Google documents the
fixed-resource [key-event delete
operation](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties.keyEvents/delete).

## Troubleshooting

### Environment or credential errors

- Re-run `source "$HOME/.config/sweet-fork-analytics/env.sh"`.
- Confirm the external credential path exists and is readable without opening
  the file.
- Confirm the property variables are not wrapped in extra quotes in the shell.
- Never work around authentication by copying the credential into the repo.

### Permission errors

- GA4 read operations require property access for the service-account email.
  Dimension creation requires GA4 Editor or Administrator access.
- Search Console read operations require access to the exact configured
  property. URL-prefix and domain properties are different identifiers.
- Fix a `403` by reviewing product-level access. Do not add broad Cloud IAM
  roles, enable more APIs, or attach billing.

### Reporting errors

- A newly created custom dimension can take time to become queryable.
- A dimension/metric compatibility error means GA4 does not permit that
  combination; narrow the report rather than requesting customer-level data.
- Empty Realtime output is valid when no inquiry event occurred in the selected
  window.
- Search Console can return partial or delayed data. The reporting command
  paginates conservatively and caps output with `--limit`.

## Access removal and key lifecycle

These are owner-controlled Google Console actions, not toolkit commands.

### Revoke the current key

1. Open Google Cloud Console → IAM & Admin → Service Accounts.
2. Open the Sweet Fork analytics service account and its **Keys** tab.
3. Delete the affected key.
4. Remove the external local credential file after confirming no other approved
   local workflow uses it.

### Rotate the key

1. Create a replacement key for the same service account only during an
   explicitly approved rotation.
2. Store it outside the repository with restrictive local permissions.
3. Update the external environment loader, verify access, then delete the old
   key.
4. Never keep two active keys longer than the verification window.

### Reduce or remove product access

- In GA4 Admin → Property access management, change the service account from
  Editor to Viewer now that the approved configuration and legacy cleanup are
  complete, unless another explicitly approved write is planned.
- In Search Console → Settings → Users and permissions, remove the service
  account to revoke its property access.
- Removing Cloud project IAM alone does not necessarily remove the separate
  GA4 or Search Console product permissions.

## Cost controls

This implementation uses only local Node.js processes and the existing Google
Analytics Admin API, Google Analytics Data API, and Search Console API. It does
not use BigQuery, Cloud Run, Cloud Functions, Compute Engine, Cloud SQL, Vertex
AI, Gemini APIs, or another hosted Google Cloud service. No billing account was
attached and no paid service was introduced.

Reports use bounded date ranges, output limits, and conservative pagination.
Google publishes separate [Analytics Data API quota
limits](https://developers.google.com/analytics/devguides/reporting/data/v1/quotas)
and [Search Console API usage
limits](https://developers.google.com/webmaster-tools/limits). Running these
commands occasionally for operations and QA does not require a hosted runtime.

Google documents service-account key lifecycle controls in [Create and delete
service account
keys](https://cloud.google.com/iam/docs/keys-create-delete).
