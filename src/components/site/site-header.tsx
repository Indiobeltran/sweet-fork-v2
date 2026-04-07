"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  brandName: string;
  navigation: Array<{
    href: string;
    label: string;
  }>;
  tagline: string;
};

export function SiteHeader({
  brandName,
  navigation,
  tagline,
}: Readonly<SiteHeaderProps>) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (open) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-charcoal/8 bg-ivory/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-8">
        <Link
          href="/"
          className="group inline-flex min-w-0 items-center gap-3 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
        >
          <Image
            src="/brand/logo-dark.png"
            alt={brandName}
            width={340}
            height={193}
            priority
            className="h-auto w-[126px] shrink-0 sm:w-[148px]"
          />
          <p className="hidden max-w-[13rem] text-[10px] uppercase tracking-[0.24em] text-charcoal/45 xl:block">
            {tagline}
          </p>
        </Link>

        <nav className="hidden items-center rounded-full border border-charcoal/8 bg-white/70 p-1 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-[13px] font-medium tracking-[0.01em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50",
                pathname === item.href
                  ? "bg-charcoal text-ivory shadow-soft"
                  : "text-charcoal/68 hover:bg-charcoal/5 hover:text-charcoal",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/start-order"
            aria-current={pathname === "/start-order" ? "page" : undefined}
            className={cn(
              "inline-flex h-11 items-center rounded-full px-5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50",
              pathname === "/start-order"
                ? "bg-charcoal text-ivory shadow-soft"
                : "bg-charcoal text-ivory shadow-soft hover:bg-charcoal/92",
            )}
          >
            Start Order
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/start-order"
            aria-current={pathname === "/start-order" ? "page" : undefined}
            className={cn(
              "inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50",
              pathname === "/start-order"
                ? "border-charcoal bg-charcoal text-ivory shadow-soft"
                : "border-charcoal/12 bg-white/75 text-charcoal hover:border-charcoal/30 hover:bg-white",
            )}
          >
            Start Order
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/10 bg-white/70 text-charcoal transition hover:border-charcoal/30 hover:bg-white"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-label={open ? "Close navigation" : "Open navigation"}
          >
            {open ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid overflow-hidden border-t border-charcoal/8 bg-cream/95 transition-[grid-template-rows] duration-300 lg:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-6 pt-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-charcoal/45">{tagline}</p>
          </div>
          <nav className="space-y-2 px-5 pb-5">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={cn(
                  "block rounded-[1.25rem] px-4 py-3 text-sm font-medium transition",
                  pathname === item.href
                    ? "bg-charcoal text-ivory shadow-soft"
                    : "bg-white/75 text-charcoal hover:bg-white",
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/start-order"
              aria-current={pathname === "/start-order" ? "page" : undefined}
              className={cn(
                "mt-4 block rounded-full px-4 py-3 text-center text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50",
                pathname === "/start-order"
                  ? "bg-charcoal text-ivory shadow-soft"
                  : "bg-charcoal text-ivory shadow-soft hover:bg-charcoal/92",
              )}
              onClick={() => setOpen(false)}
            >
              Start Order
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
