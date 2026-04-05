# Phase 2.5 Supabase Apply and Typegen

## Current State

- The repo now contains schema, seed, and baseline RLS migrations.
- This workspace is not currently linked or authenticated to the remote Supabase project.
- The configured project ref inferred from the existing Supabase URL is `renjsmdsrzjnppqpaoaa`.
- A committed schema-snapshot type file already exists at `src/types/supabase.generated.ts`, but it should be overwritten by official CLI output after the remote project is linked and migrated.

## Exact Remote Apply Process From This Workspace

1. Install the Supabase CLI dependency if it is not already present:

```bash
npm install
```

2. Authenticate the CLI:

```bash
npx supabase login
```

If you already have a token, you can also export it first:

```bash
export SUPABASE_ACCESS_TOKEN=your_token_here
```

3. Link this workspace to the remote project:

```bash
npx supabase link --project-ref renjsmdsrzjnppqpaoaa
```

4. Apply all pending migrations:

```bash
npm run db:push
```

## Regenerating Database Types

After the project is linked and the migrations are applied:

```bash
npm run db:typegen
```

That command writes the latest Supabase TypeScript database snapshot to:

- `src/types/supabase.generated.ts`

Right now that file is a repo-side schema snapshot. The command above is the step that upgrades it to official live-generated output.

## Verifying Seeded Reference Data

After migrations are applied, run:

```bash
npm run db:verify:seed
```

That script checks:

- `products`
- `gallery_categories`
- `site_settings`
- `faq_items`

using the configured `SUPABASE_SERVICE_ROLE_KEY`.

## Policies In Place

The baseline policy migration adds:

- helper functions: `current_admin_role()`, `is_admin()`, `is_owner()`
- RLS enabled on all Phase 2 tables
- owner-only role management on `user_roles`
- self-or-admin profile access on `profiles`
- admin full CRUD policies on internal operational tables
- public read policies on safe reference/content tables:
  - `products`
  - `product_prices`
  - `gallery_categories`
  - `site_settings` where `is_public = true`
  - `faq_items` where `is_published = true`
  - `testimonials` where `is_published = true`
  - `content_blocks` where `is_active = true`
  - `media_assets` where `public_url is not null`
  - `media_assignments` where `page_key is not null`

## Intentionally Deferred

These are not implemented yet in Phase 2.5:

- public anonymous inquiry insert policies
- fine-grained page-by-page or content-type-specific role restrictions
- staff invitation/provisioning workflow
- storage bucket policies
- production-grade audit logging or policy tests
- full hardening of auth/session flows in the admin UI
