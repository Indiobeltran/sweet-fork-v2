"use client";

import { type TouchEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

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

export function GalleryGrid({
  items,
  compact = false,
  priorityCount = 0,
}: GalleryGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogId = useId();
  const triggerRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const dialogPanelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const activeItem = activeIndex === null ? null : items[activeIndex] ?? null;
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;
  const interactiveIndexes = useMemo(
    () =>
      items.reduce<number[]>((accumulator, item, index) => {
        if (item.imageUrl) {
          accumulator.push(index);
        }

        return accumulator;
      }, []),
    [items],
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
    if (!items[index]?.imageUrl) {
      return;
    }

    setActiveIndex(index);
  };

  const showGalleryControls = interactiveIndexes.length > 1 && activeIndex !== null;
  const showPreviousItem = () => {
    setActiveIndex((current) =>
      getAdjacentInteractiveIndex(current, interactiveIndexes, "previous"),
    );
  };
  const showNextItem = () => {
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

  return (
    <>
      <div
        className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", compact && "lg:grid-cols-3")}
      >
        {items.map((item, index) => {
          const isFeatured = index % 3 === 0;

          return (
            <article
              key={item.id}
              className={cn(
                "group relative overflow-hidden rounded-[2rem] border border-charcoal/8 bg-white shadow-soft transition duration-300 hover:-translate-y-1 focus-within:-translate-y-1 focus-within:border-gold/35 focus-within:shadow-[0_18px_48px_rgba(53,37,29,0.14)]",
                isFeatured ? "lg:row-span-2" : "",
              )}
              style={{
                containIntrinsicSize: isFeatured ? "460px" : "360px",
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
                <div
                  className={cn(
                    "relative min-h-[300px] overflow-hidden bg-gradient-to-br from-cream via-white to-ivory",
                    isFeatured ? "lg:min-h-[460px]" : "lg:min-h-[360px]",
                  )}
                >
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
                        <span className="inline-flex rounded-full border border-charcoal/10 bg-white/82 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-charcoal/62">
                          Selected work
                        </span>
                        <p className="mt-4 font-serif text-3xl leading-none tracking-[-0.04em] text-charcoal">
                          {item.title}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                    <span className="inline-flex rounded-full bg-charcoal/75 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-ivory">
                      {item.category}
                    </span>
                    {item.imageUrl ? (
                      <span className="rounded-full border border-white/18 bg-white/12 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-ivory backdrop-blur">
                        View larger
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2 px-5 py-5">
                  <h3 className="font-serif text-2xl leading-none tracking-[-0.03em] text-charcoal">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-6 text-charcoal/70">{item.alt}</p>
                </div>
              </button>
            </article>
          );
        })}
      </div>

      {activeItem?.imageUrl ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-charcoal/88 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onClick={() => closeItem()}
        >
          <div
            ref={dialogPanelRef}
            className="relative flex max-h-[calc(100svh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#1f1815] p-4 text-ivory shadow-[0_30px_90px_rgba(15,9,7,0.5)] sm:p-5"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-gold/75">
                  {activeItem.category}
                </p>
                <h3
                  id={titleId}
                  className="mt-2 font-serif text-3xl tracking-[-0.04em] text-ivory sm:text-4xl"
                >
                  {activeItem.title}
                </h3>
                {activeImagePosition ? (
                  <p className="mt-3 text-sm leading-6 text-ivory/70">
                    Image {activeImagePosition} of {interactiveIndexes.length}
                  </p>
                ) : null}
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/6 text-ivory transition hover:border-white/28 hover:bg-white/10 focus-visible:border-gold/50 focus-visible:bg-white/12"
                onClick={() => closeItem()}
                aria-label="Close gallery image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-5">
              <div className="relative overflow-hidden rounded-[1.7rem] bg-black/10">
                <div className="relative h-[min(56svh,34rem)] lg:h-full lg:min-h-[30rem]">
                  <Image
                    src={activeItem.imageUrl}
                    alt={activeItem.alt}
                    fill
                    priority
                    quality={82}
                    sizes={GALLERY_MODAL_SIZES}
                    className="object-cover"
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

              <div className="flex min-h-0 flex-col justify-between gap-5 rounded-[1.7rem] border border-white/10 bg-white/6 p-5">
                <div className="min-h-0 overflow-y-auto pr-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-gold/72">
                    The Sweet Fork detail
                  </p>
                  <p id={descriptionId} className="mt-3 text-sm leading-7 text-ivory/78">
                    {activeItem.alt}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-ivory/62">
                    Use the previous and next buttons, or your arrow keys, to move through the
                    gallery without closing the lightbox.
                  </p>
                </div>

                {showGalleryControls ? (
                  <p className="text-xs uppercase tracking-[0.16em] text-ivory/46">
                    Swipe or use arrow keys
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
