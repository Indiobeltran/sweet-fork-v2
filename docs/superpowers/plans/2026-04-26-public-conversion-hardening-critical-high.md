# Public Conversion Hardening Critical/High Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the public inquiry path, fix the broken gallery lightbox, and implement the high-impact conversion polish identified in the audit without weakening the premium Sweet Fork aesthetic.

**Architecture:** Keep the existing App Router structure and component system. Public reads should degrade to curated static content when Supabase admin access is unavailable; writes still require a valid backend Supabase key or an explicit email fallback. Visual improvements reuse the existing gallery placeholder/public media pipeline and `next/image`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Supabase JS, Zod, `next/image`, `next/og`, `agent-browser`.

---

## Current Root Cause And Key Workaround

`npm run db:verify:seed` currently fails with:

```text
Verification failed for products: Legacy API keys are disabled
```

That matches the live `/start-order` failure. The code currently treats `SUPABASE_SERVICE_ROLE_KEY` as the only backend admin key. If the legacy service role key was revoked/disabled, public product lookup fails, `getStartOrderPageData()` returns an empty catalog, and `/start-order` renders “Online inquiries are temporarily unavailable.”

Supabase now recommends the newer API key formats:

- `sb_publishable_...` for public/browser-safe access.
- `sb_secret_...` for backend access that replaces the old JWT-based `service_role` key.

Code should support both names during migration:

- Prefer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; fall back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Prefer `SUPABASE_SECRET_KEY`; fall back to `SUPABASE_SERVICE_ROLE_KEY`.

Deployment workaround:

1. Create a new Supabase secret key in Project Settings -> API Keys.
2. Add it to Vercel as `SUPABASE_SECRET_KEY`.
3. Create/copy the publishable key and add it to Vercel as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Keep old env names supported locally, but do not put the revoked service role key back.
5. Redeploy and run `npm run db:verify:seed`.

References:

- Supabase API keys: https://supabase.com/docs/guides/api/api-keys
- Supabase key rotation: https://supabase.com/docs/guides/troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd

---

## File Map

- Modify: `src/lib/env.ts`
  - Add new key-name support and redacted key diagnostics helpers.
- Modify: `src/lib/supabase/admin.ts`
  - Continue creating the server-only admin client, now using the preferred backend key.
- Modify: `src/lib/supabase/browser.ts`
  - Prefer the publishable key for browser clients.
- Modify: `src/lib/supabase/server.ts`
  - Prefer the publishable key for server auth clients.
- Modify: `scripts/verify-reference-data.mjs`
  - Verify with `SUPABASE_SECRET_KEY || SUPABASE_SERVICE_ROLE_KEY`.
- Modify: `.env.example`
  - Document new and legacy env names without secret values.
- Modify: `src/lib/inquiries/types.ts`
  - Add catalog source/submission availability metadata.
- Modify: `src/lib/inquiries/catalog.ts`
  - Return static fallback catalog when Supabase reads fail or active products are empty.
- Modify: `src/app/(site)/start-order/page.tsx`
  - Render the wizard whenever fallback catalog exists.
- Modify: `src/components/inquiry/start-order-wizard.tsx`
  - Add graceful offline/email fallback mode when backend submissions are unavailable.
- Modify: `src/components/site/gallery-grid.tsx`
  - Fix modal image quality.
- Modify: `src/app/(site)/page.tsx`
  - Add above-the-fold dessert imagery and trust signals.
- Modify: `src/types/domain.ts`
  - Add optional hero image metadata for product pages.
- Modify: `src/lib/content/site-content.ts`
  - Add product hero images using existing approved placeholder assets.
- Modify: `src/components/site/product-page-template.tsx`
  - Render product-specific hero imagery.
- Modify: `src/components/site/sticky-product-cta.tsx`
  - Reduce mobile CTA obstruction.
- Modify: `src/app/(site)/faq/page.tsx`
  - Convert FAQ list to native accessible disclosure cards.
- Modify: `src/app/og/route.tsx`
  - Add route-specific dessert imagery to OG images.

---

### Task 1: Supabase Key Migration Compatibility

**Files:**
- Modify: `src/lib/env.ts`
- Modify: `src/lib/supabase/admin.ts`
- Modify: `src/lib/supabase/browser.ts`
- Modify: `src/lib/supabase/server.ts`
- Modify: `scripts/verify-reference-data.mjs`
- Modify: `.env.example`

- [ ] **Step 1: Reproduce the current key failure**

Run:

```bash
npm run db:verify:seed
```

Expected before the fix, with the revoked legacy key still configured:

```text
Verification failed for products: Legacy API keys are disabled
```

- [ ] **Step 2: Update `.env.example` with new key names**

