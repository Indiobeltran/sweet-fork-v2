# The Sweet Fork v2

Production-readiness workspace for a Next.js + Supabase rebuild of The Sweet Fork public site, inquiry flow, and private admin workspace.

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
    inquiry/            Public start-order inquiry wizard
    site/               Public-site presentation components
    ui/                 Reusable UI primitives
  lib/
    content/            Public fallback content and launch copy
    inquiries/          Catalog, pricing, feature flags, and inquiry submission helpers
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
- `src/app/admin` contains the private inquiry, order, customer, pricing, media, content, calendar, notification, and settings workspace.
- `src/app/api/inquiries/route.ts` handles public inquiry submissions with server-side validation and spam checks.

## Environment Variables

Required for Supabase-backed features:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

Legacy key names are still supported during migration:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

General app configuration:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `INQUIRY_UPLOAD_ENABLED`
- `INQUIRY_LINK_FALLBACK_ENABLED`
- `SUPABASE_STORAGE_BUCKET`

See `.env.example`.

## Current Phase Status

- Public marketing routes are implemented with route-level metadata, sitemap, robots, OG image generation, gallery lightbox behavior, and inquiry CTAs.
- `/start-order` uses a multi-step inquiry wizard with client-side guidance, server-side validation, upload checks, honeypot/timing checks, duplicate detection, and a fallback email path when submissions are unavailable.
- Supabase-backed public reads degrade to curated fallback content when the backend is unavailable.
- Admin routes are implemented behind Supabase auth and role checks.

## Commands

- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
