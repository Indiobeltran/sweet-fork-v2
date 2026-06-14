import Image from "next/image";
import Link from "next/link";

import { InquiryCta } from "@/components/site/inquiry-cta";
import { SectionHeading } from "@/components/site/section-heading";
import { SitePrimaryCta } from "@/components/site/site-primary-cta";
import { TestimonialCarousel } from "@/components/site/testimonial-carousel";
import { getPublicEnv } from "@/lib/env";
import { siteConfig } from "@/lib/content/site-content";
import { buildMetadata } from "@/lib/seo";
import { getHomePageData } from "@/lib/site/marketing";
import type { GalleryItem } from "@/types/domain";

export async function generateMetadata() {
  return buildMetadata({
    title: "Custom Cakes & Desserts in Centerville, Utah",
    description:
      "Custom cakes, wedding cakes, cupcakes, macarons, sugar cookies, and DIY kits crafted in Centerville, Utah with a polished, boutique finish.",
    path: "/",
  });
}

function CuratedImage({
  className,
  item,
  priority = false,
  sizes,
}: Readonly<{
  className?: string;
  item: GalleryItem | null;
  priority?: boolean;
  sizes: string;
}>) {
  if (!item?.imageUrl) {
    return (
      <div
        className={`flex h-full min-h-[14rem] w-full items-end bg-[radial-gradient(circle_at_top_left,rgba(184,150,92,0.18),transparent_30%),linear-gradient(140deg,rgba(255,253,249,0.94),rgba(248,242,234,0.97))] p-5 ${className ?? ""}`}
      >
        <div>
          <p className="eyebrow-label">The Sweet Fork</p>
          <p className="mt-3 max-w-[14rem] font-serif text-3xl leading-none text-charcoal">
            Custom desserts made to order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={item.imageUrl}
      alt={item.alt}
      fill
      priority={priority}
      quality={82}
      sizes={sizes}
      className={`object-cover ${className ?? ""}`}
    />
  );
}

export default async function HomePage() {
  const data = await getHomePageData();
  const { siteUrl } = getPublicEnv();
  const hasExplicitHero = !!data.heroImage;
  const heroGalleryItem =
    data.heroImage ??
    data.galleryItems.find((item) => item.imageUrl) ??
    data.offerings.find((item) => item.image?.imageUrl)?.image ??
    null;
  const galleryTeaserItems = data.galleryItems
    .filter((item) => item.imageUrl && (hasExplicitHero || item.id !== heroGalleryItem?.id))
    .slice(0, 3);
  const visibleGalleryTeaserItems =
    galleryTeaserItems.length > 0
      ? galleryTeaserItems
      : data.galleryItems.filter((item) => item.imageUrl).slice(0, 3);
  const offeringCards = data.offerings.slice(0, 6);
  const featuredTestimonial = data.testimonials[0] ?? null;
  const secondaryCtaHref = data.hero.settings.secondaryCtaHref ?? "/gallery";
  const secondaryCtaLabel = data.hero.settings.secondaryCtaLabel ?? "Explore the Gallery";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteUrl,
    image: `${siteUrl}/brand/logo-social.jpg`,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
      addressLocality: "Centerville",
      addressRegion: "UT",
    },
    areaServed: [
      "Centerville",
      "Davis County",
      "Salt Lake County",
      "Weber County",
      "Northern Utah",
    ],
    sameAs: [`https://www.instagram.com/${siteConfig.instagram}/`],
    servesCuisine: "Desserts",
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="grain-surface relative overflow-hidden border-b border-charcoal/7 bg-paper">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
        <div className="section-shell grid gap-6 py-6 sm:gap-8 sm:py-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14 lg:py-16 xl:py-20">
          <div className="space-y-4 section-reveal sm:space-y-5">
            <p className="eyebrow-label">{data.hero.eyebrow}</p>
            <div className="space-y-3 sm:space-y-4">
              <h1 className="max-w-5xl text-balance font-serif text-[2.3rem] leading-[0.97] text-charcoal sm:text-[4.1rem] sm:leading-[0.94] lg:text-[5.35rem]">
                {data.hero.heading}
              </h1>
              <p className="max-w-xl text-[0.95rem] leading-6 text-charcoal/74 sm:text-lg sm:leading-7">
                {data.hero.body}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={data.hero.settings.primaryCtaHref ?? "/start-order"}
                className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-charcoal px-6 py-4 text-center text-sm font-semibold tracking-[0.02em] text-ivory shadow-[0_18px_38px_rgba(44,36,27,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-charcoal/92 active:scale-[0.985] sm:w-auto"
              >
                {data.hero.settings.primaryCtaLabel ?? "Start Your Inquiry"}
              </Link>
              <Link
                href={secondaryCtaHref}
                className="inline-flex min-h-14 w-full items-center justify-center rounded-full border border-charcoal/10 bg-white/86 px-6 py-4 text-center text-sm font-semibold tracking-[0.02em] text-charcoal shadow-[0_12px_28px_rgba(44,36,27,0.055)] transition duration-200 hover:-translate-y-0.5 hover:border-charcoal/20 hover:bg-white active:scale-[0.985] sm:w-auto"
              >
                {secondaryCtaLabel}
              </Link>
            </div>
            <p className="text-sm leading-6 text-charcoal/60">
              Inquiry takes 2-3 minutes. No commitment required.
            </p>

            <div className="hidden gap-2.5 sm:grid sm:grid-cols-3">
              {data.hero.items.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.2rem] border border-charcoal/7 bg-white/74 px-4 py-3 shadow-[0_12px_28px_rgba(44,36,27,0.045)]"
                >
                  <p className="text-sm font-medium leading-5 text-charcoal">{item.title}</p>
                </div>
              ))}
            </div>

            {featuredTestimonial ? (
              <blockquote className="hidden max-w-xl border-l border-gold/38 pl-4 text-sm leading-7 text-charcoal/68 sm:block">
                <p>&ldquo;{featuredTestimonial.quote}&rdquo;</p>
                <footer className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/48">
                  {featuredTestimonial.name}
                </footer>
              </blockquote>
            ) : null}
          </div>

          <div className="grid gap-4 section-reveal">
            <div className="relative min-h-[21rem] overflow-hidden rounded-[2.15rem] border border-white/70 bg-cream/60 text-ivory shadow-[0_26px_70px_rgba(44,36,27,0.18),0_2px_12px_rgba(44,36,27,0.08)] sm:min-h-[30rem] lg:min-h-[36rem]">
              <CuratedImage
                item={heroGalleryItem}
                priority
                sizes="(max-width: 1024px) calc(100vw - 2.5rem), 47vw"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(44,36,27,0.02),rgba(44,36,27,0.15)_42%,rgba(44,36,27,0.68))]" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold/86">
                  The Sweet Fork
                </p>
                <p className="mt-3 max-w-[25rem] font-serif text-3xl leading-[0.98] sm:text-5xl">
                  Custom desserts with a quiet luxury finish.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-12 md:py-16">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Signature offerings"
            title="Choose the dessert path that fits your celebration."
            description="Explore the cakes, cookies, cupcakes, macarons, and wedding desserts available for local celebrations."
          />
          <Link
            href="/start-order"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-charcoal px-5 py-3 text-sm font-semibold tracking-[0.02em] text-ivory shadow-[0_16px_34px_rgba(44,36,27,0.14)] transition hover:-translate-y-0.5 hover:bg-charcoal/92"
          >
            Start an inquiry
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {offeringCards.map((item) => (
            <Link
              key={item.slug}
              href={`/${item.slug}`}
              className="group overflow-hidden rounded-[1.25rem] border border-charcoal/7 bg-white/88 shadow-[0_16px_42px_rgba(44,36,27,0.06)] transition duration-300 hover:-translate-y-1 hover:border-gold/32 hover:shadow-[0_22px_54px_rgba(44,36,27,0.09)] focus-visible:border-gold/45 sm:rounded-[1.65rem]"
            >
              <div className="relative aspect-square overflow-hidden bg-cream/70 sm:aspect-[4/3]">
                <CuratedImage
                  item={item.image}
                  sizes="(max-width: 640px) calc(50vw - 1.75rem), (max-width: 1024px) calc(50vw - 2rem), 390px"
                  className="transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(44,36,27,0.01),rgba(44,36,27,0.24))]" />
              </div>
              <div className="p-4 sm:p-5">
                <p className="eyebrow-label">{item.eyebrow}</p>
                <h2 className="mt-3 font-serif text-2xl leading-[1.02] text-charcoal sm:text-3xl">
                  {item.shortTitle}
                </h2>
                <p className="mt-3 line-clamp-2 text-xs leading-6 text-charcoal/66 sm:text-sm sm:leading-7">
                  {item.intro}
                </p>
                <p className="mt-4 text-sm font-semibold text-charcoal transition group-hover:text-gold">
                  View details
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-gold/10 bg-[linear-gradient(135deg,rgb(var(--color-charcoal)),rgba(44,36,27,0.94))] py-12 text-ivory md:py-16">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        <div className="section-shell grid gap-9 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <SectionHeading
            eyebrow={data.process.eyebrow}
            title={data.process.heading}
            description={data.process.body}
            tone="inverse"
          />
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {data.process.items.map((item) => (
                <article
                  key={item.step}
                  className="rounded-[1.45rem] border border-white/12 bg-white/[0.075] px-5 py-5 shadow-[0_18px_42px_rgba(0,0,0,0.1)]"
                >
                  <p className="font-serif text-4xl leading-none text-gold">
                    {item.step}
                  </p>
                  <h3 className="mt-4 text-base font-medium leading-6 text-ivory">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ivory/70">{item.description}</p>
                </article>
              ))}
            </div>
            <SitePrimaryCta
              href="/start-order"
              label="Start Your Inquiry"
              buttonClassName="bg-ivory text-charcoal hover:bg-white sm:w-full lg:w-auto"
              className="max-w-xl"
            />
            <p className="text-sm leading-7 text-ivory/68">
              Share the event, timing, dessert mix, and design direction.
            </p>
          </div>
        </div>
      </section>

      <section className="section-shell py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <SectionHeading
            eyebrow="Gallery preview"
            title="Recent work from The Sweet Fork."
            description="A small preview of recent work, from polished cakes to custom cookies and dessert-table details."
          />
          <div
            className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0 lg:gap-3"
            aria-label="Recent work preview"
            role="list"
          >
            {visibleGalleryTeaserItems.map((item, index) => (
              <Link
                key={item.id}
                href="/gallery"
                className="group w-[72vw] max-w-[18rem] shrink-0 snap-start overflow-hidden rounded-[1.45rem] border border-charcoal/7 bg-white/88 shadow-[0_16px_42px_rgba(44,36,27,0.06)] transition hover:-translate-y-1 hover:border-gold/32 hover:shadow-[0_22px_54px_rgba(44,36,27,0.09)] sm:w-[18rem] lg:w-auto lg:max-w-none"
                role="listitem"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-cream">
                  <CuratedImage
                    item={item}
                    priority={false}
                    sizes="(max-width: 640px) 72vw, (max-width: 1024px) 18rem, 270px"
                    className="transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(44,36,27,0.02),rgba(44,36,27,0.5))]" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-ivory">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/88">
                      {item.category}
                    </p>
                    <h3 className="mt-2 font-serif text-2xl leading-[1.02]">
                      {item.title}
                    </h3>
                    {index === visibleGalleryTeaserItems.length - 1 ? (
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-ivory/82">
                        View full gallery
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <SectionHeading
            eyebrow="Kind words"
            title="The details clients remember."
            description="Thoughtful bakes, clear communication, and details that guests remember long after the last bite."
          />
          <div className="flex w-full items-center">
            <TestimonialCarousel testimonials={data.testimonials} />
          </div>
        </div>
      </section>

      <section className="border-y border-charcoal/7 bg-cream/58 py-12 md:py-16">
        <div className="section-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-6">
            <SectionHeading
              eyebrow={data.weddingHighlight.eyebrow}
              title={data.weddingHighlight.heading}
              description={data.weddingHighlight.body}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/wedding-cakes"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-charcoal px-6 py-3 text-center text-sm font-semibold tracking-[0.02em] text-ivory shadow-[0_16px_34px_rgba(44,36,27,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-charcoal/92 active:scale-[0.985] sm:w-auto"
              >
                Explore Wedding Cakes
              </Link>
              <Link
                href="/start-order"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full px-4 py-3 text-center text-sm font-semibold tracking-[0.02em] text-charcoal underline decoration-gold/40 underline-offset-4 transition hover:decoration-gold sm:w-auto"
              >
                Start a Wedding Inquiry
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Limited weekend availability",
              "Companion desserts can be quoted together",
              "Delivery and setup are planned from the start",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.45rem] border border-charcoal/7 bg-white/84 px-5 py-5 shadow-[0_14px_34px_rgba(44,36,27,0.055)]"
              >
                <p className="text-sm font-semibold leading-6 text-charcoal">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <InquiryCta />
    </div>
  );
}