Replace the Supabase env block with:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=

# Preferred hosted Supabase API key names.
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Legacy compatibility. Leave empty if legacy API keys are disabled.
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_SITE_URL=
INQUIRY_UPLOAD_ENABLED=true
INQUIRY_LINK_FALLBACK_ENABLED=true
SUPABASE_STORAGE_BUCKET=inspiration
```

- [ ] **Step 3: Replace `src/lib/env.ts` with key fallback helpers**

Use this implementation shape:

```ts
type SupabaseEnv = {
  url: string;
  publicKey: string;
  adminKey: string;
};

type PublicSupabaseEnv = {
  url: string;
  publicKey: string;
};

type KeySource = "publishable" | "anon" | "secret" | "service_role" | "missing";

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value));
}

function getPublicSupabaseKey() {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return {
    key: firstNonEmpty(publishableKey, anonKey),
    source: publishableKey ? "publishable" : anonKey ? "anon" : "missing",
  } satisfies { key?: string; source: KeySource };
}

function getAdminSupabaseKey() {
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return {
    key: firstNonEmpty(secretKey, serviceRoleKey),
    source: secretKey ? "secret" : serviceRoleKey ? "service_role" : "missing",
  } satisfies { key?: string; source: KeySource };
}

export function getSupabaseKeyStatus() {
  const publicKey = getPublicSupabaseKey();
  const adminKey = getAdminSupabaseKey();

  return {
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    publicKeySource: publicKey.source,
    adminKeySource: adminKey.source,
  };
}
```

Then update the existing exported functions:

```ts
export function isSupabaseConfigured() {
  const publicKey = getPublicSupabaseKey();
  const adminKey = getAdminSupabaseKey();

  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      publicKey.key &&
      adminKey.key,
  );
}

