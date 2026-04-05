import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { GalleryGrid } from "@/components/site/gallery-grid";
import { InquiryCta } from "@/components/site/inquiry-cta";
import { SectionHeading } from "@/components/site/section-heading";
import {
  galleryItems,
  homeExperiencePillars,
  processSteps,
  productPageContent,
  testimonials,
} from "@/lib/content/site-content";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-charcoal/8 bg-paper">
        <div className="section-shell grid min-h-[calc(100svh-5rem)] gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div className="space-y-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-charcoal/55">Premium boutique custom bakery</p>
            <div className="space-y-5">
              <h1 className="max-w-4xl font-serif text-6xl leading-[0.92] tracking-[-0.06em] text-charcoal sm:text-7xl md:text-8xl">
                Celebration cakes and sweets with a quieter kind of luxury.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-charcoal/72 sm:text-lg">
                The Sweet Fork creates custom cakes, wedding desserts, cupcakes, cookies, macarons, and giftable treats for
                celebrations that want warmth, polish, and a more intentional intake process from the first inquiry.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/start-order"
                className="inline-flex h-14 items-center justify-center rounded-full bg-charcoal px-6 text-sm font-medium text-ivory transition hover:bg-charcoal/90"
              >
                Start Order
              </Link>
              <Link
                href="/gallery"
                className="inline-flex h-14 items-center justify-center rounded-full border border-charcoal/12 bg-white/70 px-6 text-sm font-medium text-charcoal transition hover:bg-white"
              >
                View Gallery
              </Link>
            </div>
            <div className="grid gap-5 border-t border-charcoal/10 pt-6 sm:grid-cols-3">
              {homeExperiencePillars.map((item) => (
                <div key={item.title}>
                  <p className="font-medium text-charcoal">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-charcoal/64">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative grain-surface">
            <div className="rounded-[2.4rem] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.62),rgba(247,239,228,0.92))] p-4 shadow-soft">
              <div className="grid min-h-[620px] gap-4 rounded-[2rem] bg-charcoal/95 p-4 text-ivory lg:grid-cols-[1fr_0.78fr]">
                <div className="relative overflow-hidden rounded-[1.7rem] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(214,181,122,0.4),transparent_28%),linear-gradient(160deg,#2f261f,#5d4a3b_55%,#3a3028)] p-8">
                  <p className="text-xs uppercase tracking-[0.22em] text-ivory/55">Celebration-first</p>
                  <div className="mt-24 max-w-md space-y-4">
                    <p className="font-serif text-5xl leading-none tracking-[-0.05em]">The moment on the table matters.</p>
                    <p className="text-sm leading-7 text-ivory/74">
                      Editorial in feel, warm in tone, and built for people who want a centerpiece that feels personal without feeling overdone.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-[1.7rem] bg-ivory/95 p-6 text-charcoal">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-charcoal/45">Weddings included</p>
                    <p className="mt-5 font-serif text-3xl leading-tight tracking-[-0.04em]">
                      Wedding capability is clear from the first screen, without turning the entire brand into a wedding-only studio.
                    </p>
                  </div>
                  <div className="rounded-[1.7rem] border border-ivory/10 bg-white/10 p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-gold/70">Operationally better</p>
                    <ul className="mt-5 space-y-4 text-sm leading-7 text-ivory/76">
                      <li>One inquiry can cover multiple products</li>
                      <li>Upload inspiration images directly to storage</li>
                      <li>Better qualification before manual follow-up begins</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            eyebrow="Core offerings"
            title="A modern bakery menu built around celebrations, with room for weddings to scale elegantly."
            description="The experience leads with celebration, while wedding work remains clearly visible for clients planning larger, more coordinated events."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.values(productPageContent).map((item) => (
              <Link
                key={item.slug}
                href={`/${item.slug}`}
                className="group rounded-[1.8rem] border border-charcoal/8 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-charcoal/15"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal/48">{item.eyebrow}</p>
                <h2 className="mt-5 font-serif text-3xl leading-none tracking-[-0.04em] text-charcoal">{item.shortTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-charcoal/68">{item.intro}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-charcoal">
                  Explore
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-charcoal/8 bg-cream/65 py-16 md:py-20">
        <div className="section-shell space-y-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Gallery atmosphere"
              title="A boutique grid with room for polished textures, soft structure, and future image management."
              description="The gallery is already structured so admin-managed images can swap in cleanly as the library grows."
            />
            <Link href="/gallery" className="text-sm font-semibold uppercase tracking-[0.18em] text-charcoal">
              Full gallery
            </Link>
          </div>
          <GalleryGrid items={galleryItems} compact />
        </div>
      </section>

      <section className="section-shell py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr]">
          <SectionHeading
            eyebrow="How it works"
            title="A lead-generation flow designed to gather the right information once."
            description="The intake wizard reduces scattered email follow-up by collecting event-level details, item-level details, inspiration, and contact preferences in one sequence."
          />
          <div className="space-y-4">
            {processSteps.map((item) => (
              <div key={item.step} className="grid gap-3 rounded-[1.8rem] border border-charcoal/8 bg-white px-6 py-6 shadow-soft md:grid-cols-[auto_1fr]">
                <p className="font-serif text-4xl leading-none tracking-[-0.04em] text-gold">{item.step}</p>
                <div>
                  <h3 className="text-lg font-medium text-charcoal">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-charcoal/68">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-charcoal/8 bg-charcoal py-16 text-ivory md:py-20">
        <div className="section-shell grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote key={item.name} className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6">
              <p className="font-serif text-3xl leading-tight tracking-[-0.04em]">“{item.quote}”</p>
              <footer className="mt-6 text-sm text-ivory/70">
                <p className="font-medium text-ivory">{item.name}</p>
                <p>{item.context}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <InquiryCta />
    </div>
  );
}
