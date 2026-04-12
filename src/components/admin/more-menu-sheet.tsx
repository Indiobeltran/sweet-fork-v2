import Link from "next/link";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export type MoreMenuSheetItem = {
  href: string;
  isActive?: boolean;
  label: string;
};

export type MoreMenuSheetGroup = {
  items: MoreMenuSheetItem[];
  label: string;
};

type MoreMenuSheetProps = {
  description?: string;
  desktopOnly?: boolean;
  groups: MoreMenuSheetGroup[];
  mobileOnly?: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  showBackdrop?: boolean;
  title?: string;
};

function MoreMenuSheetLinks({
  groups,
  onNavigate,
}: Readonly<{
  groups: MoreMenuSheetGroup[];
  onNavigate: () => void;
}>) {
  const linkFocusClasses =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50";

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.label}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/44">
            {group.label}
          </p>

          <div className="mt-2 grid gap-2">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-12 items-center justify-between rounded-[1.3rem] border px-4 py-3 text-sm font-medium transition",
                  linkFocusClasses,
                  item.isActive
                    ? "border-charcoal/16 bg-charcoal text-ivory shadow-soft"
                    : "border-charcoal/10 bg-white/78 text-charcoal hover:border-charcoal/20 hover:bg-white",
                )}
                onClick={onNavigate}
              >
                <span>{item.label}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "text-[11px] uppercase tracking-[0.16em]",
                    item.isActive ? "text-ivory/72" : "text-charcoal/42",
                  )}
                >
                  Open
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function MoreMenuSheet({
  description = "Manage catalog content, media, notifications, and team settings without leaving the shared admin shell.",
  desktopOnly = false,
  groups,
  mobileOnly = false,
  onOpenChange,
  open,
  showBackdrop = true,
  title = "More",
}: Readonly<MoreMenuSheetProps>) {
  if (!open) {
    return null;
  }

  return (
    <>
      {showBackdrop ? (
        <button
          type="button"
          aria-label="Close more admin navigation"
          className="fixed inset-0 z-[60] bg-charcoal/14 backdrop-blur-[1px]"
          onClick={() => onOpenChange(false)}
        />
      ) : null}

      {!mobileOnly ? (
        <div
          role="dialog"
          aria-label="More admin sections"
          className="absolute right-0 top-[calc(100%+0.7rem)] z-[70] hidden w-[22rem] rounded-[1.7rem] border border-charcoal/10 bg-ivory/96 p-4 shadow-[0_24px_64px_rgba(53,37,29,0.14),0_8px_20px_rgba(53,37,29,0.08)] backdrop-blur-xl md:block"
        >
          <div className="flex items-center justify-between gap-3 border-b border-charcoal/8 pb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/42">
                {title}
              </p>
              <p className="mt-1 text-sm text-charcoal/64">
                Site management, catalog editing, and system settings.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close more admin sections"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/10 bg-white/82 text-charcoal transition hover:border-charcoal/20 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
              onClick={() => onOpenChange(false)}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <MoreMenuSheetLinks groups={groups} onNavigate={() => onOpenChange(false)} />
        </div>
      ) : null}

      {!desktopOnly ? (
        <div className="fixed inset-x-0 bottom-0 z-[70] md:hidden">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More admin sections"
            className="max-h-[min(88vh,46rem)] overflow-y-auto rounded-t-[1.8rem] border border-b-0 border-charcoal/10 bg-ivory/96 px-4 pb-[calc(env(safe-area-inset-bottom)+1.05rem)] pt-4 shadow-[0_-24px_64px_rgba(53,37,29,0.18)] backdrop-blur-xl"
          >
            <div className="mx-auto h-1.5 w-14 rounded-full bg-charcoal/14" />

            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/42">
                  {title}
                </p>
                <h2 className="mt-1.5 font-serif text-[2rem] tracking-[-0.04em] text-charcoal">
                  Extra admin sections
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close more admin sections"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-charcoal/10 bg-white/82 text-charcoal transition hover:border-charcoal/20 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
                onClick={() => onOpenChange(false)}
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-1.5 text-sm leading-6 text-charcoal/62">{description}</p>

            <MoreMenuSheetLinks groups={groups} onNavigate={() => onOpenChange(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
