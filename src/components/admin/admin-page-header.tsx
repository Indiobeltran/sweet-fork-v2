import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: string;
  hideTitleOnMobile?: boolean;
  meta?: ReactNode;
  title: string;
};

export function AdminPageHeader({
  actions,
  children,
  className,
  description,
  eyebrow,
  hideTitleOnMobile = false,
  meta,
  title,
}: Readonly<AdminPageHeaderProps>) {
  return (
    <section
      className={cn(
        "rounded-[1.7rem] border border-charcoal/10 bg-paper/90 p-4 shadow-soft sm:p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
        <div
          className={cn(
            "min-w-0",
            hideTitleOnMobile && !eyebrow && !description ? "hidden sm:block" : "",
          )}
        >
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
              {eyebrow}
            </p>
          ) : null}
          <h2
            className={cn(
              "mt-1.5 font-serif text-[1.8rem] tracking-[-0.04em] text-charcoal sm:text-[2.15rem]",
              hideTitleOnMobile ? "hidden sm:block" : "",
            )}
          >
            {title}
          </h2>
          {description ? (
            <div className="mt-1.5 max-w-3xl text-sm leading-6 text-charcoal/64">{description}</div>
          ) : null}
        </div>

        {actions || meta ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            {meta ? (
              <div className="rounded-full border border-charcoal/10 bg-white/88 px-3.5 py-2 text-sm text-charcoal/66">
                {meta}
              </div>
            ) : null}
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>
        ) : null}
      </div>

      {children ? <div className="mt-2.5 space-y-2.5">{children}</div> : null}
    </section>
  );
}
