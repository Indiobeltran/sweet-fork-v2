import { Badge } from "@/components/ui/badge";
import { SitePrimaryCta } from "@/components/site/site-primary-cta";

type PublicPageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  accent?: string;
  cta?: {
    href: string;
    label: string;
    subtext?: string;
  };
};

export function PublicPageHero({
  eyebrow,
  title,
  description,
  accent = "Small-batch desserts, custom quoting, and thoughtful details from inquiry through pickup or delivery.",
  cta,
}: PublicPageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-charcoal/8 bg-paper">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-16">
        <div className="space-y-6 section-reveal">
          <Badge>{eyebrow}</Badge>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-balance font-serif text-5xl leading-[0.95] tracking-[-0.05em] text-charcoal sm:text-6xl lg:text-7xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-charcoal/76 sm:text-lg">{description}</p>
          </div>
          {cta ? (
            <SitePrimaryCta href={cta.href} label={cta.label} subtext={cta.subtext} />
          ) : null}
        </div>
        <div className="luxury-panel section-reveal p-7 sm:p-8">
          <p className="eyebrow-label">The Sweet Fork standard</p>
          <p className="mt-4 font-serif text-3xl leading-tight tracking-[-0.04em] text-charcoal sm:text-[2.4rem]">
            {accent}
          </p>
          <div className="mt-8 h-px w-full bg-gradient-to-r from-gold/35 via-charcoal/10 to-transparent" />
          <p className="mt-6 text-sm leading-7 text-charcoal/70">
            Inquiry-only ordering keeps every quote tailored to the event instead of forcing a one-size-fits-all checkout flow.
          </p>
        </div>
      </div>
    </section>
  );
}
