"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { GalleryItem } from "@/types/domain";
import { cn } from "@/lib/utils";

type GalleryGridProps = {
  items: GalleryItem[];
  compact?: boolean;
  priorityCount?: number;
};

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

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
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
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
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
                "group relative overflow-hidden rounded-[2rem] border border-charcoal/8 bg-white shadow-soft transition duration-300 hover:-translate-y-1",
                isFeatured ? "lg:row-span-2" : "",
              )}
              style={{
                containIntrinsicSize: isFeatured ? "460px" : "360px",
                contentVisibility: "auto",
              }}
            >
              <button
                type="button"
                className="w-full text-left"
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
                        quality={86}
                        sizes={
                          isFeatured
                            ? "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 40vw"
                            : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        }
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
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="relative w-full max-w-6xl rounded-[2rem] border border-white/10 bg-[#1f1815] p-4 text-ivory shadow-[0_30px_90px_rgba(15,9,7,0.5)] sm:p-5"
            onClick={(event) => event.stopPropagation()}
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
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/6 text-ivory transition hover:border-white/28 hover:bg-white/10"
                onClick={() => setActiveIndex(null)}
                aria-label="Close gallery image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="relative overflow-hidden rounded-[1.7rem] bg-black/10">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={activeItem.imageUrl}
                    alt={activeItem.alt}
                    fill
                    priority
                    quality={88}
                    sizes="(max-width: 1024px) 100vw, 68vw"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between gap-5 rounded-[1.7rem] border border-white/10 bg-white/6 p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-gold/72">
                    Sweet Fork detail
                  </p>
                  <p id={descriptionId} className="mt-3 text-sm leading-7 text-ivory/78">
                    {activeItem.alt}
                  </p>
                </div>

                {showGalleryControls ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-4 py-3 text-sm font-medium text-ivory transition hover:border-white/28 hover:bg-white/8"
                      onClick={() =>
                        setActiveIndex((current) =>
                          getAdjacentInteractiveIndex(current, interactiveIndexes, "previous"),
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-4 py-3 text-sm font-medium text-ivory transition hover:border-white/28 hover:bg-white/8"
                      onClick={() =>
                        setActiveIndex((current) =>
                          getAdjacentInteractiveIndex(current, interactiveIndexes, "next"),
                        )
                      }
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
