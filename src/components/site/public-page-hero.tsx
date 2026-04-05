import { Badge } from "@/components/ui/badge";

type PublicPageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  accent?: string;
};

export function PublicPageHero({
  eyebrow,
  title,
  description,
  accent = "Designed with celebration in mind and the backend details already considered.",
}: PublicPageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-charcoal/8 bg-paper">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div className="space-y-6">
          <Badge>{eyebrow}</Badge>
          <div className="space-y-4">
            <h1 className="max-w-4xl font-serif text-5xl leading-[0.95] tracking-[-0.05em] text-charcoal sm:text-6xl lg:text-7xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-charcoal/72 sm:text-lg">{description}</p>
          </div>
        </div>
        <div className="rounded-[2rem] border border-charcoal/8 bg-white/75 p-7 shadow-soft backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-charcoal/48">The Sweet Fork standard</p>
          <p className="mt-4 font-serif text-3xl leading-tight tracking-[-0.04em] text-charcoal">{accent}</p>
        </div>
      </div>
    </section>
  );
}
