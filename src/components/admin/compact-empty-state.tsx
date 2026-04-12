import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CompactEmptyStateProps = {
  action?: ReactNode;
  align?: "center" | "left";
  className?: string;
  description: ReactNode;
  eyebrow?: string;
  icon?: ReactNode;
  title: string;
};

export function CompactEmptyState({
  action,
  align = "center",
  className,
  description,
  eyebrow,
  icon,
  title,
}: Readonly<CompactEmptyStateProps>) {
  return (
    <section
      className={cn(
        "rounded-[1.65rem] border border-dashed border-charcoal/14 bg-white/84 px-5 py-5 shadow-soft sm:px-5",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {icon ? <div className={align === "center" ? "mx-auto flex justify-center" : ""}>{icon}</div> : null}
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1.5 font-serif text-[1.7rem] tracking-[-0.04em] text-charcoal sm:text-[1.85rem]">
        {title}
      </h2>
      <div className="mt-1.5 text-sm leading-6 text-charcoal/62">{description}</div>
      {action ? (
        <div className={cn("mt-4", align === "center" ? "flex justify-center" : "flex")}>{action}</div>
      ) : null}
    </section>
  );
}
