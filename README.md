# The Sweet Fork v2

Phase 1 and Phase 2 workspace for a Next.js + Supabase rebuild of The Sweet Fork.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase for auth, database, and storage helpers
- Vercel-ready deployment target

## Folder Structure

```text
src/
  app/
    (site)/             Public-facing route group
    layout.tsx          Root layout
    globals.css         Global styles and design tokens
  components/
    site/               Public-site presentation components already created
    ui/                 Reusable UI primitives
  lib/
    content/            Hardcoded starter content
    supabase/           Browser/server/admin/middleware helper clients
    validations/        Shared validation schemas
    auth.ts             Admin lookup helper
    env.ts              Environment access helpers
    pricing.ts          Starter pricing utility
    seo.ts              Metadata helper
    utils.ts            Shared utility helpers
  types/
    domain.ts           Shared domain types

supabase/
  migrations/           SQL migrations for schema and starter reference data

docs/
  phase-2-schema.md    Plain-English schema notes and phase boundaries
```

## Route Groups

- `src/app/(site)` contains the current public-site routes.
- `src/app/admin` is reserved for internal admin routes but is not implemented yet.
- API route folders exist as placeholders only and are not implemented yet.

## Environment Variables

Required for Supabase-backed features:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

General app configuration:

- `NEXT_PUBLIC_SITE_URL`
- `INQUIRY_UPLOAD_ENABLED`
- `INQUIRY_LINK_FALLBACK_ENABLED`
- `SUPABASE_STORAGE_BUCKET`

See [`.env.example`](/Users/indiobeltran/Library/Mobile Documents/com~apple~CloudDocs/The Sweet Fork Business/Website Info'/Sweet Fork v2 Codex/.env.example).

## Current Phase Status

- Phase 1 stabilized foundation:
  - repo config
  - TypeScript aliasing
  - Tailwind/PostCSS setup
  - dependency manifest and lockfile
  - verification commands
- Phase 2 implemented:
  - Supabase/Postgres schema migrations
  - normalized inquiry, order, pricing, media, content, calendar, and notification tables
  - starter reference seed data for products, pricing, gallery categories, site settings, and FAQ records
- Phase 3 files exist in the repo but are intentionally not being expanded during this pass:
  - public-site routes
  - hardcoded content layer
  - starter pricing and inquiry validation utilities
  - admin/auth helpers not yet wired into full CRUD flows

## Commands

- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
