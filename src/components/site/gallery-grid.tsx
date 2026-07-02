"use client";

import { type TouchEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { GalleryItem } from "@/types/domain";
import { cn } from "@/lib/utils";

type GalleryGridProps = {
  items: GalleryItem[];
  compact?: boolean;
  priorityCount?: number;
};

const GALLERY_CARD_SIZES =
  "(max-width: 640px) calc(100vw - 2.5rem), (max-width: 1024px) calc(50vw - 2.5rem), 405px";
const GALLERY_MODAL_SIZES =
  "(max-width: 1024px) calc(100vw - 2.5rem), (max-width: 1280px) calc(100vw - 24rem), 820px";

function getAdjacentInteractiveIndex(
  current: number | null,
  interactiveIndexes: number[],
  direction: "next" | "previous",
) {
  if (current === null || interactiveIndexes.length === 0) {
    return current;
  }

  const currentInteractiveIndex = interactiveIndexes.indexOf(current);

  if (currentInteractiveIndex === -1) {
    return interactiveIndexes[0] ?? null;
  }

  if (direction === "next") {
    return interactiveIndexes[
      (currentInteractiveIndex + 1) % interactiveIndexes.length
    ] ?? null;
  }

  return interactiveIndexes[
    (currentInteractiveIndex - 1 + interactiveIndexes.length) %
      interactiveIndexes.length
  ] ?? null;
}

function getFilterCategory(category: string): string {
  const normalized = category.toLowerCase().replace(/[-_]+/g, " ").trim();
  if (normalized === "custom cake" || normalized === "custom cakes" || normalized === "celebration" || normalized === "celebrations") {
    return "Custom Cakes";
  }
  if (normalized === "sugar cookies" || normalized === "sugar cookie") {
    return "Sugar Cookies";
  }
  if (normalized === "macarons" || normalized === "macaron") {
    return "Macarons";
  }
  if (normalized === "cupcakes" || normalized === "cupcake") {
    return "Cupcakes";
  }
  if (normalized === "wedding cake" || normalized === "wedding cakes") {
    return "Wedding Cakes";
  }
  if (normalized === "diy kits" || normalized === "diy kit") {
    return "DIY Kits";
  }
  return category;
}

export function GalleryGrid({
  items,
  compact = false,
  priorityCount = 0,
}: GalleryGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") {
      return items;
    }
    return items.filter((item) => getFilterCategory(item.category) === activeCategory);
  }, [items, activeCategory]);

  const dialogId = useId();
  const triggerRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const dialogPanelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const activeItem = activeIndex === null ? null : filteredItems[activeIndex] ?? null;
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;
  const interactiveIndexes = useMemo(
    () =>
      filteredItems.reduce<number[]>((accumulator, item, index) => {
        if (item.imageUrl) {
          accumulator.push(index);
        }

        return accumulator;
      }, []),
    [filteredItems],
  );
  const activeImagePosition =
    activeIndex === null ? null : interactiveIndexes.indexOf(activeIndex) + 1;

  const closeItem = (indexToFocus = activeIndex) => {
    setActiveIndex(null);

    if (indexToFocus === null) {
      return;
    }

    window.requestAnimationFrame(() => {
      triggerRefs.current[indexToFocus]?.focus();
    });
  };

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimeoutId = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 40);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex((current) => {
          if (current !== null) {
            window.requestAnimationFrame(() => {
              triggerRefs.current[current]?.focus();
            });
          }

          return null;
        });
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          getAdjacentInteractiveIndex(current, interactiveIndexes, "next"),
        );
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          getAdjacentInteractiveIndex(current, interactiveIndexes, "previous"),
        );
      }

      if (event.key === "Tab") {
        const focusableElements = dialogPanelRef.current
          ? Array.from(
              dialogPanelRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
              ),
            )
          : [];

        if (focusableElements.length === 0) {
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!firstElement || !lastElement) {
          return;
        }

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }

        if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimeoutId);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, interactiveIndexes]);

  const openItem = (index: number) => {
    if (!filteredItems[index]?.imageUrl) {
      return;
    }

    const item = filteredItems[index];
    trackAnalyticsEvent("gallery_item_viewed", {
      gallery_category: getFilterCategory(item.category).toLowerCase().replace(/\s+/g, "_"),
      gallery_position: index + 1,
      page_path: "/gallery",
    });
    setActiveIndex(index);
  };

  const showGalleryControls = interactiveIndexes.length > 1 && activeIndex !== null;
  const showPreviousItem = () => {
    trackAnalyticsEvent("gallery_item_navigated", {
      gallery_category: activeItem
        ? getFilterCategory(activeItem.category).toLowerCase().replace(/\s+/g, "_")
        : undefined,
      page_path: "/gallery",
    });
    setActiveIndex((current) =>
      getAdjacentInteractiveIndex(current, interactiveIndexes, "previous"),
    );
  };
  const showNextItem = () => {
    trackAnalyticsEvent("gallery_item_navigated", {
      gallery_category: activeItem
        ? getFilterCategory(activeItem.category).toLowerCase().replace(/\s+/g, "_")
        : undefined,
      page_path: "/gallery",
    });
    setActiveIndex((current) =>
      getAdjacentInteractiveIndex(current, interactiveIndexes, "next"),
    );
  };
  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };
  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;

    if (!start || !touch || !showGalleryControls) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.abs(deltaX) < 52 || Math.abs(deltaY) > 80) {
      return;
    }

    if (deltaX < 0) {
      showNextItem();
      return;
    }

    showPreviousItem();
  };

  const filterCategories = [
    { key: "All", label: "All" },
    { key: "Custom Cakes", label: "Custom Cakes" },
    { key: "Sugar Cookies", label: "Sugar Cookies" },
    { key: "Macarons", label: "Macarons" },
    { key: "Cupcakes", label: "Cupcakes" },
    { key: "Wedding Cakes", label: "Wedding Cakes" },
    { key: "DIY Kits", label: "DIY Kits" },
  ] as const;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-start gap-1.5 px-0 sm:mb-8 sm:justify-center sm:gap-2 sm:px-1">
        {filterCategories.map((category) => {
          const count = category.key === "All"
            ? items.length
            : items.filter(item => getFilterCategory(item.category) === category.key).length;

          if (count === 0 && category.key !== "All") return null;

          const isActive = activeCategory === category.key;

          return (
            <button
              key={category.key}
              type="button"
              onClick={() => {
                if (activeCategory !== category.key) {
                  trackAnalyticsEvent("gallery_filter_used", {
                    gallery_category: category.key.toLowerCase().replace(/\s+/g, "_"),
                    page_path: "/gallery",
                  });
                }
                setActiveCategory(category.key);
                setActiveIndex(null);
              }}
              className={cn(
                "inline-flex min-h-[2.35rem] shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.11em] transition duration-200 sm:min-h-[2.5rem] sm:gap-1.5 sm:px-5 sm:py-2 sm:text-xs sm:tracking-[0.14em]",
                isActive
                  ? "bg-charcoal border-charcoal text-ivory shadow-sm"
                  : "bg-white/80 border-charcoal/10 text-charcoal/80 hover:border-charcoal/30 hover:text-charcoal"
              )}
            >
              <span>
                {category.label}
              </span>
              <span className={cn(
                "text-[9px] sm:text-[10px] font-bold",
                isActive ? "text-ivory/60" : "text-charcoal/40"
              )}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Elegant Uniform aspect-[4/5] Cards Grid */}
      <div
        className={cn(
          "grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6",
          compact && "md:grid-cols-3"
        )}
      >
        {filteredItems.map((item, index) => {
          return (
            <article
              key={item.id}
              className="group relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-charcoal/8 bg-white shadow-soft transition duration-300 hover:-translate-y-1 focus-within:-translate-y-1 focus-within:border-gold/35 focus-within:shadow-[0_18px_48px_rgba(53,37,29,0.14)]"
              style={{
                containIntrinsicSize: "360px",
                contentVisibility: "auto",
              }}
            >
              <button
                type="button"
                ref={(element) => {
                  triggerRefs.current[index] = element;
                }}
                className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-gold/70"
                onClick={() => openItem(index)}
                aria-haspopup={item.imageUrl ? "dialog" : undefined}
                aria-label={
                  item.imageUrl
                    ? `Open larger gallery image: ${item.title}`
                    : `View gallery details for ${item.title}`
                }
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-cream via-white to-ivory">
                  {item.imageUrl ? (
                    <>
                      <Image
                        src={item.imageUrl}
                        alt={item.alt}
                        fill
                        priority={index < priorityCount}
                        quality={82}
                        sizes={GALLERY_CARD_SIZES}
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(48,39,33,0.08),rgba(48,39,33,0.22)_55%,rgba(48,39,33,0.68))]" />
                    </>
                  ) : (
                    <div className="flex h-full items-end bg-[radial-gradient(circle_at_top_left,rgba(186,154,99,0.16),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.88),rgba(242,235,227,0.96))] p-6">
                      <div className="max-w-[16rem]">
                        <span className="inline-flex rounded-full border border-charcoal/10 bg-white/82 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-charcoal/62">
                          Selected work
                        </span>
                        <p className="mt-4 font-serif text-2xl leading-none tracking-[-0.04em] text-charcoal">
                          {item.title}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4 flex items-center justify-between gap-1 sm:gap-2">
                    <span className="inline-flex items-center justify-center text-center rounded-full bg-charcoal/75 px-1 w-[72px] sm:w-[90px] h-[36px] sm:h-[44px] text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] text-ivory leading-[1.2] select-none">
                      {getFilterCategory(item.category)}
                    </span>
                    {item.imageUrl ? (
                      <span className="inline-flex items-center justify-center text-center rounded-full border border-white/18 bg-white/12 px-1 w-[58px] sm:w-[76px] h-[36px] sm:h-[44px] text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.11em] text-ivory backdrop-blur leading-[1.2] select-none">
                        View larger
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1 p-4 sm:p-5">
                  <h3 className="font-serif text-base sm:text-lg md:text-xl leading-tight tracking-[-0.02em] text-charcoal line-clamp-1 group-hover:text-gold transition">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-normal text-charcoal/70 line-clamp-2">{item.alt}</p>
                </div>
              </button>
            </article>
          );
        })}
      </div>

      {/* Modern High-End Immersive Lightbox */}
      {activeItem?.imageUrl ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-charcoal/95 px-3 py-4 sm:px-4 sm:py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onClick={() => closeItem()}
        >
          <div
            ref={dialogPanelRef}
            className="relative flex max-h-[calc(100svh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#15100e] p-3 text-ivory shadow-[0_30px_90px_rgba(15,9,7,0.5)] sm:p-5"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Absolute positioned close button to save massive vertical space */}
            <div className="absolute right-4 top-4 z-[80]">
              <button
                ref={closeButtonRef}
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-charcoal/80 text-ivory transition hover:border-white/28 hover:bg-white/10 focus-visible:border-gold/50 focus-visible:bg-white/12 shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                onClick={() => closeItem()}
                aria-label="Close gallery image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 pt-12 lg:pt-0">
              {/* Contained full-image container (prevents cropping!) */}
              <div className="relative overflow-hidden rounded-[1.7rem] bg-black/20 flex-1 flex items-center justify-center min-h-[40svh] lg:min-h-[35rem]">
                <div className="relative w-full h-[45svh] lg:h-full">
                  <Image
                    src={activeItem.imageUrl}
                    alt={activeItem.alt}
                    fill
                    priority
                    quality={82}
                    sizes={GALLERY_MODAL_SIZES}
                    className="object-contain"
                  />
                </div>
                {showGalleryControls ? (
                  <>
                    <button
                      type="button"
                      aria-label="Show previous gallery image"
                      className="absolute left-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/16 bg-charcoal/62 text-ivory shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur transition hover:border-white/34 hover:bg-charcoal/76 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/70"
                      onClick={showPreviousItem}
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Show next gallery image"
                      className="absolute right-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/16 bg-charcoal/62 text-ivory shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur transition hover:border-white/34 hover:bg-charcoal/76 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/70"
                      onClick={showNextItem}
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </>
                ) : null}
              </div>

              {/* Premium streamlined sidebar (completely free of navigation instructions) */}
              <div className="flex flex-col justify-between gap-4 rounded-[1.7rem] border border-white/10 bg-white/4 p-5 sm:p-6 lg:max-h-[38rem] overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <span className="inline-flex rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold border border-gold/25">
                      {getFilterCategory(activeItem.category)}
                    </span>
                    {activeImagePosition ? (
                      <span className="text-[10px] uppercase tracking-[0.16em] text-ivory/50 font-medium">
                        {activeImagePosition} / {interactiveIndexes.length}
                      </span>
                    ) : null}
                  </div>

                  <h3 id={titleId} className="font-serif text-2xl sm:text-3xl tracking-tight text-ivory leading-tight">
                    {activeItem.title}
                  </h3>

                  <div className="border-t border-white/10 pt-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-gold/72 mb-2">
                      Details
                    </p>
                    <p id={descriptionId} className="text-sm leading-relaxed text-ivory/80">
                      {activeItem.alt}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
