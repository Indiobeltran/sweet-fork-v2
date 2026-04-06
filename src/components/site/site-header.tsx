"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

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

  return (
    <header className="sticky top-0 z-50 border-b border-charcoal/8 bg-ivory/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group inline-flex min-w-0 items-center gap-3 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50">
          <Image
            src="/brand/logo-dark.png"
            alt={brandName}
            width={340}
            height={193}
            priority
            className="h-auto w-[134px] shrink-0 sm:w-[156px]"
          />
          <p className="hidden max-w-[14rem] text-[11px] uppercase tracking-[0.22em] text-charcoal/48 lg:block">
            {tagline}
          </p>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-2 py-1 text-sm font-medium text-charcoal/72 transition hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/start-order"
            className="inline-flex h-12 items-center rounded-full bg-charcoal px-5 text-sm font-medium text-ivory transition hover:bg-charcoal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
          >
            Start Order
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-charcoal/10 text-charcoal lg:hidden"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "grid overflow-hidden border-t border-charcoal/8 bg-cream transition-[grid-template-rows] duration-300 lg:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <nav className="space-y-2 px-5 py-5">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-charcoal transition hover:bg-white"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/start-order"
              className="mt-4 block rounded-full bg-charcoal px-4 py-3 text-center text-sm font-medium text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
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
