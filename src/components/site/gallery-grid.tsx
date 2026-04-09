import Image from "next/image";

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
            "group relative overflow-hidden rounded-[2rem] border border-charcoal/8 bg-white shadow-soft transition duration-300 hover:-translate-y-1",
            index % 3 === 0 ? "lg:row-span-2" : "",
          )}
        >
          <div
            className={cn(
              "relative min-h-[300px] overflow-hidden bg-gradient-to-br from-cream via-white to-ivory",
              index % 3 === 0 ? "lg:min-h-[460px]" : "lg:min-h-[360px]",
            )}
          >
            {item.imageUrl ? (
              <>
                <Image
                  src={item.imageUrl}
                  alt={item.alt}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(48,39,33,0.08),rgba(48,39,33,0.22)_55%,rgba(48,39,33,0.68))]" />
              </>
            ) : (
              <div className="flex h-full items-end bg-[radial-gradient(circle_at_top_left,rgba(186,154,99,0.16),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(242,235,227,0.96))] p-6">
                <div className="max-w-[16rem]">
                  <span className="inline-flex rounded-full border border-charcoal/10 bg-white/82 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-charcoal/62">
                    Selected work
                  </span>
                  <p className="mt-4 font-serif text-3xl leading-none tracking-[-0.04em] text-charcoal">
                    {item.title}
                  </p>
                </div>
              </div>
            )}
            <div className="absolute bottom-5 left-5 right-5">
              <span className="inline-flex rounded-full bg-charcoal/75 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-ivory">
                {item.category}
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
