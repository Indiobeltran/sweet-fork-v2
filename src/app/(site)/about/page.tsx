import { InquiryCta } from "@/components/site/inquiry-cta";
import { PublicPageHero } from "@/components/site/public-page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description: "Meet The Sweet Fork and learn about the boutique bakery approach behind the brand.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div>
      <PublicPageHero
        eyebrow="About"
        title="A boutique bakery built around warmth, polish, and event-level intention."
        description="The Sweet Fork is positioned for clients who want custom sweets that feel refined and personal, without the experience becoming intimidating or overly formal."
        accent="The aesthetic is calm and editorial. The service philosophy is thoughtful, clear, and deeply celebration-first."
      />
      <section className="section-shell grid gap-8 py-16 md:py-20 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-charcoal/8 bg-charcoal p-8 text-ivory shadow-soft">
          <p className="text-xs uppercase tracking-[0.2em] text-gold/70">Studio point of view</p>
          <p className="mt-6 font-serif text-4xl leading-tight tracking-[-0.04em]">
            Beautiful sweets should feel celebratory, hospitable, and well-considered from the first email to final pickup.
          </p>
        </div>
        <div className="space-y-5 text-base leading-8 text-charcoal/72">
          <p>
            The Sweet Fork serves celebrations that want something more elevated than a standard order form and more approachable than a high-barrier luxury experience.
          </p>
          <p>
            The new platform reflects that middle space: strong art direction on the public site, practical operational tools on the admin side, and a more complete intake process that gathers the right details up front.
          </p>
          <p>
            It is designed for a bakery owner who needs clarity, simplicity, and room to grow pricing, content, and image management without turning the business into a software project.
          </p>
        </div>
      </section>
      <InquiryCta />
    </div>
  );
}
