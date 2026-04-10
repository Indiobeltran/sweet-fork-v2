"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { defaultInquiryCta } from "@/lib/site/cta";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  brandName: string;
  primaryNavigation: Array<{
    href: string;
    label: string;
  }>;
  secondaryNavigation: Array<{
    href: string;
    label: string;
  }>;
  tagline: string;
};

function NavLink({
  href,
  label,
  pathname,
  compact = false,
  onClick,
}: {
  href: string;
  label: string;
  pathname: string;
  compact?: boolean;
  onClick?: () => void;
}) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50",
        compact
          ? isActive
            ? "bg-charcoal text-ivory px-3 py-2 text-[13px] shadow-soft"
            : "px-3 py-2 text-[13px] text-charcoal/72 hover:bg-charcoal/5 hover:text-charcoal"
          : isActive
            ? "bg-charcoal text-ivory px-4 py-2.5 text-sm shadow-soft"
            : "px-4 py-2.5 text-sm text-charcoal/78 hover:bg-charcoal/5 hover:text-charcoal",
      )}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}

export function SiteHeader({
  brandName,
  primaryNavigation,
  secondaryNavigation,
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
    <header className="sticky top-0 z-50 border-b border-charcoal/8 bg-ivory/90 backdrop-blur-xl">
      <div className="hidden border-b border-charcoal/8 lg:block">
        <div className="section-shell flex h-11 items-center justify-between gap-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-charcoal/56">{tagline}</p>
          <nav className="flex items-center gap-1">
            {secondaryNavigation.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                pathname={pathname}
                compact
              />
            ))}
          </nav>
        </div>
      </div>

      <div className="section-shell flex h-[4.7rem] items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex min-w-0 items-center gap-3 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
        >
          <Image
            src="/brand/logo-dark.png"
            alt={brandName}
            width={1024}
            height={582}
            priority
            sizes="(max-width: 640px) 130px, 148px"
            className="h-auto w-[130px] shrink-0 sm:w-[148px]"
          />
        </Link>

        <nav className="hidden items-center rounded-full border border-charcoal/8 bg-white/74 p-1 lg:flex">
          {primaryNavigation.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} />
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href={defaultInquiryCta.href}
            aria-current={pathname === defaultInquiryCta.href ? "page" : undefined}
            className="inline-flex h-12 items-center justify-center rounded-full bg-charcoal px-5 text-sm font-semibold tracking-[0.02em] text-ivory shadow-soft transition duration-200 hover:-translate-y-0.5 hover:bg-charcoal/94"
          >
            {defaultInquiryCta.label}
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href={defaultInquiryCta.href}
            aria-current={pathname === defaultInquiryCta.href ? "page" : undefined}
            className="inline-flex h-10 items-center justify-center rounded-full border border-charcoal/10 bg-white/80 px-4 text-sm font-medium text-charcoal transition hover:border-charcoal/22 hover:bg-white"
          >
            Inquire
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/10 bg-white/80 text-charcoal transition hover:border-charcoal/22 hover:bg-white"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls="mobile-site-navigation"
            aria-label={open ? "Close navigation" : "Open navigation"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-site-navigation"
        aria-hidden={!open}
        inert={!open ? true : undefined}
        className={cn(
          "grid overflow-hidden border-t border-charcoal/8 bg-ivory/98 transition-[grid-template-rows] duration-300 lg:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="section-shell pb-6 pt-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-charcoal/56">{tagline}</p>

            <div className="mt-6">
              <p className="eyebrow-label">Shop by category</p>
              <nav className="mt-3 grid gap-2">
                {primaryNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={cn(
                      "rounded-[1.35rem] px-4 py-3 text-sm font-medium transition",
                      pathname === item.href
                        ? "bg-charcoal text-ivory shadow-soft"
                        : "bg-white/82 text-charcoal hover:bg-white",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-6">
              <p className="eyebrow-label">Explore</p>
              <nav className="mt-3 grid gap-2">
                {secondaryNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={cn(
                      "rounded-[1.2rem] px-4 py-3 text-sm transition",
                      pathname === item.href
                        ? "bg-charcoal text-ivory shadow-soft"
                        : "text-charcoal/78 hover:bg-white/82 hover:text-charcoal",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <Link
              href={defaultInquiryCta.href}
              className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-charcoal px-5 py-4 text-center text-sm font-semibold tracking-[0.02em] text-ivory shadow-soft transition duration-200 active:scale-[0.985]"
              onClick={() => setOpen(false)}
            >
              {defaultInquiryCta.label}
            </Link>
            <p className="mt-3 text-center text-sm text-charcoal/66">{defaultInquiryCta.subtext}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
