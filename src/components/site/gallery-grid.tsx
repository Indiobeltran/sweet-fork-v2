import type { GalleryItem } from "@/types/domain";
import { cn } from "@/lib/utils";

type GalleryGridProps = {
  items: GalleryItem[];
  compact?: boolean;
};

export function GalleryGrid({ items, compact = false }: GalleryGridProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", compact && "lg:grid-cols-3")}>
      {items.map((item, index) => (
        <article
          key={item.id}
          className={cn(
            "group relative overflow-hidden rounded-[2rem] border border-charcoal/8 bg-white shadow-soft",
            index % 3 === 0 ? "lg:row-span-2" : "",
          )}
        >
          <div
            className={cn(
              "relative min-h-[300px] overflow-hidden bg-gradient-to-br from-cream via-white to-ivory",
              index % 3 === 0 ? "lg:min-h-[460px]" : "lg:min-h-[360px]",
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,181,122,0.25),transparent_35%),linear-gradient(160deg,rgba(255,255,255,0.18),rgba(58,48,41,0.08))]" />
            <div className="absolute inset-5 rounded-[1.6rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.6),rgba(247,239,228,0.9))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.72),transparent_25%),radial-gradient(circle_at_80%_85%,rgba(161,122,79,0.16),transparent_30%)]" />
            <div className="absolute bottom-5 left-5 right-5">
              <span className="inline-flex rounded-full bg-charcoal/75 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-ivory">
                {item.category.replace("-", " ")}
              </span>
            </div>
          </div>
          <div className="space-y-2 px-5 py-5">
            <h3 className="font-serif text-2xl leading-none tracking-[-0.03em] text-charcoal">{item.title}</h3>
            <p className="text-sm leading-6 text-charcoal/65">{item.alt}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
