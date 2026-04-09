import Link from "next/link";

import { cn } from "@/lib/utils";

type SitePrimaryCtaProps = {
  href: string;
  label: string;
  subtext?: string;
  className?: string;
  buttonClassName?: string;
  align?: "left" | "center";
};

export function SitePrimaryCta({
  href,
  label,
  subtext,
  className,
  buttonClassName,
  align = "left",
}: SitePrimaryCtaProps) {
  return (
    <div className={cn("w-full", align === "center" && "text-center", className)}>
      <Link
        href={href}
        className={cn(
          "inline-flex min-h-14 w-full items-center justify-center rounded-full bg-charcoal px-6 py-4 text-center text-sm font-semibold tracking-[0.02em] text-ivory shadow-soft transition duration-200 hover:-translate-y-0.5 hover:bg-charcoal/94 active:scale-[0.985] sm:w-auto",
          buttonClassName,
        )}
      >
        {label}
      </Link>
      {subtext ? (
        <p
          className={cn(
            "mt-3 text-sm text-charcoal/58",
            align === "center" && "text-center",
          )}
        >
          {subtext}
        </p>
      ) : null}
    </div>
  );
}
