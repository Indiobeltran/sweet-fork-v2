"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  getHomeGalleryCarouselWindow,
  getNextHomeGalleryCarouselIndex,
  orderHomeGalleryCarouselItems,
} from "@/components/site/home-gallery-carousel-utils";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types/domain";

type HomeGalleryCarouselProps = {
  items: GalleryItem[];
};

const AUTOPLAY_INTERVAL_MS = 4500;
const VISIBLE_CARD_COUNT = 3;

function GalleryPreviewImage({
  className,
  item,
}: Readonly<{
  className?: string;
  item: GalleryItem;
}>) {
  if (!item.imageUrl) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[18rem] w-full items-end bg-[radial-gradient(circle_at_top_left,rgba(184,150,92,0.18),transparent_30%),linear-gradient(140deg,rgba(255,253,249,0.94),rgba(248,242,234,0.97))] p-5",
          className,
        )}
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
      quality={82}
      sizes="(max-width: 640px) calc(100vw - 2.5rem), (max-width: 1024px) calc((100vw - 6rem) / 3), 285px"
      className={cn("object-cover", className)}
    />
  );
}

export function HomeGalleryCarousel({ items }: HomeGalleryCarouselProps) {
  const orderedItems = useMemo(() => orderHomeGalleryCarouselItems(items), [items]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const visibleItems = useMemo(
    () =>
      getHomeGalleryCarouselWindow(orderedItems, {
        startIndex: activeIndex,
        visibleCount: VISIBLE_CARD_COUNT,
      }),
    [activeIndex, orderedItems],
  );

  const hasMultipleItems = orderedItems.length > 1;

  const showNextItem = useCallback(() => {
    setActiveIndex((currentIndex) =>
      getNextHomeGalleryCarouselIndex(currentIndex, orderedItems.length, "next"),
    );
  }, [orderedItems.length]);

  const showPreviousItem = () => {
    setActiveIndex((currentIndex) =>
      getNextHomeGalleryCarouselIndex(currentIndex, orderedItems.length, "previous"),
    );
    setIsPaused(true);
  };

  const goToItem = (index: number) => {
    setActiveIndex(index);
    setIsPaused(true);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncReducedMotion = () => {
      setIsReducedMotion(mediaQuery.matches);
    };

    syncReducedMotion();
    mediaQuery.addEventListener("change", syncReducedMotion);

    return () => {
      mediaQuery.removeEventListener("change", syncReducedMotion);
    };
  }, []);

  useEffect(() => {
    if (!hasMultipleItems || isPaused || isReducedMotion) {
      return;
    }

    const intervalId = window.setInterval(showNextItem, AUTOPLAY_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasMultipleItems, isPaused, isReducedMotion, showNextItem]);

  if (orderedItems.length === 0) {
    return null;
  }

  return (
    <div
      ref={carouselRef}
      className="min-w-0 overflow-hidden"
      aria-label="Recent work preview"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
    >
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        {visibleItems.map((item, index) => (
          <Link
            key={`${item.id}-${activeIndex}-${index}`}
            href="/gallery"
            className={cn(
              "group min-w-0 overflow-hidden rounded-[1.45rem] border border-charcoal/7 bg-white/88 shadow-[0_16px_42px_rgba(44,36,27,0.06)] transition hover:-translate-y-1 hover:border-gold/32 hover:shadow-[0_22px_54px_rgba(44,36,27,0.09)] focus-visible:border-gold/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
              index > 0 && "hidden sm:block",
            )}
            role="listitem"
            aria-label={`View ${item.title} in the full gallery`}
          >
            <div className="relative aspect-[4/5] min-h-[18rem] overflow-hidden bg-cream">
              <GalleryPreviewImage
                item={item}
                className="transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(44,36,27,0.02),rgba(44,36,27,0.5))]" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-ivory">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/88">
                  {item.category}
                </p>
                <h3 className="mt-2 font-serif text-2xl leading-[1.02]">{item.title}</h3>
                {index === 0 ? (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-ivory/82">
                    View the Gallery
                  </p>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-5 flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-charcoal/10 bg-white/82 text-charcoal shadow-[0_10px_22px_rgba(44,36,27,0.06)] transition hover:-translate-y-0.5 hover:border-gold/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            aria-label="Show previous gallery preview"
            onClick={showPreviousItem}
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-charcoal/10 bg-white/82 text-charcoal shadow-[0_10px_22px_rgba(44,36,27,0.06)] transition hover:-translate-y-0.5 hover:border-gold/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            aria-label="Show next gallery preview"
            onClick={() => {
              showNextItem();
              setIsPaused(true);
            }}
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </div>

        <Link
          href="/gallery"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/68 underline decoration-gold/45 underline-offset-4 transition hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          View the Gallery
        </Link>

        <div className="flex max-w-[11rem] flex-wrap justify-end gap-2 sm:max-w-none" role="tablist" aria-label="Gallery preview slides">
          {orderedItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-label={`Show gallery preview ${index + 1}`}
              aria-selected={index === activeIndex}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                index === activeIndex
                  ? "w-6 bg-gold"
                  : "w-1.5 bg-charcoal/16 hover:bg-charcoal/32",
              )}
              onClick={() => goToItem(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