export function isSupabaseBrowserConfigured() {
  const publicKey = getPublicSupabaseKey();

  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && publicKey.key);
}

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publicKey = getPublicSupabaseKey();
  const adminKey = getAdminSupabaseKey();

  if (!url || !publicKey.key || !adminKey.key) {
    throw new Error("Missing Supabase environment variables.");
  }

  return {
    url,
    publicKey: publicKey.key,
    adminKey: adminKey.key,
  };
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publicKey = getPublicSupabaseKey();

  if (!url || !publicKey.key) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return {
    url,
    publicKey: publicKey.key,
  };
}
```

Keep the existing `getPublicEnv()`, `resolveSiteUrl()`, and inquiry flag helpers intact.

- [ ] **Step 4: Update Supabase clients**

In `src/lib/supabase/admin.ts`, use:

```ts
export function createAdminClient() {
  const env = getSupabaseEnv();

  return createClient<Database>(env.url, env.adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

In `src/lib/supabase/browser.ts`, use:

```ts
const env = getPublicSupabaseEnv();

return createBrowserClient<Database>(env.url, env.publicKey);
```

In `src/lib/supabase/server.ts`, use:

```ts
const env = getSupabaseEnv();

return createServerClient<Database>(env.url, env.publicKey, {
  cookies: {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      } catch {
        // Server Components can read cookies but cannot write them.
        // Middleware refreshes the Supabase session and persists updates.
      }
    },
  },
});
```

- [ ] **Step 5: Update `scripts/verify-reference-data.mjs`**

Use the new key names without logging values:

```js
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const adminKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminKeySource = process.env.SUPABASE_SECRET_KEY
  ? "SUPABASE_SECRET_KEY"
  : process.env.SUPABASE_SERVICE_ROLE_KEY
    ? "SUPABASE_SERVICE_ROLE_KEY"
    : "missing";

if (!url || !adminKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and backend Supabase admin key.");
  process.exit(1);
}

console.log(`Using ${adminKeySource} for server-side verification.`);

const supabase = createClient(url, adminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

Leave the existing table checks unchanged.

- [ ] **Step 6: Verify key migration locally**

Run:

```bash
npm run db:verify:seed
```

Expected after setting `SUPABASE_SECRET_KEY=sb_secret_...`:

```text
Using SUPABASE_SECRET_KEY for server-side verification.
products: count=...
gallery_categories: count=...
site_settings: count=...
faq_items: count=...
```

If this still fails, stop and inspect the exact Supabase error before continuing. Do not continue with UI patches until the admin key path is understood.

---

### Task 2: Make `/start-order` Resilient When Supabase Admin Reads Fail

**Files:**
- Modify: `src/lib/inquiries/types.ts`
- Modify: `src/lib/inquiries/catalog.ts`
- Modify: `src/app/(site)/start-order/page.tsx`
- Modify: `src/components/inquiry/start-order-wizard.tsx`

- [ ] **Step 1: Add page data status fields**

In `src/lib/inquiries/types.ts`, update `StartOrderPageData`:

```ts
export type StartOrderCatalogSource = "live" | "fallback";

export type StartOrderPageData = {
  catalog: InquiryCatalogItem[];
  catalogSource: StartOrderCatalogSource;
  submissionAvailable: boolean;
  submissionUnavailableMessage?: string;
  featureFlags: InquiryFeatureFlags;
  pricingBaseline: InquiryPricingBaseline;
  deliveryRange: [number, number];
};
```

- [ ] **Step 2: Return fallback catalog instead of empty catalog**

In `src/lib/inquiries/catalog.ts`, update all `StartOrderPageData` returns:

```ts
if (!isSupabaseConfigured()) {
  return {
    catalog: buildFallbackCatalog(defaultPricingBaseline),
    catalogSource: "fallback",
    submissionAvailable: false,
    submissionUnavailableMessage:
      "Online submission is temporarily unavailable, but you can still prepare your inquiry details and send them by email.",
    featureFlags: mergeFeatureFlags(),
    pricingBaseline: defaultPricingBaseline,
    deliveryRange: [15, 50],
  };
}
```

After loading `activeProducts`, handle empty active products without disabling the wizard:

```ts
const catalog =
  activeProducts.length > 0
    ? buildCatalog(activeProducts, pricingBaseline)
    : buildFallbackCatalog(pricingBaseline);

return {
  catalog,
  catalogSource: activeProducts.length > 0 ? "live" : "fallback",
  submissionAvailable: true,
  featureFlags: parseFeatureFlags(inquiryFlags?.value_json ?? null),
  pricingBaseline,
  deliveryRange,
};
```

In the catch block, do not return an empty catalog:

```ts
console.error("Unable to load live start-order data.", {
  message: error instanceof Error ? error.message : "Unknown Supabase catalog error",
});

return {
  catalog: buildFallbackCatalog(defaultPricingBaseline),
  catalogSource: "fallback",
  submissionAvailable: false,
  submissionUnavailableMessage:
    "Online submission is temporarily unavailable, but you can still prepare your inquiry details and send them by email.",
  featureFlags: mergeFeatureFlags(),
  pricingBaseline: defaultPricingBaseline,
  deliveryRange: [15, 50],
};
```

- [ ] **Step 3: Always render the wizard when a fallback catalog exists**

In `src/app/(site)/start-order/page.tsx`, replace the `hasCatalog ? ... : ...` fallback branch with:

```tsx
return (
  <div className="pb-6 pt-8 sm:pt-10">
    <h1 className="sr-only">Start your inquiry</h1>
    <StartOrderWizard {...pageData} />
  </div>
);
```

If `catalog.length === 0` after Task 2, that is a programming error; do not preserve the current customer-facing dead end.

- [ ] **Step 4: Extend `StartOrderWizardProps`**

In `src/components/inquiry/start-order-wizard.tsx`, change props to:

```ts
type StartOrderWizardProps = {
  catalog: InquiryCatalogItem[];
  catalogSource: "live" | "fallback";
  featureFlags: InquiryFeatureFlags;
  submissionAvailable: boolean;
  submissionUnavailableMessage?: string;
};
```

Then update the component signature:

```ts
export function StartOrderWizard({
  catalog,
  catalogSource,
  featureFlags,
  submissionAvailable,
  submissionUnavailableMessage,
}: StartOrderWizardProps) {
```

- [ ] **Step 5: Add a calm offline/submission-unavailable banner**

Near the top of the wizard header, after the first `Badge` row, add:

```tsx
{!submissionAvailable ? (
  <div className="rounded-[1.4rem] border border-gold/28 bg-gold/10 px-4 py-3 text-sm leading-6 text-charcoal/72">
    <p className="font-medium text-charcoal">Online submission is paused.</p>
    <p className="mt-1">
      {submissionUnavailableMessage ??
        "You can still prepare your inquiry details here, then email Sweet Fork directly from the review step."}
    </p>
  </div>
) : catalogSource === "fallback" ? (
  <div className="rounded-[1.4rem] border border-charcoal/10 bg-cream/70 px-4 py-3 text-sm leading-6 text-charcoal/68">
    Product options are using the standard Sweet Fork menu while live catalog details refresh.
  </div>
) : null}
```

- [ ] **Step 6: Add an email fallback builder**

Inside `StartOrderWizard`, before `submitInquiryForm`, add:

```ts
const buildEmailFallbackHref = () => {
  const preparedValues = normalizeInquiryFormValues(values);
  const subject = encodeURIComponent(
    `Sweet Fork inquiry for ${preparedValues.eventType || "my celebration"}`,
  );
  const selectedSummary =
    preparedValues.orderItems.length > 0
      ? preparedValues.orderItems
          .map((item) => `${getProductDisplayLabel(item.productType)}: ${formatSelectedItemSummary(item)}`)
          .join("\n")
      : "No dessert selections yet";

  const body = encodeURIComponent(
    [
      "Hi Sweet Fork,",
      "",
      "I started an inquiry on the website and would like to send the details by email.",
      "",
      `Event type: ${preparedValues.eventType || "Not set"}`,
      `Event date: ${preparedValues.eventDate || "Not set"}`,
      `Guest count: ${preparedValues.guestCount ?? "Not set"}`,
      `Fulfillment: ${preparedValues.fulfillmentMethod}`,
      `Delivery ZIP: ${preparedValues.deliveryZip ?? "Not needed / not set"}`,
      `Budget range: ${getBudgetRangeLabel(preparedValues.budgetRange)}`,
      `Budget flexibility: ${getBudgetFlexibilityLabel(preparedValues.budgetFlexibility)}`,
      "",
      "Desserts:",
      selectedSummary,
      "",
      `Color palette: ${preparedValues.colorPalette ?? "Not set"}`,
      `Inspiration notes: ${preparedValues.inspirationText ?? "Not set"}`,
      `Inspiration links: ${preparedValues.inspirationLinks.join(", ") || "None"}`,
      "",
      `Name: ${preparedValues.customerName || "Not set"}`,
      `Email: ${preparedValues.customerEmail || "Not set"}`,
      `Phone: ${preparedValues.customerPhone || "Not set"}`,
      `Preferred contact: ${preparedValues.preferredContact}`,
      `Instagram: ${preparedValues.instagramHandle ?? "Not set"}`,
      `How I heard about you: ${preparedValues.howDidYouHear ?? "Not set"}`,
      "",
      `Additional notes: ${preparedValues.additionalNotes ?? "None"}`,
    ].join("\n"),
  );

  return `mailto:thesweetfork@yahoo.com?subject=${subject}&body=${body}`;
};
```

- [ ] **Step 7: Prevent dead-end submit attempts when backend is unavailable**

At the start of `submitInquiryForm`, after all validation succeeds and before `setIsSubmitting(true)`, add:

```ts
if (!submissionAvailable) {
  setSubmitError(
    "Online submission is paused. Use the email button below to send these details directly.",
  );
  return;
}
```

In the review-step action area, replace the final submit button label area with conditional actions:

```tsx
{!submissionAvailable ? (
  <a
    href={buildEmailFallbackHref()}
    className="inline-flex min-h-12 items-center justify-center rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-ivory shadow-soft transition hover:bg-charcoal/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50"
  >
    Email inquiry details
  </a>
) : (
  <Button type="button" onClick={submitInquiryForm} disabled={isSubmitting}>
    {isSubmitting ? (
      <>
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Submitting inquiry...
      </>
    ) : (
      "Submit inquiry"
    )}
  </Button>
)}
```

Keep existing previous/next buttons unchanged.

- [ ] **Step 8: Verify `/start-order` no longer dead-ends**

Run:

```bash
npm run build
npm run start
```

In another terminal:

```bash
agent-browser --session sf-start-order-check set viewport 390 844
agent-browser --session sf-start-order-check open http://127.0.0.1:3000/start-order
agent-browser --session sf-start-order-check wait --load networkidle
agent-browser --session sf-start-order-check snapshot -i
agent-browser --session sf-start-order-check screenshot /tmp/sf-start-order-fallback.png
```

Expected:

- The page shows the inquiry wizard, not “Online inquiries are temporarily unavailable.”
- If admin key is unavailable, a calm “Online submission is paused” banner appears.
- The review step offers “Email inquiry details” instead of a broken submit.

---

### Task 3: Fix Gallery Lightbox Images

**Files:**
- Modify: `src/components/site/gallery-grid.tsx`

- [ ] **Step 1: Reproduce current broken modal**

Run against live or local:

```bash
agent-browser --session sf-gallery-check set viewport 1440 1000
agent-browser --session sf-gallery-check open https://sweet-fork-v2.vercel.app/gallery
agent-browser --session sf-gallery-check wait --load networkidle
agent-browser --session sf-gallery-check scroll down 700
agent-browser --session sf-gallery-check snapshot -i
```

Click the first gallery image and inspect image requests:

```bash
agent-browser --session sf-gallery-check find role button click --name "Open larger gallery image: Tiered wedding cake"
agent-browser --session sf-gallery-check wait 300
agent-browser --session sf-gallery-check network requests --filter "_next/image"
```

Expected before fix: modal request with `q=86` returns `400`.

- [ ] **Step 2: Change modal image quality to an allowed value**

In `src/components/site/gallery-grid.tsx`, replace:

```tsx
quality={86}
```

with:

```tsx
quality={82}
```

Do not change the card quality; it already uses `82`.

- [ ] **Step 3: Verify modal image loads**

Run:

```bash
npm run build
npm run start
agent-browser --session sf-gallery-local set viewport 1440 1000
agent-browser --session sf-gallery-local open http://127.0.0.1:3000/gallery
agent-browser --session sf-gallery-local wait --load networkidle
agent-browser --session sf-gallery-local scroll down 700
agent-browser --session sf-gallery-local snapshot -i
agent-browser --session sf-gallery-local find role button click --name "Open larger gallery image: Tiered wedding cake"
agent-browser --session sf-gallery-local wait --load networkidle
agent-browser --session sf-gallery-local screenshot /tmp/sf-gallery-modal-fixed.png
agent-browser --session sf-gallery-local eval "JSON.stringify(Array.from(document.querySelectorAll('[role=dialog] img')).map(img => ({naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, src: img.currentSrc})))"
```

Expected:

```json
[{"naturalWidth":496,"naturalHeight":496, "...":"...q=82"}]
```

Any positive natural width/height is acceptable.

---

### Task 4: Add Product Desire And Trust Above The Homepage Fold

**Files:**
- Modify: `src/app/(site)/page.tsx`

- [ ] **Step 1: Import `Image`**

At the top of `src/app/(site)/page.tsx`, add:

```ts
import Image from "next/image";
```

- [ ] **Step 2: Create a hero image variable**

Inside `HomePage()`, after `const { siteUrl } = getPublicEnv();`, add:

```ts
const heroGalleryItem = data.galleryItems.find((item) => item.imageUrl) ?? null;
const featuredTestimonial = data.testimonials[0] ?? null;
```

- [ ] **Step 3: Replace the right-side copy-only hero panel**

Replace the `<div className="grid gap-4 section-reveal">` hero sidebar with:

```tsx
<div className="grid gap-4 section-reveal">
  <div className="relative overflow-hidden rounded-[2.4rem] border border-charcoal/12 bg-charcoal text-ivory shadow-[0_18px_48px_rgba(53,37,29,0.18),0_2px_10px_rgba(53,37,29,0.08)]">
    <div className="relative min-h-[24rem] sm:min-h-[30rem] lg:min-h-[34rem]">
      {heroGalleryItem?.imageUrl ? (
        <Image
          src={heroGalleryItem.imageUrl}
          alt={heroGalleryItem.alt}
          fill
          priority
          quality={82}
          sizes="(max-width: 1024px) calc(100vw - 2.5rem), 44vw"
          className="object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(48,39,33,0.04),rgba(48,39,33,0.32)_48%,rgba(48,39,33,0.82))]" />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-gold/82">The Sweet Fork</p>
        <p className="mt-4 max-w-[25rem] font-serif text-4xl leading-[0.92] tracking-[-0.05em] sm:text-5xl">
          Handcrafted desserts with a quiet luxury finish.
        </p>
        <div className="mt-6 space-y-3 border-t border-white/16 pt-5 text-sm leading-7 text-ivory/84">
          <p>Custom cakes, wedding work, cupcakes, macarons, decorated cookies, and DIY kits.</p>
          <p>Pickup in Centerville. Local delivery available across nearby Northern Utah communities.</p>
        </div>
      </div>
    </div>
  </div>

  <div className="grid gap-4 sm:grid-cols-3">
    {data.hero.items.map((item) => (
      <div key={item.title} className="luxury-panel rounded-[1.6rem] px-5 py-5">
        <p className="text-sm font-medium text-charcoal">{item.title}</p>
        <p className="mt-3 text-sm leading-7 text-charcoal/64">{item.description}</p>
      </div>
    ))}
  </div>

  {featuredTestimonial ? (
    <blockquote className="rounded-[1.6rem] border border-charcoal/8 bg-white/72 px-5 py-5 shadow-soft">
      <p className="text-sm leading-7 text-charcoal/72">“{featuredTestimonial.quote}”</p>
      <footer className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/48">
        {featuredTestimonial.name}
      </footer>
    </blockquote>
  ) : null}
</div>
```

- [ ] **Step 4: Verify mobile and desktop first impression**

Run:

```bash
npm run build
npm run start
agent-browser --session sf-home-hero set viewport 390 844
agent-browser --session sf-home-hero open http://127.0.0.1:3000/
agent-browser --session sf-home-hero wait --load networkidle
agent-browser --session sf-home-hero screenshot /tmp/sf-home-mobile-hero.png
agent-browser --session sf-home-hero set viewport 1440 1000
agent-browser --session sf-home-hero reload
agent-browser --session sf-home-hero wait --load networkidle
agent-browser --session sf-home-hero screenshot /tmp/sf-home-desktop-hero.png
```

Expected:

- A real dessert image is visible in the first viewport.
- CTA remains visible and uncluttered.
- No text/image overlap.

---

### Task 5: Add Product-Specific Hero Imagery And Reduce Sticky CTA Obstruction

**Files:**
- Modify: `src/types/domain.ts`
- Modify: `src/lib/content/site-content.ts`
- Modify: `src/components/site/product-page-template.tsx`
- Modify: `src/components/site/sticky-product-cta.tsx`

- [ ] **Step 1: Extend product content type**

In `src/types/domain.ts`, add:

```ts
heroImage: {
  alt: string;
  src: string;
};
```

to `ProductPageContent`.

- [ ] **Step 2: Add hero images to every product content entry**

In `src/lib/content/site-content.ts`, add these fields:

```ts
heroImage: {
  src: "/placeholders/marketing/garden-cake.jpg",
  alt: "Floral buttercream celebration cake with soft garden tones and an ivory finish",
},
```

Use this mapping:

- `custom-cakes` -> `/placeholders/marketing/garden-cake.jpg`
- `wedding-cakes` -> `/placeholders/marketing/wedding-tier.jpg`
- `cupcakes` -> `/placeholders/marketing/cupcake-set.jpg`
- `sugar-cookies` -> `/placeholders/marketing/cookie-favors.jpg`
- `macarons` -> `/placeholders/marketing/macaron-tower.jpg`
- `diy-kits` -> `/placeholders/marketing/diy-kit.jpg`

- [ ] **Step 3: Render product image in the product hero**

In `src/components/site/product-page-template.tsx`, import:

```ts
import Image from "next/image";
```

Replace the current right-side `luxury-panel` in the hero with:

```tsx
<div className="grid gap-4 section-reveal">
  <div className="relative overflow-hidden rounded-[2.4rem] border border-charcoal/12 bg-charcoal shadow-soft">
    <div className="relative min-h-[22rem] sm:min-h-[28rem] lg:min-h-[31rem]">
      <Image
        src={content.heroImage.src}
        alt={content.heroImage.alt}
        fill
        priority
        quality={82}
        sizes="(max-width: 1024px) calc(100vw - 2.5rem), 42vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(48,39,33,0.02),rgba(48,39,33,0.24)_50%,rgba(48,39,33,0.72))]" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-ivory sm:p-8">
        <p className="eyebrow-label text-gold/80">What makes it premium</p>
        <p className="mt-4 max-w-[28rem] font-serif text-3xl leading-tight tracking-[-0.04em] sm:text-[2.35rem]">
          {content.heroStatement}
        </p>
      </div>
    </div>
  </div>
  <div className="luxury-panel p-6 sm:p-7">
    <p className="text-sm leading-7 text-charcoal/70">{content.availabilityNote}</p>
  </div>
</div>
```

- [ ] **Step 4: Make sticky mobile CTA less obstructive**

In `src/components/site/sticky-product-cta.tsx`, replace the wrapper card with a shorter single-pill treatment:

```tsx
<div
  className={cn(
    "pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] pt-3 transition duration-200 md:hidden",
    shouldShow ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
  )}
>
  <div className="pointer-events-auto mx-auto max-w-md rounded-full border border-charcoal/10 bg-ivory/94 p-1.5 shadow-[0_18px_48px_rgba(40,31,24,0.18)] backdrop-blur-xl">
    <Link
      href={href}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-charcoal px-5 py-3 text-center text-sm font-semibold tracking-[0.02em] text-ivory shadow-soft transition duration-200 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50"
    >
      {label}
    </Link>
    <p className="sr-only">{subtext}</p>
  </div>
</div>
```

In `ProductPageTemplate`, change top-level padding:

```tsx
<div className="pb-24 md:pb-0">
```

- [ ] **Step 5: Verify product pages**

Run:

```bash
npm run build
npm run start
agent-browser --session sf-products set viewport 390 844
agent-browser --session sf-products open http://127.0.0.1:3000/custom-cakes
agent-browser --session sf-products wait --load networkidle
agent-browser --session sf-products screenshot /tmp/sf-custom-cakes-mobile.png
agent-browser --session sf-products scroll down 850
agent-browser --session sf-products screenshot /tmp/sf-custom-cakes-mobile-sticky.png
agent-browser --session sf-products set viewport 1440 1000
agent-browser --session sf-products reload
agent-browser --session sf-products wait --load networkidle
agent-browser --session sf-products screenshot /tmp/sf-custom-cakes-desktop.png
```

Expected:

- Product image is visible above the fold.
- Sticky CTA does not cover multiple lines of content.
- Product page still feels editorial, not e-commerce.

---

### Task 6: Convert FAQ Cards To Accessible Disclosures

**Files:**
- Modify: `src/app/(site)/faq/page.tsx`

- [ ] **Step 1: Replace static FAQ cards with native disclosures**

Replace the FAQ section map with:

```tsx
<section className="section-shell space-y-4 py-16 md:py-20">
  {faqItems.map((item, index) => (
    <details
      key={item.question}
      className="group luxury-panel rounded-[1.8rem] p-0"
      open={index < 3}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-6 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50">
        <h2 className="text-lg font-medium text-charcoal">{item.question}</h2>
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-charcoal/10 text-xl leading-none text-charcoal/58 transition group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="px-6 pb-6 pt-0">
        <p className="max-w-3xl text-sm leading-7 text-charcoal/68">{item.answer}</p>
      </div>
    </details>
  ))}
</section>
```

- [ ] **Step 2: Verify keyboard behavior**

Run:

```bash
npm run build
npm run start
agent-browser --session sf-faq set viewport 390 844
agent-browser --session sf-faq open http://127.0.0.1:3000/faq
agent-browser --session sf-faq wait --load networkidle
agent-browser --session sf-faq scroll down 850
agent-browser --session sf-faq screenshot /tmp/sf-faq-mobile-disclosures.png
agent-browser --session sf-faq press Tab
agent-browser --session sf-faq press Enter
agent-browser --session sf-faq screenshot /tmp/sf-faq-mobile-keyboard.png
```

Expected:

- First three FAQs are open by default.
- Focus is visible on summary rows.
- Enter toggles the focused FAQ.

---

### Task 7: Add Dessert Imagery To OG Previews

**Files:**
- Modify: `src/app/og/route.tsx`

- [ ] **Step 1: Add route image mapping**

Near `pageLabels`, add:

```ts
const pageImages: Record<string, string> = {
  "/": "/brand/logo-social.jpg",
  "/custom-cakes": "/placeholders/marketing/garden-cake.jpg",
  "/cupcakes": "/placeholders/marketing/cupcake-set.jpg",
  "/diy-kits": "/placeholders/marketing/diy-kit.jpg",
  "/gallery": "/placeholders/marketing/wedding-tier.jpg",
  "/macarons": "/placeholders/marketing/macaron-tower.jpg",
  "/pricing": "/placeholders/marketing/garden-cake.jpg",
  "/sugar-cookies": "/placeholders/marketing/cookie-favors.jpg",
  "/wedding-cakes": "/placeholders/marketing/wedding-tier.jpg",
};

function getImagePath(path: string) {
  return pageImages[path] ?? "/brand/logo-social.jpg";
}
```

- [ ] **Step 2: Build an absolute image URL**

Inside `GET`, after `const label = getLabel(path);`, add:

```ts
const imageUrl = new URL(getImagePath(path), request.url).toString();
```

- [ ] **Step 3: Add a right-side image panel to the `ImageResponse`**

Change the main card content from a single text column to a two-column interior. Keep the existing brand/title copy, but wrap the title block and image like this:

```tsx
<div
  style={{
    alignItems: "stretch",
    display: "flex",
    gap: "34px",
  }}
>
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      maxWidth: "670px",
    }}
  >
    <div
      style={{
        display: "flex",
        fontFamily: "Georgia, serif",
        fontSize: 68,
        letterSpacing: "-0.05em",
        lineHeight: 0.98,
      }}
    >
      {title}
    </div>
    <div
      style={{
        color: "rgba(55, 43, 36, 0.76)",
        display: "flex",
        fontSize: 26,
        lineHeight: 1.35,
        maxWidth: "650px",
      }}
    >
      Inquiry-first ordering for custom cakes, wedding work, cupcakes, macarons, cookies,
      and elevated dessert details.
    </div>
  </div>

  <img
    src={imageUrl}
    alt=""
    style={{
      borderRadius: "30px",
      height: "270px",
      objectFit: "cover",
      width: "300px",
    }}
  />
</div>
```

Adjust surrounding `justifyContent` spacing only enough to keep footer visible.

- [ ] **Step 4: Verify OG image visually**

Run:

```bash
npm run build
npm run start
agent-browser --session sf-og set viewport 1200 630
agent-browser --session sf-og open "http://127.0.0.1:3000/og?path=%2Fgallery&title=Cake+%26+Dessert+Gallery"
agent-browser --session sf-og wait --load networkidle
agent-browser --session sf-og screenshot /tmp/sf-og-gallery-image.png
```

Expected:

- OG preview contains a real dessert image.
- Text is not cropped.
- Visual remains premium and legible at 1200x630.

---

### Task 8: Final Verification

**Files:**
- No additional files.

- [ ] **Step 1: Run static checks**

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Expected: all pass.

- [ ] **Step 2: Verify Supabase key health**

With `SUPABASE_SECRET_KEY` set locally:

```bash
npm run db:verify:seed
```

Expected: table counts print without `Legacy API keys are disabled`.

- [ ] **Step 3: Browser QA desktop**

Run:

```bash
npm run start
agent-browser --session sf-final-desktop set viewport 1440 1000
agent-browser --session sf-final-desktop open http://127.0.0.1:3000/
agent-browser --session sf-final-desktop wait --load networkidle
agent-browser --session sf-final-desktop screenshot /tmp/sf-final-home-desktop.png
agent-browser --session sf-final-desktop open http://127.0.0.1:3000/gallery
agent-browser --session sf-final-desktop wait --load networkidle
agent-browser --session sf-final-desktop scroll down 700
agent-browser --session sf-final-desktop snapshot -i
agent-browser --session sf-final-desktop find role button click --name "Open larger gallery image: Tiered wedding cake"
agent-browser --session sf-final-desktop wait --load networkidle
agent-browser --session sf-final-desktop screenshot /tmp/sf-final-gallery-modal-desktop.png
agent-browser --session sf-final-desktop open http://127.0.0.1:3000/start-order
agent-browser --session sf-final-desktop wait --load networkidle
agent-browser --session sf-final-desktop screenshot /tmp/sf-final-start-order-desktop.png
```

Expected:

- Homepage has dessert imagery above fold.
- Gallery modal image renders.
- `/start-order` shows wizard, not unavailable fallback.

- [ ] **Step 4: Browser QA mobile**

Run:

```bash
agent-browser --session sf-final-mobile set viewport 390 844
agent-browser --session sf-final-mobile open http://127.0.0.1:3000/
agent-browser --session sf-final-mobile wait --load networkidle
agent-browser --session sf-final-mobile screenshot /tmp/sf-final-home-mobile.png
agent-browser --session sf-final-mobile open http://127.0.0.1:3000/custom-cakes
agent-browser --session sf-final-mobile wait --load networkidle
agent-browser --session sf-final-mobile scroll down 850
agent-browser --session sf-final-mobile screenshot /tmp/sf-final-product-sticky-mobile.png
agent-browser --session sf-final-mobile open http://127.0.0.1:3000/faq
agent-browser --session sf-final-mobile wait --load networkidle
agent-browser --session sf-final-mobile scroll down 850
agent-browser --session sf-final-mobile screenshot /tmp/sf-final-faq-mobile.png
agent-browser --session sf-final-mobile open http://127.0.0.1:3000/start-order
agent-browser --session sf-final-mobile wait --load networkidle
agent-browser --session sf-final-mobile screenshot /tmp/sf-final-start-order-mobile.png
```

Expected:

- Header and CTA remain usable by thumb.
- Sticky CTA is present but not overly tall.
- FAQ disclosures are usable.
- Inquiry wizard is visible and mobile-friendly.

- [ ] **Step 5: Commit in logical chunks**

Recommended commits:

```bash
git add .env.example src/lib/env.ts src/lib/supabase/admin.ts src/lib/supabase/browser.ts src/lib/supabase/server.ts scripts/verify-reference-data.mjs
git commit -m "fix: support new Supabase API keys"

git add src/lib/inquiries/types.ts src/lib/inquiries/catalog.ts 'src/app/(site)/start-order/page.tsx' src/components/inquiry/start-order-wizard.tsx
git commit -m "fix: keep inquiry wizard available during catalog fallback"

git add src/components/site/gallery-grid.tsx
git commit -m "fix: load gallery lightbox images"

git add 'src/app/(site)/page.tsx' src/types/domain.ts src/lib/content/site-content.ts src/components/site/product-page-template.tsx src/components/site/sticky-product-cta.tsx 'src/app/(site)/faq/page.tsx' src/app/og/route.tsx
git commit -m "feat: strengthen public conversion surfaces"
```

---

## Self-Review Notes

- Critical `/start-order` failure is covered by Tasks 1 and 2.
- Critical gallery modal image failure is covered by Task 3.
- High homepage/product visual conversion issues are covered by Tasks 4 and 5.
- High mobile sticky CTA friction is covered by Task 5.
- High FAQ scan/interaction issue is covered by Task 6.
- High social preview polish is covered by Task 7.
- No secrets are printed or committed. All key checks use only source names, not values.
- Final verification includes lint, typecheck, build, Supabase reference-data verification, and desktop/mobile browser QA.
