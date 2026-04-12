"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

type FilterSheetProps = {
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
  title: string;
  triggerIcon?: ReactNode;
  triggerLabel?: string;
};

export function FilterSheet({
  children,
  description,
  footer,
  title,
  triggerIcon,
  triggerLabel = "Filters",
}: Readonly<FilterSheetProps>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dialogId = useId();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <>
      <Button
        type="button"
        aria-controls={dialogId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        variant="secondary"
        size="sm"
        className="h-11 gap-2 rounded-full px-4"
        onClick={() => setIsOpen(true)}
      >
        <span aria-hidden="true">
          {triggerIcon ?? <SlidersHorizontal className="h-4 w-4" />}
        </span>
        {triggerLabel}
      </Button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Close filters"
            className="fixed inset-0 z-[60] bg-charcoal/20 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-0 z-[70] flex items-end justify-center px-3 pb-0 pt-6 md:items-center md:px-6 md:pb-6">
            <div
              id={dialogId}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="flex max-h-[min(88vh,50rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.8rem] border border-charcoal/10 bg-ivory/96 shadow-[0_24px_72px_rgba(53,37,29,0.18)] backdrop-blur-xl md:rounded-[1.8rem]"
            >
              <div className="border-b border-charcoal/8 px-4 pb-3 pt-3 sm:px-5">
                <div className="mx-auto h-1.5 w-14 rounded-full bg-charcoal/14 md:hidden" />

                <div className="mt-4 flex items-start justify-between gap-4 md:mt-0">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                      Filters
                    </p>
                    <h2 className="mt-1.5 font-serif text-[2rem] tracking-[-0.04em] text-charcoal sm:text-[2.15rem]">
                      {title}
                    </h2>
                    {description ? (
                      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-charcoal/64">
                        {description}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    aria-label="Close filters"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-charcoal/10 bg-white/82 text-charcoal transition hover:border-charcoal/20 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
                    onClick={() => setIsOpen(false)}
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

              {footer ? (
                <div className="border-t border-charcoal/8 px-4 py-4 sm:px-5">{footer}</div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
